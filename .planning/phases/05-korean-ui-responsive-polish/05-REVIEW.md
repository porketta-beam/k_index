---
phase: 05-korean-ui-responsive-polish
reviewed: 2026-04-10T12:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - src/app/globals.css
  - src/lib/store/battle-store.ts
  - src/lib/store/battle-store.test.ts
  - src/hooks/use-active-card.ts
  - src/components/battle/swipe-container.tsx
  - src/components/battle/battle-arena.tsx
  - src/components/battle/battle-input.tsx
  - src/components/battle/response-card.tsx
  - src/components/battle/vote-panel.tsx
  - src/components/battle/reveal-panel.tsx
  - src/components/battle/category-selector.tsx
  - src/app/page.tsx
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-10T12:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

This review covers the Phase 05 Korean UI / responsive polish changes: a mobile swipe container with IntersectionObserver-based active card detection, battle store additions for mobile state and input text, responsive styling updates, and Korean typography configuration.

Overall quality is solid. The state machine in `battle-store.ts` is well-designed with clear phase transitions and appropriate race condition handling. The CSS configuration correctly sets up Korean typography with `word-break: keep-all`. The mobile swipe container uses appropriate web platform APIs (scroll-snap, IntersectionObserver).

Key concerns: (1) `battle-arena.tsx` subscribes to the entire Zustand store without selectors, causing unnecessary re-renders on every state change, which is a correctness risk during streaming when the store updates rapidly; (2) an accessibility gap where `role="tab"` elements lack `aria-controls` attributes linking them to their corresponding `role="tabpanel"` elements; (3) the `useEffect` dependency on `containerRef` in `use-active-card.ts` will never re-fire because ref objects maintain stable identity.

No security vulnerabilities or critical bugs were found.

## Warnings

### WR-01: Entire Zustand store subscribed without selectors in BattleArena

**File:** `src/components/battle/battle-arena.tsx:25`
**Issue:** `const store = useBattleStore()` subscribes to the entire store. During the streaming phase, any state update (including `mobileActiveCard` changes from swipe, `streamingA`/`streamingB` toggles, duration updates) triggers a full re-render of `BattleArena` and all its children. This is particularly problematic because `BattleArena` is the top-level component containing both `useCompletion` hooks, and unnecessary re-renders during rapid streaming can cause visual jank or dropped frames.
**Fix:** Use granular selectors for state reads, and group actions into a separate selector:
```tsx
const phase = useBattleStore((s) => s.phase);
const question = useBattleStore((s) => s.question);
const category = useBattleStore((s) => s.category);
const systemPrompt = useBattleStore((s) => s.systemPrompt);
const battleToken = useBattleStore((s) => s.battleToken);
// ... etc for each piece of state actually used in render

// Actions (stable references, won't cause re-renders)
const actions = useBattleStore((s) => ({
  startBattle: s.startBattle,
  setStreamingA: s.setStreamingA,
  // ...
}));
```
The same pattern should be applied to `battle-input.tsx:17` and `category-selector.tsx:12` which also destructure the entire store, though the impact is less severe there since they are leaf components.

### WR-02: useEffect dependency on containerRef never re-fires

**File:** `src/hooks/use-active-card.ts:42`
**Issue:** The `useEffect` has `[containerRef]` as its dependency array. React ref objects created by `useRef` maintain stable identity across renders -- the reference never changes. This means if the container's children are rendered asynchronously (e.g., during streaming when cards first appear), the IntersectionObserver is set up once on mount and observes whatever children exist at that moment. If children mount after the observer is created, they won't be observed. In the current usage the two child divs are always rendered (just with empty content), so this is not currently breaking, but it is fragile and would break if the swipe container conditionally rendered its children.
**Fix:** Add a dependency on the number of children, or use a ResizeObserver / MutationObserver pattern. For the current usage, the simplest fix is to document the assumption explicitly, or observe children via a ref callback:
```tsx
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const children = Array.from(container.children);
  if (children.length === 0) return;

  const observer = new IntersectionObserver(/* ... */);
  children.forEach((child) => observer.observe(child));
  return () => observer.disconnect();
}, [containerRef]); // Stable ref -- runs once on mount, which is correct for static children
```
Add a comment noting the assumption that children are always present on mount.

### WR-03: `setStreamingA` and `setStreamingB` race condition with intermediate state reads

**File:** `src/lib/store/battle-store.ts:110-124`
**Issue:** In `setStreamingA`, the code calls `set({ streamingA: streaming })` then `get()` to check the other stream. The comment says this prevents race conditions, but there is a subtle issue: both `setStreamingA(false)` and `setStreamingB(false)` could fire in the same microtask (since both `onFinish` callbacks fire from the same event loop tick if both streams complete simultaneously). Zustand's `set` is synchronous, so the second `set` in `setStreamingA` would read the state before `setStreamingB`'s `set` runs -- this is actually correct behavior. However, `setStreamingB` checks `!state.streamingA && !streaming` (line 121) while `setStreamingA` checks `!streaming && !state.streamingB` (line 113). These are functionally identical given the `set()` before `get()` pattern, but the inconsistent parameter ordering makes the code harder to verify. More importantly, if both fire in the same microtask, the phase transition to "voting" could be set twice (harmless but wasteful).
**Fix:** Make both checks consistent for readability:
```ts
setStreamingA: (streaming: boolean) => {
  set({ streamingA: streaming });
  const state = get();
  if (!state.streamingA && !state.streamingB && state.phase === "streaming") {
    set({ phase: "voting" });
  }
},
setStreamingB: (streaming: boolean) => {
  set({ streamingB: streaming });
  const state = get();
  if (!state.streamingA && !state.streamingB && state.phase === "streaming") {
    set({ phase: "voting" });
  }
},
```
After calling `set({ streamingA: streaming })`, `state.streamingA` from `get()` already reflects the new value. Using `state.streamingA` and `state.streamingB` in both functions is clearer and avoids mixing parameter with state.

