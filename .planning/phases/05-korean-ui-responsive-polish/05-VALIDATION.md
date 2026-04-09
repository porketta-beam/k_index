---
phase: 05
slug: korean-ui-responsive-polish
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-10
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

**Note:** Playwright is not used in this phase. Phase 05 is primarily CSS/layout/visual work. The existing Vitest config uses `environment: "node"` which cannot render React components or test DOM layout. Adding jsdom/happy-dom + React Testing Library would be significant infrastructure work out of scope for this phase (see RESEARCH.md Validation Architecture justification). Visual/responsive verification is handled by the manual checkpoint in Plan 05-02 Task 3.

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full vitest suite must be green + manual checkpoint approved
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | UI-01, UI-02 | T-05-01 | N/A | unit | `npx vitest run src/lib/store/battle-store.test.ts --reporter=verbose` | Yes (existing, extended in task) | ⬜ pending |
| 05-01-02 | 01 | 1 | UI-01, UI-02 | T-05-02 | N/A | unit | `npx vitest run --reporter=verbose` | Yes (existing suite) | ⬜ pending |
| 05-02-01 | 02 | 2 | UI-01, UI-02, UI-03 | T-05-03, T-05-04 | N/A | unit | `npx vitest run --reporter=verbose` | Yes (existing suite) | ⬜ pending |
| 05-02-02 | 02 | 2 | UI-01, UI-02, UI-03 | T-05-05 | N/A | unit | `npx vitest run --reporter=verbose` | Yes (existing suite) | ⬜ pending |
| 05-02-03 | 02 | 2 | UI-01, UI-02, UI-03 | — | N/A | manual (checkpoint) | `npx vitest run --reporter=verbose` | Yes (existing suite) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing vitest infrastructure covers unit-level verification
- [x] Plan 05-01 Task 1 creates new unit tests for mobileActiveCard/inputText in `battle-store.test.ts`
- No new test framework installation needed

*Wave 0 is satisfied by existing vitest infrastructure + TDD tests created in Plan 05-01 Task 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Checkpoint |
|----------|-------------|------------|-------------------|------------|
| Korean text reads naturally | UI-01 | Subjective language quality | Read all UI text, verify casual/formal tone split per D-06 | Plan 05-02, Task 3 |
| Swipe gesture feels responsive | UI-02 | Touch interaction quality | Test on physical mobile device or DevTools, verify smooth scroll-snap | Plan 05-02, Task 3 |
| Mobile layout at 375px | UI-02 | Visual layout verification | Chrome DevTools device toolbar, iPhone SE (375px) | Plan 05-02, Task 3 |
| Desktop layout at 1280px+ | UI-02 | Visual layout verification | Full browser window, verify 50:50 cards side by side | Plan 05-02, Task 3 |
| Breakpoint transition at 768px | UI-02 | Visual layout verification | DevTools at 767px (swipe) vs 768px (grid) | Plan 05-02, Task 3 |
| End-to-end flow continuity | UI-03 | Holistic UX assessment | Complete full battle flow on mobile and desktop, check for jarring transitions | Plan 05-02, Task 3 |

All manual verifications are covered by the `checkpoint:human-verify` task in Plan 05-02, Task 3, which includes detailed step-by-step instructions for all three viewport widths and the full battle flow.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands (`npx vitest run`)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covered (existing vitest + TDD tests in Plan 05-01 Task 1)
- [x] No watch-mode flags
- [x] Feedback latency < 30s (~15s vitest run)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
