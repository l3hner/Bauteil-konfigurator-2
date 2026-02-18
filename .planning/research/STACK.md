# Technology Stack

**Project:** Lehner Haus Konfigurator — PDF + Wizard Upgrade
**Researched:** 2026-02-17
**Milestone context:** Subsequent milestone — adding marketing-grade PDF and true step-by-step wizard to existing Node.js/Express/EJS/PDFKit app

---

## Context: What Already Exists

The existing stack is non-negotiable per project constraints:

| Layer | Current | Version | Status |
|-------|---------|---------|--------|
| Runtime | Node.js | >=18 (dev: 22.16.0) | Keep |
| Server | Express.js | ^4.18.2 | Keep |
| Templates | EJS | ^3.1.9 | Keep |
| PDF | PDFKit | ^0.14.0 | Keep, extend |
| Frontend | Vanilla JS + CSS | — | Keep, no build step |
| QR codes | qrcode | ^1.5.4 | Keep |
| Images | sharp | ^0.34.5 (devDep) | Promote to prod dep |

This research focuses exclusively on **what to add** to achieve marketing-grade PDF output and a true tablet-optimized step-by-step wizard within these constraints.

---

## Recommended Additions

### PDF Quality: Custom Fonts

**Problem:** All PDF text uses Helvetica (built-in PDF font). This produces a generic, non-branded appearance. Marketing-grade PDFs use custom typefaces that match the brand.

**Recommendation:** Add custom TTF/OTF fonts via PDFKit's `doc.registerFont()` API.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom TTF files | N/A (assets) | Branded typography in PDFs | PDFKit 0.14.0 fully supports `.ttf` and `.otf` registration via `doc.registerFont('Name', '/path/to/font.ttf')`. No additional npm package needed. Built-in fonts (Helvetica, Times, Courier) look generic; custom fonts immediately lift perceived quality to brochure level. |
| Google Fonts (Inter, Lato, or Montserrat) | Latest | Free OFL-licensed sans-serif | These are clean, readable, free to use commercially. Download the TTF files and store in `assets/fonts/`. Montserrat is a strong match for modern German architectural branding. Confirm Lehner Haus corporate font with client — if they have a brand font, use that instead. |

**Confidence:** HIGH — PDFKit `registerFont()` is well-documented and stable in 0.14.x.

**How to use:**
```javascript
// In PdfService constructor or once at startup
doc.registerFont('Montserrat', path.join(__dirname, '../../assets/fonts/Montserrat-Regular.ttf'));
doc.registerFont('Montserrat-Bold', path.join(__dirname, '../../assets/fonts/Montserrat-Bold.ttf'));

// Then use by name:
doc.font('Montserrat-Bold').fontSize(20).text('Ihr Traumhaus');
```

**Note on font embedding:** PDFKit embeds the full font subset into the PDF. File size impact is ~50-150 KB per font family (acceptable).

---

### PDF Quality: Image Compression Pipeline

**Problem:** PDFs are 23-24MB because product images are embedded uncompressed. This exceeds practical email limits and slows browser rendering.

**Recommendation:** Move `sharp` from devDependency to production dependency and run it as a preprocessing step before embedding images into PDFs.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| sharp | ^0.34.5 | Resize + compress images before PDF embedding | Already present as devDep. Produces WebP/JPEG at specified quality. A 5MB PNG product photo can become a 200KB JPEG at quality 85 with no visible loss at print resolution. PDFKit accepts `Buffer` from sharp directly. |

**Confidence:** HIGH — sharp is the Node.js standard for image processing. Already in the project. Just needs to move to dependencies and be called inside `pdfService.js` before `doc.image()`.

**Pattern:**
```javascript
const sharp = require('sharp');

// Before embedding in PDF:
async function prepareImageForPdf(imagePath, targetWidthPx) {
  try {
    const buffer = await sharp(imagePath)
      .resize(targetWidthPx, null, { withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
    return buffer; // pass directly to doc.image(buffer, x, y, opts)
  } catch {
    return null; // fall back to placeholder
  }
}
```

**Target:** PDFs under 5MB. At quality 85 JPEG, 400px-wide product images run ~30-80 KB each.

---

### PDF Quality: Absolute Layout Refactor (No New Libraries)

**Problem:** The current pdfService.js is 1,672 lines of absolute-coordinate drawing on a single god-object. Adding new pages or modifying existing ones risks overlapping content (fragile area documented in CONCERNS.md).

