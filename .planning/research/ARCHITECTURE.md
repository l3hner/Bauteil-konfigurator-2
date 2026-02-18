# Architecture Patterns

**Domain:** House component configurator with wizard UI and PDF sales document generation
**Researched:** 2026-02-17
**Confidence:** HIGH (based on existing codebase CLAUDE.md documentation + training knowledge of PDFKit, Express, EJS patterns)

---

## Existing Architecture (Baseline)

The current system follows a classic MVC-lite Express pattern:

```
Browser (single HTML form)
  → POST /submit
    → catalogService (validate selections)
    → submissionService (save JSON to disk)
    → pdfService (generate PDF with PDFKit)
    → redirect → GET /result/:id
      → EJS template → HTML response
```

The pdfService is monolithic at ~1,672 lines: one function per page type, all in one file. This works but creates friction when improving visual quality — every layout change requires touching the same large file with no isolation between page concerns.

---

## Target Architecture (Post-Milestone)

Two parallel concerns drive the new architecture:

1. **Wizard UI** — the single form becomes a stateful multi-step flow
2. **PDF quality** — the monolithic pdfService gets decomposed into page modules

These two concerns are independent. They share only the submission data structure.

```
Browser (multi-step wizard, JS-managed state)
  ↕ (step navigation via POST or session)
  → POST /submit (unchanged contract)
    → catalogService (unchanged)
    → submissionService (unchanged)
    → pdfService (decomposed into page renderers)
      → pdfLayout (shared: fonts, colors, helpers)
      → pdfPages/* (one module per page type)
    → redirect → GET /result/:id
```

---

## Component Boundaries

### Component Map

