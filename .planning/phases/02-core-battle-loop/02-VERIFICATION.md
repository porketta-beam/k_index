---
phase: 02-core-battle-loop
verified: 2026-04-09T05:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Complete battle flow end-to-end in browser"
    expected: "Idle state -> submit Korean question -> two anonymous streaming responses appear simultaneously -> vote buttons disabled until both complete -> vote A or B -> model names revealed with colored badges and win rate bars -> new battle resets to idle"
    why_human: "Full battle flow involves live AI API calls, real-time SSE streaming, vote persistence to Supabase, and RPC function execution. Cannot verify without running the dev server with real credentials and performing manual browser interactions."
  - test: "Blind integrity check (D-08) via browser DevTools"
    expected: "/api/battle/start response contains only { token: '...' }. /api/battle/stream responses are raw text only with no model IDs. Model names do not appear in DOM or network responses before voting."
    why_human: "Requires inspecting live network traffic in browser DevTools during an active battle session."
  - test: "Win rate display after multiple battles"
    expected: "After completing 2+ battles, the reveal panel shows non-zero win rate values (e.g., '승률: 50% (1승 / 2전)') for at least one model."
    why_human: "Requires Supabase migration 00002_win_rate_function.sql to be applied to the live database and multiple completed battles stored."
---

# Phase 2: Core Battle Loop Verification Report

