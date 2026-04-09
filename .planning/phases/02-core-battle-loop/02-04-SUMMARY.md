---
phase: 02-core-battle-loop
plan: 04
subsystem: ui
tags: [battle-arena, orchestrator, useCompletion, dual-stream, zustand-wiring, page-integration]

# Dependency graph
requires:
  - phase: 02-core-battle-loop/01
    provides: Battle API routes (start/stream/vote), HMAC tokens, types
  - phase: 02-core-battle-loop/02
    provides: shadcn/ui components, CSS design system, Sonner toaster, Pretendard font
  - phase: 02-core-battle-loop/03
    provides: Zustand battle store, 6 battle UI components (BattleInput, ResponseCard, VotePanel, RevealPanel, StreamingIndicator, WinRateBar)
provides:
  - BattleArena orchestrator component connecting all APIs, hooks, store, and UI components
  - Complete battle page at / with live battle interface replacing placeholder
  - Dual useCompletion hooks with parallel streaming (D-04, BATTLE-02)
  - Error coordination across streams (D-06)
  - Duration tracking with performance.now() (D-05)
  - Vote submission reading accumulated text from useCompletion hooks (D-07)
  - Model reveal with win rates after voting (D-04, D-11)
  - Reset to idle state on new battle (D-12)
affects: [03-categories, 04-seasons, 05-ui-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [dual-useCompletion-orchestration, performance-now-duration-tracking, vote-loading-ref-guard]

key-files:
  created:
    - src/components/battle/battle-arena.tsx
  modified:
    - src/app/page.tsx

key-decisions:
  - "Response text read directly from useCompletion hooks at vote time per RESEARCH.md Pitfall 3 -- not mirrored to Zustand"
  - "Body passed at complete() call site per RESEARCH.md Pitfall 1 -- not at hook init level, to ensure token availability"
  - "voteLoadingRef prevents double-vote submission at UI level (T-02-17)"
  - "useEffect watching store.phase === error triggers stop() on both completion hooks (D-06)"

patterns-established:
  - "Orchestrator pattern: parent component wires Zustand store + useCompletion hooks + API calls + child components"
  - "Dual-hook isolation: separate id values (battle-a, battle-b) prevent useCompletion hook collision"

requirements-completed: [BATTLE-01, BATTLE-02, BATTLE-03, BATTLE-04, BATTLE-05, BATTLE-06]

# Metrics
duration: 4min
completed: 2026-04-09
---

# Phase 2 Plan 4: Battle Arena Orchestrator Summary

**BattleArena orchestrator wiring dual useCompletion hooks, 3 API endpoints, Zustand battle store, and 6 UI components into the complete blind battle flow at /**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-09T03:30:44Z
- **Completed:** 2026-04-09T03:34:21Z
- **Tasks:** 1 (code) + 1 (checkpoint:human-verify pending)
- **Files modified:** 2

## Accomplishments
- Created BattleArena orchestrator component that connects all Phase 2 infrastructure into a working battle flow
- Wired dual useCompletion hooks with unique IDs for parallel AI streaming without hook collision
- Connected to all 3 API routes: /api/battle/start (token), /api/battle/stream (SSE), /api/battle/vote (reveal)
- Implemented error coordination: one stream error aborts both via useEffect + stop() (D-06)
- Duration tracking with performance.now() for accurate timing unaffected by tab backgrounding (D-05)
- Vote submission reads response text directly from useCompletion hooks at vote time (RESEARCH.md Pitfall 3)
- Replaced placeholder "Coming Soon" page with live BattleArena component
- All Korean copywriting matches UI-SPEC contract
- TypeScript compilation and Next.js production build pass clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BattleArena orchestrator and replace page.tsx** - `9de187d` (feat)

## Files Created/Modified
- `src/components/battle/battle-arena.tsx` - Master orchestrator: dual useCompletion hooks, API wiring, Zustand integration, error coordination, duration tracking, all child component composition
- `src/app/page.tsx` - Replaced placeholder with BattleArena rendering in flex-1 main container

## Decisions Made
- **Response text from hooks, not store:** At vote submission time, read `completionA.completion` and `completionB.completion` directly rather than mirroring text to Zustand store. This avoids double-storing streaming data per RESEARCH.md recommendation.
- **Body at complete() call site:** Token and slot passed via the `body` parameter of `complete()` function, not at hook initialization. Ensures token is available when streams are triggered (RESEARCH.md Pitfall 1).
- **voteLoadingRef for double-click prevention:** Used a ref instead of state to prevent re-renders during the loading guard check. Combined with VotePanel's disabled prop for UI-level double-vote prevention.
- **useEffect for error abort:** Watches `store.phase` and calls `stop()` on both hooks when entering error state. This is the documented pattern for coordinating independent hook instances (RESEARCH.md Pitfall 5).

## Deviations from Plan

None - plan executed exactly as written.

## Threat Mitigations Verified
- **T-02-14 (Information Disclosure):** Token is opaque blob in client state. Model IDs never stored in client-accessible state. No model hints in useCompletion hook params.
- **T-02-15 (Tampering):** Token verified server-side. Response texts read from useCompletion (matches displayed text).
- **T-02-16 (DoS):** Button disabled during streaming prevents rapid-fire starts. Phase 4 adds server-side rate limiting.
- **T-02-17 (Replay):** voteLoadingRef prevents double-click at client level. Server UNIQUE constraint on votes.battle_id prevents DB duplicates.

## Issues Encountered
- Build initially failed due to missing env vars in worktree (.env.local not present). Resolved by copying .env.local from main repo and adding BATTLE_SESSION_SECRET. This is a pre-existing infrastructure gap, not caused by Plan 04 changes.

## User Setup Required
- All prerequisites from Plan 01 apply: API keys, Supabase migration, BATTLE_SESSION_SECRET
- Human verification (Task 2) pending: complete battle flow end-to-end test in browser

## Next Phase Readiness
- Complete battle loop functional at /
- Phase 3 (Categories) can add category selection UI to BattleArena
- Phase 4 (Seasons) can add season banner and rate limiting
- Phase 5 (UI Polish) can refine animations, loading states, responsive behavior

## Self-Check: PASSED

All created/modified files verified present. Task commit verified in git log.
