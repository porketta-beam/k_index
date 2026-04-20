---
phase: 04-season-system-global-state
plan: 03
subsystem: api, ui, state
tags: [season, gate, counter, admin, zustand, accessibility, korean]

# Dependency graph
requires:
  - phase: 04-season-system-global-state
    plan: 01
    provides: Season types, Redis client, SQL migrations, env schema
  - phase: 04-season-system-global-state
    plan: 02
    provides: checkSeasonActive, incrementBattleCounter, getCurrentSeason, endSeasonIfThresholdReached, createSeason, endSeason, verifyAdminKey
provides:
  - Season gate enforcement at battle start (503 for ended season)
  - Counter increment and auto-end check at vote time
  - Season-filtered win rates via getModelWinRates(category, seasonId)
  - Admin season start/end API routes with bearer token auth
  - Zustand seasonEnded/seasonNumber state with setSeasonEnded action
  - SeasonEnded UI component with accessibility and reduced-motion support
  - BattleArena season-ended rendering and 503 detection
affects: [leaderboard, season-history, ui-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Season gate as first route check (before body parsing)", "503 status for season-ended (not error, expected state)", "Sticky season state (preserved across battle resets)", "Admin bearer auth on protected routes"]

key-files:
  created:
    - src/app/api/admin/season/start/route.ts
    - src/app/api/admin/season/end/route.ts
    - src/components/battle/season-ended.tsx
  modified:
    - src/app/api/battle/start/route.ts
    - src/app/api/battle/vote/route.ts
    - src/lib/db/queries.ts
    - src/lib/store/battle-store.ts
    - src/components/battle/battle-arena.tsx

key-decisions:
  - "Season gate runs BEFORE request body parsing to avoid unnecessary work when season is ended"
  - "503 with error=season_ended is treated as expected state, not error, in the UI (per UI-SPEC)"
  - "seasonEnded state is sticky across battle resets (user must refresh page to clear)"
  - "Header is duplicated in SeasonEnded render path (not extracted) per UI-SPEC, will be refactored in Phase 05"

patterns-established:
  - "Admin routes pattern: verifyAdminKey(req) as first check, 401 for invalid, try/catch with console.error for 500"
  - "Season-aware queries: pass seasonId as optional parameter, spread into RPC params when present"

requirements-completed: [SEASON-02, SEASON-03, SEASON-04, DATA-02]

# Metrics
duration: 4min
completed: 2026-04-09
---

# Phase 4 Plan 3: Season Integration and Admin API Summary

**Season gate wired into battle routes, admin start/end API with bearer auth, Zustand season state, and accessible SeasonEnded UI component with Korean localization**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-09T16:03:56Z
- **Completed:** 2026-04-09T16:07:50Z
- **Tasks:** 2 completed, 1 checkpoint pending user verification
- **Files modified:** 8

## Accomplishments
- Wired season gate into battle/start route as first check (503 for ended seasons, sId threaded through HMAC token)
- Added counter increment and auto-end check in battle/vote route after each vote
- Created admin season start/end API routes with bearer token authentication and proper error handling (409 for double-start, 404 for no active season)
- Extended Zustand store with seasonEnded/seasonNumber state that persists across battle resets
- Built SeasonEnded component with UI-SPEC compliance (role=status, aria-label, motion-reduce, vertical centering, Korean typography)
- Modified BattleArena to detect 503 season_ended and render SeasonEnded component

## Task Commits

Each task was committed atomically:

1. **Task 1: Modify battle routes, update DB queries, create admin routes** - `71faabe` (feat)
2. **Task 2: Extend Zustand store, create SeasonEnded component, modify BattleArena** - `8ea3a0a` (feat)
3. **Task 3: Push database migrations and verify end-to-end** - checkpoint pending user verification

## Files Created/Modified
- `src/app/api/battle/start/route.ts` - Added season gate (checkSeasonActive) as first check, 503 response for ended season, sId in HMAC token
- `src/app/api/battle/vote/route.ts` - Added counter increment, auto-end check, seasonId in insertBattleWithVote, season filter in getModelWinRates
- `src/lib/db/queries.ts` - Added seasonId parameter to insertBattleWithVote, season_filter to getModelWinRates RPC call
- `src/app/api/admin/season/start/route.ts` - New admin route: creates season with threshold from env, 409 if already active
- `src/app/api/admin/season/end/route.ts` - New admin route: ends current season with final Redis count, 404 if no active season
- `src/lib/store/battle-store.ts` - Added seasonEnded, seasonNumber state; setSeasonEnded action; reset preserves season state
- `src/components/battle/season-ended.tsx` - New component: centered card with season number, ended message, wait message; accessibility compliant
- `src/components/battle/battle-arena.tsx` - Added SeasonEnded import, season-ended early return, 503 detection in handleStartBattle

## Decisions Made
- Season gate runs BEFORE request body parsing (`req.json()`) to avoid unnecessary work when season is ended
- 503 with `error=season_ended` is treated as expected state in the UI, not an error -- per UI-SPEC "No error state -- this is not an error"
- seasonEnded state is sticky: preserved across battle resets, user must refresh page to see new season
- Header is duplicated in SeasonEnded render path rather than extracted as shared component -- Phase 05 (UI Polish) will refactor layout

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

**Task 3 (checkpoint) requires manual steps before end-to-end verification:**

1. **Upstash Redis credentials** -- Set in `.env.local`:
   - `UPSTASH_REDIS_REST_URL=<your-upstash-url>`
   - `UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>`

2. **Admin key and threshold** -- Set in `.env.local`:
   - `ADMIN_API_KEY=<generate with: openssl rand -base64 32>`
   - `SEASON_BATTLE_THRESHOLD=5` (low threshold for testing)

3. **Push database migrations:**
   ```bash
   npx supabase db push
   ```
   If auth required, set `SUPABASE_ACCESS_TOKEN` env var first.
   Verify: seasons table exists, battles table has season_id column.

4. **Test admin API:**
   ```bash
   # Start season
   curl -X POST http://localhost:3000/api/admin/season/start \
     -H "Authorization: Bearer <your-ADMIN_API_KEY>"
   # Expected: 201 with { season: { season_number: 1, status: "active", ... } }
   
   # End season
   curl -X POST http://localhost:3000/api/admin/season/end \
     -H "Authorization: Bearer <your-ADMIN_API_KEY>"
   ```

5. **Test end-to-end battle flow** with active season, auto-end at threshold, and season-ended UI screen.

## Next Phase Readiness
- Season system is fully implemented in code, pending DB migration push and end-to-end verification
- All 53 tests pass (no regressions from existing test suite)
- Ready for Phase 05 (UI Polish) once human verification complete

## Known Stubs

None -- all modules are fully implemented with real logic. No placeholder data or TODO markers.

## Threat Flags

None -- all files match the plan's threat model (T-04-07 through T-04-13). Admin routes use verifyAdminKey with crypto.timingSafeEqual. Season gate queries Supabase server-side. Season ID is threaded through HMAC-signed token.

## Self-Check: PASSED

All 8 files verified present. Both commit hashes (71faabe, 8ea3a0a) found in git log.

---
*Phase: 04-season-system-global-state*
*Completed: 2026-04-09*
