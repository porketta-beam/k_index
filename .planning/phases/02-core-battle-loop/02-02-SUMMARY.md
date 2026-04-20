---
phase: 02-core-battle-loop
plan: 02
subsystem: ui
tags: [shadcn, tailwind-v4, zustand, sonner, pretendard, korean-typography, oklch, css-variables]

# Dependency graph
requires:
  - phase: 01-foundation-ai-integration
    provides: Next.js 16 project with Tailwind v4, Geist fonts, AI SDK providers
provides:
  - shadcn/ui initialized with 6 components (button, card, textarea, badge, separator, skeleton)
  - CSS design system with UI-SPEC colors (primary blue-600, success green-600, reveal-a violet-600, reveal-b cyan-600)
  - Pretendard Variable Korean font loaded via CDN
  - Sonner Toaster mounted in root layout
  - Korean typography with word-break keep-all
  - Zustand 5.x and sonner available as dependencies
affects: [02-03, 02-04, all-future-ui-plans]

# Tech tracking
tech-stack:
  added: [zustand@5.x, sonner@2.x, shadcn/ui@4.x, class-variance-authority, clsx, tailwind-merge, tw-animate-css, lucide-react, @base-ui/react]
  patterns: [oklch-color-variables, pretendard-font-stack, korean-word-break-keep-all, shadcn-base-nova-style]

key-files:
  created:
    - src/components/ui/badge.tsx
    - src/components/ui/card.tsx
    - src/components/ui/textarea.tsx
    - src/components/ui/separator.tsx
    - src/components/ui/skeleton.tsx
  modified:
    - src/app/layout.tsx
    - src/app/globals.css

key-decisions:
  - "Used oklch color format (shadcn v4 default) instead of HSL for CSS variables -- adapted UI-SPEC hex colors to oklch equivalents"
  - "Set --primary to blue-600 (oklch 0.546 0.245 262.881) as UI-SPEC accent color, replacing shadcn neutral default"
  - "Set --ring to match --primary for consistent focus indicators"

patterns-established:
  - "oklch color variables: all custom colors use oklch format matching shadcn v4 convention"
  - "Font stack: Pretendard Variable > Geist Sans > system-ui > sans-serif for Korean-first rendering"
  - "Korean typography: word-break keep-all applied globally to prevent mid-syllable line breaks"
  - "Custom CSS variables: --success, --reveal-a, --reveal-b follow shadcn naming pattern with -foreground variants"

requirements-completed: [BATTLE-01]

# Metrics
duration: 5min
completed: 2026-04-09
---

# Phase 02 Plan 02: UI Foundation Summary

**shadcn/ui with 6 components, Pretendard Korean font, and oklch design system variables matching UI-SPEC color palette**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-09T03:14:20Z
- **Completed:** 2026-04-09T03:19:50Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- All 6 shadcn/ui components (button, card, textarea, badge, separator, skeleton) available for import by Plans 03 and 04
- Complete CSS design system with UI-SPEC custom colors: --success (green-600), --reveal-a (violet-600), --reveal-b (cyan-600) with foreground variants
- Pretendard Variable Korean font loading via jsdelivr CDN with Geist Sans fallback
- Sonner Toaster mounted at bottom-center of root layout for toast notifications
- Korean metadata title set ("K-Index | AI 블라인드 배틀")
- Global word-break: keep-all for proper Korean text rendering
- --primary updated from neutral to blue-600 for UI-SPEC accent color

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, initialize shadcn/ui, add required components** - `2910479` (feat)
2. **Task 2: Configure Pretendard font, CSS variables, and Korean typography** - `e88ce36` (feat)

## Files Created/Modified
- `src/components/ui/badge.tsx` - shadcn Badge component for model labels
- `src/components/ui/card.tsx` - shadcn Card component for response containers
- `src/components/ui/textarea.tsx` - shadcn Textarea component for question input
- `src/components/ui/separator.tsx` - shadcn Separator for visual dividers
- `src/components/ui/skeleton.tsx` - shadcn Skeleton for streaming placeholder
- `src/app/layout.tsx` - Added Pretendard CDN link, Toaster, Korean metadata
- `src/app/globals.css` - Full CSS design system with oklch variables and Korean typography

## Decisions Made
- **oklch over HSL:** shadcn v4 generates oklch color format by default. Adapted all UI-SPEC hex colors (#2563eb, #16a34a, #7c3aed, #0891b2) to oklch equivalents rather than forcing HSL, maintaining consistency with the shadcn ecosystem.
- **--primary = blue-600:** Overrode shadcn's neutral default primary with blue-600 (oklch 0.546 0.245 262.881) to match UI-SPEC accent color specification. Also updated --ring to match for consistent focus indicators.
- **base-nova style:** shadcn v4 initialized with "base-nova" style (its current default), which uses @base-ui/react primitives. This is compatible with all required components.
- **Dark mode custom colors:** Added slightly lighter variants of custom colors for dark mode readability, even though Phase 02 is light-mode only per UI-SPEC.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted color format from HSL to oklch**
- **Found during:** Task 2 (CSS variables configuration)
- **Issue:** Plan specified HSL values for CSS variables, but shadcn v4 generates oklch format. Mixing formats would break the design system.
- **Fix:** Converted all UI-SPEC hex colors to oklch equivalents. The plan explicitly noted this possibility: "If shadcn uses a different CSS variable format (e.g., oklch instead of HSL), adapt the values to match the format."
- **Files modified:** src/app/globals.css
- **Verification:** npm run build passes, all color variables resolve correctly
- **Committed in:** e88ce36 (Task 2 commit)

**2. [Rule 3 - Blocking] shadcn v4 uses base-nova style instead of default**
- **Found during:** Task 1 (shadcn init)
- **Issue:** Plan referenced `"style": "default"` but shadcn v4 defaults to "base-nova" with @base-ui/react primitives. Components use different base but same API surface.
- **Fix:** Accepted shadcn's default style. All 6 components generated correctly and TypeScript compiles.
- **Files modified:** components.json (auto-generated by shadcn)
- **Verification:** npx tsc --noEmit passes, all components importable
- **Committed in:** 2910479 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking - format adaptation)
**Impact on plan:** Both auto-fixes necessary to work with shadcn v4 current defaults. No scope creep. Functional outcome matches plan intent.

## Issues Encountered
- shadcn/ui button.tsx, utils.ts, components.json, and package.json with zustand/sonner were already committed in HEAD from Phase 01. Only the 5 additional components (card, textarea, badge, separator, skeleton) were new. This was discovered during Task 1 and is not a problem -- the existing foundation was reused correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 6 shadcn components ready for BattleInput, ResponseCard, VotePanel, RevealPanel in Plans 03 and 04
- Zustand available for battle state store implementation
- Sonner Toaster mounted for vote confirmation toasts
- CSS design system complete with all UI-SPEC colors for battle flow states (streaming, voting, reveal)
- Pretendard font loading for Korean text rendering in all UI components

## Self-Check: PASSED

All 10 files verified present on disk. Both task commits (2910479, e88ce36) found in git log. SUMMARY.md exists.

---
*Phase: 02-core-battle-loop*
*Completed: 2026-04-09*
