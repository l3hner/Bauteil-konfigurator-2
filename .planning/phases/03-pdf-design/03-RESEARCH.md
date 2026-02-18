# Phase 3: PDF Design - Research

**Researched:** 2026-02-18
**Domain:** PDFKit layout design, custom fonts, image composition, visual hierarchy
**Confidence:** HIGH

## Summary

Phase 3 transforms the existing functional PDF into a visually compelling "Hochglanz-Broschure" (glossy brochure). The codebase is well-prepared: Phase 2 delivered a clean modular architecture with isolated page modules (`src/services/pdf/pages/`), a central `layout.js` design system, and a sharp-based image compression pipeline. All three plans (title page redesign, component page hierarchy, executive summary) operate on existing modules with well-defined interfaces.

The primary technical challenges are: (1) embedding a large hero image with a semi-transparent overlay for text legibility on the title page, (2) restructuring the component page from the current 2-column technical layout to a top-down visual hierarchy (big image first), and (3) a critical color palette discrepancy -- the requirements specify `#003366` (navy blue) and `#C8102E` (red), but the current codebase uses a completely different green/beige palette (`#06402b` primary, `#b1a699` secondary). This color change must be addressed as a design decision before implementation.

PDFKit 0.14.0 (currently installed) fully supports all required capabilities: custom font registration via `registerFont()`, semi-transparent overlays via `fillOpacity()`, linear gradients, clipping paths, and the `cover` image option for full-bleed backgrounds. No additional dependencies are needed.

**Primary recommendation:** Implement the three plans sequentially (title page first enables visual foundation, then component pages follow the new hierarchy, then executive summary consolidates). Address the color palette question at the start of Plan 03-01 as it cascades through the entire document.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdfkit | 0.14.0 | PDF generation | Already installed, proven in codebase, supports all needed features |
| sharp | 0.34.5 | Image compression/resizing | Already installed via Phase 2, handles hero image preprocessing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Montserrat (font) | TTF from Google Fonts | Custom heading typography | Register via `doc.registerFont()` for premium heading look |
| Helvetica (built-in) | PDF Standard 14 | Body text | Already used throughout, keep for body text consistency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Montserrat | Helvetica-Bold (current) | Montserrat gives premium feel but adds ~50 KB to PDF; Helvetica is zero-cost as built-in font |
| Custom font for everything | Montserrat headings + Helvetica body | Mixing is the right approach -- custom for visual impact, built-in for reliability and file size |

**Installation (font only -- no npm packages needed):**
```bash
# Download Montserrat TTF files from Google Fonts
# Place in: assets/fonts/Montserrat-Bold.ttf, Montserrat-SemiBold.ttf, Montserrat-Regular.ttf
```

**IMPORTANT:** The prior phase note states: "Lehner Haus brand font unknown -- research recommends Montserrat as fallback. Confirm with client before implementing custom font." If the client has a specific brand font, use that instead. The implementation pattern is identical regardless of which font.

## Architecture Patterns

### Current Module Structure (from Phase 2)
```
src/services/pdf/
  layout.js               # Design system: colors, typography, helpers
  pages/
    index.js              # buildPageList() -- page registry
    titlePage.js          # Title page (to be redesigned in 03-01)
    componentPage.js      # Shared renderComponent() (to be redesigned in 03-02)
    haustypPage.js        # Shared renderHaustyp() (to be redesigned in 03-02)
    executiveSummary.js   # Executive summary (to be redesigned in 03-03)
    ... (11 more page modules)
```