**Recommendation:** No new library. Use a page-module pattern within PDFKit.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native Node.js modules | — | Split pdfService.js into per-page modules | Extracting each draw method into `src/services/pdf/pages/titlePage.js`, `overviewPage.js`, etc. costs zero dependencies. Each module receives `(doc, data, layout, colors, typography)` and is responsible for one page. The orchestrator becomes 30 lines. |

**Confidence:** HIGH — this is pure refactoring, no ecosystem dependency.

---

### PDF Quality: Background Images / Bleeds

**Problem:** Marketing brochures use full-page background images. PDFKit supports this natively but the current code only draws colored rectangles.

**Recommendation:** No new library needed. Use `doc.image(bgPath, 0, 0, { width: 595, height: 842 })` at the start of page drawing for pages where emotional imagery is needed (title page, house type page). Source: PDFKit image API, which is part of 0.14.x.

**Confidence:** HIGH — PDFKit image sizing with `{ width, height }` crops/fills the full page.

---

### Wizard UI: True One-Step-at-a-Time Navigation

**Problem:** The current "wizard" shows all 14 sections on one scrolling page. A Fachberater at a customer meeting needs clean, focused screens — one decision per screen, large tap targets, no scrolling.

**Recommendation:** Implement true single-step display in vanilla JS + CSS. No framework needed.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vanilla JS (ES2020+) | — | Step visibility controller | Adding `data-step` attributes and a central `showStep(n)` function in `public/js/script.js`. CSS `display: none` / `display: block` on `.form-section`. The existing progress bar markup is already correct. This is ~50 lines of JS. |
| CSS transitions | — | Slide-in animation between steps | `transform: translateX()` + `transition: transform 0.3s ease` on `.form-section`. Feels modern, works on tablets. No library. |

**Confidence:** HIGH — this is a CSS/JS pattern. No external library needed or appropriate given no-build-step constraint.

**What NOT to use:**
- Alpine.js — adds 15KB and a new mental model for a task solvable in 50 lines of vanilla JS
- HTMX — wrong tool; wizard state is client-side, not server-driven
- Any React/Vue wizard library — violates the no-build-step constraint

---

### Wizard UI: Tablet Touch Optimization

**Problem:** Current form uses standard browser inputs. Tablets need large tap targets, swipe navigation, and landscape-friendly layouts.

**Recommendation:** Pure CSS and minor JS enhancements.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CSS touch-action | — | Swipe gesture for step navigation | `touch-action: pan-y` on non-swipeable areas; detect `touchstart`/`touchend` delta to advance/retreat steps on horizontal swipe. ~30 lines of JS. |
| CSS media queries | — | Tablet layout breakpoints | Already exists in `style.css`. Extend with `@media (min-width: 768px) and (max-width: 1200px)` for tablet-specific card sizes and font scaling. |
| min-height: 44px on all inputs | — | Apple HIG tap target guideline | Ensures all radio options, buttons, and inputs are finger-friendly. Apply globally in CSS, no library. |

**Confidence:** HIGH — native browser APIs, no dependencies.

---

### Form: Client-Side Step Validation

**Problem:** Currently validation fires on submit. A wizard needs per-step validation ("can I proceed to step 2?") to prevent confusion.

**Recommendation:** Extend existing `updateProgress()` JS function. No library.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native HTML5 Constraint Validation API | — | Per-step field validation | `formElement.checkValidity()` scoped to the current step's inputs. If invalid, call `reportValidity()` to show native browser error bubbles. Already works in all modern browsers. No library needed. |

**Confidence:** HIGH — Constraint Validation API is baseline in all modern browsers including iOS Safari.

**Pattern:**
```javascript
function canAdvanceFromStep(stepNumber) {
  const section = document.getElementById(`section-${stepNumber}`);
  const inputs = section.querySelectorAll('input, select, textarea');
  return [...inputs].every(input => input.checkValidity());
}
```

---

### Infrastructure: express-rate-limit

**Problem:** CONCERNS.md documents no rate limiting on `/submit`. PDF generation is CPU/memory/disk intensive. An internal Fachberater tool with no rate limiting is one bot away from filling the disk.

**Recommendation:** Add express-rate-limit.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| express-rate-limit | ^7.x | Rate limiting on `/submit` | Minimal dependency, widely used, zero config for basic usage. Prevents abuse of the PDF generation endpoint. |

**Confidence:** HIGH — express-rate-limit is the de facto standard for Express rate limiting. Version 7.x is the current major.

