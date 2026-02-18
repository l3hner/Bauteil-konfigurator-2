# Phase 2: PDF Architektur - Research

**Researched:** 2026-02-18
**Domain:** PDFKit modular decomposition + sharp image compression pipeline
**Confidence:** HIGH

## Summary

Phase 2 decomposes a 1,700-line monolithic `pdfService.js` into isolated page modules and adds a sharp-based image compression pipeline. The current file contains 21 methods in a single class: a `generatePDF` orchestrator (~140 lines), 12 page-rendering methods, 4 shared draw helpers, and 4 dead-code methods. The page modules are pure PDFKit draw functions with no external framework needed -- the decomposition is a straightforward extract-method refactoring. The image pipeline uses sharp (already a devDependency at ^0.34.5) to compress 66 product images (38 MB total, largest 5.5 MB) before PDF embedding, which will reduce generated PDFs from ~24 MB to well under 5 MB.

The critical risk is visual regression: moving draw logic between files without accidentally changing coordinates, font sizes, or colors. Since no visual regression testing exists, the safest approach is a mechanical extraction (copy-paste, then verify by generating a reference PDF before and after).

**Primary recommendation:** Extract shared constants and helpers first (layout.js), then mechanically move each page method into its own module file with zero logic changes, and finally add the sharp image pipeline as a separate concern.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdfkit | ^0.14.0 | PDF generation engine | Already in use; all draw methods target its API |
| sharp | ^0.34.5 | Image resize + compression | Already in devDependencies; move to production dependency. Fastest Node.js image processor, prebuilt binaries for Linux x64 (Render.com target) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| qrcode | ^1.5.4 | QR code generation in contact page | Already in use, no changes needed |
| fs/path (stdlib) | N/A | File I/O for images and PDF output | Already in use |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp | jimp | jimp is pure JS (no native deps), but 4-5x slower and already only a devDependency. sharp prebuilt binaries work on Render.com Linux. |
| sharp runtime compression | Pre-optimized images on disk | Would avoid runtime dep, but locks image quality at build time, prevents dynamic resize based on PDF layout needs, and the Phase 4 target of <5MB PDF requires runtime awareness of which images are actually used |

**Installation:**
```bash
# Move sharp from devDependencies to dependencies
npm install sharp@^0.34.5 --save
```

**Note on Render.com deployment:** The `render.yaml` uses `plan: free` with Node.js environment. sharp v0.34.5 automatically downloads prebuilt binaries for `linux-x64` (glibc) during `npm install`. No build toolchain is needed. The free tier memory (512 MB) is sufficient for sharp -- it processes images in a streaming fashion with low peak memory (~50 MB for a single image resize).

## Architecture Patterns

### Recommended Project Structure
```
src/services/
├── pdfService.js              # Orchestrator (<50 lines): doc setup, page loop, stream output
├── imageService.js            # Image compression pipeline: resize + compress + cache
└── pdf/
    ├── layout.js              # Shared: colors, typography, layout constants, drawHeader, drawFooter, drawImagePlaceholder
    └── pages/
        ├── titlePage.js       # Title page (lines 227-280)
        ├── qdfCertification.js # QDF certification page (lines 310-377)
        ├── executiveSummary.js # Executive summary (lines 441-525)
        ├── leistungsuebersicht.js # Service overview (lines 528-689)
        ├── qualityAdvantages.js # 7 quality advantages grid (lines 380-439)
        ├── serviceContent.js  # Service content (lines 786-824)
        ├── componentPage.js   # Generic component page (lines 826-1047) + helpers
        ├── haustypPage.js     # Haustyp flyer-style page (lines 1135-1220)
        ├── floorPlan.js       # Room planning (lines 1622-1672)
        ├── comparisonChecklist.js # Comparison checklist (lines 1452-1520)
        ├── glossary.js        # Glossary page (lines 1571-1615)
        ├── beraterPage.js     # Fachberater page (lines 1522-1569)
        └── contactPage.js     # Contact + QR codes (lines 1412-1450)
```