### Pattern 1: Hero Image with Text Overlay (Title Page)
**What:** Full-width or large hero image with semi-transparent color overlay and text on top
**When to use:** Title page (PDF-01)
**Example:**
```javascript
// Source: PDFKit docs - images.html, vector.html
// Step 1: Draw hero image covering upper portion of page
const heroHeight = 500; // ~60% of A4 height
doc.save();
doc.rect(0, 0, 595, heroHeight).clip();
doc.image(heroBuffer, 0, 0, { cover: [595, heroHeight], align: 'center', valign: 'center' });
doc.restore();

// Step 2: Semi-transparent overlay gradient for text legibility
const grad = doc.linearGradient(0, heroHeight * 0.4, 0, heroHeight);
grad.stop(0, '#003366', 0);    // Transparent at top
grad.stop(1, '#003366', 0.85); // Nearly opaque at bottom
doc.rect(0, heroHeight * 0.4, 595, heroHeight * 0.6).fill(grad);

// Step 3: Text on top of overlay
doc.font('Montserrat-Bold').fontSize(32).fillColor('#FFFFFF');
doc.text('Ihre persoenliche', 60, heroHeight - 120, { width: 475 });
doc.font('Montserrat-Bold').fontSize(36).fillColor('#D4AF37');
doc.text('Leistungsbeschreibung', 60, heroHeight - 80, { width: 475 });
```

### Pattern 2: Visual-First Component Layout
**What:** Large product image at top, then emotional headline, then benefits, then specs
**When to use:** Every component page (PDF-02)
**Current layout:** 2-column (small image left, specs right) -- needs complete restructuring
**New layout:**
```
+-----------------------------------------------+
| [Header: Chapter Number + Category Title]     |
+-----------------------------------------------+
|                                               |
|        [ LARGE PRODUCT IMAGE ]                |
|        (full content width, ~200px tall)      |
|                                               |
+-----------------------------------------------+
| Emotional Headline (product name)             |
| Short description                             |
+-----------------------------------------------+
| Premium Features / Vorteile                   |
| (2-column bullet list with checkmarks)        |
+-----------------------------------------------+
| Technical Details / Specs                     |
| (compact table or layer list)                 |
+-----------------------------------------------+
| [Comparison Tip Box - if space]               |
+-----------------------------------------------+
```

### Pattern 3: Executive Summary Grid Layout
**What:** All key configuration facts on one page in a structured, scannable format
**When to use:** Executive summary page (PDF-03)
**Example structure:**
```
+-----------------------------------------------+
| [Header: Ihre Konfiguration auf einen Blick]  |
+-----------------------------------------------+
| Bauherr: Familie Mustermann                   |
| Datum: 18. Februar 2026                       |
+-----------------------------------------------+
| GRID: 2x4 or 3-column layout                 |
| +----------+----------+----------+            |
| | Haustyp  | Waende   | KfW      |            |
| | icon+val | icon+val | icon+val |            |
| +----------+----------+----------+            |
| | Heizung  | Lueftung | Dach     |            |
| | icon+val | icon+val | icon+val |            |
| +----------+----------+----------+            |
| | Fenster  | Treppe   | Dachein. |            |
| | icon+val | icon+val | icon+val |            |
| +----------+----------+----------+            |
+-----------------------------------------------+
```

### Anti-Patterns to Avoid
- **Text before image on component pages:** The requirement is explicit -- "kein Text kommt vor dem Bild." The image MUST be the first visual element after the header.
- **Stretching images beyond aspect ratio:** Use `fit` or `cover` with alignment, never bare `width + height` which distorts. The current code already uses `fit` correctly.
- **Forgetting `save()`/`restore()` around clips:** Clipping without save/restore permanently restricts the drawing area. Always wrap clipping operations.
- **Hardcoding Y positions across the full page:** Use accumulated `y` variable pattern (already used in codebase). Hardcoded positions break when content height varies.
- **Ignoring the title page special case:** Title page has `title: null` (no header/footer drawn by orchestrator). This must remain -- the title page has its own full-bleed layout.

## Critical Design Decision: Color Palette

**IMPORTANT:** There is a significant discrepancy between requirements and the current codebase.

| Element | Requirements (ROADMAP) | Current layout.js | Action Needed |
|---------|----------------------|-------------------|---------------|
| Primary | `#003366` (navy blue) | `#06402b` (dark green) | DECISION REQUIRED |
| Secondary | `#C8102E` (red) | `#b1a699` (beige) | DECISION REQUIRED |
| Gold/Accent | Not specified | `#D4AF37` | Keep as-is |