### WR-04: Missing aria-controls on tab elements in SwipeContainer

**File:** `src/components/battle/swipe-container.tsx:70-107`
**Issue:** The dot indicator buttons have `role="tab"` and `aria-selected`, but lack `aria-controls` attributes linking them to the corresponding `role="tabpanel"` elements. The tabpanels also lack `id` attributes. This is an accessibility violation per WAI-ARIA tabs pattern -- screen readers cannot associate tabs with their panels.
**Fix:** Add `id` attributes to tabpanels and `aria-controls` to tabs:
```tsx
<div
  id="card-panel-a"
  role="tabpanel"
  aria-label="Model A"
>
  {slotA}
</div>
<div
  id="card-panel-b"
  role="tabpanel"
  aria-label="Model B"
>
  {slotB}
</div>

{/* Dot indicators */}
<button
  role="tab"
  aria-selected={activeCard === 0}
  aria-controls="card-panel-a"
  aria-label="Model A"
  ...
/>
<button
  role="tab"
  aria-selected={activeCard === 1}
  aria-controls="card-panel-b"
  aria-label="Model B"
  ...
/>
```

### WR-05: Vote button remains clickable during loading despite UI intent

**File:** `src/components/battle/vote-panel.tsx:26-27`
**Issue:** When `disabled` is true (during streaming), the buttons correctly use `disabled={disabled || loading || selectedWinner !== null}`. However, both `aria-disabled={disabled}` (line 27) and `aria-describedby` (line 28) only reference the `disabled` prop, not `loading` or `selectedWinner`. When `loading` is true (vote API in-flight) or `selectedWinner` is set, the button is disabled via the `disabled` attribute but `aria-disabled` still reports `false`. This gives inconsistent signals to assistive technology.
**Fix:** Sync `aria-disabled` with the actual computed disabled state:
```tsx
const isButtonDisabled = disabled || loading || selectedWinner !== null;
// ...
<Button
  disabled={isButtonDisabled}
  aria-disabled={isButtonDisabled}
  aria-describedby={isButtonDisabled ? "vote-wait-message" : undefined}
>
```

## Info

### IN-01: completionA and completionB in useEffect dependency cause frequent re-creation

**File:** `src/components/battle/battle-arena.tsx:95`
**Issue:** The useEffect on line 90-95 depends on `[store.phase, completionA, completionB]`. The `completionA` and `completionB` objects from `useCompletion` are recreated on each render (new object references), which means this effect runs on every render, not just when `phase` changes. The effect is lightweight (just calling `.stop()`), so this is not a bug, but it means the abort logic fires more often than intended.
**Fix:** Extract `stop` functions into stable references:
```tsx
const stopA = completionA.stop;
const stopB = completionB.stop;

useEffect(() => {
  if (store.phase === "error") {
    stopA();
    stopB();
  }
}, [store.phase, stopA, stopB]);
```

### IN-02: handleStartBattle and handleVote reference entire `store` object

**File:** `src/components/battle/battle-arena.tsx:145`
**Issue:** The `useCallback` dependencies include `store`, which is the full Zustand store object. Since `store` is obtained via `useBattleStore()` without a selector, `store` is a new object on every render. This means `handleStartBattle` and `handleVote` are recreated on every render, defeating the purpose of `useCallback`. This is related to WR-01 but worth noting separately as a pattern issue.
**Fix:** After applying WR-01's fix, replace `store` dependency with specific action references (which are stable in Zustand).

### IN-03: Duplicate body selector in globals.css base layer

**File:** `src/app/globals.css:152-162`
**Issue:** There are two `body` rule blocks in the `@layer base` section -- one at line 153 applying `bg-background text-foreground`, and another at line 160-162 setting `word-break: keep-all`. These could be merged into a single rule block for clarity.
**Fix:** Combine into one block:
```css
body {
  @apply bg-background text-foreground;
  word-break: keep-all;
}
```

### IN-04: Unused `cn` import in battle-arena.tsx could be replaced with template literal

**File:** `src/components/battle/battle-arena.tsx:9`
**Issue:** The `cn` utility is imported but used only once at line 240-242 for a simple conditional class. While not incorrect, the usage pattern `cn("flex-1 overflow-y-auto px-4", (isIdle || isStreaming) && "pb-[80px]")` could alternatively use a template literal. This is a minor style observation -- `cn` is fine and consistent with the rest of the codebase.
**Fix:** No action needed. Keeping `cn` is consistent with the project's conventions.

---

_Reviewed: 2026-04-10T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
