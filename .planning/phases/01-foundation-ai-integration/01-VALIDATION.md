---
phase: 1
slug: foundation-ai-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (recommended for Next.js + Turbopack) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AI-01 | T-1-01 / — | API keys server-only | integration | `npx vitest run tests/ai/openai.test.ts -t "stream"` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | AI-02 | T-1-01 / — | API keys server-only | integration | `npx vitest run tests/ai/anthropic.test.ts -t "stream"` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | AI-03 | T-1-01 / — | API keys server-only | integration | `npx vitest run tests/ai/google.test.ts -t "stream"` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | AI-04 | — | N/A | unit | `npx vitest run tests/ai/config.test.ts -t "maxTokens"` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | DATA-01 | T-1-03 / — | Service role key server-only | integration | `npx vitest run tests/db/battles.test.ts -t "insert"` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | — | T-1-02 / — | Env validation fail-fast | unit | `npx vitest run tests/lib/env.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration with path aliases matching tsconfig
- [ ] `tests/ai/openai.test.ts` — OpenAI streaming integration test stub
- [ ] `tests/ai/anthropic.test.ts` — Anthropic streaming integration test stub
- [ ] `tests/ai/google.test.ts` — Google streaming integration test stub
- [ ] `tests/ai/config.test.ts` — AI config validation (maxTokens, model IDs)
- [ ] `tests/db/battles.test.ts` — Supabase battle CRUD operations stub
- [ ] `tests/lib/env.test.ts` — Environment variable validation stub
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react`

*Note: AI integration tests require real API keys. Use AI SDK's custom fetch for mocking in CI.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Korean response quality | AI-01~03 | Subjective language quality | Send Korean prompt to each provider, verify response is natural Korean |
| Streaming visual feedback | AI-01~03 | Requires browser | Open stream endpoint, verify SSE events arrive incrementally |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
