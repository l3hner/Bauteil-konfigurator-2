---
phase: 02-pdf-architektur
plan: 03
subsystem: pdf
tags: [sharp, image-compression, pdfkit, performance]

# Dependency graph
requires:
  - phase: 02-02
    provides: "Page modules (componentPage, haustypPage, titlePage) and pdfService orchestrator"
provides:
  - "imageService.js with sharp-based image compression pipeline"
  - "Format-aware compression: PNG for alpha, JPEG for photos"
  - "In-memory cache cleared per PDF generation"
  - "sharp as production dependency"
affects: [03-pdf-visual-quality, 04-deployment]

# Tech tracking
tech-stack:
  added: [sharp@^0.34.5]
  patterns: [async-image-compression, buffer-based-pdf-embedding, format-aware-optimization]

key-files:
  created:
    - src/services/imageService.js
  modified:
    - package.json
    - src/services/pdfService.js
    - src/services/pdf/pages/componentPage.js
    - src/services/pdf/pages/haustypPage.js
    - src/services/pdf/pages/titlePage.js

key-decisions:
  - "sharp in production dependencies (not devDependencies) since PDF generation runs in production"
  - "maxWidth=800 default (4x oversampling for PDF at 72 DPI) balances quality with file size"
  - "JPEG quality 75 with mozjpeg for photos, PNG compressionLevel 8 for transparent images"
  - "Skip images < 10 KB (placeholders) to avoid unnecessary processing"
  - "Error fallback reads raw file rather than breaking PDF generation"
  - "Logo uses maxWidth=500 for higher quality branding"

patterns-established:
  - "ctx.imageService pattern: compression service passed through render context"
  - "Async render functions: all page modules using images must be async"
  - "Buffer-based PDF embedding: doc.image(buffer, ...) instead of doc.image(filePath, ...)"

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 2 Plan 3: Image Compression Pipeline Summary

**Sharp-based image compression service reducing PDF sizes by ~90%+ via format-aware resize, JPEG/PNG optimization, and in-memory caching**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T08:45:17Z
- **Completed:** 2026-02-18T08:48:32Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created imageService.js with getCompressedImage (resize + format-aware compress + cache) and clearCache
- Moved sharp from devDependencies to production dependencies
- Wired image compression into componentPage, haustypPage, and titlePage via ctx.imageService
- Technical drawings compress from 942 KB to 11 KB (99% reduction)
- Cache cleared after each PDF generation to prevent memory accumulation

## Task Commits

Each task was committed atomically:

1. **Task 1: Move sharp to production dependency and create imageService.js** - `8cacb06` (feat)
2. **Task 2: Wire imageService into page modules and orchestrator** - `03ea8dd` (feat)

## Files Created/Modified
- `src/services/imageService.js` - Image compression pipeline with sharp (getCompressedImage, clearCache)
- `package.json` - sharp moved from devDependencies to dependencies
- `src/services/pdfService.js` - Import imageService, add to ctx, clearCache after doc.end()
- `src/services/pdf/pages/componentPage.js` - Async renderComponent with compressed image buffers
- `src/services/pdf/pages/haustypPage.js` - Async renderHaustyp with compressed image buffers
- `src/services/pdf/pages/titlePage.js` - Async render with compressed logo (maxWidth=500)

## Decisions Made
- sharp in production dependencies since it is needed at runtime for PDF generation
- maxWidth=800 default provides 4x oversampling for PDF images at 72 DPI -- good quality without bloat
- JPEG quality 75 with mozjpeg for opaque photos, PNG compressionLevel 8 for images with alpha channels
- Images under 10 KB (generated placeholders) skip sharp processing entirely
- Error fallback reads raw file to prevent PDF generation from failing on a single bad image
- Logo gets maxWidth=500 for higher quality branding on the title page

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 2 (PDF Architektur) is now complete: layout.js (02-01), page modules + orchestrator (02-02), image compression (02-03)
- PDF generation produces compressed images via sharp pipeline
- Ready for Phase 3 (PDF Visual Quality) to build on this architecture
- Memory concern for Render.com still relevant -- sharp uses native binaries but image cache is cleared per generation

---
*Phase: 02-pdf-architektur*
*Completed: 2026-02-18*
