---
phase: 03-category-system
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - src/app/api/battle/start/route.ts
  - src/app/api/battle/stream/route.ts
  - src/app/api/battle/vote/route.ts
  - src/app/page.tsx
  - src/components/battle/battle-arena.tsx
  - src/components/battle/category-selector.tsx
  - src/components/battle/reveal-panel.tsx
  - src/components/battle/system-prompt-editor.tsx
  - src/components/ui/collapsible.tsx
  - src/components/ui/toggle-group.tsx
  - src/components/ui/toggle.tsx
  - src/lib/battle/session.test.ts
  - src/lib/categories.test.ts
  - src/lib/categories.ts
  - src/lib/store/battle-store.test.ts
  - src/lib/store/battle-store.ts
  - src/lib/types.ts
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-09
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

The phase 03 category system implementation is well-structured overall. The security model (HMAC-signed tokens carrying category and system prompt) is sound, and the store logic for category switching with prompt-modification detection is correct. Two critical issues exist in `verifyBattleToken`: it can crash (unhandled exception → 500) on attacker-controlled input due to `timingSafeEqual` length mismatch and unguarded `JSON.parse`. Additionally, the test suite calls `useBattleStore.getInitialState()` which Zustand's `create()` does not expose — all category-related store tests will fail at runtime. There are also two warning-level concerns around vote state recovery and a CSS variable unit issue in the toggle group.

---

## Critical Issues

### CR-01: `verifyBattleToken` crashes on tokens with wrong-length signatures

**File:** `src/lib/battle/session.ts:30`

**Issue:** `crypto.timingSafeEqual` requires both buffers to have the same byte length and throws a `RangeError` if they differ. An attacker submitting a token whose signature portion is any length other than 43 characters (the length of a SHA-256 base64url digest) will trigger an unhandled exception. This exception propagates through `POST /api/battle/stream` and `POST /api/battle/vote` as an unhandled throw, causing a 500 response instead of the expected 401. While not a security bypass (the token is correctly rejected), it is a denial-of-service vector — repeated crafted requests cause unlogged crashes. The catch blocks in both route handlers only handle `ZodError` and then a generic `console.error`, so the stack trace is logged but the behavior is inconsistent with the intended 401 path.

**Fix:**
```typescript
// src/lib/battle/session.ts
export function verifyBattleToken(token: string): BattleSession | null {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac(ALGORITHM, env.BATTLE_SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  // Guard: timingSafeEqual throws RangeError if buffer lengths differ
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.byteLength !== expBuf.byteLength) return null;

  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    ) as BattleSession;

    if (Date.now() - session.ts > TOKEN_TTL_MS) return null;

    return session;
  } catch {
    return null;
  }
}
```

---

### CR-02: `JSON.parse` in `verifyBattleToken` is unguarded and can throw

**File:** `src/lib/battle/session.ts:34-41`

**Issue:** `JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"))` has no try/catch. Any token with a valid-length signature over an invalid-JSON payload (e.g., a crafted token whose payload decodes to non-JSON) will throw a `SyntaxError`. Because the HMAC check at line 30 passes only when signature matches, this path is harder to reach maliciously — but a corrupted or truncated token that happens to produce the same-length (though wrong) signature could trigger it. More practically, any future code that generates tokens outside this module could produce malformed payloads. The fix is the same try/catch wrapper shown in CR-01.

**Fix:** Wrap the `JSON.parse` call in a try/catch as shown in the CR-01 fix above. No additional change required beyond what is already described there.

---

## Warnings

### WR-01: `useBattleStore.getInitialState()` does not exist — all category store tests will fail

**File:** `src/lib/store/battle-store.test.ts:8`

**Issue:** The test `beforeEach` calls `useBattleStore.getInitialState()` to reset state between tests. Zustand's `create()` function does not expose a `getInitialState` method on the returned hook. This is a method on the underlying vanilla store (`createStore`), not the React hook. Calling `.getInitialState()` on the hook will throw `TypeError: useBattleStore.getInitialState is not a function`, causing the entire `battle-store` test suite to fail before any assertions run.

**Fix:**

Option A — Export and use the raw `initialState` object directly (simplest):
```typescript
// src/lib/store/battle-store.ts  (already defined at line 54, just export it)
export const initialState = { ... };

// src/lib/store/battle-store.test.ts
import { useBattleStore, initialState } from "@/lib/store/battle-store";

beforeEach(() => {
  useBattleStore.setState(initialState, true); // true = replace, not merge
});
```

Option B — Use Zustand's `createStore` + `useStore` pattern which does expose `getInitialState`, but requires restructuring the store export.

Option A is the minimal fix with zero restructuring.

---

### WR-02: Vote loading spinner has no recovery path if `setReveal` is never called

**File:** `src/components/battle/battle-arena.tsx:140-173`, `src/lib/store/battle-store.ts:114-115`

**Issue:** After the user clicks vote, `store.setVoteSubmitted(winner)` is called at line 140, which sets `winner` to `"a"` or `"b"` but does NOT advance the phase. The `VotePanel` at line 270 renders a loading spinner when `winner !== null && !isRevealed`. If the vote API call fails (`res.ok` is false), the code calls `toast.error` and returns at line 161 — but `winner` remains set and `phase` stays at `"voting"`. This leaves the VotePanel in a permanent loading spinner state with no way for the user to retry the vote or start a new battle. The `handleRetry` function only fires in the `isError` phase, which is not set in this failure path.