The current green/beige palette was implemented during Phase 2. The ROADMAP success criterion #4 explicitly states: "Lehner Haus Corporate Colors (#003366, #C8102E)".

**Recommendation:** The requirements document is authoritative. The colors in `layout.js` must be updated to match `#003366` (navy blue primary) and `#C8102E` (red secondary/accent). This should be done at the start of Plan 03-01 as a foundational step, since every page module references `layout.colors`.

However -- a secondary concern: the current green palette may be the ACTUAL Lehner Haus brand. The logo file `LehnerLogo_schwaebischgut.jpg` should be inspected. If the actual brand is green, then the ROADMAP requirements contain incorrect color values. **This needs human confirmation.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font subsetting | Manual glyph extraction | PDFKit auto-subsets registered fonts | PDFKit handles this automatically when you `registerFont()` |
| Image aspect ratio math | Custom width/height calculations | PDFKit `fit: [w, h]` and `cover: [w, h]` options | Built-in options handle aspect ratio correctly |
| Gradient overlays | Multiple stacked semi-transparent rects | `doc.linearGradient()` with opacity stops | Native gradient support is smoother and more performant |
| Font fallback chain | Try/catch for each font | Single `registerFont()` with Helvetica fallback in catch | Keep it simple -- one try, one fallback |

**Key insight:** PDFKit has mature image composition and vector graphics capabilities. Every visual effect needed for the "Hochglanz-Broschure" is achievable with built-in PDFKit methods -- no additional libraries needed.

## Common Pitfalls

### Pitfall 1: Hero Image File Missing
**What goes wrong:** Title page crashes or shows blank area because no hero image exists in `assets/`
**Why it happens:** No dedicated hero/lifestyle image has been added to the repository yet. Only product-specific images exist under `assets/variants/`.
**How to avoid:** Implement a graceful fallback chain: (1) dedicated hero image from `assets/hero/`, (2) fallback to first haustyp image, (3) fallback to solid color background with branding. The title page must NEVER crash.
**Warning signs:** `fs.existsSync()` returns false for hero image path.

### Pitfall 2: Image Clipping Without save()/restore()
**What goes wrong:** Everything drawn after the hero image is clipped to the hero area -- rest of page is invisible.
**Why it happens:** `doc.rect(...).clip()` permanently restricts the drawing canvas unless wrapped in save/restore.
**How to avoid:** ALWAYS use this pattern:
```javascript
doc.save();
doc.rect(x, y, w, h).clip();
doc.image(buffer, x, y, { cover: [w, h] });
doc.restore(); // Critical!
```
**Warning signs:** Content after hero image doesn't appear in PDF.

### Pitfall 3: Component Image Missing or Too Small
**What goes wrong:** Large image area shows placeholder or tiny stretched image at top of component page.
**Why it happens:** Some catalog items may have small placeholder images (~3 KB) or missing `filePath`.
**How to avoid:** Check image existence AND minimum file size. Use `drawImagePlaceholder()` (already in layout.js) as fallback. Consider showing technical drawing as fallback when product image is a placeholder.
**Warning signs:** Images under 10 KB in `assets/variants/`.

### Pitfall 4: Font Registration Fails Silently
**What goes wrong:** PDF renders with Helvetica everywhere despite Montserrat being "registered."
**Why it happens:** Font file path is wrong, TTF file is corrupted, or font name mismatch between `registerFont()` and `font()` calls.
**How to avoid:** Register fonts once at document creation, wrap in try/catch, log success/failure. Use the registered name consistently.
```javascript
try {
  doc.registerFont('Montserrat-Bold', path.join(fontsDir, 'Montserrat-Bold.ttf'));
  doc.registerFont('Montserrat-SemiBold', path.join(fontsDir, 'Montserrat-SemiBold.ttf'));
  console.log('[PDF] Custom fonts registered');
} catch (e) {
  console.warn('[PDF] Custom font registration failed, using Helvetica fallback:', e.message);
  // Fallback: registerFont with built-in name so all font('Montserrat-Bold') calls still work
  doc.registerFont('Montserrat-Bold', 'Helvetica-Bold');
  doc.registerFont('Montserrat-SemiBold', 'Helvetica-Bold');
}
```
**Warning signs:** PDF headings look identical to body text style.

