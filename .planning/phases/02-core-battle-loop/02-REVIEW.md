---
phase: 02-core-battle-loop
reviewed: 2026-04-09T12:45:00Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - package.json
  - src/app/api/battle/start/route.ts
  - src/app/api/battle/stream/route.ts
  - src/app/api/battle/vote/route.ts
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/components/battle/battle-arena.tsx
  - src/components/battle/battle-input.tsx
  - src/components/battle/response-card.tsx
  - src/components/battle/reveal-panel.tsx
  - src/components/battle/streaming-indicator.tsx
  - src/components/battle/vote-panel.tsx
  - src/components/battle/win-rate-bar.tsx
  - src/components/ui/badge.tsx
  - src/components/ui/card.tsx
  - src/components/ui/separator.tsx
  - src/components/ui/skeleton.tsx
  - src/components/ui/textarea.tsx
  - src/lib/ai/config.ts
  - src/lib/ai/pairing.test.ts
  - src/lib/ai/pairing.ts
  - src/lib/battle/session.test.ts
  - src/lib/battle/session.ts
  - src/lib/db/queries.ts
  - src/lib/env.ts
  - src/lib/store/battle-store.ts
  - src/lib/types.ts
  - supabase/migrations/00002_win_rate_function.sql
  - vitest.config.ts
findings:
  critical: 2
  warning: 6
  info: 4
  total: 12
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-09T12:45:00Z
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

The core battle loop implementation is well-structured overall. The HMAC token-based session design is sound -- model IDs and questions are sourced from the signed token on the server, preventing client-side manipulation (D-08). The dual `useCompletion` hook pattern is clean, the Zustand state machine is well-defined, and the SQL win-rate function is correct.

However, there are two critical issues: (1) the `verifyBattleToken` function can crash on length-mismatched signatures due to `timingSafeEqual`, and (2) the `JSON.parse` call in the same function has no error handling, allowing a crafted valid-HMAC payload with invalid JSON to crash the route. There are also several warnings around missing replay protection, vote submission race conditions, and an insecure randomness source for the security-sensitive model pairing.

## Critical Issues

### CR-01: `timingSafeEqual` crashes on length-mismatched buffers

**File:** `src/lib/battle/session.ts:30`
**Issue:** `crypto.timingSafeEqual()` throws a `RangeError` if the two buffers have different lengths. A tampered or truncated signature will have a different byte-length than the expected HMAC digest, causing an unhandled exception that crashes the route handler instead of returning null. This is both a crash vulnerability (denial of service) and a logic error -- the catch block in the route handler will return a generic 500 error instead of the intended 401.
**Fix:**
```typescript
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);

  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
```

### CR-02: Unguarded `JSON.parse` on token payload causes crash on malformed data

**File:** `src/lib/battle/session.ts:34`
**Issue:** After HMAC verification passes, `JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"))` is called without a try-catch. If the payload is valid base64url but not valid JSON (unlikely but possible with certain edge cases, or if the HMAC secret is compromised and an attacker crafts a payload), this will throw an unhandled `SyntaxError`, crashing the request. Additionally, the parsed result is cast `as BattleSession` without any runtime validation -- a structurally invalid payload would pass silently.
**Fix:**
```typescript
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    ) as BattleSession;

    // Reject tokens older than 30 minutes
    if (Date.now() - session.ts > TOKEN_TTL_MS) return null;

    // Minimal structural validation
    if (!session.sid || !session.q || !session.mA || !session.mB) return null;

    return session;
  } catch {
    return null;
  }
```

## Warnings

### WR-01: No replay protection on battle tokens -- vote can be submitted multiple times

**File:** `src/app/api/battle/vote/route.ts:16-79`
**Issue:** The battle token is verified but not invalidated after a vote is submitted. A user can replay the same signed token with different `winner` values. While the DB has a `UNIQUE(battle_id)` constraint on `votes`, the battle insert creates a new row each time the vote endpoint is called (since `insertBattleWithVote` always inserts a new battle). This means the same question/token can generate an unlimited number of battle+vote records, inflating the win-rate statistics and enabling vote manipulation.
**Fix:** Add a server-side nonce set (e.g., store `session.sid` in Upstash Redis with a short TTL, or check if a battle with the same `sid` already exists in the DB before inserting). At minimum, add a DB unique constraint on a session identifier column in the `battles` table:
```sql
ALTER TABLE battles ADD COLUMN session_id text;
ALTER TABLE battles ADD CONSTRAINT battles_session_id_unique UNIQUE (session_id);
```
Then pass `session.sid` into `insertBattleWithVote` and store it. The unique constraint will reject duplicates.

### WR-02: `Math.random()` used for security-sensitive model pairing

**File:** `src/lib/ai/pairing.ts:15-25`
**Issue:** `Math.random()` is not cryptographically secure. While this is a model selection function (not a password generator), the randomization of model pairing and position assignment is a core fairness guarantee of the product (D-03, BATTLE-06). A predictable PRNG could theoretically allow a sophisticated attacker to predict which model is A vs B, defeating the blind comparison. On V8 (Node.js), `Math.random()` uses xorshift128+ which is predictable with enough observations.
**Fix:** Use `crypto.getRandomValues()` or `crypto.randomInt()` for the shuffle and position assignment:
```typescript
import crypto from "node:crypto";

// Replace Math.random() with:
const j = crypto.randomInt(0, i + 1);
// ...
positionA: crypto.randomInt(0, 2) === 0 ? "left" : "right",
```

### WR-03: Vote submission does not guard against voting while streams are still active

