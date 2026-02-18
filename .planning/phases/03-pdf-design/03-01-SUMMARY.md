---
phase: 03-pdf-design
plan: 01
subsystem: pdf
tags: [pdfkit, montserrat, typography, hero-image, corporate-branding, gradient]

# Dependency graph
requires:
  - phase: 02-pdf-architektur
    provides: "Page module system, image compression service, layout.js design constants"
provides:
  - "Navy (#003366) / Red (#C8102E) corporate color palette in layout.js"
  - "Montserrat font files (Bold + SemiBold) in assets/fonts/"
  - "Font registration with Helvetica fallback in pdfService.js"
  - "Hero image title page with gradient overlay and personalized customer name"
affects: [03-pdf-design, 04-web-redesign]

# Tech tracking
tech-stack:
  added: [Montserrat-Bold.ttf, Montserrat-SemiBold.ttf]
  patterns: [hero-image-with-gradient, font-registration-with-fallback, full-bleed-clip-pattern]

key-files:
  created:
    - assets/fonts/Montserrat-Bold.ttf
    - assets/fonts/Montserrat-SemiBold.ttf
    - scripts/download-fonts.js
  modified:
    - src/services/pdf/layout.js
    - src/services/pdfService.js
    - src/services/pdf/pages/titlePage.js

key-decisions:
  - "Montserrat as heading font with Helvetica-Bold fallback via try/catch"
  - "Hero image uses selected haustyp 1.png with stadtvilla as fallback, solid navy as last resort"
  - "Typography references use registered name 'Heading' not file path — enables graceful degradation"
  - "drawHeader uses typography.h1.font reference — all page headers now use Montserrat automatically"

patterns-established:
  - "Font registration pattern: try/catch with registerFont('Heading', ...) fallback to Helvetica-Bold"
  - "Hero image with clip: doc.save() -> rect.clip() -> doc.image(cover) -> doc.restore()"
  - "Gradient overlay: linearGradient with 3 stops (transparent -> semi -> opaque)"

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 3 Plan 1: Corporate Branding & Hero Title Page Summary

**Navy/red corporate palette, Montserrat headings, and hero-image title page with gradient overlay and personalized customer name**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T10:15:12Z
- **Completed:** 2026-02-18T10:19:12Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Updated entire PDF color palette from green (#06402b) to navy (#003366) / red (#C8102E) corporate colors
- Added Montserrat font files and registered them in PDF generation with graceful Helvetica fallback
- Rewrote title page as an emotional hero-image cover with full-bleed haustyp photo, gradient overlay, personalized customer name, and gold accents
- All 13+ existing page modules automatically inherit the new navy/red palette via layout.colors references

## Task Commits

Each task was committed atomically:

1. **Task 1: Update color palette, typography, and download Montserrat font** - `aa918a6` (feat)
2. **Task 2: Register fonts in pdfService and rewrite title page with hero image** - `5860bfc` (feat)

## Files Created/Modified
- `assets/fonts/Montserrat-Bold.ttf` - Custom heading font (Bold weight)
- `assets/fonts/Montserrat-SemiBold.ttf` - Custom heading font (SemiBold weight)
- `scripts/download-fonts.js` - Utility to download Montserrat fonts from GitHub
- `src/services/pdf/layout.js` - Updated colors (navy/red), typography (Heading font refs), drawHeader (uses typography.h1.font)
- `src/services/pdfService.js` - Font registration with try/catch Helvetica fallback after PDFDocument creation
- `src/services/pdf/pages/titlePage.js` - Complete rewrite: hero image with gradient overlay, customer name, gold accents

## Decisions Made
- Montserrat as heading font with Helvetica-Bold fallback via try/catch — premium feel without hard dependency
- Hero image uses selected haustyp 1.png with fallback chain: stadtvilla -> first available -> solid navy background
- Typography references use registered name 'Heading' — enables graceful degradation if font files missing
- drawHeader uses typography.h1.font reference instead of hardcoded 'Helvetica-Bold' — all page headers get Montserrat automatically
- drawFooter and drawImagePlaceholder keep Helvetica intentionally — body text stays built-in for reliability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both tasks completed without issues. Test PDF generated successfully with hero image compression (1298 KB -> 90 KB), logo loading, and all existing pages rendering correctly with the new palette.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Corporate color palette cascades through all existing pages automatically
- Montserrat headings render in page headers via drawHeader
- Ready for 03-02 (component page redesign) — new colors and fonts are the foundation
- All subsequent PDF plans will inherit the navy/red palette and Montserrat typography

## Self-Check: PASSED

- All 7 files verified present on disk
- Commit aa918a6 verified in git log (Task 1)
- Commit 5860bfc verified in git log (Task 2)
- Test PDF generated successfully without errors

---
*Phase: 03-pdf-design*
*Completed: 2026-02-18*
