# Phase 5: Korean UI & Responsive Polish - Research

**Researched:** 2026-04-10
**Domain:** Responsive UI, Mobile Swipe UX, Korean-first Typography, Layout Restructuring
**Confidence:** HIGH

## Summary

Phase 5 transforms the existing desktop-only battle UI into an arena.ai-inspired experience that is mobile-first, Korean-first, and flows seamlessly across the entire battle journey. The existing codebase has 10 battle components, a working Zustand state machine, OKLCH color system, and Pretendard font already configured. The primary work is: (1) restructuring the page layout to move input to the bottom, (2) implementing mobile swipe between response cards with CSS scroll-snap, (3) updating all copy to match the new D-06 tone decisions and D-11 vote button text, and (4) ensuring all states (idle, streaming, voting, reveal, error) work flawlessly across breakpoints.

The arena.ai screenshots confirm the visual reference: clean white background, minimal chrome, response cards with model names at top, dot indicators for mobile swipe navigation, vote buttons centered between cards, and input pinned to the bottom. K-Index diverges from arena.ai in that we only offer 2 vote options ("A가 더 좋아" / "B가 더 좋아"), have no sidebar, and use light-mode only.

**Primary recommendation:** Use native CSS `scroll-snap` via Tailwind v4 utilities for mobile card swipe (zero dependencies), restructure `BattleArena` layout with sticky-bottom input using flexbox, and add a `mobileActiveCard` state to the Zustand store for dot indicator tracking.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Mobile (<768px) swipe between response cards (arena.ai style), dot indicators (filled/unfilled circles)
- **D-02:** Swipe works during streaming -- do not block swipe while responses are being generated
- **D-03:** Breakpoint at md (768px) -- below = mobile swipe, above = desktop side-by-side. Tablet portrait = mobile.
- **D-04:** No animations on phase transitions -- instant swap between idle/streaming/voting/reveal
- **D-05:** Empty card + progressive text for streaming (no skeleton/spinner)
- **D-06:** Mixed tone -- casual for buttons/labels (반말), formal for errors/system messages (존댓말)
- **D-07:** No i18n framework -- Korean-only inline strings
- **D-08:** Visual reference is arena.ai (https://arena.ai/)
- **D-09:** Light mode only
- **D-10:** Desktop 50:50 cards, model name top, internal scroll for overflow
- **D-11:** Vote buttons arena.ai style center, only "A가 더 좋아" / "B가 더 좋아" (2 options only)
- **D-12:** Input at bottom (arena.ai style), move from current top position
- **D-13:** No sidebar nav in v1

### Claude's Discretion
- arena.ai reference-based color/typography adjustments
- Mobile swipe implementation method (CSS scroll snap vs library)
- OKLCH color system light-mode optimization
- Accessibility (a11y) implementation scope and method
- Response card internal scroll max-height reference

### Deferred Ideas (OUT OF SCOPE)
- Dark mode toggle (v2)
- next-intl i18n structuring (English support)
- Full accessibility audit (WCAG AA compliance)
- Sidebar navigation + leaderboard/search pages (v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Interface is Korean-first, English mixed only where natural (model names, technical terms) | Copywriting audit of all components; D-06 tone rules; D-07 inline strings pattern |
| UI-02 | Responsive design for mobile (375px), tablet (768px), desktop (1280px+) | CSS scroll-snap for mobile swipe (D-01); md breakpoint (D-03); sticky-bottom input (D-12); 50:50 desktop cards (D-10) |
| UI-03 | Complete battle flow feels like one continuous experience | Layout restructure with bottom input (D-12); instant transitions (D-04); streaming swipe (D-02); arena.ai vote buttons (D-11) |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.x (installed) | Scroll-snap utilities, responsive breakpoints, layout | Built-in `snap-x`, `snap-mandatory`, `snap-start`, `snap-always` classes. No plugin needed. | [VERIFIED: package.json] |
| React | 19.2.4 (installed) | useRef + IntersectionObserver for active card detection | Already in project | [VERIFIED: package.json] |
| Zustand | 5.x (installed) | `mobileActiveCard` state for swipe indicator | Already managing battle state machine | [VERIFIED: package.json] |
| shadcn/ui | 4.2 (installed) | Button, Card, Textarea, Badge primitives | 9 UI primitives already installed | [VERIFIED: package.json] |

### No New Dependencies Required

This phase requires **zero new npm packages**. The mobile swipe is implemented entirely with CSS scroll-snap (Tailwind v4 built-in utilities). The dot indicator tracks state via IntersectionObserver + Zustand. No carousel library needed.

**Recommendation against Embla Carousel:** While Embla is excellent (6KB, headless), CSS scroll-snap is sufficient for a 2-card swipe scenario. Adding a dependency for 2 items is unnecessary overhead. CSS scroll-snap has universal browser support, zero JS runtime cost, and integrates naturally with Tailwind utilities. [VERIFIED: Tailwind docs, MDN docs]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS scroll-snap | Embla Carousel (8.6.0) | Embla adds 6KB for 2-card swipe; CSS scroll-snap is zero-JS, built into Tailwind v4 |
| IntersectionObserver | scroll event listener | IO is more performant (no layout thrashing), threshold-based detection is cleaner |
| Custom scrollbar-hide CSS | tailwind-scrollbar-utilities plugin | 3-line CSS rule vs. adding a dependency; not worth a plugin for one use case |

## Architecture Patterns

### Current Layout Structure (BEFORE -- needs restructuring)

```
BattleArena (max-w-[1120px], mx-auto, px-4, py-8, space-y-8)
  Header (text-center)
  CategorySelector
  SystemPromptEditor
  BattleInput (TOP -- needs to move to BOTTOM)
  Question display (read-only)
  ResponseCards (grid grid-cols-1 md:grid-cols-2 gap-4)
  Error state
  VotePanel
  RevealPanel
  Empty state
```

### Target Layout Structure (AFTER -- arena.ai inspired)

```
Page (min-h-dvh, flex flex-col)
  Header (sticky top-0, z-10, backdrop-blur)
    "K-Index" + "AI 블라인드 배틀"
  
  Main Content (flex-1, overflow-y-auto, pb-[input-area-height])
    [idle state]
      CategorySelector
      SystemPromptEditor (collapsible)
      Empty state hero ("첫 번째 배틀을 시작해보세요!")
    
    [streaming/voting/reveal/error states]
      Question display (read-only, muted bg)
      
      [Desktop >= 768px]
        ResponseCards (grid grid-cols-2 gap-4)
          Each card: model name top, overflow-y-auto max-h-[60vh]
      
      [Mobile < 768px]
        ResponseCards (scroll-snap container, horizontal swipe)
          snap-x snap-mandatory overflow-x-auto
          Each card: w-full snap-start snap-always
          Dot indicators below (filled/unfilled circles)
      
      VotePanel (centered, "A가 더 좋아" / "B가 더 좋아")
      RevealPanel (win rates, "새 배틀 시작" button)
  
  Input Footer (sticky bottom-0, border-t, bg-background, z-10)
    BattleInput (textarea + submit button)
    Only visible in idle + streaming states
```

### Pattern 1: CSS Scroll-Snap Mobile Swipe

**What:** Pure CSS horizontal swipe between 2 response cards on mobile
**When to use:** Mobile viewport below 768px (D-01, D-03)

```typescript
// Source: Tailwind CSS v4 docs + MDN scroll-snap
// Container classes (on mobile only):
// "flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0"
// Each child:
// "w-full flex-shrink-0 snap-start snap-always"

// The key Tailwind classes:
// snap-x          -> scroll-snap-type: x var(--tw-scroll-snap-strictness)
// snap-mandatory   -> --tw-scroll-snap-strictness: mandatory
// snap-start       -> scroll-snap-align: start
// snap-always      -> scroll-snap-stop: always (prevents skipping cards)
```

**Custom CSS for scrollbar hiding (add to globals.css):**
```css
@layer utilities {
  .scrollbar-hide {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
    &::-webkit-scrollbar {
      display: none; /* Chrome/Safari/Opera */
    }
  }
}
```
[VERIFIED: Tailwind CSS v4 docs -- snap-x, snap-mandatory, snap-start, snap-always are all built-in]

### Pattern 2: IntersectionObserver for Active Card Detection

**What:** Detect which card is currently visible in the scroll-snap container to update dot indicator
**When to use:** Mobile swipe view to show active dot

```typescript
// Source: MDN IntersectionObserver + React patterns
import { useRef, useEffect, useState, useCallback } from "react";

function useActiveCard(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.children;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = Array.from(cards).indexOf(entry.target as Element);
            if (index >= 0) setActiveIndex(index);
          }
        }
      },
      { root: container, threshold: 0.5 }
    );

    for (const card of Array.from(cards)) {
      observer.observe(card);
    }

    return () => observer.disconnect();
  }, [containerRef]);

  return activeIndex;
}
```
[CITED: dev.to/ruben_suet/my-experience-with-intersectionobserver-scroll-snap-and-react]

### Pattern 3: Sticky Bottom Input (arena.ai style)

**What:** Input area pinned to bottom of viewport, always visible during idle/streaming
**When to use:** All viewport sizes (D-12)

```tsx
// Layout structure using flexbox + sticky
<div className="min-h-dvh flex flex-col">
  {/* Header */}
  <header className="sticky top-0 z-10 bg-background/80 backdrop-blur ...">
    ...
  </header>
  
  {/* Scrollable main content */}
  <main className="flex-1 overflow-y-auto">
    {/* Battle content here */}
  </main>
  
  {/* Sticky bottom input */}
  {(isIdle || isStreaming) && (
    <footer className="sticky bottom-0 z-10 border-t bg-background px-4 py-3">
      <div className="max-w-[1120px] mx-auto">
        <BattleInput ... />
      </div>
    </footer>
  )}
</div>
```

**iOS Safari keyboard concern:** Using `sticky` instead of `fixed` avoids the notorious iOS Safari bug where `position: fixed` elements don't respect the virtual keyboard. With `sticky bottom-0`, the element stays at the bottom of its containing block, which adjusts naturally when the keyboard opens. The `min-h-dvh` (dynamic viewport height) also handles the mobile browser toolbar correctly.
[CITED: medium.com/@im_rahul/safari-and-position-fixed, Tailwind CSS height docs]

### Pattern 4: Response Card Internal Scroll (D-10)

**What:** When AI response text exceeds card height, card scrolls internally rather than expanding infinitely
**When to use:** Desktop and mobile when response is long

```tsx
// Desktop: max-h-[60vh] with overflow-y-auto
// Mobile: max-h-[50vh] (less vertical space due to bottom input)
<CardContent className="flex-1 overflow-y-auto max-h-[60vh] md:max-h-[60vh]">
  <div className="text-base leading-[1.6] whitespace-pre-wrap">
    {responseText}
  </div>
</CardContent>
```

**Recommendation for max-height:** 60vh on desktop, 50vh on mobile. This ensures the card never pushes vote buttons off-screen while giving enough room for meaningful response reading. [ASSUMED]

### Anti-Patterns to Avoid

- **Using `position: fixed` for bottom input:** Breaks on iOS Safari when keyboard opens. Use `sticky bottom-0` instead.
- **Using JavaScript-based scroll/swipe libraries for 2 cards:** CSS scroll-snap handles this natively with zero JS runtime cost.
- **Hiding cards during streaming on mobile:** D-02 explicitly requires swipe to work DURING streaming. Both cards must be rendered and swipeable even when responses are incomplete.
- **Using `vh` instead of `dvh`:** The `vh` unit doesn't account for mobile browser chrome. Use `dvh` (dynamic viewport height) via Tailwind's `min-h-dvh`.
- **Adding transitions between battle phases:** D-04 explicitly prohibits animations on phase transitions. Use instant swap.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile card swipe | Custom touch/drag handler | CSS `scroll-snap-type: x mandatory` via Tailwind `snap-x snap-mandatory` | Native browser behavior, perfect momentum, zero JS |
| Active card detection | Scroll position math | `IntersectionObserver` with 0.5 threshold | No layout thrashing, accurate on all browsers |
| Scrollbar hiding | Custom overflow wrapper component | 3-line CSS utility class `.scrollbar-hide` | Simpler, applies via Tailwind class |
| Responsive breakpoint logic | `window.innerWidth` checks | Tailwind responsive prefixes (`md:`) | SSR-safe, no hydration mismatch |
| Viewport height on mobile | `100vh` | Tailwind `min-h-dvh` | Handles mobile browser chrome correctly |

**Key insight:** This phase is almost entirely CSS layout work. The only new JavaScript is the IntersectionObserver hook for dot indicators and the Zustand state addition for mobile active card. Everything else is restructuring existing components with Tailwind classes.

## Common Pitfalls

### Pitfall 1: iOS Safari Keyboard Pushing Fixed Elements
**What goes wrong:** On iOS Safari, `position: fixed` bottom elements get pushed up or hidden when the virtual keyboard opens, causing layout chaos.
**Why it happens:** Safari doesn't resize the layout viewport when the keyboard appears; it resizes the visual viewport instead. Fixed elements reference the layout viewport.
**How to avoid:** Use `position: sticky` with `bottom: 0` inside a flex container. The element stays at the bottom of its scrollable parent, which adjusts with the visual viewport.
**Warning signs:** Input disappears or overlaps content when user taps the textarea on mobile Safari.

### Pitfall 2: Scroll-Snap Not Working During Streaming
**What goes wrong:** If response cards change height during streaming (text being appended), scroll-snap can become unstable and snap back to the first card.
**Why it happens:** Dynamic content changes can trigger scroll-snap recalculation in some browsers.
**How to avoid:** Set a fixed minimum height on mobile response cards (`min-h-[300px]`). Ensure both cards are always rendered (even if empty). The scroll container dimensions should not change as text streams in.
**Warning signs:** Card snaps back to Model A every time new text arrives on Model B.

### Pitfall 3: Vote Button Text Mismatch with UI-SPEC
**What goes wrong:** Phase 2 UI-SPEC says "A 승리" / "B 승리" but Phase 5 CONTEXT.md D-11 overrides to "A가 더 좋아" / "B가 더 좋아". If the planner doesn't catch this, the wrong text ships.
**Why it happens:** Phase 5 decisions intentionally override Phase 2 copy to match arena.ai style and the more casual Korean tone.
**How to avoid:** Phase 5 plan must explicitly list ALL copy changes as a distinct task. Cross-reference Phase 2 UI-SPEC copy table against Phase 5 D-06/D-11 decisions.
**Warning signs:** N/A -- just needs careful planning.

### Pitfall 4: BattleInput State Loss When Moving to Bottom
**What goes wrong:** Moving `BattleInput` from inline in the component tree to a sticky footer can cause it to unmount/remount, losing the user's typed text.
**Why it happens:** React unmounts components when their position in the tree changes.
**How to avoid:** Keep `BattleInput` as a controlled component with question state in the parent or in Zustand. The current implementation uses local `useState` inside `BattleInput`, so moving it in the tree will lose the typed text. Options: (a) lift state to Zustand, or (b) ensure the component stays mounted in the same tree position.
**Warning signs:** User types a question, scrolls or viewport changes, text disappears.

### Pitfall 5: Response Card Skeleton Removed Too Early (D-05)
**What goes wrong:** D-05 says "empty card + progressive text" with no skeleton/spinner. But the current `ResponseCard` has skeleton lines (`animate-pulse` divs) shown when `isStreaming && responseText.length === 0`.
**Why it happens:** Phase 2 implementation included skeletons as a placeholder before text arrives. Phase 5 D-05 overrides this.
**How to avoid:** Remove the skeleton fallback in `ResponseCard`. Show an empty card body until the first character arrives, then show progressive text.
**Warning signs:** Pulsing gray bars visible before streaming text appears.

### Pitfall 6: Category Selector Overflow on Mobile
**What goes wrong:** The 5 category toggle buttons (`flex-wrap gap-2`) can wrap into 2-3 rows on narrow mobile screens (375px), taking up too much vertical space.
**Why it happens:** Each button has `min-h-[44px] px-4` and emoji + Korean text.
**How to avoid:** On mobile, make the category selector horizontally scrollable with scroll-snap or use a compact single-row layout. Consider reducing font size or making it a dropdown on mobile.
**Warning signs:** Category selector takes more than 100px of vertical space on 375px width.

## Copywriting Changes (D-06 Tone Audit)

Phase 5 D-06 introduces a mixed tone rule: casual (반말) for interactive elements, formal (존댓말) for system/error messages. Phase 5 D-11 changes vote button text. All changes from Phase 2 UI-SPEC:

| Element | Phase 2 (Current) | Phase 5 (Target) | Tone | Change Reason |
|---------|-------------------|-------------------|------|---------------|
| Vote A button | "A 승리" | "A가 더 좋아" | Casual (반말) | D-11: arena.ai style, friendlier |
| Vote B button | "B 승리" | "B가 더 좋아" | Casual (반말) | D-11: arena.ai style, friendlier |
| Primary CTA | "배틀 시작" | "배틀 시작!" | Casual (반말) | D-06: exclamation for energy |
| Vote recorded toast | "투표가 기록되었습니다!" | "투표 완료!" | Casual (반말) | D-06: shorter, punchier |
| New battle CTA | "새 배틀 시작" | "새 배틀 시작" | Casual (unchanged) | Already casual |
| Error message | "응답을 생성하는 중 오류가 발생했습니다" | "오류가 발생했습니다" (or keep) | Formal (존댓말) | D-06: errors stay formal |
| Vote wait message | "두 응답이 모두 완료될 때까지 기다려주세요" | Same | Formal (존댓말) | D-06: system message stays formal |
| Input placeholder | "한국어로 질문을 입력하세요" | Same | Formal (존댓말) | Existing is already appropriate |
| Stream complete label | "완료" | "완료" | Neutral (unchanged) | Short label, no tone change needed |
| Vote prompt heading | "어떤 응답이 더 좋았나요?" | "어떤 응답이 더 좋아?" or keep | Casual or keep formal | D-06 discretion area |
| Empty state heading | "첫 번째 배틀을 시작해보세요!" | Same or "첫 배틀을 시작해봐!" | Casual option | D-06 discretion area |

**Note:** The exact copywriting for D-06 discretion areas (vote prompt, empty state) should be decided during planning. The research provides both options.

## Code Examples

### Example 1: Mobile Swipe Container for Response Cards

```tsx
// Source: Tailwind CSS v4 scroll-snap docs + arena.ai reference
// This replaces the current grid in BattleArena

{/* Mobile: horizontal swipe container */}
<div className="md:hidden">
  <div
    ref={scrollContainerRef}
    className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
  >
    <div className="w-full flex-shrink-0 snap-start snap-always px-4">
      <ResponseCard slot="a" {...cardAProps} />
    </div>
    <div className="w-full flex-shrink-0 snap-start snap-always px-4">
      <ResponseCard slot="b" {...cardBProps} />
    </div>
  </div>
  {/* Dot indicators */}
  <div className="flex justify-center gap-2 mt-3">
    <span className={cn(
      "w-2 h-2 rounded-full transition-colors",
      activeCard === 0 ? "bg-foreground" : "bg-muted-foreground/30"
    )} />
    <span className={cn(
      "w-2 h-2 rounded-full transition-colors",
      activeCard === 1 ? "bg-foreground" : "bg-muted-foreground/30"
    )} />
  </div>
</div>

{/* Desktop: side by side */}
<div className="hidden md:grid md:grid-cols-2 gap-4">
  <ResponseCard slot="a" {...cardAProps} />
  <ResponseCard slot="b" {...cardBProps} />
</div>
```

### Example 2: Arena.ai Style Vote Buttons (D-11)

```tsx
// Source: arena.ai screenshots + D-11 decision
<div className="flex justify-center gap-3">
  <Button
    variant="outline"
    size="lg"
    className="min-w-[140px] min-h-[44px]"
    onClick={() => onVote("a")}
    disabled={disabled}
  >
    A가 더 좋아
  </Button>
  <Button
    variant="outline"
    size="lg"
    className="min-w-[140px] min-h-[44px]"
    onClick={() => onVote("b")}
    disabled={disabled}
  >
    B가 더 좋아
  </Button>
</div>
```

### Example 3: Sticky Bottom Input Footer

```tsx
// Source: arena.ai home/battle screenshots + D-12 decision
{(isIdle || isStreaming) && (
  <footer className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur-sm px-4 py-3">
    <div className="max-w-[1120px] mx-auto">
      <BattleInput
        onSubmit={handleStartBattle}
        disabled={isStreaming}
        loading={isStreaming}
      />
    </div>
  </footer>
)}
```

### Example 4: Scrollbar-Hide Utility (globals.css addition)

```css
/* Source: MDN scrollbar-width + webkit-scrollbar docs */
@layer utilities {
  .scrollbar-hide {
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `100vh` for full height | `100dvh` / `min-h-dvh` | 2023 (browser adoption), Tailwind 3.4 | Handles mobile browser chrome correctly |
| JS touch-based swipe | CSS `scroll-snap-type` | 2020+ (universal support) | Zero JS, native momentum, accessible |
| `position: fixed` bottom | `position: sticky` bottom in flex | 2022+ (iOS Safari fixes) | Works with mobile keyboards |
| `-webkit-overflow-scrolling: touch` | Default behavior (deprecated) | 2019+ | No longer needed, all browsers smooth by default |
| JS-based responsive checks | Tailwind responsive prefixes (`md:`) | Always | SSR-safe, no hydration mismatch |

**Deprecated/outdated:**
- `-webkit-overflow-scrolling: touch`: Deprecated, momentum scrolling is default in all modern browsers [VERIFIED: MDN]
- `overscroll-behavior` for scroll-snap: Not needed; `snap-mandatory` handles containment [VERIFIED: Tailwind docs]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | max-h-[60vh] desktop / max-h-[50vh] mobile is the right threshold for response card internal scroll | Architecture Patterns, Pattern 4 | Cards may be too short (cuts off content) or too tall (pushes vote buttons offscreen). Easy to adjust via CSS. |
| A2 | min-h-[300px] on mobile cards prevents scroll-snap instability during streaming | Common Pitfalls, Pitfall 2 | If too small, short responses look odd. If too large, wastes space. Low risk -- easily tunable. |
| A3 | Vote prompt heading "어떤 응답이 더 좋았나요?" should stay formal vs. become casual | Copywriting Changes | Tone mismatch with casual vote buttons if kept formal. But "어떤 응답이 더 좋아?" may feel too informal for a heading. |
| A4 | Category selector should remain as toggle group on mobile (not dropdown) | Common Pitfalls, Pitfall 6 | May take too much vertical space on 375px. Horizontal scroll is the fallback. |

## Open Questions (RESOLVED)

1. **Category selector mobile layout**
   - What we know: 5 categories with emoji + Korean text, currently `flex-wrap gap-2`, each button is 44px tall
   - What's unclear: Whether they fit in a single row on 375px or need horizontal scroll / dropdown
   - Recommendation: Implement as horizontally scrollable row with overflow-x-auto on mobile. Can test and adjust during implementation.
   - RESOLVED: Horizontally scrollable row with `flex-nowrap overflow-x-auto scrollbar-hide` on mobile, `md:flex-wrap` on desktop. Each ToggleGroupItem gets `flex-shrink-0`. Implemented in Plan 05-02, Task 1 (CategorySelector update).

2. **BattleInput state management during layout move**
   - What we know: Current BattleInput uses local useState for question text. Moving it to sticky footer could cause unmount.
   - What's unclear: Whether React will preserve the component across the layout change
   - Recommendation: Lift the question input state to Zustand (add `inputText` to store) or keep BattleInput in a stable tree position. Simplest fix: ensure the component does not conditionally render in different tree positions.
   - RESOLVED: Lifted question input state to Zustand store (`inputText` + `setInputText` fields). Plan 05-01 Task 1 extends the store; Plan 05-02 Task 1 rewires BattleInput to use `useBattleStore()` instead of local `useState`. This makes the input value survive tree position changes.

3. **SystemPromptEditor placement with bottom input**
   - What we know: Currently positioned below CategorySelector, above BattleInput. With BattleInput moving to bottom, the collapsible prompt editor needs a new home.
   - What's unclear: Where it fits best in the new layout
   - Recommendation: Keep it in the main content area below CategorySelector. It's only visible in idle state and collapses to one line, so it doesn't conflict with the bottom input.
   - RESOLVED: Kept in main content area below CategorySelector, rendered only in idle state. BattleInput moved to sticky footer, so no conflict. Implemented in Plan 05-02, Task 2 (BattleArena layout restructure).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | `vitest.config.ts` (exists, node environment) |
| Quick run command | `npm run test` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Korean text in all UI components | manual-only | Visual review + grep for English-only strings | N/A |
| UI-02 | Responsive layout at 375px, 768px, 1280px | manual-only | Browser DevTools responsive mode | N/A |
| UI-03 | Battle flow continuity | manual-only | E2E walkthrough in browser | N/A |
| UI-02 (unit) | Zustand store mobileActiveCard state | unit | `npx vitest run src/lib/store/battle-store.test.ts -t "mobileActiveCard"` | Existing (needs new tests) |

**Justification for manual-only:** Phase 5 is primarily a CSS/layout/visual phase. The existing Vitest config uses `environment: "node"` which cannot render React components or test DOM layout. Adding jsdom/happy-dom environment and React Testing Library would be significant infrastructure work that is out of scope for this phase. The meaningful validation for responsive UI is visual testing in a browser at each breakpoint.

### Sampling Rate
- **Per task commit:** `npm run test` (ensure existing unit tests still pass)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green + manual responsive check at 375px, 768px, 1280px

### Wave 0 Gaps
- [ ] Add `mobileActiveCard` tests to `src/lib/store/battle-store.test.ts`
- No new test files needed for CSS-only changes

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A (no auth in v1) |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | No (no new inputs) | Existing zod validation unchanged |
| V6 Cryptography | No | N/A |

**Phase 5 is a pure UI/CSS phase.** No new API endpoints, no new data flows, no new input handling. All existing security controls (rate limiting, input validation, session tokens) are unchanged. No security domain research needed.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 scroll-snap-type docs](https://tailwindcss.com/docs/scroll-snap-type) -- snap-x, snap-mandatory utilities verified
- [Tailwind CSS v4 scroll-snap-align docs](https://tailwindcss.com/docs/scroll-snap-align) -- snap-start, snap-center utilities verified
- [Tailwind CSS v4 scroll-snap-stop docs](https://tailwindcss.com/docs/scroll-snap-stop) -- snap-always, snap-normal utilities verified
- [MDN scroll-snap-type](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-snap-type) -- mandatory vs proximity behavior
- [Tailwind CSS height docs](https://tailwindcss.com/docs/height) -- h-dvh, min-h-dvh utilities confirmed available since v3.4
- arena.ai screenshots (5 screenshots in project root) -- layout reference verified visually
- Existing codebase (10 battle components, globals.css, battle-store.ts) -- read and analyzed directly

### Secondary (MEDIUM confidence)
- [DEV Community: IntersectionObserver + scroll-snap + React](https://dev.to/ruben_suet/my-experience-with-intersectionobserver-scroll-snap-and-react-252a) -- pattern for active slide detection
- [Safari position:fixed keyboard bug](https://medium.com/@im_rahul/safari-and-position-fixed-978122be5f29) -- sticky bottom recommendation
- [Embla Carousel](https://www.embla-carousel.com/) -- evaluated and rejected for this use case (2-card only)

### Tertiary (LOW confidence)
- None -- all findings verified against primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies needed, all Tailwind utilities verified in official docs
- Architecture: HIGH -- patterns verified against arena.ai screenshots and Tailwind/MDN documentation
- Pitfalls: HIGH -- iOS Safari keyboard issue well-documented; scroll-snap streaming instability is a known concern with documented mitigation
- Copywriting: HIGH -- D-06/D-11 decisions are explicit in CONTEXT.md; tone mapping is straightforward

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable CSS features, no fast-moving dependencies)