### Pattern 1: Page Module Contract
**What:** Every page module exports `condition(submission)` and `render(doc, submission, ctx)`.
**When to use:** For every PDF page that gets its own module file.
**Example:**
```javascript
// src/services/pdf/pages/titlePage.js
const layout = require('../layout');

module.exports = {
  title: null, // Title pages have no header

  condition(submission) {
    return true; // Always rendered
  },

  render(doc, submission, ctx) {
    // Exact same draw code as current drawTitlePage, using layout.colors etc.
    const splitY = 420;
    doc.rect(0, splitY, 595, 842 - splitY).fill(layout.colors.primary);
    // ... rest of draw code
  }
};
```

### Pattern 2: Orchestrator Loop
**What:** The orchestrator iterates an ordered array of page modules, checks conditions, calls render.
**When to use:** In the refactored `pdfService.js`.
**Example:**
```javascript
// src/services/pdfService.js (orchestrator)
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const layout = require('./pdf/layout');
const pages = require('./pdf/pages');

class PdfService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../output');
  }

  async generatePDF(submission) {
    // ... ensureOutputDir, create doc, create stream ...

    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    let pageNum = 0;
    const ctx = { catalogService, imageService, pageNum: 0 };

    for (const page of pages) {
      if (!page.condition(submission)) continue;

      doc.addPage();
      ctx.pageNum++;

      if (page.title) {
        layout.drawHeader(doc, page.title);
      }

      await page.render(doc, submission, ctx);

      if (page.title) {
        layout.drawFooter(doc, ctx.pageNum);
      }
    }

    doc.end();
    return new Promise((resolve, reject) => { /* stream finish/error */ });
  }
}
```

### Pattern 3: Component Pages as Dynamic Entries
**What:** The 8-10 component pages (walls, windows, heating, etc.) are generated dynamically from a components array, not as separate module files.
**When to use:** Component pages share the same render logic (`drawComponentContent` or `drawHaustypPage`) but differ in data.
**Example:**
```javascript
// In the pages array, component pages are generated dynamically:
const componentEntries = buildComponentPages(submission);
// Each entry has { title, condition, render } just like static pages
// condition checks if catalogService.getVariantById returns data
// render calls the shared componentPage.render or haustypPage.render
```

### Pattern 4: Image Service with Caching
**What:** The image service compresses images on first access and caches the buffer.
**When to use:** Every time an image is embedded in the PDF.
**Example:**
```javascript
// src/services/imageService.js
const sharp = require('sharp');
const fs = require('fs');

const cache = new Map();

async function getCompressedImage(imagePath, maxWidth = 800) {
  if (cache.has(imagePath)) return cache.get(imagePath);

  const buffer = await sharp(imagePath)
    .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toBuffer();

  cache.set(imagePath, buffer);
  return buffer;
}
```

### Anti-Patterns to Avoid
- **Changing draw logic during extraction:** Every coordinate, font size, color, and text string must be copied verbatim. Zero refactoring of draw logic during decomposition.
- **Shared mutable state between pages:** Each page module must be self-contained. No module should modify `submission` or a shared context object that other modules depend on (except `pageNum` counter).
- **Converting PNG to JPEG for technical drawings:** Technical drawings with transparency (PNG alpha channel) would lose information if converted to JPEG. Keep PNG format for images that use transparency; only JPEG-compress photographic images.

## Current State Analysis

### Methods in pdfService.js (1,700 lines)

**Orchestrator:**
- `generatePDF(submission)` -- lines 65-225 (~160 lines) -- the main entry point

**Page-rendering methods (called from generatePDF):**
| Method | Lines | Called When | Notes |
|--------|-------|------------|-------|
| `drawTitlePage` | 227-280 | Always | No header/footer, has own layout |
| `drawQDFCertificationPage` | 310-377 | Always | New page, static content |
| `drawExecutiveSummary` | 441-525 | Always | Uses catalogService lookups |
| `drawLeistungsuebersicht` | 528-689 | Always | 3-column layout, dynamic content |
| `drawQualityAdvantagesPage` | 380-439 | Always | Card grid, static content |
| `drawServiceContent` | 786-824 | Always | Static service list |
| `drawComponentContent` | 826-1047 | Per component (8-10x) | Shared template for all components |
| `drawHaustypPage` | 1135-1220 | Once (for haustyp) | Special layout with 3 images |
| `drawFloorPlanPage` | 1622-1672 | If rooms exist | Conditional page |
| `drawComparisonChecklist` | 1452-1520 | Always | Checklist with dynamic U-Wert |
| `drawGlossaryPage` | 1571-1615 | Always | 2-column glossary |
| `drawBeraterPage` | 1522-1569 | If berater data exists | Conditional page |
| `drawContactPage` | 1412-1450 | Always | QR codes, async |

