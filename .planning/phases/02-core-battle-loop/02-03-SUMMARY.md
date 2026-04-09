---
phase: 02-core-battle-loop
plan: 03
subsystem: ui
tags: [zustand, state-machine, battle-components, korean-ui, streaming, voting, reveal]

# Dependency graph
requires:
  - phase: 02-core-battle-loop/01
    provides: Battle types (BattleVoteResponse, ModelReveal, WinRateData), API routes
  - phase: 02-core-battle-loop/02
    provides: shadcn/ui components, CSS design system, Pretendard font, Zustand dependency
provides:
  - Zustand battle state machine with all phase transitions (idle/streaming/voting/reveal/error)
  - BattleInput component with 2000 char limit, Korean placeholder, Ctrl+Enter submit
  - ResponseCard with streaming indicator, completion time, model reveal with colored badges
  - StreamingIndicator pulsing blue dot (800ms animation)
  - VotePanel with A/B vote buttons, disabled state during streaming, loading spinner
  - WinRateBar horizontal percentage bar with model color fill
  - RevealPanel with model reveal, win rates, and new battle button
affects: [02-04, all-future-ui-plans]

# Tech tracking
tech-stack:
  added: []
  patterns: [zustand-state-machine, props-driven-components, dual-stream-race-condition-prevention]

key-files:
  created:
    - src/lib/store/battle-store.ts
    - src/components/battle/streaming-indicator.tsx
    - src/components/battle/battle-input.tsx
    - src/components/battle/response-card.tsx
    - src/components/battle/vote-panel.tsx
    - src/components/battle/win-rate-bar.tsx
    - src/components/battle/reveal-panel.tsx

key-decisions:
  - "Response text NOT stored in Zustand -- owned by useCompletion hooks in Plan 04 to avoid double-storing"
  - "Race condition prevention: setStreamingA/B uses get() after set() to check both stream states"
  - "Phase guard on streaming->voting transition prevents spurious transitions after error"
  - "All components are props-driven presentation components ready for orchestration in Plan 04"

patterns-established:
  - "Zustand store as single source of truth for battle phase, with response text owned by AI SDK hooks"
  - "Props-driven battle components: no store subscriptions in components, wiring done by parent orchestrator"
  - "Korean copywriting contract: all user-facing text in Korean with formal polite speech"

requirements-completed: [BATTLE-01, BATTLE-02, BATTLE-03, BATTLE-04, BATTLE-05]

# Metrics
duration: 2min
completed: 2026-04-09
---

# Phase 2 Plan 3: Zustand Store + Battle Components Summary

**Zustand battle state machine with race-condition-safe dual-stream completion and 6 Korean battle UI components matching UI-SPEC visual contract**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T03:25:21Z
- **Completed:** 2026-04-09T03:27:34Z
- **Tasks:** 2
- **Files created:** 7

## Accomplishments
- Created Zustand store implementing the complete battle state machine (idle -> streaming -> voting -> reveal -> error -> idle) with race condition prevention for dual-stream completion
- Built 6 battle UI components matching the UI-SPEC visual contract exactly: StreamingIndicator, BattleInput, ResponseCard, VotePanel, WinRateBar, RevealPanel
- All Korean copywriting matches UI-SPEC contract (placeholder, CTA, vote buttons, completion label, win rate format, new battle button)
- Response text intentionally NOT stored in Zustand -- will be owned by useCompletion hooks in Plan 04 to avoid double-storing streaming data
- Threat model mitigations implemented: 2000 char client limit (T-02-11), model identity hidden until revealedModelName set (T-02-12), vote buttons disabled after first click (T-02-13)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Zustand battle state machine store** - `78011cd` (feat)
2. **Task 2: Create all 6 battle UI components** - `87f33bb` (feat)

## Files Created
- `src/lib/store/battle-store.ts` - Zustand store with BattlePhase type, all state+actions, race condition handling
- `src/components/battle/streaming-indicator.tsx` - Pulsing blue dot (800ms) for active streaming
- `src/components/battle/battle-input.tsx` - Textarea with 2000 char counter, Korean placeholder, Ctrl+Enter
- `src/components/battle/response-card.tsx` - Model label badge, streaming/complete body, duration, reveal colors
- `src/components/battle/vote-panel.tsx` - A/B vote buttons with disabled state, loading spinner, accessibility
- `src/components/battle/win-rate-bar.tsx` - Horizontal percentage bar with model color fill
- `src/components/battle/reveal-panel.tsx` - Post-vote model reveal with win rates and new battle CTA

## Decisions Made
- Response text NOT stored in Zustand store. The `useCompletion` hooks in BattleArena (Plan 04) own response text via `completionA.completion` / `completionB.completion`. This avoids double-storing streaming text.
- Race condition prevention: `setStreamingA`/`setStreamingB` uses `get()` after `set()` to read the other stream's status, with a phase guard (`state.phase === "streaming"`) to prevent spurious transitions after error.
- All 6 components are props-driven presentation components with no direct store subscriptions. The parent orchestrator (Plan 04) will wire props from both the Zustand store and useCompletion hooks.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Zustand store ready for BattleArena orchestrator in Plan 04
- All 6 components ready for composition in the arena page
- Components accept props that Plan 04 will derive from useBattleStore + useCompletion hooks
- Korean copywriting complete and consistent with UI-SPEC contract

## Self-Check: PASSED

All 7 created files verified present. Both task commits verified in git log.

---
*Phase: 02-core-battle-loop*
*Completed: 2026-04-09*
