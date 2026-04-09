---
phase: 04-season-system-global-state
plan: 01
subsystem: database, api
tags: [redis, upstash, supabase, postgresql, zod, seasons]

# Dependency graph
requires:
  - phase: 03-category-system
    provides: BattleSession with cat/sp fields, Battle with category, get_model_win_rates function
provides:
  - Season, SeasonStatus, SeasonGateResult type definitions
  - Battle.season_id nullable field for season tagging
  - BattleSession.sId field for season_id threading via HMAC token
  - Env schema with ADMIN_API_KEY, SEASON_BATTLE_THRESHOLD, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
  - Redis client singleton via @upstash/redis
  - seasons table SQL migration with status constraints
  - Updated get_model_win_rates function with season_filter parameter
affects: [04-02, 04-03, season-counter, season-gate, admin-api, battle-start, battle-vote, win-rates]

# Tech tracking
tech-stack:
  added: ["@upstash/redis@1.37.0"]
  patterns: ["Redis.fromEnv() singleton pattern", "Nullable FK for backward-compatible schema extension", "DEFAULT NULL parameter for backward-compatible function extension"]

key-files:
  created:
    - src/lib/redis/client.ts
    - supabase/migrations/00003_create_seasons.sql
    - supabase/migrations/00004_update_win_rate_function.sql
  modified:
    - src/lib/types.ts
    - src/lib/env.ts
    - src/lib/battle/session.test.ts
    - src/app/api/battle/start/route.ts

key-decisions:
  - "Redis.fromEnv() reads env directly, not through our lazy env.ts proxy -- Upstash handles its own env initialization"
  - "BattleSession.sId set to empty string as placeholder until Plan 02 wires season gate"

patterns-established:
  - "Redis singleton: import { redis } from '@/lib/redis/client' for all Redis operations"
  - "Nullable FK with backward compat: season_id on battles is NULL for pre-season records"
  - "Coerce env vars: z.coerce.number() for numeric environment variables"

requirements-completed: [SEASON-01, DATA-02, SEASON-02]

# Metrics
duration: 5min
completed: 2026-04-09
---

# Phase 4 Plan 1: Season Data Foundation Summary

**Season type definitions, Redis client singleton, env schema extension, and SQL migrations for seasons table with win-rate season filtering**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-09T10:18:27Z
- **Completed:** 2026-04-09T10:23:17Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Extended types.ts with SeasonStatus, Season, SeasonGateResult types and added season_id/sId fields to existing interfaces
- Extended env.ts with 4 new environment variables (ADMIN_API_KEY, SEASON_BATTLE_THRESHOLD, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) using correct Zod types
- Created Redis client singleton using @upstash/redis Redis.fromEnv() pattern
- Created two SQL migrations: seasons table with constraints + updated win rate function with season_filter parameter

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend types and environment schema for season system** - `6bf2c54` (feat)
2. **Task 2: Create Redis client singleton and SQL migrations** - `bd44ff1` (feat)

## Files Created/Modified
- `src/lib/types.ts` - Added SeasonStatus, Season, SeasonGateResult types; Battle.season_id; BattleSession.sId
- `src/lib/env.ts` - Extended Zod schema with ADMIN_API_KEY, SEASON_BATTLE_THRESHOLD, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
- `src/lib/redis/client.ts` - New Redis client singleton via Redis.fromEnv()
- `supabase/migrations/00003_create_seasons.sql` - Seasons table + battles.season_id FK column + indexes
- `supabase/migrations/00004_update_win_rate_function.sql` - Updated get_model_win_rates with season_filter uuid DEFAULT NULL
- `src/lib/battle/session.test.ts` - Added sId field to all BattleSession test fixtures
- `src/app/api/battle/start/route.ts` - Added sId placeholder to BattleSession creation

## Decisions Made
- Redis.fromEnv() reads env directly from process.env, not through our lazy env.ts proxy, because Upstash handles its own env initialization
- BattleSession.sId set to empty string as placeholder in battle/start route until Plan 02 wires the season gate

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added sId field to BattleSession test fixtures and battle/start route**
- **Found during:** Task 1 (type extension)
- **Issue:** Adding sId to BattleSession interface would cause TypeScript type errors in 6 test fixtures and the battle/start route handler that create BattleSession objects without sId
- **Fix:** Added `sId: ""` to all BattleSession object literals in session.test.ts and battle/start/route.ts
- **Files modified:** src/lib/battle/session.test.ts, src/app/api/battle/start/route.ts
- **Verification:** `npx vitest run` passes (36/36 tests)
- **Committed in:** 6bf2c54 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary for type correctness. No scope creep. The empty string placeholder will be replaced with actual season_id in Plan 02.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Upstash Redis credentials will be needed at deployment time (covered by env.ts validation).

## Next Phase Readiness
- Season types, Redis client, and SQL migrations are ready for Plan 02 (counter + gate + admin routes)
- Plan 02 will wire the season gate into battle/start and increment counter at vote time
- Plan 03 will handle client-side season-ended UI

## Self-Check: PASSED

All 7 files verified present. Both commit hashes (6bf2c54, bd44ff1) found in git log.

---
*Phase: 04-season-system-global-state*
*Completed: 2026-04-09*
