---
phase: 04-season-system-global-state
plan: 02
subsystem: season-logic-modules
tags: [season, redis, counter, gate, admin-auth, supabase, tdd]
dependency_graph:
  requires: [04-01]
  provides: [season-counter, season-gate, season-queries, admin-auth]
  affects: [api-battle-start, api-battle-vote, api-admin-season]
tech_stack:
  added: ["@upstash/redis"]
  patterns: [redis-atomic-incr, supabase-crud, timing-safe-compare, tdd-red-green]
key_files:
  created:
    - src/lib/redis/client.ts
    - src/lib/season/counter.ts
    - src/lib/season/counter.test.ts
    - src/lib/season/gate.ts
    - src/lib/season/gate.test.ts
    - src/lib/season/queries.ts
    - src/lib/season/queries.test.ts
    - src/lib/admin/auth.ts
    - src/lib/admin/auth.test.ts
  modified:
    - src/lib/types.ts
    - src/lib/env.ts
    - package.json
    - package-lock.json
decisions:
  - Used crypto.timingSafeEqual instead of manual XOR loop for admin key comparison (stronger guarantee, matches session.ts pattern)
  - Season gate queries Supabase directly (no Redis cache) to ensure admin changes are immediately visible
  - Counter uses Redis INCR for atomic single-operation increment (no race conditions)
metrics:
  duration: 4 minutes
  completed: "2026-04-09T10:32:24Z"
  tasks_completed: 2
  tasks_total: 2
  tests_added: 17
  tests_total: 53
  files_created: 9
  files_modified: 4
---

# Phase 4 Plan 2: Season Logic Modules Summary

Redis atomic counter, Supabase season CRUD, season gate check, and admin bearer token auth with crypto.timingSafeEqual -- 4 production modules + 4 test files, all 53 tests green.

## What Was Built

### Production Modules

1. **src/lib/redis/client.ts** -- Redis singleton using `Redis.fromEnv()` from @upstash/redis. HTTP-based, no connection pooling needed on serverless.

2. **src/lib/season/counter.ts** -- Two functions:
   - `incrementBattleCounter(seasonId)`: Redis INCR on `season:{id}:battles` key, returns new count atomically
   - `getBattleCount(seasonId)`: Redis GET, returns count or 0 if key missing

3. **src/lib/season/gate.ts** -- `checkSeasonActive()`: Queries Supabase for active season, returns `SeasonGateResult` with `{active, seasonId, seasonNumber}`. Queries directly (no cache) so admin changes are immediately visible.

4. **src/lib/season/queries.ts** -- Season CRUD:
   - `getCurrentSeason()`: Returns active Season or null
   - `createSeason(threshold)`: Auto-increments season_number via MAX+1
   - `endSeason(seasonId, finalBattleCount)`: Sets status to ended with timestamp
   - `endSeasonIfThresholdReached(seasonId, threshold)`: Compares Redis counter against threshold, auto-ends if met

5. **src/lib/admin/auth.ts** -- `verifyAdminKey(request)`: Extracts Bearer token from Authorization header, validates against `env.ADMIN_API_KEY` using `crypto.timingSafeEqual` for constant-time comparison. Returns false for missing header, wrong prefix, empty key, length mismatch, or wrong key.

### Type & Config Extensions

6. **src/lib/types.ts** -- Added `SeasonStatus`, `Season`, `SeasonGateResult` types
7. **src/lib/env.ts** -- Added `ADMIN_API_KEY`, `SEASON_BATTLE_THRESHOLD`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` to Zod schema

### Test Files

8. **src/lib/season/counter.test.ts** -- 4 tests: INCR returns correct key/value, first increment returns 1, GET returns count, GET returns 0 for missing key
9. **src/lib/season/gate.test.ts** -- 3 tests: active season returns data, no active season returns false, error returns false
10. **src/lib/season/queries.test.ts** -- 3 tests: getCurrentSeason active/null, createSeason with auto-increment, endSeason status update
11. **src/lib/admin/auth.test.ts** -- 6 tests: valid key, missing header, wrong prefix, wrong key, different length, empty token

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 7bea00a | feat(04-02): create season counter and gate modules with tests |
| 2 | e571b5a | feat(04-02): create season queries and admin auth modules with tests |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created prerequisite files from Plan 01 (parallel worktree)**
- **Found during:** Task 1 setup
- **Issue:** Plan 02 depends on `src/lib/redis/client.ts`, Season types in `types.ts`, and env vars in `env.ts` which Plan 01 creates in a parallel worktree. These files did not exist in this worktree.
- **Fix:** Created `src/lib/redis/client.ts` with `Redis.fromEnv()` singleton. Added `SeasonStatus`, `Season`, `SeasonGateResult` types to `types.ts`. Added `ADMIN_API_KEY`, `SEASON_BATTLE_THRESHOLD`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` to `env.ts`. Installed `@upstash/redis` package.
- **Files modified:** `src/lib/redis/client.ts`, `src/lib/types.ts`, `src/lib/env.ts`, `package.json`, `package-lock.json`
- **Commit:** 7bea00a

**2. [Rule 1 - Bug] Fixed queries.test.ts mock chain for createSeason**
- **Found during:** Task 2 GREEN phase
- **Issue:** The Supabase mock only chained `select().eq().order()` but `createSeason` calls `select("season_number").order()` directly (no `.eq()`). Test failed with "supabase.from(...).select(...).order is not a function".
- **Fix:** Added `order` method to the select mock return object alongside `eq`.
- **Files modified:** `src/lib/season/queries.test.ts`
- **Commit:** e571b5a

## Decisions Made

1. **crypto.timingSafeEqual over manual XOR**: Used Node.js built-in `crypto.timingSafeEqual` for admin key comparison instead of the manual XOR loop from RESEARCH.md (which was marked as assumption A1). This matches the existing `session.ts` pattern and provides a stronger timing attack guarantee.

2. **Direct Supabase query for season gate**: No Redis caching of season status. The ~50-100ms latency is acceptable since the gate only runs at battle start (not per page load), and direct queries ensure admin season changes are immediately visible.

## Known Stubs

None -- all modules are fully implemented with real logic. No placeholder data or TODO markers.

## Threat Flags

None -- all files match the plan's threat model. No new network endpoints, auth paths, or schema changes beyond what was specified.

## Self-Check: PASSED

All created files verified to exist, all commits verified in git log, all 53 tests passing.
