---
phase: 2
slug: core-battle-loop
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (created in Plan 01 Task 0) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npx tsc --noEmit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-00 | 01 | 1 | — | — | N/A | setup | `npx vitest run --reporter=verbose 2>&1 \| tail -20` | W0 creates | pending |
| 02-01-01 | 01 | 1 | BATTLE-06 | T-02-01 | Model pair always different; positionA randomized | unit | `npx vitest run` | W0 creates | pending |
| 02-01-02 | 01 | 1 | BATTLE-02, BATTLE-04 | T-02-02, T-02-03 | Token verified; model ID from token not client | type-check | `npx tsc --noEmit` | existing | pending |
| 02-01-03 | 01 | 1 | BATTLE-05 | T-02-05 | Unique vote constraint; win rate RPC | migration | `cat supabase/migrations/00002_win_rate_function.sql \| grep -c "get_model_win_rates"` | W0 creates | pending |
| 02-02-01 | 02 | 1 | BATTLE-01 | T-02-09 | shadcn components available | type-check | `npx tsc --noEmit && test -f src/components/ui/button.tsx && echo "PASS"` | W0 creates | pending |
| 02-02-02 | 02 | 1 | BATTLE-01 | T-02-10 | Pretendard font, CSS vars | type-check + grep | `grep -c "Pretendard" src/app/globals.css` | existing | pending |
| 02-03-01 | 03 | 2 | BATTLE-01, BATTLE-03 | T-02-13 | State machine transitions correct | type-check | `npx tsc --noEmit` | existing | pending |
| 02-03-02 | 03 | 2 | BATTLE-01~05 | T-02-11, T-02-12 | Components export correctly; Korean copy | type-check | `npx tsc --noEmit` | existing | pending |
| 02-04-01 | 04 | 3 | BATTLE-01~06 | T-02-14~17 | Full integration; blind integrity | build | `npx tsc --noEmit && npm run build` | existing | pending |
| 02-04-02 | 04 | 3 | BATTLE-01~06 | — | E2E visual/functional verification | manual | human-verify checkpoint | N/A | pending |

*Status: pending (pre-execution)*

---

## Wave 0 Requirements

- [x] `vitest.config.ts` — Vitest config with @/ alias (Plan 01 Task 0)
- [x] `src/lib/ai/pairing.test.ts` — Unit tests for selectModelPair (Plan 01 Task 0)
- [x] `src/lib/battle/session.test.ts` — Unit tests for createBattleToken/verifyBattleToken (Plan 01 Task 0)
- [x] `vitest` dev dependency — Installed in Plan 01 Task 0

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Complete battle flow (idle -> stream -> vote -> reveal -> new) | BATTLE-01~06 | Requires live AI API keys, visual verification of streaming, model reveal UX | Plan 04 Task 2 checkpoint: 8-step verification in browser |
| Blind integrity (no model IDs in network/DOM before vote) | BATTLE-06, D-08 | Requires DevTools network inspection | Plan 04 Task 2 Step 7: check /api/battle/start and /api/battle/stream responses |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (pre-execution)