**Shared helpers (used by multiple pages):**
| Method | Lines | Used By |
|--------|-------|---------|
| `drawHeader` | 282-290 | All pages except title |
| `drawFooter` | 292-307 | All pages except title |
| `drawImagePlaceholder` | 1674-1697 | componentPage, haustypPage |
| `drawQRCode` | 1298-1319 | contactPage (and dead finalContent) |
| `extractAufbauItems` | 1049-1102 | componentPage |
| `extractQualityItems` | 1104-1132 | componentPage |
| `getGrundstueckText` | 1617-1620 | executiveSummary |

**Dead code (defined but never called from generatePDF):**
| Method | Lines | Notes |
|--------|-------|-------|
| `drawOverviewContent` | 691-784 | Superseded by drawExecutiveSummary |
| `drawFinalContent` | 1321-1410 | Superseded by drawContactPage |
| `drawUValueBarChart` | 1223-1257 | Infographic helper, never wired |
| `drawSCOPGauge` | 1260-1295 | Infographic helper, never wired |

### Image Analysis (66 files, 38 MB total)

**Categories by size:**
| Category | Files | Largest | Notes |
|----------|-------|---------|-------|
| haustypen | 18 | 5,513 KB (mehrfamilienhaus/3.png 2165x1441) | Nested subdirectories, 3 images per type |
| innenwalls | 4 | 2,602 KB (1920x1440) | Technical drawings are large |
| decken | 4 | 2,817 KB (2100x1000) | Technical drawings |
| walls | 8 | 942 KB (1184x864) | 4 variants x 2 (product + technical) |
| tiles | 4 | 877 KB (1184x864) | Technical drawings |
| windows | 4 | 846 KB (1184x864) | Technical drawings |
| heizung | 4 | 603 KB (832x468) | Mixed sizes |
| lueftung | 4 | 590 KB (1030x532) | Technical drawings |
| daecher | 8 | 3 KB (800x600) | Placeholders only (Phase 1) |
| treppen | 8 | 3 KB (800x600) | Placeholders only (Phase 1) |

**Key insight:** Images rendered in PDF at max 180px wide (component pages) or ~158px (haustyp 3-up layout). At 72 DPI, that is ~180 PDF points = ~180 pixels needed. Even at 2x for quality, 360px is far less than the 1920px+ originals. Massive compression gains are available.

**Placeholder images (3 KB each):** daecher and treppen have 800x600 placeholder PNGs. These need no compression.

### PDF Size Analysis
| PDF | Size | Notes |
|-----|------|-------|
| Full config with images | ~24 MB | Uncompressed PNGs embedded |
| Config without haustyp images | ~6 MB | Still large from technical drawings |
| Minimal (no real images) | ~61-95 KB | Just text and placeholders |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Custom imagemagick CLI wrapper | sharp `.resize().jpeg().toBuffer()` | sharp is already in the project, handles all formats, streaming, and is 4-5x faster than alternatives |
| Image format detection | Extension-based format guessing | sharp `.metadata()` to check `hasAlpha` | Some PNGs have alpha channels (technical drawings with transparency) that would be ruined by blind JPEG conversion |
| PDF page ordering | Manual page index management | Ordered array of page modules with `condition` checks | Keeps page order declarative and prevents off-by-one errors in pageNum |
| In-memory caching | LRU cache library | Simple `Map()` keyed by file path | Only 10-15 images per PDF generation, all fit in memory. Map is cleared per request. |

**Key insight:** The decomposition is a refactoring, not a rewrite. Every line of draw code is copied verbatim. The only new code is the module wiring (orchestrator loop + page exports) and the image service.

## Common Pitfalls

### Pitfall 1: Visual Regression During Extraction
**What goes wrong:** A coordinate, font size, color, or text string is accidentally changed when moving code between files, causing the PDF layout to shift or text to misalign.
**Why it happens:** Manual copy-paste across files; easy to miss a `this.colors.primary` that needs to become `layout.colors.primary`.
**How to avoid:** (1) Generate a reference PDF before any changes. (2) After extraction, generate the same PDF and compare file sizes byte-for-byte -- they should be identical. (3) Do a visual spot-check of 2-3 pages. (4) Replace all `this.colors` with `layout.colors` systematically using find-replace, not manual edits.
**Warning signs:** PDF file size changes by more than a few bytes after "pure refactoring" step.

