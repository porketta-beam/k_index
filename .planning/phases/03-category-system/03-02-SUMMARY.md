---
phase: 03-category-system
plan: 02
subsystem: ui
tags: [category-selector, system-prompt-editor, zustand, shadcn-ui, toggle-group, collapsible, url-persistence]

# Dependency graph
requires:
  - phase: 03-category-system plan 01
    provides: Static category definitions (CATEGORIES, getCategoryById, getDefaultPrompt), BattleSession with cat/sp fields
provides:
  - CategorySelector toggle-group component with 5 Korean-labeled presets
  - SystemPromptEditor collapsible component with char counter, reset, and modified badge
  - Extended Zustand battle store with category/prompt state and switch-warning logic
  - URL persistence via ?cat query parameter with server component integration
  - Category-specific win rate headers in reveal panel
affects: [04-seasons (season system may need category-aware leaderboard), 05-ui-polish (styling refinements)]

# Tech tracking
tech-stack:
  added: [radix-ui/react-toggle-group, radix-ui/react-toggle, radix-ui/react-collapsible]
  patterns: [url-state-sync, collapsible-editor, toggle-group-selector, category-switch-warning]

key-files:
  created:
    - src/components/battle/category-selector.tsx
    - src/components/battle/system-prompt-editor.tsx
    - src/components/ui/toggle-group.tsx
    - src/components/ui/toggle.tsx
    - src/components/ui/collapsible.tsx
    - src/lib/store/battle-store.test.ts
  modified:
    - src/lib/store/battle-store.ts
    - src/components/battle/battle-arena.tsx
    - src/components/battle/reveal-panel.tsx
    - src/app/page.tsx

key-decisions:
  - "shadcn toggle-group for category selection (accessible, keyboard-navigable, 0KB runtime)"
  - "URL ?cat param removed for default category (clean URL for general)"
  - "Category switch with modified prompt shows inline warning with confirm/cancel"

patterns-established:
  - "URL state sync pattern: searchParams read in server component, passed as initialCategory prop, synced via window.history.replaceState"
  - "Collapsible editor pattern: ChevronDown rotation animation, textarea with char counter and max validation"
  - "Store-driven UI disable pattern: selector disabled and editor hidden during streaming/voting/reveal states"

requirements-completed: [CAT-01, CAT-02, CAT-03]

# Metrics
duration: 7min
completed: 2026-04-09
---

# Phase 3 Plan 02: Category Selection UI + Store Wiring Summary

**Toggle-group category selector with 5 Korean presets, collapsible system prompt editor, URL persistence, and category-aware battle flow integration**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-09T07:02:00Z
- **Completed:** 2026-04-09T07:09:00Z
- **Tasks:** 3 (Task 3 was visual verification — approved by user)
- **Files modified:** 10

## Accomplishments
- CategorySelector with 5 emoji-labeled toggle buttons (일반, 과제 도움, 자기소개서, 고민 상담, 창작) using shadcn toggle-group
- Collapsible SystemPromptEditor with live char counter, "수정됨" badge, "기본값 복원" reset button, and 500-char max validation
- Category switch warning when prompt is modified: "수정한 프롬프트가 있습니다. 카테고리를 변경하시겠습니까?" with confirm/cancel
- URL persistence via ?cat= query parameter — survives page refresh, clean URL for default category
- Extended Zustand store with category, systemPrompt, isPromptModified, pendingCategory state + actions
- Reveal panel shows "{카테고리명} 카테고리 승률" header above win rates
- Selector disabled and editor hidden during streaming/voting/reveal; new battle preserves category but resets prompt

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn components, extend Zustand store, add tests**
   - `86e1384` (test) - Failing tests for Zustand store category state
   - `85933dd` (feat) - Zustand store extension + shadcn toggle-group, toggle, collapsible components
2. **Task 2: Create CategorySelector, SystemPromptEditor, wire BattleArena, URL sync**
   - `5de28fb` (feat) - Full UI implementation with URL persistence and battle flow integration
3. **Task 3: Visual verification** — approved by user

## Files Created/Modified
- `src/components/battle/category-selector.tsx` - ToggleGroup-based category picker with 5 emoji options
- `src/components/battle/system-prompt-editor.tsx` - Collapsible prompt editor with textarea, char counter, reset
- `src/components/ui/toggle-group.tsx` - shadcn ToggleGroup component (Radix UI)
- `src/components/ui/toggle.tsx` - shadcn Toggle component (Radix UI)
- `src/components/ui/collapsible.tsx` - shadcn Collapsible component (Radix UI)
- `src/lib/store/battle-store.test.ts` - Unit tests for Zustand store category logic
- `src/lib/store/battle-store.ts` - Extended with category, systemPrompt, isPromptModified, pendingCategory, and actions
- `src/components/battle/battle-arena.tsx` - Wired CategorySelector + SystemPromptEditor, passes category/prompt to start API
- `src/components/battle/reveal-panel.tsx` - Win rate section header with category name
- `src/app/page.tsx` - Server component reading ?cat searchParam, passes initialCategory prop

## Decisions Made
- Used shadcn toggle-group (Radix UI underneath) for accessible, keyboard-navigable category selection with zero runtime JS overhead
- Clean URL for default category — ?cat param only appears for non-general categories
- Inline warning pattern for category switch with modified prompt (not a dialog — less disruptive)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete category system operational end-to-end: selection → token → streaming → voting → win rates
- Ready for Phase 04 (seasons) which may need category-aware leaderboards
- All category UI components self-contained for Phase 05 styling refinements

## Self-Check: PASSED

All 10 files verified. All 3 commits (86e1384, 85933dd, 5de28fb) verified in git log. User approved visual verification.

---
*Phase: 03-category-system*
*Completed: 2026-04-09*
