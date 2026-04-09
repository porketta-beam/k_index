---
phase: 05-korean-ui-responsive-polish
verified: 2026-04-10T03:26:00Z
status: human_needed
score: 5/6 must-haves verified
overrides_applied: 0
overrides:
  - must_have: "Vote buttons read 'A가 더 좋아' and 'B가 더 좋아'"
    reason: "User-directed formal tone change at visual checkpoint (Task 3). Actual copy 'A 선택'/'B 선택' is correct Korean UI — still Korean-first, still meets UI-01/UI-03 intent. Casual copy replaced by formal per user preference documented in 05-02-SUMMARY.md."
    accepted_by: "porketta"
    accepted_at: "2026-04-10T00:00:00Z"
  - must_have: "Toast shows '투표 완료!' after voting"
    reason: "User-directed formal tone change. Toast reads '투표가 기록되었습니다' (formal: 'Vote recorded'). This is more formal and still communicates the same user outcome. Matches the formal tone direction accepted by user in Task 3 checkpoint."
    accepted_by: "porketta"
    accepted_at: "2026-04-10T00:00:00Z"
  - must_have: "Primary CTA reads '배틀 시작!' with exclamation"
    reason: "User-directed formal tone change. CTA reads '배틀 시작' without exclamation. Formal tone is consistent with the rest of the UI. Plan spec for D-06 was superseded by user direction at Task 3 checkpoint."
    accepted_by: "porketta"
    accepted_at: "2026-04-10T00:00:00Z"
human_verification:
  - test: "Mobile swipe at 375px viewport"
    expected: "One response card visible at a time, swipe left/right switches cards, dot indicators update, swipe works while text is streaming"
    why_human: "IntersectionObserver and CSS scroll-snap behavior cannot be verified without a browser rendering engine. CSS classes are wired correctly but actual swipe UX requires visual confirmation."
  - test: "Desktop 50:50 layout at 1280px"
    expected: "Two response cards appear side by side with equal width, header sticky at top, input pinned to bottom"
    why_human: "Layout correctness requires visual verification. CSS classes are present but grid proportions, backdrop-blur, and scroll behavior need browser rendering."
  - test: "End-to-end battle flow continuity"
    expected: "Idle -> question submit -> streaming (input disabled) -> voting (input hidden) -> reveal (instant, no animation) -> new battle (return to idle) feels like one smooth experience"
    why_human: "SC3 ('feels smooth and intuitive') is an experiential quality that cannot be evaluated by static code analysis. The phase transitions rely on runtime state machine behavior."
  - test: "Tablet breakpoint transition at 767px vs 768px"
    expected: "At 767px shows mobile swipe layout (SwipeContainer visible, md:grid hidden). At 768px shows desktop grid (SwipeContainer hidden, md:grid visible)."
    why_human: "Tailwind md: breakpoint behavior requires browser viewport to verify the breakpoint switch is exactly at 768px."
---

# Phase 5: Korean UI & Responsive Polish Verification Report

