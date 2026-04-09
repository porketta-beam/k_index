---
phase: 05-korean-ui-responsive-polish
plan: 01
subsystem: ui
tags: [zustand, scroll-snap, intersection-observer, mobile-swipe, css-utilities, react-hooks]

# Dependency graph
requires:
  - phase: 02-core-battle-loop
    provides: "BattleState store with phase machine, ResponseCard component"
  - phase: 03-category-system
    provides: "Category state in battle store (preserved across reset)"
  - phase: 04-season-system-global-state
    provides: "Season state in battle store (preserved across reset)"
provides:
  - "mobileActiveCard (0|1) and inputText (string) state in Zustand store"
  - "setMobileActiveCard and setInputText actions"
  - "useActiveCard hook for IntersectionObserver-based scroll-snap detection"
  - "SwipeContainer component for mobile horizontal card swipe with dot indicators"
  - "scrollbar-hide CSS utility class"
affects: [05-02-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "IntersectionObserver with 0.5 threshold for scroll-snap active card detection"
    - "CSS scroll-snap with snap-x snap-mandatory for mobile card swipe"
    - "scrollbar-hide utility using scrollbar-width:none + webkit pseudoelement"
    - "Zustand store extension pattern: add to interface, initialState, actions, reset()"

key-files:
  created:
    - src/hooks/use-active-card.ts
    - src/components/battle/swipe-container.tsx
  modified:
    - src/lib/store/battle-store.ts
    - src/lib/store/battle-store.test.ts
    - src/app/globals.css

key-decisions:
  - "IntersectionObserver threshold 0.5 for detecting active card (50% visibility)"
  - "min-h-[300px] on card slots to prevent scroll-snap instability during streaming"
  - "md:hidden on SwipeContainer so desktop continues showing side-by-side grid"

patterns-established:
  - "Hook pattern: useActiveCard returns 0|1, synced to store via useEffect"
  - "SwipeContainer slot pattern: slotA/slotB ReactNode props for flexible card content"
  - "Accessibility pattern: tablist/tab/tabpanel roles on swipe dot indicators"

requirements-completed: [UI-01, UI-02]

# Metrics
duration: 4min
completed: 2026-04-09
---

# Phase 05 Plan 01: Foundation Primitives Summary

**Zustand store extended with mobileActiveCard/inputText, IntersectionObserver hook for scroll-snap detection, SwipeContainer with CSS snap and dot indicators, scrollbar-hide utility**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-09T18:01:41Z
- **Completed:** 2026-04-09T18:05:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extended Zustand battle store with mobileActiveCard (0|1) and inputText (string) fields, with proper actions and reset/startBattle clearing
- Created useActiveCard hook using IntersectionObserver with 0.5 threshold for detecting which scroll-snap card is visible
- Built SwipeContainer component with CSS scroll-snap, dot indicators, ARIA accessibility roles, and min-h-[300px] for streaming stability
- Added scrollbar-hide CSS utility class covering Firefox (scrollbar-width:none), IE/Edge (-ms-overflow-style:none), and WebKit browsers
- All 63 tests pass (10 new mobile state tests + 53 existing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Zustand store + scrollbar-hide CSS** - `ef6df85` (test: RED), `9ad4d0e` (feat: GREEN)
2. **Task 2: Create useActiveCard hook and SwipeContainer** - `4a9956a` (feat)

## Files Created/Modified
- `src/hooks/use-active-card.ts` - IntersectionObserver hook returning active card index (0|1)
- `src/components/battle/swipe-container.tsx` - Mobile swipe container with scroll-snap and dot indicators
- `src/lib/store/battle-store.ts` - Extended with mobileActiveCard, inputText, and their actions
- `src/lib/store/battle-store.test.ts` - 10 new tests for mobile state fields
- `src/app/globals.css` - scrollbar-hide utility class in @layer utilities

## Decisions Made
- Used IntersectionObserver threshold 0.5 (50% visibility) as recommended by UI-SPEC research for reliable snap detection
- Applied min-h-[300px] on card slots per RESEARCH.md Pitfall 2 to prevent snap instability when streaming content changes card height
- SwipeContainer uses md:hidden so it only renders on mobile; desktop layout remains unchanged (side-by-side grid in Plan 02)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All primitives ready for Plan 02 (BattleArena restructure): useActiveCard hook, SwipeContainer, store fields, scrollbar-hide
- SwipeContainer accepts slotA/slotB ReactNode props, ready to receive ResponseCard instances
- Store's mobileActiveCard syncs automatically when user swipes

## Self-Check: PASSED

- All 5 files verified as FOUND on disk
- All 3 commits (ef6df85, 9ad4d0e, 4a9956a) verified in git history
- 63/63 tests passing across 8 test files

---
*Phase: 05-korean-ui-responsive-polish*
*Completed: 2026-04-09*