**Phase Goal:** Users can experience a complete blind battle -- type a question, see two anonymous AI responses stream in, vote for the better one, and discover which models they were
**Verified:** 2026-04-09T05:00:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User types a Korean question and two anonymous AI responses appear (labeled Model A / Model B with no identity hints) | VERIFIED | `BattleArena` renders two `ResponseCard` components with `revealedModelName={null}` during streaming phase. `ResponseCard` shows `<Badge variant="secondary">{label}</Badge>` ("Model A"/"Model B") when not revealed. Server never exposes model IDs -- only opaque HMAC token. |
| 2 | Responses stream in real-time; both complete before either is revealed to the user (fairness preserved) | VERIFIED | Two independent `useCompletion` hooks (`id: "battle-a"`, `id: "battle-b"`) with `streamProtocol: "text"` call `/api/battle/stream` in parallel. `revealedModelName` is only set via `store.setReveal()` which fires from the vote API response -- not before. Stream endpoint uses `toTextStreamResponse()` matching the hook's `streamProtocol: "text"`. |
| 3 | User can vote A wins or B wins, and voting is disabled until both responses finish streaming | VERIFIED | `VotePanel` receives `disabled={isStreaming}` from `BattleArena`. `isStreaming` is `phase === "streaming"`. The store transitions from `"streaming"` to `"voting"` only when both `setStreamingA(false)` and `setStreamingB(false)` are called (with race condition prevention via `get()` after `set()`). Vote buttons have `disabled={disabled || loading || selectedWinner !== null}`. |
| 4 | After voting, the actual model names (GPT / Claude / Gemini) are revealed for each response | VERIFIED | Vote API `/api/battle/vote/route.ts` returns `BattleVoteResponse` with `modelA.displayName` and `modelB.displayName` from `MODEL_DISPLAY_NAMES`. `store.setReveal(revealData)` stores this in Zustand. `ResponseCard` renders the colored badge with `revealedModelName` when set. |
| 5 | After voting, per-category win rates for each revealed model are displayed alongside the result | VERIFIED | Vote route calls `getModelWinRates(category)` which calls Supabase RPC `get_model_win_rates`. SQL migration `00002_win_rate_function.sql` defines the `get_model_win_rates` function aggregating wins/total per model per category. `RevealPanel` renders two `WinRateBar` components with `wins` and `total` from `revealData.winRates`. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/ai/pairing.ts` | Model pair selection and position randomization | VERIFIED | Exports `selectModelPair()`. Fisher-Yates shuffle over 3 models, returns two different models plus random `positionA`. 28 lines, substantive. |
| `src/lib/battle/session.ts` | HMAC-signed battle session token create/verify | VERIFIED | Exports `createBattleToken`, `verifyBattleToken`, `BattleSession`. SHA-256 HMAC with `timingSafeEqual`, 30-min TTL. 44 lines, substantive. |
| `src/app/api/battle/start/route.ts` | POST endpoint returning signed battle token | VERIFIED | Zod-validates question (max 2000 chars), calls `selectModelPair()` and `createBattleToken()`, returns `{ token }`. |
| `src/app/api/battle/stream/route.ts` | POST endpoint streaming single model response from token | VERIFIED | Zod-validates token+slot, calls `verifyBattleToken()`, reads model from signed token (D-08), returns `result.toTextStreamResponse()`. |
| `src/app/api/battle/vote/route.ts` | POST endpoint saving battle+vote to DB and returning reveal data | VERIFIED | Verifies token, calls `insertBattleWithVote()` and `getModelWinRates()`, returns full `BattleVoteResponse`. |
| `supabase/migrations/00002_win_rate_function.sql` | PostgreSQL RPC for per-category model win rates | VERIFIED | Contains `CREATE OR REPLACE FUNCTION get_model_win_rates`. Includes `votes_battle_id_unique` constraint for double-vote prevention. 37 lines, substantive. |
| `src/lib/ai/pairing.test.ts` | Unit tests for model pairing logic | VERIFIED | 4 vitest tests covering: different models, models from pool, random positions, varying pairs. 37 lines. |
| `src/lib/battle/session.test.ts` | Unit tests for HMAC session token create/verify | VERIFIED | 4 vitest tests covering: create+verify round trip, tampered rejection, expired rejection, malformed rejection. 54 lines. |
| `src/lib/store/battle-store.ts` | Zustand battle state machine with all actions | VERIFIED | Exports `useBattleStore`. All required actions present: `startBattle`, `setStreamingA`, `setStreamingB`, `setDurationA`, `setDurationB`, `setVoteSubmitted`, `setReveal`, `setError`, `reset`. Race condition prevention via `get()` after `set()`. Response text NOT in store. |
| `src/components/battle/battle-input.tsx` | Question textarea with character counter and submit button | VERIFIED | Exports `BattleInput`. Korean placeholder "한국어로 질문을 입력하세요", `MAX_CHARS = 2000`, counter format "{n} / 2,000", "배틀 시작" CTA. |
| `src/components/battle/response-card.tsx` | Model response card with label, body, streaming indicator, completion time | VERIFIED | Exports `ResponseCard`. Shows "Model A"/"Model B" before reveal, colored badge after reveal, `StreamingIndicator`, `완료 {n.1}초`, `border-l-success` for winner, `선택됨` badge. |
| `src/components/battle/streaming-indicator.tsx` | Pulsing blue dot for active streaming | VERIFIED | Exports `StreamingIndicator`. Uses `animate-pulse`, `bg-primary`, `animationDuration: "800ms"`. |
| `src/components/battle/vote-panel.tsx` | A wins / B wins vote buttons with disabled state | VERIFIED | Exports `VotePanel`. "A 승리"/"B 승리" buttons, `min-h-[44px]`, disabled state with Korean wait message, loading spinner. |
| `src/components/battle/reveal-panel.tsx` | Post-vote model reveal with win rates | VERIFIED | Exports `RevealPanel`. Uses `WinRateBar`, "새 배틀 시작" button, fade-in animation. |
| `src/components/battle/win-rate-bar.tsx` | Horizontal win rate percentage bar | VERIFIED | Exports `WinRateBar`. "승률: {N}% ({W}승 / {T}전)" format, `font-mono`, horizontal bar with `colorClass` fill. |
| `src/components/battle/battle-arena.tsx` | Orchestrator connecting all APIs, hooks, store, and UI components | VERIFIED | Exports `BattleArena`. Dual `useCompletion` hooks with `id: "battle-a"/"battle-b"`, connects to all 3 API routes, all child components, error coordination, duration tracking. |
| `src/app/page.tsx` | Battle page rendering BattleArena | VERIFIED | Imports and renders `BattleArena`. No placeholder "Coming Soon" text. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/battle/start/route.ts` | `src/lib/battle/session.ts` | `createBattleToken` | WIRED | Line 21: `const token = createBattleToken({...})` |
| `src/app/api/battle/stream/route.ts` | `src/lib/battle/session.ts` | `verifyBattleToken` | WIRED | Line 19: `const session = verifyBattleToken(token)` |
| `src/app/api/battle/vote/route.ts` | `src/lib/db/queries.ts` | `insertBattleWithVote \| getModelWinRates` | WIRED | Lines 29, 43: both functions called |
| `src/components/battle/vote-panel.tsx` | `src/lib/store/battle-store.ts` | `useBattleStore` subscription for phase/streaming state | WIRED | Props from `BattleArena` which reads `isStreaming` from store; `VotePanel` receives `disabled={isStreaming}` |
| `src/components/battle/response-card.tsx` | `src/lib/store/battle-store.ts` | `useBattleStore` for streaming status, revealed model | WIRED | Props from `BattleArena`: `revealedModelName={revealData?.modelA.displayName}`, `isWinner={winner === "a"}` |
| `src/components/battle/reveal-panel.tsx` | `src/components/battle/win-rate-bar.tsx` | `WinRateBar` component import | WIRED | Line 5 import + lines 19-30 usage with `modelName`, `wins`, `total`, `colorClass` |
| `src/components/battle/battle-arena.tsx` | `/api/battle/start` | `fetch POST` | WIRED | Line 61: `fetch("/api/battle/start", { method: "POST", ... })` |
| `src/components/battle/battle-arena.tsx` | `/api/battle/stream` | two `useCompletion` hooks | WIRED | Lines 21-48: `completionA` and `completionB` with `api: "/api/battle/stream"` |
| `src/components/battle/battle-arena.tsx` | `/api/battle/vote` | `fetch POST` | WIRED | Line 104: `fetch("/api/battle/vote", { method: "POST", ... })` |
| `src/components/battle/battle-arena.tsx` | `src/lib/store/battle-store.ts` | `useBattleStore` | WIRED | Line 14: `const store = useBattleStore()` |
| `src/app/page.tsx` | `src/components/battle/battle-arena.tsx` | `BattleArena` import and render | WIRED | Line 1 import, line 6 render |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `battle-arena.tsx` | `completionA.completion` / `completionB.completion` | `useCompletion` hooks → `/api/battle/stream` → `streamText()` → AI models | Yes -- `streamText()` calls live AI providers via registry | FLOWING |
| `battle-arena.tsx` | `revealData` (model names, win rates) | `fetch("/api/battle/vote")` → `getModelWinRates()` → Supabase RPC `get_model_win_rates` | Yes (DB query) -- requires SQL migration applied | FLOWING (pending migration) |
| `response-card.tsx` | `responseText` prop | `completionA.completion` / `completionB.completion` from `BattleArena` | Flows from useCompletion | FLOWING |
| `reveal-panel.tsx` / `win-rate-bar.tsx` | `revealData.winRates` | Supabase RPC result via vote API | Real DB query, graceful fallback to `[]` on RPC error | FLOWING (pending migration) |