### Pitfall 2: `this` Context Loss in Extracted Modules
**What goes wrong:** Page methods that reference `this.colors`, `this.typography`, `this.layout` break when extracted from the class.
**Why it happens:** In the current code, all draw methods are class instance methods using `this.` to access shared constants.
**How to avoid:** Extract all `this.*` references into the `layout.js` module first. Then each page module imports `layout` and uses `layout.colors` instead of `this.colors`. This is the single most important refactoring step.
**Warning signs:** `TypeError: Cannot read properties of undefined (reading 'primary')` at runtime.

### Pitfall 3: Async Pages Breaking the Loop
**What goes wrong:** `drawContactPage` is async (uses `await drawQRCode`). If the orchestrator loop does not `await` each page render, the QR codes are missing.
**Why it happens:** Most page renders are synchronous, so it is easy to forget the `await`.
**How to avoid:** Make the orchestrator loop always `await page.render(...)`. All page render functions should return a promise (or be async). This is a no-op for sync functions.
**Warning signs:** QR codes missing from contact page; no error thrown (silent promise ignored).

### Pitfall 4: PNG Alpha Channel Destroyed by JPEG Compression
**What goes wrong:** Technical drawings with transparent backgrounds become ugly when converted from PNG to JPEG (white/black background replaces transparency).
**Why it happens:** JPEG does not support alpha channels. Blind format conversion loses transparency.
**How to avoid:** In imageService, check `metadata.hasAlpha` before compression. If the image has an alpha channel, keep it as PNG (with compression level 6-9). Only convert to JPEG for photographic images (haustypen photos) or PNGs without transparency.
**Warning signs:** Technical drawings in PDF have visible white rectangles where transparency used to be.

### Pitfall 5: sharp Native Module on Render.com Free Tier
**What goes wrong:** sharp fails to install or run on the deployment platform.
**Why it happens:** sharp uses native binaries (libvips). Render.com free tier uses Linux x64 with glibc, which is fully supported by sharp prebuilt binaries.
**How to avoid:** (1) Move sharp from devDependencies to dependencies so `npm install` on Render downloads the Linux binary. (2) Lock `sharp@^0.34.5` to avoid major version surprises. (3) Test deployment after adding sharp.
**Warning signs:** `npm install` fails with compilation errors (means prebuilt binary was not available).

### Pitfall 6: Component Pages Are Dynamic, Not Static
**What goes wrong:** Treating each component type (walls, windows, heizung, etc.) as a separate page module creates 8+ nearly identical files.
**Why it happens:** Misunderstanding the architecture. All components share `drawComponentContent`, except haustyp which uses `drawHaustypPage`.
**How to avoid:** Create just two page renderers: `componentPage.js` (generic) and `haustypPage.js` (special). The orchestrator builds the component list dynamically and passes data into these shared renderers. The page module contract allows a factory function to generate page entries.
**Warning signs:** 8+ files with >80% duplicated code.

## Code Examples

