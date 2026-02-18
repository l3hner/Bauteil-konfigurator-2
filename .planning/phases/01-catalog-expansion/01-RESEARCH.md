# Phase 1: Catalog Expansion - Research

**Researched:** 2026-02-18
**Domain:** Adding new catalog categories (Daecher, Treppen) to an existing Node.js/Express configurator with PDFKit PDF generation
**Confidence:** HIGH

## Summary

Phase 1 adds two new catalog categories ("daecher" for roof forms and "treppen" for staircase options) to an existing house configurator. The codebase already has 8 working categories (walls, innerwalls, decken, windows, tiles, haustypen, heizung, lueftung) with an established pattern for catalog entries, form rendering, whitelist validation, submission persistence, and PDF page generation.

The primary risk is backward compatibility: 3 existing submissions lack fields for `decke` (already missing), `dach`, and `treppe`. The code already uses optional chaining (`?.`) and null checks in many places, but not consistently -- several `getVariantById` calls pass `undefined` submission fields without guarding the result, which can cause silent failures or layout bugs in the PDF rather than 500 errors. The migration script must add default values AND the existing null-check patterns must be audited.

**Primary recommendation:** Follow the established "decken" category addition pattern exactly. Add catalog data, getter methods, validation rules, form sections, submission fields, PDF component entries, and placeholder images. Then write a migration script that adds `schemaVersion: 2`, `dach: null`, and `treppe: null` to all existing submissions, and add defensive null-checks at every point where these fields are consumed.

## Standard Stack

### Core (already in use -- no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express | ^4.18.2 | HTTP routing | Already used for all routes |
| EJS | ^3.1.9 | Server-side form rendering | Already renders all form sections |
| PDFKit | ^0.14.0 | PDF generation | Already generates all component pages |
| uuid | ^9.0.1 | Submission ID generation | Already used in submissionService |
| Jimp | ^1.6.0 (dev) | Placeholder image generation | Already used in scripts/ |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs (built-in) | - | Read/write catalog.json and submissions | Already used throughout |
| path (built-in) | - | File path construction | Already used throughout |

### Alternatives Considered

None. This phase uses exclusively existing libraries and patterns. No new dependencies are required.

**Installation:**
```bash
# No installation needed -- all dependencies are already present
```

## Architecture Patterns

### Existing Project Structure (relevant files)
```
data/
  catalog.json              # Add "daecher" and "treppen" arrays
  submissions/              # Existing submissions need migration
src/
  routes/
    index.js                # Pass new categories to EJS template
    submit.js               # Add dach/treppe to submission object
  services/
    catalogService.js       # Add getDaecher(), getTreppen(), validate
    submissionService.js    # No parsing changes needed (simple fields)
    pdfService.js           # Add component entries for Dach and Treppe pages
views/
  index.ejs                 # Add form sections for Dach and Treppen
public/
  js/script.js              # Update progress tracking (step count)
assets/
  variants/
    daecher/                # New directory for roof images
    treppen/                # New directory for stair images
scripts/
  migrate-submissions.js    # New migration script
```

### Pattern 1: Adding a New Catalog Category (established precedent: "decken")

The `decken` category was the most recently added category. Its integration pattern across all files is the canonical model.

**catalog.json entry pattern:**
```json
{
  "id": "unique-id",
  "name": "Display Name",
  "description": "Short German description",
  "constructionType": "optional type classifier",
  "premiumFeatures": ["Feature 1", "Feature 2"],
  "layers": [
    { "name": "Layer name", "value": "dimension or empty string" }
  ],
  "technicalDetails": {
    "key": "value"
  },
  "options": [
    { "position": "Pos. XX.XXX", "description": "Option description" }
  ],
  "advantages": ["Advantage 1", "Advantage 2"],
  "comparisonNotes": "Comparison tips text",
  "filePath": "assets/variants/category/image.png",
  "technicalDrawing": "assets/variants/category/image-technical.png"
}
```