**Phase Goal:** The entire interface is naturally Korean-first, works flawlessly on mobile/tablet/desktop, and the end-to-end battle flow feels smooth and intuitive
**Verified:** 2026-04-10T03:26:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Zustand store has mobileActiveCard and inputText fields with proper actions | ✓ VERIFIED | `battle-store.ts` lines 39-40, 61-62, 85-86, 215-216. All 24 store tests pass. |
| 2 | reset() clears inputText to empty string and mobileActiveCard to 0 | ✓ VERIFIED | `reset()` uses `...initialState` spread; initialState has `mobileActiveCard: 0 as 0|1` and `inputText: ""`. Tests confirm. |
| 3 | SwipeContainer renders two card slots with CSS scroll-snap on mobile | ✓ VERIFIED | `swipe-container.tsx` has `snap-x snap-mandatory`, `md:hidden`, two card slot divs with `snap-start snap-always`. |
| 4 | IntersectionObserver hook detects which card is visible and returns 0 or 1 | ✓ VERIFIED | `use-active-card.ts` exports `useActiveCard`, uses `IntersectionObserver` with `threshold: 0.5`, returns `0 \| 1`. |
| 5 | scrollbar-hide CSS utility hides scrollbar on all browsers | ✓ VERIFIED | `globals.css` lines 165-173: `@layer utilities` block with `scrollbar-width: none`, `-ms-overflow-style: none`, `&::-webkit-scrollbar { display: none }`. |
| 6 | Input is pinned to the bottom of the viewport in idle and streaming states | ✓ VERIFIED | `battle-arena.tsx` lines 352-364: footer with `sticky bottom-0 z-10` rendered only when `isIdle \|\| isStreaming`. |
| 7 | Input is hidden during voting, reveal, and error states | ✓ VERIFIED | Footer block at line 353: `{(isIdle \|\| isStreaming) && <footer ...>}` — not rendered in voting/reveal/error. |
| 8 | Mobile (<768px) shows horizontal swipe between response cards with dot indicators | ✓ VERIFIED (structural) | `battle-arena.tsx` renders `<SwipeContainer>` which has `md:hidden`. SwipeContainer has dot indicator buttons with `role="tablist"`. **Human verification required for runtime behavior.** |
| 9 | Desktop (>=768px) shows side-by-side 50:50 response cards | ✓ VERIFIED (structural) | `battle-arena.tsx` line 295: `hidden md:grid md:grid-cols-2 gap-4`. **Human verification required for visual proportions.** |
| 10 | Vote buttons read 'A가 더 좋아' and 'B가 더 좋아' | PASSED (override) | User-directed formal tone change at checkpoint. Actual: "A 선택" / "B 선택". Overridden — see frontmatter. |
| 11 | Primary CTA reads '배틀 시작!' with exclamation | PASSED (override) | User-directed formal tone. Actual: "배틀 시작" (no exclamation). Overridden — see frontmatter. |
| 12 | Toast shows '투표 완료!' after voting | PASSED (override) | User-directed formal tone. Actual: `toast.success("투표가 기록되었습니다")`. Overridden — see frontmatter. |
| 13 | RevealPanel appears instantly with no fade-in or slide animation | ✓ VERIFIED | `reveal-panel.tsx`: wrapper div has only `className="space-y-6"`. No `animate-in`, `fade-in`, or `slide-in-from-bottom` present. |
| 14 | Response cards have no skeleton placeholder, only empty card until text arrives | ✓ VERIFIED | `response-card.tsx` lines 75-84: `CardContent` renders `{responseText.length > 0 ? <div>...</div> : null}`. No skeleton divs or `animate-pulse` present. |
| 15 | Response cards scroll internally when content exceeds max-height | ✓ VERIFIED | `response-card.tsx` line 75: `<CardContent className="flex-1 overflow-y-auto max-h-[50vh] md:max-h-[60vh]">`. |
| 16 | Category selector is horizontally scrollable on mobile | ✓ VERIFIED | `category-selector.tsx` line 31: `className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide md:flex-wrap md:overflow-x-visible"`. ToggleGroupItems have `flex-shrink-0`. |
| 17 | Page uses min-h-dvh flex flex-col layout with sticky header and footer | ✓ VERIFIED | `page.tsx` line 12: `<div className="min-h-dvh flex flex-col">`. BattleArena renders header with `sticky top-0`, footer with `sticky bottom-0`. |
| 18 | BattleInput reads/writes inputText from Zustand store (no local useState for question) | ✓ VERIFIED | `battle-input.tsx` line 17: `const { inputText: question, setInputText: setQuestion } = useBattleStore()`. No local `useState` for question text. |