### Example 1: layout.js -- Shared Constants and Helpers
```javascript
// src/services/pdf/layout.js
const path = require('path');
const fs = require('fs');

const colors = {
  primary: '#06402b',
  primaryDark: '#042e1f',
  primaryLight: '#267e61',
  secondary: '#b1a699',
  secondaryLight: '#f5f3ef',
  gold: '#D4AF37',
  goldDark: '#b8922e',
  goldLight: '#faf8f0',
  text: '#1d1d1b',
  textLight: '#333333',
  textMuted: '#666666',
  gray: '#999999',
  grayLight: '#f5f5f5',
  white: '#FFFFFF',
  error: '#cc0000',
  errorLight: '#fff5f5'
};

const typography = {
  hero: { font: 'Helvetica-Bold', size: 48, lineHeight: 1.1 },
  h1: { font: 'Helvetica-Bold', size: 20, lineHeight: 1.2 },
  h2: { font: 'Helvetica-Bold', size: 14, lineHeight: 1.3 },
  h3: { font: 'Helvetica-Bold', size: 12, lineHeight: 1.4 },
  body: { font: 'Helvetica', size: 10, lineHeight: 1.5 },
  small: { font: 'Helvetica', size: 8, lineHeight: 1.4 },
  caption: { font: 'Helvetica', size: 7, lineHeight: 1.3 }
};

const layout = {
  pageWidth: 595,
  pageHeight: 842,
  marginLeft: 60,
  marginRight: 60,
  marginTop: 80,
  marginBottom: 60,
  contentWidth: 475,
  gridGap: 15,
  sectionGap: 25
};

function drawHeader(doc, title) {
  doc.rect(50, 35, 4, 30).fill(colors.gold);
  doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.primary);
  doc.text(title, 62, 40, { lineBreak: false });
  doc.moveTo(50, 75).lineTo(545, 75).strokeColor(colors.secondary).lineWidth(1).stroke();
}

function drawFooter(doc, pageNum) {
  doc.moveTo(50, 800).lineTo(545, 800).lineWidth(0.5).strokeColor(colors.gold).stroke();
  doc.font('Helvetica').fontSize(7).fillColor(colors.textMuted);
  doc.text('www.lehner-haus.de', 50, 810, { lineBreak: false });
  doc.font('Helvetica').fontSize(7).fillColor(colors.textMuted);
  doc.text('Lehner Haus GmbH', 0, 810, { width: 595, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.primary);
  doc.text(`Seite ${pageNum}`, 495, 810, { width: 50, align: 'right' });
}

function drawImagePlaceholder(doc, x, y, width, height, category) {
  // ... exact copy from current pdfService.js lines 1674-1697
}

module.exports = { colors, typography, layout, drawHeader, drawFooter, drawImagePlaceholder };
```

### Example 2: Page Module with Condition
```javascript
// src/services/pdf/pages/floorPlan.js
const layout = require('../layout');

module.exports = {
  title: 'Ihre Raumplanung',

  condition(submission) {
    return (submission.rooms?.erdgeschoss?.length > 0) ||
           (submission.rooms?.obergeschoss?.length > 0) ||
           (submission.rooms?.untergeschoss?.length > 0);
  },

  render(doc, submission, ctx) {
    // Exact copy of drawFloorPlanPage body (lines 1623-1672)
    // Replace this.colors -> layout.colors, this.layout -> layout.layout
    let y = 100;
    const marginLeft = 60;
    const contentWidth = 475;
    // ... rest of draw code
  }
};
```

### Example 3: imageService.js -- Compression Pipeline
```javascript
// src/services/imageService.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const cache = new Map();

async function getCompressedImage(imagePath, maxWidth = 800) {
  if (!imagePath || !fs.existsSync(imagePath)) return null;

  const cacheKey = `${imagePath}:${maxWidth}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const metadata = await sharp(imagePath).metadata();
  const stats = fs.statSync(imagePath);

  // Skip tiny images (< 10 KB) -- likely placeholders
  if (stats.size < 10240) {
    const buf = fs.readFileSync(imagePath);
    cache.set(cacheKey, buf);
    return buf;
  }

  let pipeline = sharp(imagePath)
    .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true });

  if (metadata.hasAlpha) {
    // Keep PNG for images with transparency (technical drawings)
    pipeline = pipeline.png({ compressionLevel: 8 });
  } else {
    // Convert to JPEG for photos
    pipeline = pipeline.jpeg({ quality: 75, mozjpeg: true });
  }

  const buffer = await pipeline.toBuffer();
  cache.set(cacheKey, buffer);
  return buffer;
}

function clearCache() {
  cache.clear();
}

module.exports = { getCompressedImage, clearCache };
```

### Example 4: Orchestrator (Target: <50 lines)
```javascript
// src/services/pdfService.js (refactored orchestrator)
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const layout = require('./pdf/layout');
const { buildPageList } = require('./pdf/pages');
const imageService = require('./imageService');