**Fix:**
```typescript
// src/components/battle/battle-arena.tsx
if (!res.ok) {
  const err = await res.json().catch(() => ({ error: "투표 실패" }));
  toast.error(err.error || "투표를 기록할 수 없습니다");
  // Reset winner so spinner clears and user can re-vote
  store.setVoteSubmitted(null); // needs store.winner reset or a clearVote() action
  voteLoadingRef.current = false;
  return;
}
```

Or add a `clearVote()` action to the store that resets `winner` back to `null` without changing phase, allowing re-vote.

---

### WR-03: `setCategory` does not validate the categoryId against `CATEGORIES`

**File:** `src/lib/store/battle-store.ts:142-155`

**Issue:** `setCategory(categoryId: string)` accepts any string and calls `getDefaultPrompt(categoryId)`. `getDefaultPrompt` silently falls back to `CATEGORIES[0].defaultPrompt` for unknown IDs (categories.ts:52-55). This means if an invalid category ID is stored in state — e.g., from a stale URL parameter — the store sets `category` to the invalid string while `systemPrompt` silently loads the "general" default. This creates a state mismatch: `store.category` is `"unknown-id"` but the prompt shown is from `"general"`. The validation exists at the API level (`route.ts:15-18`) but not in the store or UI layer.

The `initialCategory` prop from `page.tsx` already validates via `getCategoryById` at `battle-arena.tsx:32` before calling `setCategory`, so the real exposure is any direct call path that bypasses this guard (future code, deep links not going through the page component).

**Fix:**
```typescript
// src/lib/store/battle-store.ts
import { getCategoryById, getDefaultPrompt } from "@/lib/categories";

setCategory: (categoryId: string) => {
  // Silently ignore unknown category IDs
  if (!getCategoryById(categoryId)) return;
  const { isPromptModified } = get();
  // ... rest of existing logic
},
```

---

### WR-04: `ToggleGroup` CSS custom property `--gap` passed as unitless number

**File:** `src/components/ui/toggle-group.tsx:43`

**Issue:** `style={{ '--gap': spacing } as React.CSSProperties}` sets the CSS custom property `--gap` to the raw number `0` (or any integer passed as `spacing`). This value is then consumed via the Tailwind v4 utility `gap-[--spacing(var(--gap))]`. Tailwind v4's `--spacing()` function interprets values relative to the spacing scale, so a raw number `0` resolves correctly to `0px`. However, any non-zero spacing value passed (e.g., `spacing={4}`) will be interpreted as `4` on the spacing scale (4 × 4px = 16px in default Tailwind config), which may or may not be the intended unit. The type annotation `as React.CSSProperties` suppresses the TypeScript error for the non-standard CSS property name. This is not currently broken (only `spacing=0` is used in `CategorySelector`), but the API is misleading: callers of `ToggleGroup` who pass `spacing={2}` will get `8px` gap, not `2px`.

**Fix:** Document the `spacing` prop clearly as a Tailwind spacing scale index, or change the implementation to accept a CSS string (e.g., `"8px"`) rather than a bare number.

---

## Info

### IN-01: `pendingCategory` confirmation dialog does not validate the pending value

**File:** `src/components/battle/category-selector.tsx:45-66`

**Issue:** The inline confirmation dialog renders whenever `pendingCategory` is truthy, displaying a hardcoded message "수정한 프롬프트가 있습니다. 카테고리를 변경하시겠습니까?" without showing which category the user is switching to. The `confirmCategorySwitch` action in the store silently does nothing if `pendingCategory` is `null` (store line 158-166), but the UI only renders when `pendingCategory` is set, so this is safe. Minor UX issue: the user cannot see which category they are confirming before clicking.

**Fix (UX improvement):** Include the target category label in the confirmation message:
```tsx
{pendingCategory && (() => {
  const targetCat = getCategoryById(pendingCategory);
  return (
    <div role="alert" ...>
      <span>
        수정한 프롬프트가 있습니다.{" "}
        {targetCat ? `"${targetCat.label}"` : "선택한 카테고리"}로 변경하시겠습니까?
      </span>
      ...
    </div>
  );
})()}
```

---

### IN-02: `voteLoadingRef` reset uses early return instead of `finally`, creating inconsistent cleanup pattern

**File:** `src/components/battle/battle-arena.tsx:156-161`

**Issue:** When the vote API returns a non-ok response, `voteLoadingRef.current = false` is reset manually before the early return at line 161. The success path and network-error path both reset via the `finally` block at line 172. The early-return path is the only case that resets manually. If the `toast.error` call at line 159 were to throw (unlikely with current `sonner` implementation), `voteLoadingRef.current` would be stuck `true`, permanently blocking subsequent vote attempts for the session lifetime. This is low-risk but inconsistent.

**Fix:** Move the early return reset into the finally block by using a boolean flag, or structure the entire function with a single finally reset:
```typescript
const handleVote = useCallback(async (winner: "a" | "b") => {
  if (voteLoadingRef.current) return;
  voteLoadingRef.current = true;
  store.setVoteSubmitted(winner);

  try {
    const res = await fetch("/api/battle/vote", { ... });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "투표 실패" }));
      toast.error(err.error || "투표를 기록할 수 없습니다");
      return; // finally will handle cleanup
    }

    const revealData = (await res.json()) as BattleVoteResponse;
    store.setReveal(revealData);
    toast.success("투표가 기록되었습니다!");
  } catch {
    toast.error("네트워크 오류가 발생했습니다");
  } finally {
    voteLoadingRef.current = false; // single cleanup point
  }
}, [store, completionA, completionB]);
```

---

_Reviewed: 2026-04-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