**File:** `src/components/battle/battle-arena.tsx:96-134`
**Issue:** The `handleVote` function reads `completionA.completion` and `completionB.completion` at call time. Although the UI disables vote buttons during streaming, a race condition exists: the user could click vote in the brief moment between the last `onFinish` firing and the phase transitioning to `voting`. More importantly, if there's a network delay in the `onFinish` callback, the completion text could be empty or truncated. The vote endpoint's zod validation requires `responseA` and `responseB` to be min length 1, so empty strings would fail, but truncated responses would silently succeed.
**Fix:** Add a guard at the top of `handleVote`:
```typescript
const handleVote = useCallback(async (winner: "a" | "b") => {
  if (voteLoadingRef.current) return;
  if (store.phase !== "voting") return; // Guard: only vote when phase is correct
  if (!completionA.completion || !completionB.completion) return; // Guard: responses must exist
  // ... rest of handler
```

### WR-04: Supabase client initialized at module scope with lazy env proxy causes confusing errors

**File:** `src/lib/db/client.ts:6-9`
**Issue:** The `supabase` client is created at module scope: `createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)`. While `env` is a lazy proxy, `createClient` is called immediately when the module is first imported. If the env vars are not yet available (e.g., during edge runtime initialization or test setup without mocks), the error message will be a Zod validation error thrown from inside the Supabase client constructor context, making it hard to diagnose. This also means the service role key is baked into a singleton -- there is no way to reset it for testing.
**Fix:** Use a lazy initialization pattern consistent with how `env` itself works:
```typescript
let _supabase: ReturnType<typeof createClient> | undefined;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return _supabase;
}

// For backward compatibility during transition:
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
```

### WR-05: `useEffect` dependency on entire `completionA`/`completionB` objects causes re-renders on every stream chunk

**File:** `src/components/battle/battle-arena.tsx:51-56`
**Issue:** The `useEffect` that aborts streams on error has `completionA` and `completionB` in its dependency array. These are objects returned by `useCompletion` that change identity on every render (every stream chunk). This means the effect runs on every single text chunk during streaming, not just when the phase changes to "error". While functionally benign (the `if` guard prevents action), it is wasteful and could cause subtle issues if the effect body becomes more complex.
**Fix:** Extract the `stop` functions into stable refs, or use only `store.phase` as the dependency and access `stop` via refs:
```typescript
const stopARef = useRef(completionA.stop);
const stopBRef = useRef(completionB.stop);
stopARef.current = completionA.stop;
stopBRef.current = completionB.stop;

useEffect(() => {
  if (store.phase === "error") {
    stopARef.current();
    stopBRef.current();
  }
}, [store.phase]);
```

### WR-06: `handleStartBattle` missing `await` on `completionA.complete()` and `completionB.complete()` -- errors are silently swallowed

**File:** `src/components/battle/battle-arena.tsx:84-89`
**Issue:** `completionA.complete()` and `completionB.complete()` return promises, but they are called without `await` and without `.catch()`. If either call rejects synchronously (e.g., the hook is in an invalid state), the rejection is unhandled. The `onError` callback on the hook handles stream errors, but connection-level failures before streaming begins may not trigger `onError` and would instead produce unhandled promise rejections.
**Fix:** Add error handling for the promise results:
```typescript
Promise.all([
  completionA.complete(question, { body: { token, slot: "a" } }),
  completionB.complete(question, { body: { token, slot: "b" } }),
]).catch(() => {
  store.setError("스트림 연결에 실패했습니다");
});
```

## Info

### IN-01: Unused exports in `queries.ts`

**File:** `src/lib/db/queries.ts:4-71`
**Issue:** The functions `insertBattle`, `updateBattleResponse`, `updateBattleStatus`, `insertVote`, and `getBattleById` are exported but never imported anywhere in the reviewed codebase. Only `insertBattleWithVote` and `getModelWinRates` are used by the vote route. These appear to be an earlier API design that was superseded by `insertBattleWithVote`.
**Fix:** Remove unused functions or add a comment indicating they are reserved for future use (e.g., admin endpoints). Dead code increases maintenance burden.

### IN-02: `console.error` calls in route handlers

**File:** `src/app/api/battle/start/route.ts:38`, `src/app/api/battle/stream/route.ts:45`, `src/app/api/battle/vote/route.ts:77`
**Issue:** Route handlers use `console.error` for error logging. While acceptable for v1/MVP, this produces unstructured logs that are hard to query in Vercel's logging infrastructure.
**Fix:** Consider a minimal structured logger or at least include a consistent format. Low priority for v1.

### IN-03: `handleRetry` and `handleNewBattle` are identical

**File:** `src/components/battle/battle-arena.tsx:137-148`
**Issue:** Both `handleRetry` and `handleNewBattle` have exactly the same implementation (stop both completions and reset store). While the semantic distinction is reasonable (retry from error vs. new battle from reveal), having two identical functions is unnecessary code duplication.
**Fix:** Consolidate into a single `handleReset` function used by both UI triggers:
```typescript
const handleReset = useCallback(() => {
  completionA.stop();
  completionB.stop();
  store.reset();
}, [store, completionA, completionB]);
```

### IN-04: `durationA`/`durationB` fields in `insertBattleWithVote` are accepted but never persisted

**File:** `src/lib/db/queries.ts:110-111` and `src/lib/db/queries.ts:114-128`
**Issue:** The `insertBattleWithVote` function accepts `durationA` and `durationB` parameters in its input type, but these values are never included in the Supabase insert call. The data is silently dropped. The vote route sends duration data from the client, but it is never stored.
**Fix:** Either add `duration_a` and `duration_b` columns to the `battles` table and include them in the insert, or remove the parameters from the function signature to avoid confusion:
```typescript
// If keeping: add to insert object
.insert({
  // ... existing fields
  duration_a: data.durationA,
  duration_b: data.durationB,
})
```

---

_Reviewed: 2026-04-09T12:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