class PdfService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../output');
  }

  async ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generatePDF(submission) {
    await this.ensureOutputDir();
    const outputPath = path.join(this.outputDir, `Leistungsbeschreibung_${submission.id}.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false, bufferPages: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const pages = buildPageList(submission);
    let pageNum = 0;

    for (const page of pages) {
      if (!page.condition(submission)) continue;
      doc.addPage();
      pageNum++;
      if (page.title) layout.drawHeader(doc, page.title);
      await page.render(doc, submission, { pageNum, imageService });
      if (page.title) layout.drawFooter(doc, pageNum);
    }

    doc.end();
    imageService.clearCache();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    });
  }
}

module.exports = new PdfService();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| sharp in devDependencies | sharp as production dependency | Phase 2 | Images compressed at PDF generation time, not just as a build-time script |
| Monolithic class with 21 methods | Page modules + orchestrator | Phase 2 | Each page can be modified independently without regression risk |
| Raw PNG embedding in PDFKit | Compressed buffer embedding | Phase 2 | PDF size drops from ~24 MB to <5 MB target |

**Deprecated/outdated:**
- `drawOverviewContent` (lines 691-784): Dead code, superseded by `drawExecutiveSummary`. Remove during extraction.
- `drawFinalContent` (lines 1321-1410): Dead code, superseded by `drawContactPage`. Remove during extraction.
- `drawUValueBarChart` (lines 1223-1257): Never wired into any page. Remove during extraction.
- `drawSCOPGauge` (lines 1260-1295): Never wired into any page. Remove during extraction.

## Open Questions

1. **Render.com free tier memory for sharp**
   - What we know: Render free tier is likely 512 MB RAM. sharp processing a single image uses ~50-100 MB peak. Images are processed sequentially.
   - What's unclear: Exact memory limit for the free tier on Render.com. The prior decision notes "Render.com memory tier unknown."
   - Recommendation: Process images one at a time (no parallel sharp calls). Monitor memory in production. If memory is tight, reduce maxWidth or skip caching.

2. **Test fixture for regression checking**
   - What we know: `test/test-pdf-generation.js` exists and generates a test PDF. A golden-sample fixture path is referenced but may not exist.
   - What's unclear: Whether any existing submissions can serve as regression baselines.
   - Recommendation: Generate a reference PDF from a known submission BEFORE starting refactoring. Compare file size and visual output after each plan step.

3. **Haustypen directory structure**
   - What we know: Haustypen images are in nested subdirectories (`assets/variants/haustypen/stadtvilla/1.png`). The `drawHaustypPage` method iterates `1.png`, `2.png`, `3.png` from `component.filePath` directory.
   - What's unclear: Nothing -- the structure is well-understood.
   - Recommendation: imageService must handle directory paths (for haustypen) and file paths (for all other categories) correctly.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `src/services/pdfService.js` (1,700 lines, 21 methods) -- all line numbers verified
- Direct codebase analysis of `package.json` -- sharp ^0.34.5 already in devDependencies
- Direct filesystem analysis -- 66 images, 38 MB total, dimensions verified with sharp `.metadata()`
- [sharp official docs - Installation](https://sharp.pixelplumbing.com/install/) -- Node.js ^18.17.0 or >=20.3.0, prebuilt binaries for linux-x64
- [sharp official docs - Output](https://sharp.pixelplumbing.com/api-output/) -- JPEG quality 1-100 (default 80), PNG compression level 0-9
- [sharp official docs - Resize](https://sharp.pixelplumbing.com/api-resize/) -- fit modes, withoutEnlargement option
- [PDFKit docs - Images](https://pdfkit.org/docs/images.html) -- Supports JPEG and PNG formats, accepts Buffer objects

### Secondary (MEDIUM confidence)
- [sharp npm page](https://www.npmjs.com/package/sharp) -- 4-5x faster than ImageMagick, uses libvips
- [sharp GitHub](https://github.com/lovell/sharp) -- prebuilt binaries auto-selected during npm install
- Render.com `render.yaml` in repo -- free plan, Node.js environment, `npm install` as build command

### Tertiary (LOW confidence)
- Render.com free tier memory limit (512 MB assumed from general knowledge, not verified from official source)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- sharp already in project, PDFKit already in use, no new libraries needed
- Architecture: HIGH -- straightforward extract-method refactoring, all code analyzed line-by-line
- Pitfalls: HIGH -- all pitfalls derived from direct code analysis (async pages, `this` context, alpha channels, dead code)
- Image pipeline: HIGH -- sharp API verified against official docs, image dimensions measured, compression ratios predictable

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable domain, no fast-moving dependencies)