**catalogService.js pattern:**
```javascript
getDaecher() {
  return this.catalog.daecher || [];
}

getTreppen() {
  return this.catalog.treppen || [];
}

// In validateSelection():
if (selection.dach && !this.getVariantById('daecher', selection.dach)) {
  errors.push('Ungueltige Dachauswahl');
}
if (selection.treppe && !this.getVariantById('treppen', selection.treppe)) {
  errors.push('Ungueltige Treppenauswahl');
}
```

**Note the naming convention mismatch:** The category key in catalog.json is plural German ("daecher", "treppen") but the submission field is singular ("dach", "treppe"). This follows the existing pattern: category "walls" -> field "wall", category "innerwalls" -> field "innerwall", category "decken" -> field "decke", category "tiles" -> field "tiles" (exception).

**index.js route pattern:**
```javascript
const daecher = catalogService.getDaecher();
const treppen = catalogService.getTreppen();
// Add to catalog object passed to EJS
```

**submit.js pattern:**
```javascript
// In submission object:
dach: formData.dach,
treppe: formData.treppe,
```

**pdfService.js component array pattern (line ~128):**
```javascript
// Add to the components array:
{ title: 'Dachform', data: catalogService.getVariantById('daecher', submission.dach), chapter: '5.7' },
{ title: 'Treppensystem', data: catalogService.getVariantById('treppen', submission.treppe), chapter: '5.8' },
```

**EJS form section pattern:**
```html
<section class="form-section" id="section-N">
    <h3 class="section-title">N. Category Title</h3>
    <div class="radio-group">
        <% catalog.daecher.forEach(dach => { %>
        <label class="radio-card">
            <input type="radio" name="dach" value="<%= dach.id %>" onchange="updateProgress();">
            <div class="radio-content">
                <h4><%= dach.name %></h4>
                <p><%= dach.description %></p>
            </div>
            <span class="checkmark">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
        </label>
        <% }); %>
    </div>
</section>
```

### Pattern 2: PDF Component Page Generation (conditional skip for null data)

The PDF generation already handles missing component data gracefully in the main loop:

```javascript
for (const comp of components) {
  if (comp.data) {  // <-- null/undefined data skips the page entirely
    doc.addPage();
    pageNum++;
    // ... render page
  } else {
    console.log(`[PDF] SKIPPED: ${comp.title} - no data`);
  }
}
```

This means if `submission.dach` is undefined (old submissions), `getVariantById('daecher', undefined)` returns `undefined`, and the page is simply skipped. This is the correct behavior for backward compatibility.

### Pattern 3: Progress Tracking in script.js

The progress bar uses a numbered sections object. Adding new steps means:
1. Adding new entries to the `sections` object
2. Updating `totalSteps` count
3. Adding corresponding progress step indicators in the EJS HTML

### Anti-Patterns to Avoid

- **Inconsistent null checking:** The codebase has BOTH `?.` (optional chaining) and direct property access. Wherever submission fields are accessed, use `?.` consistently. Several places in pdfService.js access `submission.dach` directly which returns `undefined` for old submissions -- this is actually fine since `getVariantById('daecher', undefined)` returns `undefined`, but any code that subsequently accesses properties of the result (like `dachData.name`) without `?.` will crash.

- **Hardcoded component lists in multiple places:** The pdfService.js accesses component data in at least 6 separate methods (generatePDF, drawExecutiveSummary, drawLeistungsuebersicht, drawOverviewContent, drawComparisonChecklist, and the unnamed section around line 700). Each must be updated independently. Missing one causes silent data omission, not a crash.

- **Forgetting the fallback in loadCatalog():** The constructor fallback (line 17-20) lists all category keys. If `daecher` or `treppen` are missing from that fallback, a corrupt/missing catalog.json would cause getVariantById to crash on `undefined[category]`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Placeholder images | Custom PNG creation | Existing `scripts/generate-placeholder-images.js` | Already handles all categories automatically from catalog.json |
| Schema migration | Manual JSON editing | Write a dedicated migration script | 3 submissions now, but pattern needed for future changes |
| UUID generation | Custom ID scheme | uuid v4 (already in use) | Consistent with existing submission IDs |

**Key insight:** Every piece of infrastructure needed for this phase already exists. The work is purely additive -- adding entries to existing data structures and extending existing methods.