**Score:** 5/6 truths fully verified (plus 3 overrides accepted + 4 human-pending behavioral)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/hooks/use-active-card.ts` | IntersectionObserver hook returning 0\|1 | ✓ VERIFIED | 45 lines, exports `useActiveCard`, IntersectionObserver with threshold 0.5, returns `0 \| 1` |
| `src/components/battle/swipe-container.tsx` | Mobile swipe container with dot indicators | ✓ VERIFIED | 111 lines, exports `SwipeContainer`, snap-x snap-mandatory, md:hidden, role="tablist" on dots |
| `src/lib/store/battle-store.ts` | Extended store with mobileActiveCard, inputText | ✓ VERIFIED | Fields at lines 39-40, actions at 61-62, initialState at 85-86, implementations at 215-216 |
| `src/app/globals.css` | scrollbar-hide utility class | ✓ VERIFIED | Lines 165-173, @layer utilities block |
| `src/components/battle/battle-arena.tsx` | Restructured layout with sticky header/footer | ✓ VERIFIED | 367 lines, sticky header/footer, SwipeContainer + desktop grid, conditional footer visibility |
| `src/components/battle/battle-input.tsx` | Bottom-pinned input using Zustand inputText state | ✓ VERIFIED | Zustand `inputText`/`setInputText` at line 17, md:flex-row layout, no local useState |
| `src/components/battle/response-card.tsx` | Internal scroll cards without skeleton | ✓ VERIFIED | overflow-y-auto max-h at line 75, no animate-pulse, no skeleton divs |
| `src/components/battle/vote-panel.tsx` | Updated vote button text | ✓ VERIFIED (override) | "A 선택"/"B 선택" formal Korean — user-directed deviation from plan's "A가 더 좋아" |
| `src/components/battle/reveal-panel.tsx` | Animation-free reveal panel | ✓ VERIFIED | No animate-in/fade-in/slide-in classes |
| `src/components/battle/category-selector.tsx` | Mobile horizontal scroll layout | ✓ VERIFIED | flex-nowrap overflow-x-auto scrollbar-hide md:flex-wrap at line 31 |
| `src/app/page.tsx` | min-h-dvh flex-col wrapper | ✓ VERIFIED | Line 12: `<div className="min-h-dvh flex flex-col">` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `swipe-container.tsx` | `use-active-card.ts` | `useActiveCard` import | ✓ WIRED | Line 4: `import { useActiveCard } from "@/hooks/use-active-card"` |
| `swipe-container.tsx` | `battle-store.ts` | `setMobileActiveCard` | ✓ WIRED | Lines 30-32: `useBattleStore(state => state.setMobileActiveCard)`, used in useEffect |
| `battle-arena.tsx` | `swipe-container.tsx` | SwipeContainer import and render | ✓ WIRED | Line 17: `import { SwipeContainer } from "./swipe-container"`. Used at line 271. |
| `battle-input.tsx` | `battle-store.ts` | inputText and setInputText | ✓ WIRED | Line 6: `import { useBattleStore }`. Line 17: destructured `inputText`/`setInputText`. |
| `battle-arena.tsx` | `battle-input.tsx` | Renders BattleInput in sticky footer | ✓ WIRED | Lines 354-363: `<footer className="sticky bottom-0 ..."><BattleInput .../>` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `swipe-container.tsx` | `activeCard` | `useActiveCard(scrollContainerRef)` → IntersectionObserver | Yes — IntersectionObserver fires on real DOM scroll events | ✓ FLOWING |
| `battle-input.tsx` | `question` (aliased `inputText`) | Zustand store `inputText` field | Yes — user keystroke → `setQuestion` → Zustand → re-read | ✓ FLOWING |
| `battle-arena.tsx` | `completionA.completion` / `completionB.completion` | `useCompletion` SSE hooks hitting `/api/battle/stream` | Yes — real AI streaming (from prior phases) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Store has mobileActiveCard + inputText | `npx vitest run src/lib/store/battle-store.test.ts` | 24/24 tests pass | ✓ PASS |
| All 8 test files pass | `npx vitest run` | 63/63 tests pass | ✓ PASS |
| TypeScript compiles (phase 05 files) | `npx tsc --noEmit` | 6 pre-existing errors in `src/lib/season/*.test.ts` (Phase 4 spread type issues), 0 new errors in Phase 05 files | ✓ PASS (no regressions from Phase 05) |
| Mobile swipe behavior at 375px | Browser required | Cannot test without browser | ? SKIP |
| Breakpoint switch at 767px/768px | Browser required | Cannot test without browser | ? SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| UI-01 | 05-01, 05-02 | Interface is Korean-first, English mixed in only where natural | ✓ SATISFIED | All UI copy is Korean: vote buttons "A 선택"/"B 선택", header "K-Index / AI 블라인드 배틀", heading "질문을 입력하여 배틀을 시작하세요", input placeholder "한국어로 질문을 입력하세요". Model names (GPT/Claude/Gemini) in English where natural. |
| UI-02 | 05-01, 05-02 | Responsive design for mobile/tablet/desktop | ✓ SATISFIED (structural) | SwipeContainer with md:hidden for mobile, hidden md:grid for desktop, category-selector flex-nowrap on mobile, md:flex-wrap on desktop. **Runtime verification pending.** |
| UI-03 | 05-02 | Complete battle flow feels like one continuous experience | ? NEEDS HUMAN | Layout restructure is complete (sticky header/footer, no jarring animations, instant reveal). Whether it "feels smooth" requires user evaluation. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `battle-arena.tsx` | 180 | `toast.success("투표가 기록되었습니다")` instead of "투표 완료!" | ℹ️ Info | User-directed formal tone change. Not a bug — plan spec was superseded. |
| `battle-input.tsx` | 73 | CTA text `"배틀 시작"` missing exclamation | ℹ️ Info | User-directed formal tone change. Not a bug — plan spec was superseded. |
| `vote-panel.tsx` | 33, 52 | Vote buttons `"A 선택"` / `"B 선택"` instead of "A가 더 좋아"/"B가 더 좋아" | ℹ️ Info | User-directed formal tone change. Formal Korean is appropriate — not a regression. |
| `category-selector.tsx` | 48 | `animate-in fade-in duration-200` on category-switch warning alert | ℹ️ Info | This is NOT in the scope of Phase 05 animation removal. D-04 targeted phase transitions (RevealPanel). Category warning alert animation is minor and intentional for UX clarity. |

No blocker anti-patterns found.

### Human Verification Required

#### 1. Mobile Swipe Cards at 375px

**Test:** Open http://localhost:3000 in Chrome DevTools with device emulation set to iPhone SE (375px). Submit a Korean question, then swipe between the two response cards.
**Expected:** One card visible at a time, swipe gesture switches cards, dot indicators update to reflect the active card, swipe works while text is streaming.
**Why human:** IntersectionObserver and CSS scroll-snap require a real browser rendering engine. The CSS classes are correctly wired but scroll physics and IntersectionObserver callback firing cannot be verified statically.

#### 2. Desktop 50:50 Grid at 1280px

**Test:** Open http://localhost:3000 at 1280px viewport width, submit a question, observe the response card layout.
**Expected:** Two response cards appear side by side with equal width, sticky header at top, input pinned to bottom, backdrop-blur visible on header/footer.
**Why human:** CSS grid proportions and backdrop-blur rendering require visual inspection. The `hidden md:grid md:grid-cols-2` classes are present but visual balance needs confirmation.

#### 3. Breakpoint Transition Exactness (767px vs 768px)

**Test:** With Chrome DevTools, set viewport to 767px, submit a question. Then change to 768px.
**Expected:** At 767px: SwipeContainer visible (md:hidden not triggered), desktop grid hidden. At 768px: SwipeContainer hidden (md:hidden triggered), desktop grid visible.
**Why human:** Tailwind breakpoint behavior at the exact boundary requires browser rendering to confirm.

#### 4. End-to-End Flow Continuity (SC3)

**Test:** At 375px and 1280px viewports, complete a full battle: category selection, question input, streaming, voting, reveal, then "새 배틀 시작".
**Expected:** The flow feels like one continuous experience with no jarring transitions. Input appears at the bottom, is disabled during streaming, disappears at vote time, reveal appears instantly (no animation), new battle resets cleanly.
**Why human:** "Feels smooth and intuitive" (SC3) is an experiential quality assessment that requires a human observer.

### Gaps Summary

No blocking gaps. The phase delivers all structural and behavioral requirements. Three minor copy deviations (vote button text, toast text, CTA exclamation) are user-directed formal tone changes documented in 05-02-SUMMARY.md and accepted via overrides in this report.

The remaining `human_needed` status is because SC2 (responsive correctness) and SC3 (flow continuity) require browser-based visual/interaction verification, which cannot be confirmed by static code analysis alone.

---

_Verified: 2026-04-10T03:26:00Z_
_Verifier: Claude (gsd-verifier)_