| Component | File(s) | Responsibility | Communicates With |
|-----------|---------|---------------|-------------------|
| WizardController | `public/js/wizard.js` | Step state machine, validation per step, progress indicator, browser history | EJS form template, session/localStorage |
| WizardState | `public/js/wizardState.js` OR localStorage | Holds in-progress selections across steps | WizardController |
| StepTemplates | `views/steps/*.ejs` OR inline | Per-step form markup | WizardController (via DOM) |
| catalogService | `src/services/catalogService.js` | Load catalog.json, filter by KfW, validate selections | Routes, pdfService |
| submissionService | `src/services/submissionService.js` | Serialize/deserialize submission JSON, parse rooms/Eigenleistungen | Routes, pdfService |
| pdfLayout | `src/services/pdf/layout.js` | Brand constants (colors, fonts, margins), shared draw helpers (header, footer, page number) | All pdfPage modules |
| pdfPages/* | `src/services/pdf/pages/*.js` | One module per page type: title, overview, services, each component page, raumplanung, eigenleistungen, closing | pdfLayout, pdfService |
| pdfService | `src/services/pdfService.js` | Orchestrator only: instantiate PDFDocument, call pages in order, pipe to file | pdfLayout, pdfPages/*, submissionService |
| catalogData | `data/catalog.json` | All selectable items with images, descriptions, advantages, KfW flags | catalogService |
| submissionStore | `data/submissions/*.json` | Persisted user configurations | submissionService |
| Routes | `src/routes/*.js` | HTTP boundary: parse request, call services, render template or redirect | All services |

### Boundary Rules

- **Routes** own HTTP concerns only. No PDF logic, no catalog logic.
- **catalogService** is the single source of truth for what is valid to select. The wizard front-end reads catalog data through an API endpoint or embedded in EJS; it does not duplicate validation.
- **pdfLayout** exports pure functions and constants — no side effects, no PDFDocument instantiation. Page modules import from it.
- **pdfPages modules** each export a single `render(doc, data, layout)` function. They do not call each other.
- **pdfService** is the only caller of pdfPages modules. It decides page order and conditionality (e.g., skip Lüftungssystem if not selected).
- **WizardController** runs entirely in the browser. It never talks to pdfService.

---

## Data Flow

### Wizard UI Data Flow

```
1. GET /
   → Express renders index.ejs
   → Catalog data embedded as JSON in template (or loaded via /api/catalog)
   → WizardController initializes: reads catalog JSON, sets step=1

2. User navigates steps
   → WizardController validates current step on "Weiter" click
   → State saved to localStorage (key: "konfigurator-draft")
   → DOM updated to show next step (no server round-trip)

3. User reaches final step, submits
   → Standard HTML form POST /submit (all fields collected from state)
   → Server processes exactly as before
```

Wizard state lives in the browser (localStorage). No server-side session needed. The final POST carries the complete selection — same as the current single-form POST. The submission contract is unchanged.

### PDF Generation Data Flow

```
1. submissionService.load(id) → submissionData object
2. pdfService.generate(submissionData) →
   a. new PDFDocument()
   b. layout = require('./pdf/layout')   // colors, fonts, margins
   c. for each page in ordered page list:
      if (pageCondition(submissionData)):
        pdfPages[pageName].render(doc, submissionData, layout)
   d. doc.pipe(fs.createWriteStream(outputPath))
   e. doc.end()
3. Output: output/{id}.pdf
```

### Catalog Data Flow

```
catalog.json
  → catalogService.loadAll()          // parse, cache in memory
  → catalogService.filterByKfw(std)   // return subset for current KfW selection
  → embedded in index.ejs OR
  → GET /api/catalog?kfw=KFW40        // JSON response for wizard JS
```

A lightweight `/api/catalog` endpoint (new, but tiny) lets the wizard re-filter options dynamically when the user changes KfW standard on step 1, without a full page reload.

### New Catalog Categories (Dächer, Treppen)

```
catalog.json (add "daecher", "treppen" arrays)
  → catalogService (add to category list — no structural change)
  → submissionService (add dach, treppe fields — additive change)
  → pdfService (add pdfPages/daech.js, pdfPages/treppe.js — additive)
  → wizard (add step for each new category)
  → views/result.ejs (add display fields)
```

Adding new categories is purely additive in all layers. No existing code paths change.

---

## PDF Service Decomposition

### Current State (Problem)

The 1,672-line `pdfService.js` mixes:
- Document setup (margins, fonts, colors)
- Page orchestration (which pages, what order, conditions)
- Per-page layout logic (positions, box sizes, text wrapping)
- Image loading/embedding
- Brand constants (hex colors, font paths)

A change to the title page layout risks touching lines adjacent to heating system layout code. There is no isolation.

### Target State (Decomposed)

```
src/services/pdf/
  layout.js           — brand constants + draw helpers (pure, no PDFDocument)
  pages/
    title.js          — render(doc, data, L) for title page
    overview.js       — render(doc, data, L) for Bauherr summary
    services.js       — render(doc, data, L) for Lehner Haus Leistungen
    ausenwand.js      — render(doc, data, L) for exterior wall
    innenwand.js      — render(doc, data, L) for interior wall
    fenster.js        — render(doc, data, L) for windows
    dach.js           — render(doc, data, L) for roof tiles
    haustyp.js        — render(doc, data, L) for house type
    heizung.js        — render(doc, data, L) for heating
    lueftung.js       — render(doc, data, L) for ventilation
    daecher.js        — NEW: render(doc, data, L) for Dachkonstruktion
    treppen.js        — NEW: render(doc, data, L) for Treppen
    raumplanung.js    — render(doc, data, L) for room planning
    eigenleistungen.js — render(doc, data, L) for self-performed work
    closing.js        — render(doc, data, L) for next steps
  pdfService.js       — orchestrator only (import pages, call in order)
```

### layout.js exports

```javascript
// Brand
const COLORS = { blue: '#003366', red: '#C8102E', lightGray: '#F5F5F5' };
const FONTS  = { regular: '...', bold: '...' };
const MARGINS = { top: 40, bottom: 40, left: 50, right: 50 };

// Helpers (all take `doc` as first arg)
function drawHeader(doc, title) { ... }
function drawFooter(doc, pageNum, totalPages) { ... }
function drawSectionBox(doc, x, y, w, h, options) { ... }
function drawImage(doc, filePath, x, y, w, h) { ... }  // with fallback
function drawAdvantagesList(doc, advantages, x, y) { ... }
```

### Page module contract

```javascript
// Example: src/services/pdf/pages/ausenwand.js
module.exports = {
  condition: (data) => Boolean(data.wall),
  render: (doc, data, L) => {
    // Uses only: doc (PDFDocument), data (submission), L (layout exports)
    // Adds exactly one page to doc
    // Returns nothing
  }
};
```

pdfService iterates:

```javascript
const pages = [title, overview, services, ausenwand, innenwand, ...];
for (const page of pages) {
  if (page.condition(data)) {
    page.render(doc, data, layout);
  }
}
```

---

## Wizard UI Structure

### Step Definition Pattern

```javascript
// public/js/wizard.js
const STEPS = [
  { id: 'kfw',         label: 'KfW-Standard',      fields: ['kfw_standard'] },
  { id: 'haustyp',     label: 'Haustyp',            fields: ['haustyp'] },
  { id: 'ausenwand',   label: 'Außenwand',          fields: ['wall'], dependsOn: 'kfw_standard' },
  { id: 'innenwand',   label: 'Innenwand',          fields: ['innerwall'] },
  { id: 'fenster',     label: 'Fenster',            fields: ['window'] },
  { id: 'dach',        label: 'Dacheindeckung',     fields: ['tiles'] },
  { id: 'daecher',     label: 'Dachkonstruktion',   fields: ['dach'] },   // NEW
  { id: 'treppen',     label: 'Treppen',            fields: ['treppe'] }, // NEW
  { id: 'heizung',     label: 'Heizung',            fields: ['heizung'] },
  { id: 'lueftung',    label: 'Lüftung',            fields: ['lueftung'], dependsOn: 'kfw_standard' },
  { id: 'raumplanung', label: 'Raumplanung',        fields: ['rooms'] },
  { id: 'eigenleistungen', label: 'Eigenleistungen', fields: ['eigenleistungen'] },
  { id: 'bauherr',     label: 'Kontaktdaten',       fields: ['vorname','nachname','email','telefon'] },
  { id: 'zusammenfassung', label: 'Zusammenfassung', fields: [] },
];
```

### State Management

State is plain JSON in localStorage. No framework needed (vanilla JS).

```javascript
// wizardState.js
const STATE_KEY = 'konfigurator-draft';

function getState() { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); }
function setState(patch) { localStorage.setItem(STATE_KEY, JSON.stringify({...getState(), ...patch})); }
function clearState() { localStorage.removeItem(STATE_KEY); }
```

On final submit, hidden inputs are populated from state before form submission. State is cleared on successful redirect to `/result/:id`.

### Step Navigation

- "Weiter" validates current step fields (required, selection made)
- "Zurück" goes to previous step, no validation
- Progress bar shows current step / total steps
- URL hash (`#step-3`) optionally updated for back-button support
- KfW-dependent steps refilter their options when KfW value changes (read from state)

---

## Suggested Build Order

Dependencies flow in this order — build earlier items first.

### Layer 0: Catalog Expansion (no dependencies)
Add Dächer and Treppen to `catalog.json`. This unblocks all other work.

### Layer 1: PDF Layout Foundation (depends on: nothing new)
Extract `src/services/pdf/layout.js` from existing pdfService. Establish brand constants and helper functions. Existing pdfService continues to work during this refactor.

### Layer 2: PDF Page Modules (depends on: Layer 1)
Move each page type out of pdfService into `src/services/pdf/pages/*.js`. One module at a time — test PDF output after each extraction. pdfService shrinks to orchestrator only.

### Layer 3: PDF Visual Quality (depends on: Layer 2)
With isolated page modules, improve layouts page-by-page. Better image sizing, whitespace, typography, color use. Each page module is now independently editable.

### Layer 4: New PDF Pages (depends on: Layer 2, Layer 0)
Add `daecher.js` and `treppen.js` page modules. Add them to pdfService orchestrator.

### Layer 5: Wizard UI (depends on: Layer 0 for new categories, otherwise independent)
Convert index.ejs single form to wizard. Add wizard.js and wizardState.js. Add `/api/catalog` endpoint if dynamic KfW re-filtering is needed. Final POST contract unchanged — this layer does not touch any service.

### Layer 6: Result Page & Content Polish (depends on: Layer 5, Layer 4)
Update result.ejs to show new categories. Polish catalog item descriptions, advantages, comparisonNotes for new and existing items.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Wizard State in Server Session
**What:** Using Express `express-session` to hold wizard state between steps, with a POST per step
**Why bad:** Adds session middleware dependency, complicates horizontal scaling (not relevant now but unnecessary complexity), requires server round-trip per step (slower, breaks offline gracefully)
**Instead:** localStorage state + single final POST. Zero new dependencies.

### Anti-Pattern 2: Leaving pdfService Monolithic
**What:** Adding more page logic directly into the 1,672-line file
**Why bad:** Every visual improvement requires navigating a huge file; merge conflicts are certain; testing any one page requires running the whole PDF
**Instead:** Extract to page modules first (Layer 2), then improve (Layer 3)

### Anti-Pattern 3: Duplicating Catalog Validation in Wizard JS
**What:** Re-implementing "is this selection valid for KFW40?" in browser JS independently from catalogService
**Why bad:** Two sources of truth diverge; server must always re-validate anyway
**Instead:** Server remains authoritative. Browser JS uses embedded catalog data from EJS for UX filtering only. Server validates on submit.

### Anti-Pattern 4: Adding a Frontend Framework for the Wizard
**What:** Installing Vue, React, or Alpine.js to manage wizard state
**Why bad:** Overkill for a linear step wizard with ~14 steps; contradicts existing vanilla JS pattern; introduces build pipeline where none exists
**Instead:** Vanilla JS with a simple STEPS array and localStorage. The wizard logic is ~150 lines, not a framework-level problem.

### Anti-Pattern 5: Generating PDF in the POST Handler Synchronously Blocking Long Response
**What:** PDF generation inline in `/submit` POST, user waits for full PDF before redirect
**Why bad:** PDFKit is synchronous/streaming but image loading can be slow; user sees blank screen
**Instead:** Current pattern (generate then redirect) is acceptable at this scale. If PDF generation exceeds ~2s, move to background generation with polling on result page — but do not prematurely optimize.

---

## Scalability Considerations

| Concern | Current Scale (now) | At 10x submissions/day | At 100x |
|---------|--------------------|-----------------------|---------|
| PDF generation | Synchronous, inline in request | Still fine | Move to job queue (BullMQ) |
| Submission storage | JSON files on disk | Still fine | Consider SQLite |
| Catalog data | Loaded from disk per request | Add in-memory cache in catalogService | Already cached |
| Wizard state | localStorage | No server impact | No server impact |
| PDF file storage | Local `output/` directory | Add cleanup job for old PDFs | Move to S3/object storage |

This milestone is solidly in "current scale" territory. No scalability architecture changes are warranted.

---

## Sources

- Existing project CLAUDE.md documentation (authoritative — describes current codebase state)
- PDFKit documentation patterns (HIGH confidence — well-established API, stable since v0.8)
- Express.js routing and middleware patterns (HIGH confidence — core patterns unchanged for years)
- localStorage-based wizard state pattern (HIGH confidence — standard industry practice for linear form wizards without framework dependency)
- Training knowledge of Node.js module decomposition patterns (HIGH confidence for this domain)
