---
phase: 3
slug: category-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (or "none — Wave 0 installs") |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

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
| 03-01-01 | 01 | 1 | CAT-01, CAT-02 | — | N/A | unit | `npx vitest run src/lib/categories.test.ts` | No — W0 | pending |
| 03-01-02 | 01 | 1 | CAT-01, CAT-02 | T-03-01 thru T-03-06 | HMAC token roundtrip with cat/sp | unit | `npx vitest run src/lib/battle/session.test.ts` | No — W0 | pending |
| 03-02-01 | 02 | 2 | CAT-03 | — | Store category guard logic | unit | `npx vitest run src/lib/store/battle-store.test.ts` | No — W0 | pending |
| 03-02-02 | 02 | 2 | CAT-01, CAT-02, CAT-03 | T-03-07 thru T-03-10 | N/A | type-check | `npx tsc --noEmit` | N/A | pending |
| 03-02-03 | 02 | 2 | CAT-01, CAT-02, CAT-03 | — | N/A | manual | Visual inspection (checkpoint) | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Test framework setup (vitest) — if not already installed
- [ ] `src/lib/categories.test.ts` — covers CAT-01, CAT-02 (category definitions, lookup functions)
- [ ] `src/lib/battle/session.test.ts` — covers CAT-01/CAT-02 (token extension with cat+sp fields)
- [ ] `src/lib/store/battle-store.test.ts` — covers CAT-03 (category state, prompt editing, pending switch, reset D-05)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Category selection UI renders correctly | CAT-01 | Visual rendering | Open browser, verify 5 categories display with correct icons |
| System prompt produces different AI behavior | CAT-02 | Subjective quality | Start battles with different categories, compare response tone |
| Custom prompt editor UX | CAT-03 | Interaction flow | Edit prompt, start battle, verify custom prompt is used |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
