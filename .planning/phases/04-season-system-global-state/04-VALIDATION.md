---
phase: 4
slug: season-system-global-state
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.3 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SEASON-01 | T-04-01 / — | Redis INCR counter increments atomically | unit | `npx vitest run src/lib/season/counter.test.ts -t "increment" --reporter=verbose` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | DATA-02 | — | Counter value queryable via GET | unit | `npx vitest run src/lib/season/counter.test.ts -t "get count" --reporter=verbose` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | SEASON-02 | T-04-02 / — | Auto-end when threshold reached | unit | `npx vitest run src/lib/season/gate.test.ts -t "threshold" --reporter=verbose` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | SEASON-03 | T-04-03 / — | Season-end message returned on rejection | unit | `npx vitest run src/lib/season/gate.test.ts -t "season_ended" --reporter=verbose` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | SEASON-04 | T-04-04 / — | Admin start/end routes with bearer token auth | unit | `npx vitest run src/lib/admin/auth.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | SEASON-04 | T-04-04 / — | Season CRUD operations | unit | `npx vitest run src/lib/season/queries.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/season/counter.test.ts` — covers SEASON-01, DATA-02 (mock @upstash/redis)
- [ ] `src/lib/season/gate.test.ts` — covers SEASON-02, SEASON-03 (mock Supabase)
- [ ] `src/lib/admin/auth.test.ts` — covers SEASON-04 (bearer token validation)
- [ ] `src/lib/season/queries.test.ts` — covers season CRUD operations (mock Supabase)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Season-end screen replaces battle UI | SEASON-03 | Visual rendering check | Start a battle after season threshold reached; verify season-end message is shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
