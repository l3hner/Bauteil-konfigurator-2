# Phase 4: PDF Inhalte und Bugs - Research

**Researched:** 2026-02-18
**Domain:** PDFKit page module bugs, catalog marketing content, image compression
**Confidence:** HIGH

## Summary

Phase 4 addresses three distinct problem areas in the PDF generation pipeline: (1) a missing Eigenleistungen page module, (2) potential Raumplanung rendering issues, and (3) the need for emotionally compelling marketing text in the catalog data plus file size reduction to under 5 MB.

The Eigenleistungen page module does NOT exist at all -- it was never created during the Phase 2/3 refactoring. The page list in `src/services/pdf/pages/index.js` has no reference to an eigenleistungen module, and no file exists for it. This is a creation task, not a bug fix. The data pipeline works correctly: form data is parsed by `submissionService.parseEigenleistungen()`, stored as a string array in `submission.eigenleistungen`, and persisted to JSON. What is missing is the PDF page module that renders this data.

The Raumplanung page module (`floorPlan.js`) exists and appears functionally correct based on code review. It handles all three floors (Erdgeschoss, Obergeschoss, Untergeschoss), filters empty floors, and renders room name + details. The condition function correctly checks for non-empty room arrays. Testing with actual room data is needed to confirm whether there are subtle rendering bugs (e.g., page overflow with many rooms, y-position exceeding page bounds).

For marketing content (INH-03), the catalog already has `description`, `advantages`, `comparisonNotes`, and `premiumFeatures` fields. However, the roadmap calls for an `emotionalHook` field -- a short, emotionally compelling headline for each catalog entry that replaces the current technical `description` as the primary copy on component pages. This needs to be added to all catalog entries across all 9 categories (walls, innerwalls, windows, tiles, haustypen, heizung, lueftung, daecher, treppen, decken -- actually 10 categories in the catalog).

For file size (INH-04), the most recent PDF is 5.8 MB (with sharp compression active). The original was 23+ MB. The image compression service is already in place (Phase 2 work), but the current settings (maxWidth=800, JPEG q75) are not aggressive enough for the 5 MB target. The biggest offenders are images with alpha channels that stay as PNG (the `vollholzdecke-technical.png` at 2.8 MB has alpha), and the haustypen directory images (up to 5.5 MB raw). Reducing maxWidth and/or flattening alpha channels to enable JPEG conversion will close the gap.

**Primary recommendation:** Create the Eigenleistungen page module following the exact same pattern as floorPlan.js, verify Raumplanung with real data, add emotionalHook to catalog.json, and tune image compression (flatten alpha + reduce maxWidth to 600-700) to hit the 5 MB target.

## Standard Stack

### Core (already in place)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdfkit | ^0.14.0 | PDF generation | Already the project's PDF engine |
| sharp | ^0.34.5 | Image compression for PDF | Already in production deps (Phase 2) |

### Supporting (already in place)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| qrcode | ^1.5.4 | QR codes in PDF | Already used in contactPage.js |

### No New Dependencies Needed
This phase requires zero new npm packages. All work is within existing modules and data files.

## Architecture Patterns

### Page Module Contract (from Phase 2 decision 02-02)

Every PDF page module follows this contract:

```javascript
// Standard page module pattern
module.exports = {
  title: 'Page Title',           // Shown in header
  condition(submission) {         // Return true if page should render
    return /* boolean */;
  },
  render(doc, submission, ctx) {  // Render page content
    // doc = PDFDocument instance
    // submission = full submission data
    // ctx = { pageNum, catalogService, imageService }
  }
};
```

### Page List Registration (in pages/index.js)

Pages are registered in `buildPageList()`. Static pages are added directly. Dynamic component pages are generated from catalog lookups. The eigenleistungen page should be added as a static post-component page, similar to `floorPlan`:

```javascript
// Current post-component page order:
pages.push(floorPlan);
pages.push(comparisonChecklist);
// NEW: eigenleistungen goes here (after floorPlan, before comparisonChecklist)
pages.push(glossary);
pages.push(beraterPage);
pages.push(contactPage);
```

### Catalog Data Structure

Each catalog entry in `data/catalog.json` has these content fields:

```json
{
  "id": "unique-id",
  "name": "Display Name",
  "description": "Technical description (currently used as subtitle)",
  "premiumFeatures": ["Feature 1", "Feature 2"],
  "advantages": ["Advantage 1", "Advantage 2"],
  "comparisonNotes": "Multi-line comparison tips for customers",
  "emotionalHook": "NEW FIELD: Short emotional headline for PDF brochure"
}
```

The `emotionalHook` field needs to be added to every catalog entry. It should be 1-2 sentences max, written in sales-oriented German, evoking emotion rather than listing specs.

### Image Compression Pipeline (from Phase 2 decision 02-03)

```
Image file on disk
  → imageService.getCompressedImage(path, maxWidth=800)
    → Skip if < 10 KB (placeholders)
    → Check metadata.hasAlpha
      → Alpha: keep as PNG, compressionLevel 8
      → No alpha: convert to JPEG, quality 75, mozjpeg
    → Resize to maxWidth (fit inside, no enlargement)
    → Cache in Map (cleared per PDF generation)
  → Buffer returned to page module
  → doc.image(buffer, ...) embeds in PDF
```

### Layout System

The layout module (`src/services/pdf/layout.js`) provides:
- Color palette: `colors.primary` (#003366), `colors.gold` (#D4AF37), etc.
- Typography constants: `typography.h1`, `typography.body`, etc.
- Layout constants: `layout.marginLeft` (60), `layout.contentWidth` (475)
- Helper functions: `drawHeader()`, `drawFooter()`, `drawImagePlaceholder()`
- Content extractors: `extractAufbauItems()`, `extractQualityItems()`

### Anti-Patterns to Avoid
- **Hardcoding German text in page modules:** All marketing copy belongs in `catalog.json` or `data/pdf-content.json`, not in the JS rendering code. (Some existing pages violate this -- serviceContent.js, qualityAdvantages.js, etc. -- but new work should follow the data-driven pattern.)
- **Not checking y-position before rendering:** PDFKit does not auto-paginate. Every render function must check `y < threshold` before adding content to prevent overflow off the page.
- **Embedding raw images without compression:** Always use `ctx.imageService.getCompressedImage()`, never `doc.image(rawPath)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Custom sharp pipeline | Existing `imageService.getCompressedImage()` | Already handles caching, alpha detection, fallback |
| Page registration | Manual page list management | `buildPageList()` in `pages/index.js` | Consistent conditional rendering, page numbering |
| Layout helpers | Custom rect/text positioning | `layout.drawHeader()`, `layout.drawFooter()`, layout constants | Consistent brand appearance |
| Catalog lookups | Direct JSON file reads | `ctx.catalogService.getVariantById()` | Centralized, cached, validated |

## Common Pitfalls

### Pitfall 1: Eigenleistungen Module Not Found in Page List
**What goes wrong:** The eigenleistungen page module is created but never registered in `buildPageList()`.
**Why it happens:** Developer creates the file but forgets to `require()` it and `push()` it into the pages array.
**How to avoid:** After creating the module file, immediately add it to `pages/index.js` with both `require` and `pages.push()`.
**Warning signs:** PDF generates without errors but eigenleistungen page never appears.

### Pitfall 2: Empty Eigenleistungen Array vs Missing Field
**What goes wrong:** Condition function checks `submission.eigenleistungen` (truthy) but an empty array `[]` is truthy.
**Why it happens:** Every submission has `eigenleistungen: []` even when no eigenleistungen were entered.
**How to avoid:** Condition must be `submission.eigenleistungen && submission.eigenleistungen.length > 0`.
**Warning signs:** Empty eigenleistungen page appears in every PDF.

### Pitfall 3: Y-Position Overflow on Raumplanung/Eigenleistungen
**What goes wrong:** With many rooms or eigenleistungen items, content overflows past the page boundary (y > 780).
**Why it happens:** The current floorPlan.js has no page-overflow check. It adds 18px per room plus floor headers. With 3 floors x 8 rooms = 24 items, total height would be ~24*18 + 3*65 = 627px, which fits. But edge cases with long detail text could overflow.
**How to avoid:** Add a y-position check before each item. If approaching page bottom (~750), either truncate or add a continuation note.
**Warning signs:** Text disappearing or overlapping the footer on pages with many items.

### Pitfall 4: Alpha Channel Images Bloating PDF Size
**What goes wrong:** Images with transparency (alpha channel) remain as PNG, which is 3-10x larger than JPEG for photographic content.
**Why it happens:** The imageService correctly preserves alpha for true transparency needs, but many images have an alpha channel they don't actually need (e.g., technical drawings with opaque white backgrounds that happen to be saved as 32-bit PNG).
**How to avoid:** Use `sharp().flatten({ background: '#ffffff' })` before JPEG conversion to strip unnecessary alpha. This converts transparent pixels to white background and enables JPEG compression.
**Warning signs:** Compressed PNG files that are still hundreds of KB despite being photographic content.

### Pitfall 5: emotionalHook Field Missing in Component Renderer
**What goes wrong:** The `emotionalHook` field is added to catalog.json but the `componentPage.js` renderer still uses `component.description` for the subtitle.
**Why it happens:** Catalog update and renderer update are done separately.
**How to avoid:** When adding emotionalHook to catalog, simultaneously update componentPage.js to prefer `component.emotionalHook || component.description`.
**Warning signs:** Component pages still show technical descriptions despite catalog update.

### Pitfall 6: Inconsistent Category Count
**What goes wrong:** Research/roadmap says "9 categories" but catalog.json actually has 10 categories (walls, innerwalls, windows, tiles, haustypen, heizung, lueftung, daecher, treppen, decken).
**Why it happens:** The original catalog had 7 categories; Phase 1 added 3 more (daecher, treppen, decken). Some planning docs still reference "7" or "9".
**How to avoid:** When adding emotionalHook, iterate ALL keys of catalog.json programmatically, don't rely on hardcoded category lists.
**Warning signs:** Missing marketing text for some categories.

## Code Examples

### Example 1: Eigenleistungen Page Module (to be created)

Based on the floorPlan.js pattern and submission data structure:

```javascript
// src/services/pdf/pages/eigenleistungen.js
const layout = require('../layout');

module.exports = {
  title: 'Ihre geplanten Eigenleistungen',

  condition(submission) {
    return submission.eigenleistungen && submission.eigenleistungen.length > 0;
  },

  render(doc, submission, ctx) {
    let y = 100;
    const marginLeft = 60;
    const contentWidth = 475;

    // Intro text
    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
    doc.text(
      'Folgende Arbeiten moechten Sie in Eigenleistung durchfuehren:',
      marginLeft, y, { width: contentWidth }
    );
    y += 25;

    // List eigenleistungen
    submission.eigenleistungen.forEach((item, idx) => {
      if (y > 720) return; // prevent page overflow

      doc.font('Helvetica').fontSize(10).fillColor(layout.colors.gold);
      doc.text('\u2022', marginLeft + 10, y, { lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.text);
      doc.text(item, marginLeft + 22, y, { width: contentWidth - 32 });
      y += 18;
    });

    // Hinweis box
    y += 20;
    if (y < 720) {
      doc.roundedRect(marginLeft, y, contentWidth, 50, 6).fill(layout.colors.goldLight);
      doc.rect(marginLeft, y, 4, 50).fill(layout.colors.gold);
      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.text);
      doc.text(
        'Hinweis: Die genannten Eigenleistungen werden bei der Angebotserstellung beruecksichtigt. ' +
        'Ihr Fachberater bespricht gerne die Details mit Ihnen.',
        marginLeft + 15, y + 12, { width: contentWidth - 30 }
      );
    }
  }
};
```

### Example 2: Registration in pages/index.js

```javascript
const eigenleistungen = require('./eigenleistungen');
// ... in buildPageList():
pages.push(floorPlan);
pages.push(eigenleistungen);  // NEW
pages.push(comparisonChecklist);
```

### Example 3: emotionalHook Catalog Field

```json
{
  "id": "climativ",
  "name": "CLIMA-tiv",
  "emotionalHook": "Ihr Zuhause atmet -- diffusionsoffen, wohngesund und mit F90 Brandschutz als Standard.",
  "description": "CLIMA-tiv Aussenwand mit Holzwerkstoffplatte...",
  ...
}
```

### Example 4: Using emotionalHook in componentPage.js

```javascript
// Replace current shortDesc logic:
const emotionalText = component.emotionalHook || '';
const shortDesc = emotionalText || (component.description ? component.description.split('.')[0] + '.' : '');
```

### Example 5: Flattening Alpha for Better JPEG Compression

```javascript
// In imageService.js, replace the alpha-check logic:
if (metadata.hasAlpha) {
  // Flatten transparency to white background, then compress as JPEG
  pipeline = pipeline.flatten({ background: '#ffffff' })
    .jpeg({ quality: 75, mozjpeg: true });
} else {
  pipeline = pipeline.jpeg({ quality: 75, mozjpeg: true });
}
```

**Caveat:** This assumes no images genuinely need transparency in the PDF. Since PDFKit renders on white pages, flattening to white is safe for this use case.

## Detailed Bug Analysis

### Bug: Eigenleistungen Page Missing (INH-01)

**Root cause:** The eigenleistungen page module was never created. During the Phase 2 refactoring (02-02), the page module system was built and all existing pages were migrated, but eigenleistungen was not among the original pages either. The data flow works:

1. Form submits `eigenleistungen[]` field values
2. `submissionService.parseEigenleistungen()` parses them into a string array
3. Submission JSON stores `"eigenleistungen": ["Malerarbeiten", "Bodenbelaege"]`
4. **MISSING:** No page module reads `submission.eigenleistungen` and renders it

**Data structure verified** (from submissionService.js line 142-158):
```javascript
// submission.eigenleistungen = ["string1", "string2", ...]
// Each string is a trimmed, non-empty user entry
```

**Fix:** Create `src/services/pdf/pages/eigenleistungen.js` and register it in `pages/index.js`.

### Bug: Raumplanung Rendering (INH-02)

**Code review of floorPlan.js reveals:**
- Condition: checks `rooms?.erdgeschoss?.length > 0` etc. -- **correct**
- Floor filtering: `filter(floor => floor.rooms.length > 0)` -- **correct**
- Room rendering: renders `room.name` and `room.details` -- **correct**
- Floor labels: "Erdgeschoss", "Obergeschoss", "Untergeschoss (Partnerkeller oder bauseits)" -- **correct**

**Potential issues identified:**
1. **No y-overflow protection:** The render function does not check if `y` exceeds the page boundary. With many rooms (e.g., 15+ rooms across 3 floors), content will overflow past the footer area.
2. **All test submissions have empty rooms:** All 3 saved submissions have `"rooms": { "erdgeschoss": [], "obergeschoss": [], "untergeschoss": [] }`, so floorPlan has never actually been tested with real data.
3. **The hint box at the bottom** adds 60px fixed height without checking remaining space.

**Recommendation:** Test with real room data and add y-overflow guards. The page structure is sound but untested.

### Content Gap: Marketing Text (INH-03)

**Current state of catalog content quality:**

| Category | entries | has `description` | has `advantages` | has `comparisonNotes` | has `premiumFeatures` | emotionalHook |
|----------|---------|-------------------|------------------|-----------------------|-----------------------|---------------|
| walls | 4 | YES (technical) | YES (3-5 items) | YES (detailed) | YES (4 items) | MISSING |
| innerwalls | 2 | YES (technical) | YES (4-5 items) | YES (detailed) | YES (3 items) | MISSING |
| windows | 2 | YES (decent) | YES (4-7 items) | YES (detailed) | YES (2 items) | MISSING |
| tiles | 2 | YES (decent) | YES (3 items) | YES (brief) | NO | MISSING |
| haustypen | 6 | YES (brief) | YES (5 items) | YES (brief) | NO | MISSING |
| heizung | 2 | YES (good) | YES (4-5 items) | YES (detailed) | NO | MISSING |
| lueftung | 3 | YES (decent) | YES (3-5 items) | YES (detailed) | NO layers on "keine" | MISSING |
| daecher | 4 | YES (brief) | YES (4 items) | YES (brief) | YES (3 items) | MISSING |
| treppen | 5 | YES (decent) | YES (3-4 items) | YES (decent) | YES (2-3 items) | MISSING |
| decken | 2 | YES (decent) | YES (4-5 items) | YES (decent) | YES (2-3 items) | MISSING |

**Key observation:** The existing content is already fairly strong for technical details, advantages, and comparison notes. The main gaps are:
1. `emotionalHook` field missing everywhere (needs to be created)
2. Some descriptions are purely technical and could be more emotionally compelling
3. `premiumFeatures` missing on some categories (tiles, haustypen, heizung)
4. The `description` for items like `lueftung.keine` ("Natuerliche Fensterlueftung") is fine but could have an emotionalHook like "Bewaehrte Einfachheit -- frische Luft durch bewusstes Lueften."

### File Size Analysis (INH-04)

**Current state:**
- PDF without compression: ~23 MB (from output files dated Feb 4)
- PDF with compression: ~5.8 MB (from output file dated Feb 12)
- Target: < 5 MB

**Image analysis (66 total images, 38 MB raw):**
- 35 images have alpha channels
- Most alpha images are 3 KB placeholders (skip compression, pass through)
- 3 large alpha images cause problems:
  - `vollholzdecke-technical.png`: 2.8 MB, 2100x1000, ALPHA
  - `lehner-decke-technical.png`: 632 KB, 1280x955, ALPHA
  - `dezentral-technical.png`: 590 KB, 1030x532, ALPHA
- These stay as PNG because of alpha, losing the 5-10x JPEG compression benefit

**Compression strategy to hit 5 MB:**
1. **Flatten alpha before JPEG conversion:** All images are rendered on white PDF pages. Flattening alpha to white and converting to JPEG is safe and yields the biggest improvement.
2. **Reduce maxWidth to 600:** At 72 DPI, a 495pt content width = ~495px. Even at 2x oversampling (Retina), 600px is sufficient. Current 800px is overkill for A4 PDF.
3. **Consider JPEG quality reduction to 70:** From 75 to 70 saves ~10-15% with minimal visible quality loss in print.

**Estimated impact:**
- Flattening alpha alone on the 3 large alpha images could save ~1-2 MB
- Reducing maxWidth from 800 to 600 could save another 20-30% across all images
- Combined effect should bring the PDF well under 5 MB

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw images embedded in PDF | sharp compression pipeline | Phase 2 (02-03) | 23 MB -> 5.8 MB |
| Monolithic pdfService.js | Page module system | Phase 2 (02-02) | Maintainable page modules |
| Technical descriptions only | premiumFeatures + advantages + comparisonNotes | Phase 1 (01-01) | Better marketing content |
| 7 catalog categories | 10 categories (added daecher, treppen, decken) | Phase 1 (01-03) | Full house configuration |

## Open Questions

1. **What is the actual rendering behavior of floorPlan.js with real data?**
   - What we know: Code structure looks correct. No y-overflow protection.
   - What is unclear: Whether there are visual bugs (spacing, alignment, text wrapping).
   - Recommendation: Create a test submission with populated rooms and generate a PDF to verify.

2. **Should emotionalHook replace or supplement the description?**
   - What we know: Roadmap says "emotionalHook, Verkaufsargumente, Vorteils-Bullets". Component page currently shows `description.split('.')[0]` as subtitle.
   - What is unclear: Whether emotionalHook should be the new subtitle (replacing description) or shown separately.
   - Recommendation: Use emotionalHook as the subtitle on component pages (fallback to description if missing). Keep description available for pages that need technical detail.

3. **Is flattening ALL alpha channels safe?**
   - What we know: PDF pages are white, so flattening to white is visually identical for most images.
   - What is unclear: Whether any technical drawing relies on true transparency (overlay effects).
   - Recommendation: Safe to flatten. Technical drawings in PDFs are rendered on white paper. If concerned, only flatten images > 100 KB (skip small placeholders which are already fast).

## Sources

### Primary (HIGH confidence)
- Codebase inspection of all files in `src/services/pdf/pages/` (14 modules)
- Codebase inspection of `src/services/imageService.js` (compression pipeline)
- Codebase inspection of `src/services/submissionService.js` (data parsing)
- Codebase inspection of `data/catalog.json` (all 10 categories, 32 entries)
- File system analysis of `assets/variants/` (66 images, alpha channel check via sharp)
- File system analysis of `output/` directory (actual PDF sizes)

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` (Pitfall 6: marketing copy in code, emotionalHook recommendation)
- `.planning/ROADMAP.md` (Phase 4 requirements and plan descriptions)
- Prior phase decisions from state (02-02, 02-03, 03-02, 03-03)

## Metadata

**Confidence breakdown:**
- Eigenleistungen bug: HIGH - confirmed module does not exist, data pipeline verified
- Raumplanung issues: MEDIUM - code looks correct but untested with real data
- Marketing content: HIGH - catalog structure and gaps fully audited
- File size optimization: HIGH - image analysis completed, compression math validated

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable codebase, no external dependency changes expected)