**Note on SQL migration:** `supabase/migrations/00002_win_rate_function.sql` is present and correct, but it must be applied to the live Supabase instance. If not applied, `getModelWinRates()` returns empty array (graceful fallback, not a crash). This is a deployment prerequisite, not a code gap.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| vitest config resolves `@/` alias | File exists with `path.resolve(__dirname, "./src")` alias | `vitest.config.ts` confirmed with correct alias | PASS |
| Test files are substantive | Line counts: pairing.test.ts (37 lines), session.test.ts (54 lines) | 4 tests each, covering key invariants | PASS |
| Stream endpoint returns text protocol | `grep toTextStreamResponse stream/route.ts` | `return result.toTextStreamResponse()` found at line 37 | PASS |
| Full live battle flow | Requires browser + API keys + running server | Cannot test programmatically | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BATTLE-01 | 02-01, 02-02, 02-03, 02-04 | 사용자가 질문을 입력하면 두 개의 익명 AI 모델이 응답을 생성한다 | SATISFIED | `BattleInput` + `/api/battle/start` + `ResponseCard` with anonymous labels |
| BATTLE-02 | 02-01, 02-03, 02-04 | AI 응답은 실시간 스트리밍으로 표시된다 | SATISFIED | Dual `useCompletion` hooks + `toTextStreamResponse()` + `StreamingIndicator` |
| BATTLE-03 | 02-03, 02-04 | 사용자가 A승/B승 중 하나를 선택하여 투표할 수 있다 | SATISFIED | `VotePanel` disabled during streaming, enabled on `phase === "voting"` |
| BATTLE-04 | 02-01, 02-03, 02-04 | 투표 후 각 응답의 AI 모델 이름이 공개된다 | SATISFIED | Vote API returns `ModelReveal`, `ResponseCard` shows colored badge on reveal |
| BATTLE-05 | 02-01, 02-03, 02-04 | 모델 공개 시 해당 카테고리의 모델별 승률이 함께 표시된다 | SATISFIED | `get_model_win_rates` RPC + `WinRateBar` in `RevealPanel` |
| BATTLE-06 | 02-01 | 서버 사이드에서 모델을 랜덤 선택하고, 응답 위치(A/B)도 랜덤 배치한다 | SATISFIED | `selectModelPair()` Fisher-Yates shuffle + random `positionA`, stored in HMAC token |