### Pitfall 5: Content Overflows Page Bottom
**What goes wrong:** Text or images extend below the footer area or get cut off.
**Why it happens:** Large product image + long advantages list + comparison notes exceed available space.
**How to avoid:** Track `y` position throughout render. Truncate or omit optional sections (comparison notes, extra advantages) when `y > 700` (leaving room for footer at 800). The current code already does this check: `if (component.comparisonNotes && y < 690)`.
**Warning signs:** Footer overlaps content; content appears on wrong page.

### Pitfall 6: Color Palette Change Breaks Existing Pages
**What goes wrong:** Updating `layout.colors` in 03-01 causes visual regression on pages not being redesigned in Phase 3.
**Why it happens:** All 15 page modules reference `layout.colors.primary`, `.secondary`, etc.
**How to avoid:** When changing the color palette, visually verify ALL pages (not just the three being redesigned). Pages like `qdfCertification.js`, `serviceContent.js`, `qualityAdvantages.js` all use `layout.colors.primary` extensively.
**Warning signs:** Green/beige boxes suddenly appear as blue/red boxes with clashing gold accents.

## Code Examples

### Font Registration in pdfService.js
```javascript
// Source: PDFKit docs - text.html (registerFont section)
// Register custom fonts ONCE at document creation
const fontsDir = path.resolve(__dirname, '../../assets/fonts');

const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });

// Register custom heading font with Helvetica fallback
try {
  doc.registerFont('Heading', path.join(fontsDir, 'Montserrat-Bold.ttf'));
  doc.registerFont('Heading-SemiBold', path.join(fontsDir, 'Montserrat-SemiBold.ttf'));
} catch (e) {
  console.warn('[PDF] Font fallback to Helvetica:', e.message);
  doc.registerFont('Heading', 'Helvetica-Bold');
  doc.registerFont('Heading-SemiBold', 'Helvetica-Bold');
}
```

### Hero Image with Gradient Overlay (Title Page)
```javascript
// Source: PDFKit docs - images.html (cover option), vector.html (linearGradient)
const heroPath = path.resolve(assetsDir, 'hero', 'lehner-haus-hero.jpg');
const heroBuffer = await ctx.imageService.getCompressedImage(heroPath, 1200);

if (heroBuffer) {
  const heroHeight = 480;

  // Full-width hero image with cover mode
  doc.save();
  doc.rect(0, 0, 595, heroHeight).clip();
  doc.image(heroBuffer, 0, 0, { cover: [595, heroHeight], align: 'center', valign: 'center' });
  doc.restore();

  // Gradient overlay: transparent top -> dark bottom for text legibility
  const grad = doc.linearGradient(0, heroHeight * 0.3, 0, heroHeight);
  grad.stop(0, colors.primary, 0);
  grad.stop(0.6, colors.primary, 0.5);
  grad.stop(1, colors.primary, 0.9);
  doc.rect(0, heroHeight * 0.3, 595, heroHeight * 0.7).fill(grad);
}
```

### Full-Width Product Image (Component Page)
```javascript
// Source: PDFKit docs - images.html (fit option with alignment)
const imgHeight = 200;
const imgWidth = layout.contentWidth; // 475

if (imgBuffer) {
  doc.image(imgBuffer, layout.marginLeft, y, {
    fit: [imgWidth, imgHeight],
    align: 'center',
    valign: 'center'
  });
} else {
  layout.drawImagePlaceholder(doc, layout.marginLeft, y, imgWidth, imgHeight, categoryTitle);
}
y += imgHeight + 15;

// Emotional headline AFTER image
doc.font('Heading').fontSize(18).fillColor(colors.primary);
doc.text(component.name, layout.marginLeft, y, { width: imgWidth });
```