## Common Pitfalls

### Pitfall 1: Existing Submissions Already Have Stale IDs
**What goes wrong:** The 3 existing submissions use `wall: "climativ-plus-esb"` and `innerwall: "innenwand-esb-gipskarton"` which do NOT match any current catalog IDs. The current catalog has `wall: "climativ-plus"` and `innerwall: "iw80"`. This means `getVariantById('walls', 'climativ-plus-esb')` returns `undefined` even today.
**Why it happens:** The catalog IDs were changed after these submissions were created. No migration was done.
**How to avoid:** The migration script should either (a) update old field values to match current catalog IDs, or (b) add ID aliases in the catalog, or (c) accept that old submissions display with missing components. The pragmatic choice is (c) since these are test submissions from development, but the migration script should log warnings.
**Warning signs:** Loading an old submission's result page shows blank component names.

### Pitfall 2: Six Separate Component Lookup Locations in pdfService.js
**What goes wrong:** Adding a new component to the `components` array at line 128 but forgetting to add it to `drawExecutiveSummary` (line 473), `drawLeistungsuebersicht` (line 631), `drawOverviewContent` (line 702), or `drawComparisonChecklist` (line 1433). The PDF generates without error but omits the new component from summary pages.
**Why it happens:** pdfService.js is 1672 lines with duplicated component lookup logic across multiple methods.
**How to avoid:** Create a checklist of all locations. Search for `getVariantById` -- there are 27 calls across the file. Each method that builds a component list must include the new categories.
**Warning signs:** Component pages render but summary pages don't mention the new components.

### Pitfall 3: Form Section Numbering Cascade
**What goes wrong:** Inserting new sections in the middle of the form requires renumbering all subsequent sections and their corresponding progress step numbers, both in the EJS HTML and in the `script.js` sections object.
**Why it happens:** Sections are numbered 1-14 (now expanding to 16). Every section after the insertion point needs a new number.
**How to avoid:** Plan the insertion points carefully. The most logical placement for "Dachform" is after "Dacheindeckung" (section 8) as a section 8 replacement/expansion, and "Treppen" after Dach. But this would renumber sections 9-14 to 10-16. Alternative: append at the end (before Raumplanung and Eigenleistungen) to minimize disruption.
**Warning signs:** Progress bar shows wrong step counts, scroll spy activates wrong steps.

### Pitfall 4: Missing Category in loadCatalog Fallback
**What goes wrong:** If catalog.json fails to load, the fallback object in `loadCatalog()` (line 17) must include `daecher: []` and `treppen: []`. Otherwise, `this.catalog.daecher` is `undefined`, and `getVariantById('daecher', id)` crashes with `Cannot read properties of undefined`.
**Why it happens:** The fallback object was last updated when decken was added but is easy to forget.
**How to avoid:** Add both `daecher: []` and `treppen: []` to the fallback object.

### Pitfall 5: Tiles vs Daecher Naming Confusion
**What goes wrong:** The existing "tiles" category covers roof tiles (Dachziegel), while the new "daecher" category covers roof forms/shapes (Satteldach, Walmdach, Pultdach, Flachdach). These are related but distinct concepts. The form must make this distinction clear in German.
**Why it happens:** Both relate to "Dach" (roof) in German. "tiles" = Dacheindeckung (roof covering material), "daecher" = Dachform (roof shape/geometry).
**How to avoid:** Use clear German section titles: "Dacheindeckung" stays for tiles, "Dachform" for the new category. Consider whether the Dachform section should appear before Dacheindeckung since shape is decided before material.
**Warning signs:** Users/Fachberater confuse the two sections or think one replaces the other.

## Code Examples

### Example 1: Complete Catalog Entry for Daecher

Based on the existing catalog structure and typical Lehner Haus offerings:

