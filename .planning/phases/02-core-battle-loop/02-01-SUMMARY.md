---
phase: 02-core-battle-loop
plan: 01
subsystem: api
tags: [hmac, streaming, battle-loop, vitest, zod, nanoid, ai-sdk, supabase-rpc]

# Dependency graph
requires:
  - phase: 01-foundation-ai-integration
    provides: AI registry, types, env schema, DB client/queries, stream route
provides:
  - HMAC-signed battle session tokens (createBattleToken, verifyBattleToken)
  - Model pair selection with randomized position (selectModelPair)
  - POST /api/battle/start endpoint returning signed token
  - POST /api/battle/stream endpoint with token-authenticated dual-stream
  - POST /api/battle/vote endpoint saving battle+vote and returning reveal
  - insertBattleWithVote and getModelWinRates DB query functions
  - get_model_win_rates PostgreSQL RPC function
  - Unique vote constraint preventing double voting
  - MODEL_DISPLAY_NAMES mapping for reveal UI
  - Vitest test infrastructure with path aliases
affects: [02-core-battle-loop, 03-categories, 04-seasons]

# Tech tracking
tech-stack:
  added: [vitest]
  patterns: [hmac-signed-session-tokens, token-authenticated-streaming, vote-time-db-persistence, text-stream-protocol]

key-files:
  created:
    - src/lib/ai/pairing.ts
    - src/lib/battle/session.ts
    - src/app/api/battle/start/route.ts
    - src/app/api/battle/vote/route.ts
    - src/lib/ai/pairing.test.ts
    - src/lib/battle/session.test.ts
    - vitest.config.ts
    - supabase/migrations/00002_win_rate_function.sql
  modified:
    - src/lib/types.ts
    - src/lib/env.ts
    - src/lib/ai/config.ts
    - src/lib/db/queries.ts
    - src/app/api/battle/stream/route.ts
    - package.json

key-decisions:
  - "toTextStreamResponse instead of toUIMessageStreamResponse for useCompletion compatibility"
  - "Sequential inserts for battle+vote (accepted risk: no Supabase JS transaction support)"
  - "30-minute token TTL for battle sessions"
  - "Graceful fallback to empty win rates on RPC error rather than crashing"

patterns-established:
  - "HMAC token pattern: base64url payload + SHA-256 signature with timingSafeEqual"
  - "Token-authenticated endpoints: model ID and question from signed token, never from client"
  - "Vote-time-only persistence: no DB writes until user votes"
  - "Fisher-Yates shuffle for unbiased model selection"

requirements-completed: [BATTLE-01, BATTLE-02, BATTLE-04, BATTLE-05, BATTLE-06]

# Metrics
duration: 4min
completed: 2026-04-09
---

# Phase 2 Plan 1: Battle Server Infrastructure Summary

**HMAC-signed session tokens, 3 battle API routes (start/stream/vote), model pairing with randomized positions, win rate SQL aggregation, and vitest test suite**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-09T03:14:40Z
- **Completed:** 2026-04-09T03:19:13Z
- **Tasks:** 4
- **Files modified:** 14

## Accomplishments
- Built complete server-side battle infrastructure with cryptographic blind integrity via HMAC-signed session tokens
- Created 3 API routes enforcing that model IDs and questions come from signed tokens, never from client input
- Implemented model pairing with Fisher-Yates shuffle and randomized A/B position assignment
- Added win rate PostgreSQL RPC function with unique vote constraint preventing double voting
- Installed vitest with 8 passing tests covering pairing logic and session token create/verify

## Task Commits

Each task was committed atomically:

1. **Task 0: Install vitest and create test stubs** - `0387263` (test)
2. **Task 1: Create battle contracts -- types, env, pairing, session, config** - `f879d23` (feat)
3. **Task 2: Create 3 API routes and extend queries** - `f736c9b` (feat)
4. **Task 3: Create win rate PostgreSQL RPC function migration** - `c50c80b` (feat)

## Files Created/Modified
- `vitest.config.ts` - Vitest configuration with @/ path alias
- `src/lib/ai/pairing.ts` - Fisher-Yates model pair selection with randomized positionA
- `src/lib/ai/pairing.test.ts` - 4 unit tests for model pairing logic
- `src/lib/battle/session.ts` - HMAC-signed battle token create/verify with 30min TTL
- `src/lib/battle/session.test.ts` - 4 unit tests for session token integrity
- `src/lib/types.ts` - Added BattleSession, BattleStartResponse, BattleVoteRequest/Response, ModelReveal, WinRateData
- `src/lib/env.ts` - Added BATTLE_SESSION_SECRET (32-char min) to env schema
- `src/lib/ai/config.ts` - Added MODEL_DISPLAY_NAMES mapping
- `src/app/api/battle/start/route.ts` - POST endpoint returning signed token with randomized position
- `src/app/api/battle/stream/route.ts` - Rewritten: token+slot auth, toTextStreamResponse
- `src/app/api/battle/vote/route.ts` - POST endpoint: verify token, save battle+vote, return reveal with win rates
- `src/lib/db/queries.ts` - Added insertBattleWithVote and getModelWinRates functions
- `supabase/migrations/00002_win_rate_function.sql` - PostgreSQL RPC + unique vote constraint
- `package.json` - Added vitest, test scripts

## Decisions Made
- Used `toTextStreamResponse()` instead of `toUIMessageStreamResponse()` because the client will use `useCompletion` with `streamProtocol: 'text'` per RESEARCH.md Pattern 2
- Accepted sequential insert risk for battle+vote (no Supabase JS transaction support) with documented rationale
- Graceful fallback to empty win rates on RPC error rather than crashing the vote endpoint
- 30-minute token TTL balances usability with security

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

The plan requires a `BATTLE_SESSION_SECRET` environment variable:
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Add to `.env.local`: `BATTLE_SESSION_SECRET=<generated-value>`
- Must be at least 32 characters

Also: `supabase/migrations/00002_win_rate_function.sql` must be applied to Supabase before the vote endpoint can call the RPC function.

## Next Phase Readiness
- All 3 API routes ready for client-side integration (Plan 02: Zustand store + React hooks)
- Stream endpoint returns text protocol compatible with `useCompletion`
- Vote endpoint returns full model reveal data for the reveal UI
- SQL migration ready for schema push to Supabase

## Self-Check: PASSED

All 10 created files verified present. All 4 task commits verified in git log.

---
*Phase: 02-core-battle-loop*
*Completed: 2026-04-09*