**Usage:**
```javascript
const rateLimit = require('express-rate-limit');
const submitLimiter = rateLimit({ windowMs: 60_000, max: 10 });
router.post('/', submitLimiter, async (req, res) => { ... });
```

---

### Infrastructure: Nodemon (dev only)

**Problem:** No watch/hot-reload. Manual server restarts during development. This slows the PDF iteration cycle significantly when adjusting layout coordinates.

**Recommendation:** Add nodemon as a devDependency.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| nodemon | ^3.x | Auto-restart on file change during development | Standard Node.js dev tool. Zero config. Add `"dev": "nodemon src/server.js"` to package.json scripts. Does not affect production — Render uses `npm start`. |

**Confidence:** HIGH — nodemon is universal in Node.js development.

---

## Alternatives Considered and Rejected

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| PDF engine | PDFKit (keep) | Puppeteer/html2pdf | Violates tech stack constraint. Also adds Chrome binary dependency, makes Render deployment heavier. PDFKit gives full pixel-level control needed for brochure layouts. |
| PDF engine | PDFKit (keep) | PDFMake | Different API, would require full rewrite of 1,672-line service. No benefit that justifies rewrite risk. |
| Custom fonts | TTF files via `registerFont()` | Embedded base64 in JS | TTF files on disk are simpler to swap, lint, and update. Base64 in JS makes font updates painful. |
| Image compression | sharp | jimp | sharp is already present, is 10x faster, and produces smaller output. jimp is slower and produces larger files. |
| Wizard UI | Vanilla JS | Alpine.js | Alpine.js solves a state management problem the existing vanilla JS already handles adequately. Adding a reactive framework for 50 lines of state logic is over-engineering given no-build-step constraint. |
| Wizard UI | Vanilla JS | HTMX | HTMX is designed for server-driven partial page updates. The wizard state (which step is active) is purely client-side. HTMX would add unnecessary round-trips. |
| Rate limiting | express-rate-limit | Custom middleware | express-rate-limit is tested, maintained, and has zero config for basic use cases. Custom middleware provides no advantage. |

---

## Final Package Changes

```bash
# Move from devDependency to dependency:
npm install sharp

# New production dependencies:
npm install express-rate-limit

# New dev dependencies:
npm install -D nodemon

# Remove unused dependencies:
npm uninstall heic-convert open body-parser

# Add back Express built-ins replace body-parser (Express 4.16+ has these built-in):
# In server.js: replace bodyParser.urlencoded/json with express.urlencoded/json
```

**Font files (not npm — download manually):**
```
assets/fonts/
  Montserrat-Regular.ttf    (or confirmed brand font)
  Montserrat-Bold.ttf
  Montserrat-Italic.ttf
```

---

## Version Verification Notes

| Package | Claimed Version | Verification Method | Confidence |
|---------|----------------|---------------------|------------|
| pdfkit ^0.14.0 | 0.14.x | package.json (source of truth) | HIGH |
| sharp ^0.34.5 | 0.34.x | package.json (source of truth) | HIGH |
| express-rate-limit ^7.x | 7.x | Training data (last verified Jan 2025) — confirm with `npm info express-rate-limit version` before installing | MEDIUM |
| nodemon ^3.x | 3.x | Training data (last verified Jan 2025) — confirm with `npm info nodemon version` | MEDIUM |
| PDFKit `registerFont()` API | — | PDFKit docs as of 0.14.x | HIGH — this API has been stable since 0.8.x |
| sharp `.jpeg({ quality })` API | — | sharp API as of 0.34.x | HIGH — stable core API |
| HTML5 Constraint Validation API | — | Baseline browser API | HIGH — available in all browsers since 2015 |

---

## Sources

- Existing codebase: `package.json`, `src/services/pdfService.js`, `.planning/codebase/CONCERNS.md`
- PDFKit font API: https://pdfkit.org/docs/text.html (training data, MEDIUM confidence on current URL)
- sharp documentation: https://sharp.pixelplumbing.com/ (training data, MEDIUM confidence — verify current API)
- express-rate-limit: https://github.com/express-rate-limit/express-rate-limit (training data, MEDIUM confidence — verify v7.x is current)
- HTML5 Constraint Validation API: https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation (HIGH confidence — stable baseline)

**Note:** External tool access was unavailable during this research session. All external package versions should be verified via `npm info <package> version` before installation. Core PDFKit capability claims are HIGH confidence based on the existing working codebase.