### Executive Summary Key Facts Grid
```javascript
// Source: Custom layout pattern using PDFKit primitives
const gridCols = 3;
const cellWidth = Math.floor((contentWidth - (gridCols - 1) * 12) / gridCols);
const cellHeight = 70;

const keyFacts = [
  { label: 'Haustyp', value: haustyp?.name || '-', icon: null },
  { label: 'Wandsystem', value: wall?.name || '-', icon: null },
  { label: 'KfW-Standard', value: kfwLabel, icon: null },
  { label: 'Heizung', value: heizung?.name || '-', icon: null },
  { label: 'Lueftung', value: lueftung?.name || 'Keine', icon: null },
  { label: 'Dacheindeckung', value: tiles?.name || '-', icon: null },
  { label: 'Dachform', value: dach?.name || '-', icon: null },
  { label: 'Fenster', value: windowData?.name || '-', icon: null },
  { label: 'Treppe', value: treppe?.name || 'Keine', icon: null }
];

keyFacts.forEach((fact, i) => {
  const col = i % gridCols;
  const row = Math.floor(i / gridCols);
  const cx = marginLeft + col * (cellWidth + 12);
  const cy = y + row * (cellHeight + 10);

  // Cell background
  doc.roundedRect(cx, cy, cellWidth, cellHeight, 4).fill(colors.grayLight);
  doc.rect(cx, cy, 3, cellHeight).fill(colors.gold);

  // Label
  doc.font('Helvetica').fontSize(7).fillColor(colors.textMuted);
  doc.text(fact.label, cx + 10, cy + 8, { width: cellWidth - 15 });

  // Value
  doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.primary);
  doc.text(fact.value, cx + 10, cy + 22, { width: cellWidth - 15 });
});
```

## State of the Art

| Old Approach (Current) | New Approach (Phase 3) | Impact |
|------------------------|------------------------|--------|
| 2-column layout on component pages (small image + specs side by side) | Full-width image on top, then text below | Dramatically more visual, matches magazine layout |
| Title page: logo centered in white space, solid green lower half | Hero photo with gradient overlay, logo + text on image | Emotional first impression, professional feel |
| Executive summary: simple table of key facts + components | Structured grid with visual hierarchy, clear scannable layout | One-page-glance at complete configuration |
| All Helvetica typography | Montserrat headings + Helvetica body (pending font confirmation) | Premium feel, visual differentiation between headings and body |
| Green/beige color palette | Navy/red corporate colors (pending confirmation) | Brand alignment per ROADMAP requirements |

## Asset Requirements

The following assets are needed but may not yet exist in the repository:

| Asset | Path | Status | Fallback |
|-------|------|--------|----------|
| Hero lifestyle image | `assets/hero/lehner-haus-hero.jpg` | MISSING -- needs to be provided | Use first haustyp image or solid color + branding |
| Montserrat Bold TTF | `assets/fonts/Montserrat-Bold.ttf` | MISSING -- download from Google Fonts | Helvetica-Bold (built-in) |
| Montserrat SemiBold TTF | `assets/fonts/Montserrat-SemiBold.ttf` | MISSING -- download from Google Fonts | Helvetica-Bold (built-in) |

**Existing assets that ARE available:**
- Logo: `Logo/LehnerLogo_schwaebischgut.jpg` (19 KB) and `.png` (50 KB)
- Product images: `assets/variants/walls/*.png`, `assets/variants/windows/*.png`, etc.
- Haustyp lifestyle photos: `assets/variants/haustypen/*/1.png` (1-1.3 MB each, 1000x686px)
- Technical drawings: `assets/variants/*/...-technical.png`

**Hero image recommendation:** Until a dedicated hero image is provided, the selected haustyp's first image (`assets/variants/haustypen/{selected}/1.png`) is the best fallback. These are 1000x686px lifestyle photos of actual Lehner houses, exactly what the requirement describes.

