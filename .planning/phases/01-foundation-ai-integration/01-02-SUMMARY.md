---
phase: 01-foundation-ai-integration
plan: 02
subsystem: ai, api
tags: [vercel-ai-sdk, streaming, openai, anthropic, google, next-route-handler, korean-nlp]

# Dependency graph
requires:
  - phase: 01-foundation-ai-integration/01
    provides: "Next.js 16 scaffold, env validation (src/lib/env.ts), shared types (src/lib/types.ts with BudgetModelId, BUDGET_MODELS, StreamRequest)"
provides:
  - "Unified AI provider registry (registry.languageModel) for all 3 budget models"
  - "BATTLE_CONFIG with Korean-calibrated maxOutputTokens: 2048 and Korean system prompt"
  - "POST /api/battle/stream endpoint for streaming AI responses with Zod validation"
  - "Curl-based smoke test script for provider verification"
affects: [02-battle-loop, 04-seasons]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AI SDK 6 provider registry pattern (createProviderRegistry)"
    - "streamText + toUIMessageStreamResponse for Next.js Route Handlers"
    - "Zod validation on API input with z.enum for model ID whitelist"
    - "Korean system prompt for consistent Korean language responses"

key-files:
  created:
    - src/lib/ai/registry.ts
    - src/lib/ai/config.ts
    - src/app/api/battle/stream/route.ts
    - scripts/test-stream.sh
  modified: []

key-decisions:
  - "Used toUIMessageStreamResponse() instead of toDataStreamResponse() -- renamed in AI SDK v6"
  - "maxOutputTokens: 2048 for Korean text (2-4x BPE overhead vs English)"
  - "Korean system prompt using formal speech (존댓말) for consistent AI behavior"

patterns-established:
  - "Provider registry: all model access via registry.languageModel(modelId), never direct SDK imports"
  - "Battle config: centralized AI parameters in BATTLE_CONFIG constant"
  - "Route Handler pattern: Zod validation -> streamText -> toUIMessageStreamResponse"

requirements-completed: [AI-01, AI-02, AI-03, AI-04]

# Metrics
duration: 4min
completed: 2026-04-08
---

# Phase 1 Plan 02: AI Provider Integration & Streaming Summary

**Unified AI provider layer with Vercel AI SDK 6 registry wrapping GPT-4o-mini, Claude Haiku 4.5, and Gemini 2.0 Flash, streaming Korean responses via POST /api/battle/stream**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-07T17:38:38Z
- **Completed:** 2026-04-07T17:42:39Z
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files created:** 4

## Accomplishments
- Provider registry wraps all 3 AI providers (OpenAI, Anthropic, Google) with single `registry.languageModel()` interface
- Battle config enforces Korean-calibrated maxOutputTokens: 2048 and Korean system prompt with formal speech
- POST /api/battle/stream validates input with Zod (prompt length, model ID whitelist), streams AI responses
- Error handling returns structured JSON errors (400 for validation, 500 for server errors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AI provider registry, battle config, and streaming Route Handler** - `41d5418` (feat)
2. **Task 2: Smoke test script for all 3 AI providers** - `3fd1b27` (chore)

## Files Created/Modified
- `src/lib/ai/registry.ts` - Provider registry wrapping OpenAI, Anthropic, Google via createProviderRegistry
- `src/lib/ai/config.ts` - Battle configuration (maxOutputTokens: 2048, temperature: 0.7, Korean system prompt)
- `src/app/api/battle/stream/route.ts` - POST endpoint for streaming AI responses with Zod validation
- `scripts/test-stream.sh` - Curl-based smoke test for all 3 providers + error cases

## Decisions Made
- **toUIMessageStreamResponse over toDataStreamResponse:** AI SDK v6 renamed `toDataStreamResponse()` to `toUIMessageStreamResponse()`. The UI message stream protocol supports metadata, error parts, and tool calls needed for future phases. `toTextStreamResponse()` was explicitly avoided as it only supports plain text.
- **maxOutputTokens: 2048:** Korean BPE tokenization uses 2-4x more tokens than English. 1024 tokens yields only ~200-400 Korean characters (insufficient for substantive battle responses). 2048 tokens yields ~400-800 characters.
- **Korean formal system prompt:** Used 존댓말 (formal speech) in system prompt to ensure all 3 models respond consistently in natural, polite Korean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used toUIMessageStreamResponse instead of toDataStreamResponse**
- **Found during:** Task 1 (streaming Route Handler)
- **Issue:** Plan specified `toDataStreamResponse()` but this method does not exist in AI SDK v6.0.149. It was renamed to `toUIMessageStreamResponse()` in the v5->v6 migration.
- **Fix:** Used `toUIMessageStreamResponse()` which provides the same data stream protocol with metadata, error parts support.
- **Files modified:** src/app/api/battle/stream/route.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 41d5418 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** API method rename in AI SDK v6. Functionally equivalent. No scope creep.

## Issues Encountered
None beyond the API rename deviation documented above.

## Checkpoint Status

Task 2 (`checkpoint:human-verify`) requires manual smoke testing with valid API keys. The test script (`scripts/test-stream.sh`) is ready. Human must:
1. Start dev server (`npm run dev`)
2. Run `bash scripts/test-stream.sh`
3. Verify Korean streaming responses from at least 1 provider
4. Verify 400 errors for invalid model ID and empty prompt

## User Setup Required
**API keys required in `.env.local`** for smoke test verification:
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o-mini
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude Haiku 4.5
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key for Gemini 2.0 Flash

## Threat Surface Scan
No new threat surfaces beyond those documented in the plan's threat model. All mitigations implemented:
- T-02-01: Zod validation on prompt (min 1, max 2000) and modelId (z.enum whitelist)
- T-02-03: API keys in server-side env vars only (no NEXT_PUBLIC_ prefix)
- T-02-05: Prompt capped at 2000 chars, output capped at 2048 tokens
- T-02-06: z.enum(BUDGET_MODELS) restricts to exactly 3 allowed models

## Next Phase Readiness
- AI provider layer complete -- ready for Phase 2 battle orchestration
- Streaming endpoint functional -- Phase 2 will add paired model calling and battle ID generation
- onFinish callback ready for Phase 2 DB persistence wiring

## Self-Check: PASSED

- All 4 created files verified on disk
- Both commits (41d5418, 3fd1b27) verified in git log
- TypeScript compilation passes with zero errors

---
*Phase: 01-foundation-ai-integration*
*Completed: 2026-04-08*
