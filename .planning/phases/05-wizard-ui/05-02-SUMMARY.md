---
phase: 05-wizard-ui
plan: 02
subsystem: ui
tags: [wizard, product-images, radio-cards, server-validation, ejs, express]

# Dependency graph
requires:
  - phase: 01-catalog-expansion
    provides: catalog with 9 categories, all entries with filePath field
  - phase: 05-wizard-ui
    plan: 01
    provides: wizard step controller, data-wizard-step attributes, WizardState persistence
provides:
  - "Product image thumbnails in all 10 catalog-based radio card sections (8 EJS + 2 JS-rendered)"
  - "radio-card--with-image CSS class and radio-card-image div pattern for image cards"
  - "Server-side required-field validation (16 fields) with German error messages on POST /submit"
affects: [05-wizard-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: ["radio-card--with-image conditional class pattern for image vs text-only cards", "filePath-based image rendering with graceful null/missing fallback", "Server-side required-field validation as security boundary (400 JSON response)"]

key-files:
  created: []
  modified:
    - views/index.ejs
    - public/js/script.js
    - src/routes/submit.js

key-decisions:
  - "Haustypen use filePath + '1.png' convention (directory-based filePath from catalog)"
  - "Cards without filePath render text-only with no radio-card--with-image class (graceful degradation)"
  - "Server-side validation returns 400 JSON (not redirect) -- wizard client-side validation is primary UX guard, server is security boundary"
  - "16 required fields validated server-side matching wizard client-side required fields"

patterns-established:
  - "Image card pattern: radio-card--with-image class + radio-card-image div with lazy-loaded img"
  - "filePath data in wallOptions/lueftungOptions JS arrays for dynamic card rendering"
  - "Required-field validation map: { field: germanMessage } iterated with for...of"

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 5 Plan 2: Product Image Cards and Server-Side Validation Summary

**Product image thumbnails in all 10 catalog radio card sections with server-side 16-field required validation returning German error messages**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-18T12:43:56Z
- **Completed:** 2026-02-18T12:47:55Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added product image thumbnails to all 8 EJS-rendered catalog sections (haustypen, innenwalls, decken, windows, daecher, tiles, treppen, heizung) with radio-card--with-image conditional class
- Added filePath data and image rendering to 2 dynamically-rendered JS sections (wallOptions in updateWallOptions, lueftungOptions in updateLueftungOptions)
- Added server-side required-field validation for 16 fields in POST /submit route, returning 400 JSON with German error messages before catalog validation
- Cards without filePath (e.g., "Keine Treppe", "Keine Luftungsanlage") render text-only gracefully without broken images

## Task Commits

Each task was committed atomically:

1. **Task 1: Add product images to all catalog radio cards** - `7091563` (feat)
2. **Task 2: Add server-side required-field validation** - `a46fa4a` (feat)

## Files Created/Modified
- `views/index.ejs` - Added radio-card--with-image class and radio-card-image div with product thumbnails to 8 catalog sections
- `public/js/script.js` - Added filePath to wallOptions and lueftungOptions data arrays; updated updateWallOptions() and updateLueftungOptions() template strings with image rendering
- `src/routes/submit.js` - Added required-field validation block (16 fields) before catalog validation with German error messages

## Decisions Made
- Haustypen use directory-based filePath + '1.png' convention (catalog stores directory path like "assets/variants/haustypen/bungalow/")
- Cards without filePath render as text-only (no radio-card--with-image class, no image div) -- avoids broken image icons
- Server-side validation returns 400 JSON rather than redirect -- the wizard's client-side validation prevents normal users from hitting this path; the server check is a security boundary for direct POST requests
- All 16 required fields match the wizard's client-side required fields for consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Product image thumbnails ready for CSS styling in Phase 5 Plan 3 (radio-card--with-image and radio-card-image classes need CSS rules)
- Server-side validation complete as security boundary
- All existing form functionality preserved (KfW filtering, wizard navigation, state persistence)

## Self-Check: PASSED

All files verified present. All commit hashes verified in git log.

---
*Phase: 05-wizard-ui*
*Completed: 2026-02-18*