## Implementation Order Analysis

Based on the existing architecture and dependencies:

### Plan 03-01: Title Page Redesign
**Files modified:** `src/services/pdf/pages/titlePage.js`, `src/services/pdf/layout.js`
**New files:** `assets/fonts/` directory (font files), optionally `assets/hero/` directory
**Scope:** Color palette update in layout.js (affects ALL pages), font registration in pdfService.js, complete titlePage.js rewrite
**Risk:** Color palette change is the highest-risk change -- cascades to all 15 page modules. Visual regression testing needed.

### Plan 03-02: Component Page Hierarchy
**Files modified:** `src/services/pdf/pages/componentPage.js`, `src/services/pdf/pages/haustypPage.js`
**Scope:** Restructure layout from 2-column to visual-first top-down hierarchy
**Risk:** Medium -- the `renderComponent()` function is complex (234 lines) with conditional sections. Restructuring must preserve all conditional logic (premiumFeatures, advantages, comparisonNotes) while reordering visual hierarchy.

### Plan 03-03: Executive Summary One-Pager
**Files modified:** `src/services/pdf/pages/executiveSummary.js`
**Scope:** Redesign from simple table to structured grid with all 9 categories
**Risk:** Low -- self-contained page module, no dependencies on other modules. The current module already fetches all catalog data it needs.

## Open Questions

1. **Color Palette: Green or Navy?**
   - What we know: ROADMAP says `#003366`/`#C8102E` but codebase uses `#06402b`/`#b1a699` (green/beige)
   - What's unclear: Which is the actual Lehner Haus brand? The logo file should be inspected visually.
   - Recommendation: Implement per ROADMAP (`#003366`/`#C8102E`) but flag as needing client confirmation. The color change should be isolated to `layout.colors` so it's trivially reversible.

2. **Hero Image Source**
   - What we know: No dedicated hero image exists. Haustyp images are available as 1000x686px lifestyle photos.
   - What's unclear: Will the client provide a specific hero image?
   - Recommendation: Use the selected haustyp's first image as a dynamic hero. This is actually BETTER than a static hero because it personalizes the cover to the customer's chosen house type.

3. **Brand Font**
   - What we know: Prior phase noted "brand font unknown, Montserrat as fallback"
   - What's unclear: Does Lehner Haus have a brand font? (Many Mittelstand companies use standard fonts)
   - Recommendation: Download Montserrat Bold + SemiBold TTF files, implement with Helvetica fallback. If client provides brand font later, swap the TTF files -- the code pattern is identical.

## Sources

### Primary (HIGH confidence)
- [PDFKit Images Documentation](https://pdfkit.org/docs/images.html) - image embedding, fit/cover options, alignment
- [PDFKit Text Documentation](https://pdfkit.org/docs/text.html) - registerFont, custom fonts, text styling
- [PDFKit Vector Graphics](https://pdfkit.org/docs/vector.html) - linearGradient, opacity, clipping, save/restore
- Codebase inspection: `src/services/pdf/layout.js`, `src/services/pdfService.js`, all 15 page modules

### Secondary (MEDIUM confidence)
- [Google Fonts - Montserrat](https://fonts.google.com/specimen/Montserrat) - SIL Open Font License, TTF availability
- [GitHub - Montserrat](https://github.com/JulietaUla/Montserrat) - Official font repository

### Tertiary (LOW confidence)
- Color values `#003366` and `#C8102E` from ROADMAP -- needs confirmation against actual Lehner Haus brand guidelines

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - PDFKit 0.14.0 is installed and proven, all needed APIs verified in official docs
- Architecture: HIGH - Modular page structure from Phase 2 is clean and well-understood, all three target modules identified
- Pitfalls: HIGH - Based on direct codebase analysis and PDFKit API behavior
- Color palette: LOW - Discrepancy between requirements and implementation needs human resolution

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable domain, PDFKit API unlikely to change)
