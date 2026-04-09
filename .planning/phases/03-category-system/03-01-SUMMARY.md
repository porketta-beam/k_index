---
phase: 03-category-system
plan: 01
subsystem: api
tags: [categories, hmac-token, zod-validation, korean-prompts, battle-session]

# Dependency graph
requires:
  - phase: 02-core-battle-loop
    provides: HMAC token session management, battle API routes, BattleSession type
provides:
  - Static category definitions with 5 Korean-localized presets
  - Extended BattleSession type with cat/sp fields for token-based category transport
  - Category-validated /api/battle/start route with system prompt validation
  - Token-sourced system prompt in /api/battle/stream route
  - Token-sourced category in /api/battle/vote route
affects: [03-category-system plan 02 (UI components need categories.ts imports)]

# Tech tracking
tech-stack:
  added: []
  patterns: [static-category-definitions, token-sourced-system-prompt, zod-refine-validation]

key-files:
  created:
    - src/lib/categories.ts
    - src/lib/categories.test.ts
  modified:
    - src/lib/types.ts
    - src/lib/battle/session.test.ts
    - src/app/api/battle/start/route.ts
    - src/app/api/battle/stream/route.ts
    - src/app/api/battle/vote/route.ts

key-decisions:
  - "System prompt embedded directly in HMAC token (max 500 chars = ~2.4KB base64url, no server-side cache needed)"
  - "Unicode escape sequences used for Korean text in categories.ts (JS runtime interprets correctly)"

patterns-established:
  - "Static category array pattern: categories as typed const array in src/lib/categories.ts, not DB"
  - "Token-sourced values pattern: category and system prompt flow through HMAC token, never from client request to stream/vote"
  - "Zod refine validation pattern: category ID validated against known array using .refine()"

requirements-completed: [CAT-01, CAT-02, CAT-03]

# Metrics
duration: 4min
completed: 2026-04-09
---

# Phase 3 Plan 01: Category Data Layer + Token Extension Summary

**5 preset Korean categories with HMAC token transport and Zod-validated API routes replacing all hardcoded defaults**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-09T06:52:55Z
- **Completed:** 2026-04-09T06:57:23Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created src/lib/categories.ts with 5 categories (general, homework, cover-letter, counseling, creative) each with distinct Korean system prompts
- Extended BattleSession type with cat and sp fields, automatically carried through HMAC token chain
- Updated all 3 API routes: start validates category+prompt, stream reads prompt from token, vote reads category from token
- 18 unit tests pass covering category definitions, lookup functions, and token roundtrip with cat/sp fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Create category definitions and extend BattleSession type**
   - `cfb8c97` (test) - Failing tests for category definitions and lookup functions
   - `a2844d0` (feat) - Category definitions with 5 Korean presets, BattleSession cat/sp extension
2. **Task 2: Extend HMAC token and update all 3 API routes**
   - `d0343bb` (test) - HMAC token roundtrip tests for cat/sp fields
   - `0de95e0` (feat) - API route updates for token-sourced category and system prompt

## Files Created/Modified
- `src/lib/categories.ts` - Static category definitions: CategoryDef interface, CATEGORIES array (5 entries), getCategoryById, getDefaultPrompt
- `src/lib/categories.test.ts` - 9 unit tests for category definitions, lookups, and fallback behavior
- `src/lib/types.ts` - Extended BattleSession with cat: string and sp: string fields
- `src/lib/battle/session.test.ts` - 5 new tests for HMAC token roundtrip with cat/sp fields (9 total)
- `src/app/api/battle/start/route.ts` - Added category + systemPrompt to request schema with Zod validation, included in token
- `src/app/api/battle/stream/route.ts` - Changed system prompt source from BATTLE_CONFIG.systemPrompt to session.sp
- `src/app/api/battle/vote/route.ts` - Changed category source from hardcoded "general" to session.cat

## Decisions Made
- System prompt embedded directly in HMAC token payload rather than using server-side cache. At max 500 Korean chars (~2.4KB base64url), POST body has no practical size limit and this keeps the stateless HMAC pattern intact.
- Unicode escape sequences used in categories.ts for Korean text. JavaScript runtime interprets these correctly in string literals; all tests pass with proper Korean text comparison.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Category data layer complete, ready for Plan 02 UI components (CategorySelector, SystemPromptEditor)
- HMAC token automatically carries category + system prompt through entire battle flow
- Zustand store extension (Plan 02) can import from src/lib/categories.ts directly

## Self-Check: PASSED

All 7 files verified present on disk. All 4 commit hashes (cfb8c97, a2844d0, d0343bb, 0de95e0) verified in git log.

---
*Phase: 03-category-system*
*Completed: 2026-04-09*