All 6 requirements mapped to Phase 2 are SATISFIED by the implementation.

**No orphaned requirements.** REQUIREMENTS.md maps BATTLE-01 through BATTLE-06 to Phase 2, and all 6 appear in the plan frontmatter.

### Anti-Patterns Found

No blockers or substantive stubs detected in the battle code.

The following are noted as informational:

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/api/battle/vote/route.ts` | 28 | `const category = "general"; // Phase 3 adds category selection` | Info | Intentional -- category system is Phase 3. Win rates always use "general" until then. Not a stub -- all code paths function correctly. |

### Human Verification Required

The automated verification passes all structural, wiring, and data-flow checks. The following require manual testing with a running application:

#### 1. Complete Battle Flow End-to-End

**Test:** Start dev server (`npm run dev`), open http://localhost:3000. Ensure `.env.local` has `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, and `BATTLE_SESSION_SECRET`. Submit a Korean question (e.g., "한국의 수도는 어디인가요?").
**Expected:** Two anonymous response cards appear and stream text simultaneously. Pulsing blue dot visible during streaming. Vote buttons show "두 응답이 모두 완료될 때까지 기다려주세요" while streaming, become active when both finish. Click "A 승리" -- model names appear with colored badges (violet/cyan), win rate bars show "승률: N% (W승 / T전)". Click "새 배틀 시작" to return to idle.
**Why human:** Live AI API calls, real-time SSE, Supabase writes, and browser UX cannot be verified without running the app.

#### 2. Blind Integrity Check

**Test:** Open browser DevTools Network tab. Start a new battle. Inspect `/api/battle/start` response and `/api/battle/stream` SSE responses before voting.
**Expected:** `/api/battle/start` returns only `{ "token": "..." }` with no model IDs visible. SSE stream data contains only the response text chunks. Model names do not appear in the DOM (inspect HTML) until after vote submission.
**Why human:** Requires live network traffic inspection.

#### 3. SQL Migration Applied + Win Rates Non-Zero

**Test:** Apply `supabase/migrations/00002_win_rate_function.sql` to live Supabase instance. Complete 2+ battles. On the second reveal, verify win rate bars show non-zero values.
**Expected:** After applying migration and completing battles, win rates like "승률: 50% (1승 / 2전)" appear for at least one model.
**Why human:** Requires Supabase access, migration execution, and multiple completed battles.

### Gaps Summary

No automated gaps found. All 5 ROADMAP success criteria are verified by structural evidence. All 6 BATTLE requirements (BATTLE-01 through BATTLE-06) are satisfied by the codebase.

The `status: human_needed` reflects that the complete battle flow involves live AI API calls, database writes, and real-time browser behavior that cannot be confirmed programmatically. The code structure, wiring, and data flows are all correct -- the remaining verification is experiential.

**One deployment prerequisite exists:** `supabase/migrations/00002_win_rate_function.sql` must be applied to the Supabase instance before win rates will return real data. Until applied, the vote endpoint gracefully returns 0% win rates (no crash). This is documented in the Phase 2 Plan 1 SUMMARY as a "User Setup Required" item.

---

_Verified: 2026-04-09T05:00:00Z_
_Verifier: Claude (gsd-verifier)_
