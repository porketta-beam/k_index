---
phase: 05-korean-ui-responsive-polish
plan: 02
subsystem: ui
tags: [react, tailwind, zustand, responsive, scroll-snap, korean-i18n]

requires:
  - phase: 05-01
    provides: SwipeContainer, useActiveCard hook, extended battle store (mobileActiveCard, inputText), scrollbar-hide CSS
provides:
  - Restructured BattleArena layout with sticky header/footer
  - Mobile swipe card view with dot indicators
  - Desktop 50:50 side-by-side response grid
  - Formal Korean UI copy across all components
  - Animation-free phase transitions
  - Internal scroll response cards
  - Horizontally scrollable mobile category selector
  - Zustand-backed BattleInput (no local useState)
affects: []

tech-stack:
  added: []
  patterns:
    - "Sticky header/footer layout with backdrop-blur"
    - "Mobile-first responsive with md: breakpoint"
    - "SwipeContainer for mobile, hidden md:grid for desktop"

key-files:
  created: []
  modified:
    - src/components/battle/battle-arena.tsx
    - src/components/battle/battle-input.tsx
    - src/components/battle/response-card.tsx
    - src/components/battle/vote-panel.tsx
    - src/components/battle/reveal-panel.tsx
    - src/components/battle/category-selector.tsx
    - src/app/page.tsx

key-decisions:
  - "Formal Korean tone (격식체) per user feedback — 'A 선택'/'B 선택' instead of casual 'A가 더 좋아'"
  - "No animations on phase transitions (D-04) — instant swap"
  - "No skeleton placeholders (D-05) — empty card until text arrives"

patterns-established:
  - "Sticky header: sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b"
  - "Sticky footer: sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur-sm"
  - "Responsive card layout: SwipeContainer (md:hidden) + hidden md:grid md:grid-cols-2"
  - "Internal scroll: overflow-y-auto max-h-[50vh] md:max-h-[60vh]"

requirements-completed: [UI-01, UI-02, UI-03]

duration: 12min
completed: 2026-04-10
---

# Plan 05-02: Layout Restructure Summary

**Arena.ai-inspired responsive layout with sticky header/footer, mobile swipe cards, formal Korean copy, and animation-free phase transitions**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-10
- **Completed:** 2026-04-10
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 7

## Accomplishments
- Full layout restructure: flat vertical stack replaced with sticky header, scrollable main, sticky bottom input
- Mobile swipe cards via SwipeContainer with dot indicators (< 768px), desktop 50:50 grid (>= 768px)
- All Korean copy updated to formal tone (격식체) per user feedback
- Removed all phase transition animations and skeleton placeholders
- Response cards with internal scroll (max-h-[50vh]/[60vh])
- Category selector horizontally scrollable on mobile
- BattleInput state lifted from local useState to Zustand store

## Task Commits

1. **Task 1: Update leaf components** - `765db09` (feat) — vote-panel, reveal-panel, response-card, category-selector, battle-input
2. **Task 2: Restructure BattleArena layout** - `35b7ccd` (feat) — battle-arena.tsx, page.tsx
3. **Task 3: Visual verification** - `ecd8bb8` (fix) — formal Korean tone applied after user checkpoint feedback

## Files Created/Modified
- `src/components/battle/battle-arena.tsx` - Restructured with sticky header/footer, SwipeContainer, desktop grid
- `src/components/battle/battle-input.tsx` - Zustand-backed input, compact mobile layout, formal CTA
- `src/components/battle/response-card.tsx` - No skeleton, no transition animation, internal scroll
- `src/components/battle/vote-panel.tsx` - Formal copy: "A 선택"/"B 선택", "선호하는 응답을 선택하세요"
- `src/components/battle/reveal-panel.tsx` - Animation classes removed (instant appear)
- `src/components/battle/category-selector.tsx` - Mobile horizontal scroll with scrollbar-hide
- `src/app/page.tsx` - min-h-dvh flex-col wrapper, BattleArena manages own layout

## Decisions Made
- User requested formal Korean tone (격식체) instead of casual (친근체) — all UI copy updated accordingly
- Kept gap-4 between vote buttons instead of UI-SPEC gap-3 for better touch targets

## Deviations from Plan

### Tone change (user-directed)
- **Found during:** Task 3 (visual verification checkpoint)
- **Issue:** User requested formal tone ("딱딱한 말투") instead of casual ("친근한 말투")
- **Fix:** Changed all casual Korean copy to formal equivalents
- **Files modified:** vote-panel.tsx, battle-input.tsx, battle-arena.tsx
- **Committed in:** ecd8bb8

**Total deviations:** 1 user-directed change
**Impact on plan:** Copy tone changed from D-06 mixed casual to uniformly formal per user preference. No structural impact.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 05 UI requirements (UI-01, UI-02, UI-03) implemented
- Responsive layout complete at all breakpoints
- Ready for verification

---
*Phase: 05-korean-ui-responsive-polish*
*Completed: 2026-04-10*