```json
{
  "daecher": [
    {
      "id": "satteldach",
      "name": "Satteldach",
      "description": "Der Klassiker im Hausbau - zwei geneigte Dachflaechen treffen sich am First. Vielfaeltige Gestaltungsmoeglichkeiten durch variable Dachneigung.",
      "premiumFeatures": [
        "Bewaehrteste Dachform mit optimaler Regenableitung",
        "Variable Dachneigung fuer individuelle Gestaltung"
      ],
      "advantages": [
        "Optimale Raumausnutzung im Dachgeschoss",
        "Bewaehrte Konstruktion - langlebig und wartungsarm",
        "Grosse Gestaltungsfreiheit bei Gauben und Erkern",
        "Beste Voraussetzungen fuer Photovoltaik"
      ],
      "comparisonNotes": "Das Satteldach ist die meistgebaute Dachform in Deutschland...",
      "filePath": "assets/variants/daecher/satteldach.png",
      "technicalDrawing": "assets/variants/daecher/satteldach-technical.png"
    }
  ]
}
```

### Example 2: Migration Script Pattern

```javascript
const fs = require('fs').promises;
const path = require('path');

const SUBMISSIONS_DIR = path.join(__dirname, '..', 'data', 'submissions');
const TARGET_SCHEMA_VERSION = 2;

async function migrate() {
  const files = await fs.readdir(SUBMISSIONS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  let migrated = 0;
  let skipped = 0;

  for (const file of jsonFiles) {
    const filePath = path.join(SUBMISSIONS_DIR, file);
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

    if (data.schemaVersion >= TARGET_SCHEMA_VERSION) {
      skipped++;
      continue;
    }

    // Add missing fields with null defaults
    if (!('dach' in data)) data.dach = null;
    if (!('treppe' in data)) data.treppe = null;
    if (!('decke' in data)) data.decke = null;
    data.schemaVersion = TARGET_SCHEMA_VERSION;

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    migrated++;
  }

  console.log(`Migrated: ${migrated}, Skipped: ${skipped}`);
}
```

### Example 3: Defensive Null Check Pattern in pdfService.js

Where components are looked up for summary pages:

```javascript
// GOOD: defensive pattern used in existing code
const dach = catalogService.getVariantById('daecher', submission.dach);
// dach is undefined if submission.dach is null/undefined -- this is fine

// In component list:
['Dachform', dach?.name, ''],  // ?. prevents crash if dach is undefined

// DANGER: accessing nested properties without guard
const dachName = dach.name;  // CRASHES if dach is undefined
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No decke field in submissions | decke field added to form and catalog | Recent (pre-existing submissions lack it) | Old submissions already silently skip decke in PDF |
| No schemaVersion | Will add schemaVersion with Phase 1 | Phase 1 | Enables future migrations |

**Deprecated/outdated:**
- The existing submissions have stale catalog IDs from a previous catalog revision. This is a pre-existing issue not introduced by Phase 1.

## Specific Findings for Each Touchpoint

### Touchpoint Inventory: Files That Must Change

| # | File | What Changes | Risk |
|---|------|-------------|------|
| 1 | `data/catalog.json` | Add `daecher` and `treppen` arrays | LOW - additive |
| 2 | `src/services/catalogService.js` | Add getDaecher(), getTreppen(), fallback keys, validation rules | LOW - follows pattern |
| 3 | `src/routes/index.js` | Pass daecher/treppen to template | LOW - 2 lines |
| 4 | `src/routes/submit.js` | Add dach/treppe to submission object | LOW - 2 lines |
| 5 | `views/index.ejs` | Add 2 new form sections, renumber subsequent sections, update progress steps | MEDIUM - renumbering cascade |
| 6 | `public/js/script.js` | Update sections object, totalSteps, add progress step checks | MEDIUM - must match EJS numbering |
| 7 | `src/services/pdfService.js` | Add to components array (line ~128), drawExecutiveSummary (~473), drawLeistungsuebersicht (~631), drawOverviewContent (~702) | HIGH - 6+ locations, 1672 lines |
| 8 | `scripts/generate-placeholder-images.js` | Add color entries for daecher/treppen | LOW - 2 lines |
| 9 | `scripts/migrate-submissions.js` | NEW file - migrate existing submissions | LOW - new file |
| 10 | `views/result.ejs` | Optionally show dach/treppe in summary | LOW - nice to have |

### pdfService.js Detailed Impact Analysis

Methods that build component lists and MUST include daecher/treppen:

| Method | Line | What It Does | Must Add |
|--------|------|-------------|----------|
| `generatePDF` | 128-135 | Main components array for individual pages | `daecher` and `treppen` entries |
| `drawExecutiveSummary` | 473-492 | "Gewahlte Komponenten" summary table | Rows for Dachform and Treppe |
| `drawLeistungsuebersicht` | 631-644 | "Ihre zusaetzlich gewaehlten Ausstattungsmerkmale" highlights | Entries for dach/treppe |
| `drawOverviewContent` | 702-717 | Components list in overview | Entries for dach/treppe |
| `drawComparisonChecklist` | 1433 | Only uses wall currently | No change needed |

## Open Questions

1. **What specific Dachformen does Lehner Haus offer?**
   - What we know: Standard German house building includes Satteldach, Walmdach, Pultdach, Flachdach, Zeltdach. The exact Lehner Haus portfolio is not documented in the codebase.
   - What's unclear: Which forms are actually offered, their technical specs, pricing tiers, and which ones are compatible with which Haustypen.
   - Recommendation: Start with the 4 most common (Satteldach, Walmdach, Pultdach, Flachdach) with placeholder descriptions. The Fachberater/product team can refine the texts later. This matches the pattern used when other categories were first added.

2. **What specific Treppen options does Lehner Haus offer?**
   - What we know: Requirements specify "Innen- und Auentreppen" (indoor and outdoor stairs). Typical offerings include Holztreppe, Betontreppe, Stahltreppe for interiors, and various outdoor stair materials.
   - What's unclear: Exact product lineup, whether this is purely material selection or also includes construction style (gerade, gewendelt, Spindeltreppe).
   - Recommendation: Start with 3-4 common options (Holzwangentreppe, Betontreppe, Stahlholztreppe) for indoor and 2 outdoor options. Refine with product team later.

3. **Where should Dachform and Treppen appear in the form sequence?**
   - What we know: Current order is Kontakt -> Haus -> Energie -> Wand -> Innen -> Decke -> Fenster -> Dach(ziegel) -> Heizung -> Lueftung -> Personen -> Grundstueck -> Raeume -> Eigen
   - What's unclear: Whether Dachform should be before or after Dacheindeckung, and where Treppen fits logically.
   - Recommendation: Place Dachform BEFORE Dacheindeckung (choose shape before material) and Treppen after Fenster. New order: ...Fenster -> Dachform -> Dacheindeckung -> Treppen -> Heizung... This requires renumbering sections 8-14 to 8-16.

4. **Should Dachform have kfwCompatible filtering like walls/lueftung?**
   - What we know: Walls and Lueftung are filtered by KfW standard. Dachformen are generally KfW-neutral (energy efficiency depends on insulation, not shape).
   - Recommendation: No KfW filtering for Dachform. All forms available regardless of energy standard. Add `kfwCompatible: ["KFW55", "KFW40"]` to all entries for schema consistency.

5. **Are Treppen optional?**
   - What we know: Bungalows typically have no interior stairs. Some Haustypen require them.
   - Recommendation: Make the Treppen field optional (not required). The form should allow "keine Treppe" as a valid selection for bungalows. In the PDF, skip the Treppen page if no selection was made (same pattern as Lueftung).

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all 10 touchpoint files
- Examination of 3 existing submission JSON files
- catalog.json structure with all 8 existing categories
- pdfService.js complete method inventory (1672 lines, 27 getVariantById calls)

### Secondary (MEDIUM confidence)
- German house building terminology for roof forms and stair types (based on domain knowledge common in the DACH construction industry)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, purely extending existing patterns
- Architecture: HIGH - 8 existing categories provide a clear, repeatable template
- Pitfalls: HIGH - Found through direct code analysis, not speculation. The stale-ID problem in existing submissions is verified by comparing submission JSON against catalog.json IDs.

**Research date:** 2026-02-18
**Valid until:** No expiration -- findings are based on static codebase analysis, not external library versions
