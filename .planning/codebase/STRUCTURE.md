# Codebase Structure

**Analysis Date:** 2026-02-17

## Directory Layout

```
bauteil-konfigurator2/
├── src/                    # All server-side application code
│   ├── server.js           # Express app entry point
│   ├── routes/             # HTTP route handlers (one file per route)
│   │   ├── index.js        # GET /
│   │   ├── submit.js       # POST /submit
│   │   ├── result.js       # GET /result/:id
│   │   └── pdf.js          # GET /pdf/:id
│   ├── services/           # Business logic (singletons)
│   │   ├── catalogService.js
│   │   ├── submissionService.js
│   │   └── pdfService.js
│   └── utils/              # Pure utility helpers
│       └── fileUtils.js
├── views/                  # EJS server-rendered templates
│   ├── index.ejs           # Main configuration form (multi-step)
│   ├── result.ejs          # Post-submission result/download page
│   ├── error.ejs           # Error display page
│   └── layout.ejs          # Shared HTML shell (title, header, footer)
├── public/                 # Statically served client-side files
│   ├── css/
│   │   └── style.css       # All UI styling
│   └── js/
│       └── script.js       # KfW logic, form progress, toast notifications
├── data/                   # Persistent data on disk
│   ├── catalog.json        # Product catalog (all 8 categories)
│   └── submissions/        # One JSON file per user submission (UUID-named)
├── assets/                 # Static product images served at /assets
│   └── variants/           # Product images grouped by category
│       ├── walls/          # Exterior wall product images
│       ├── innenwalls/     # Interior wall product images
│       ├── decken/         # Ceiling product images
│       ├── windows/        # Window product images
│       ├── tiles/          # Roof tile product images
│       ├── haustypen/      # House type images (subdirs: bungalow, stadtvilla, etc.)
│       ├── heizung/        # Heating system images
│       └── lueftung/       # Ventilation system images
├── output/                 # Generated PDFs (runtime, gitignored)
│   └── Leistungsbeschreibung_{uuid}.pdf
├── scripts/                # Developer utility scripts (not used in production)
│   ├── generate-placeholder-images.js
│   ├── create-dummy-assets.js
│   └── optimize-images.js
├── test/                   # Manual/ad-hoc test scripts (no test framework)
│   ├── pdf-generator.test.js
│   ├── test-pdf-generation.js
│   ├── test-catalog-debug.js
│   ├── test-catalog-getvariant.js
│   ├── test-innerwall-loading.js
│   ├── test-specific-pdf.js
│   └── verify-fixes.js
├── test-fixtures/          # Static test data
│   ├── golden-sample.json  # Reference submission JSON for PDF testing
│   └── index.html          # Static HTML fixture
├── docs/                   # Developer documentation (markdown/text files)
├── .planning/              # GSD planning artifacts (not deployed)
│   └── codebase/           # Codebase analysis documents
├── package.json            # Dependencies and npm scripts
├── render.yaml             # Render.com deployment configuration
├── CLAUDE.md               # Project-specific Claude Code instructions
└── README.md               # Project overview
```

## Directory Purposes

**`src/routes/`:**
- Purpose: Thin HTTP handlers — parse request, call services, return response
- Contains: One `.js` file per URL path; no business logic
- Key files: `src/routes/submit.js` (heaviest — orchestrates validate + save + PDF)

**`src/services/`:**
- Purpose: All application logic, side effects, and external integrations
- Contains: Singleton class instances; instantiated at module load time
- Key files: `src/services/pdfService.js` (1,672 lines, most complex file in project)

**`src/utils/`:**
- Purpose: Stateless helper functions with no service dependencies
- Contains: `fileUtils.js` — `isPathSafe`, `getFileHash`, `fileExists`, `getFileExtension`

**`views/`:**
- Purpose: EJS templates; rendered server-side and sent as full HTML pages
- `index.ejs` is the main customer-facing page — multi-step form with all configurable fields

**`public/`:**
- Purpose: Files served verbatim under the root URL path
- `public/css/style.css` — all UI styles (single file, no preprocessor)
- `public/js/script.js` — dynamic form behavior (KfW field toggling, progress bar, toast notifications)

**`data/`:**
- Purpose: Application data persisted to disk
- `data/catalog.json` — the authoritative product catalog; 8 top-level arrays: `walls`, `innerwalls`, `decken`, `windows`, `tiles`, `haustypen`, `heizung`, `lueftung`
- `data/submissions/` — one `{uuid}.json` per submitted configuration; created at runtime

**`assets/variants/`:**
- Purpose: Product images referenced by `filePath` and `technicalDrawing` fields in `data/catalog.json`; served at `/assets/` URL prefix
- Images are PNG format; subdirectory names match catalog category keys

**`output/`:**
- Purpose: Runtime output directory for generated PDFs
- File naming: `Leistungsbeschreibung_{uuid}.pdf`
- Not committed to git (listed in `.gitignore`)

**`scripts/`:**
- Purpose: Developer-only utilities for generating placeholder and optimized images
- Not executed as part of application runtime

**`test/`:**
- Purpose: Ad-hoc Node.js scripts for manual testing during development; no test runner
- Run directly with `node test/test-pdf-generation.js`

## Key File Locations

**Entry Points:**
- `src/server.js`: Express application bootstrap — start here to understand the app
- `src/routes/index.js`: Root route rendering the configuration form
- `src/routes/submit.js`: Core form submission handler (validate → save → PDF → redirect)

**Configuration:**
- `package.json`: Dependencies; `npm start` runs `node src/server.js`
- `render.yaml`: Production deployment config (Render.com, Node, port 10000)
- `data/catalog.json`: Product catalog — edit here to add/remove/modify selectable components

**Core Logic:**
- `src/services/catalogService.js`: Catalog reads and whitelist validation
- `src/services/submissionService.js`: Submission persistence and form data parsing
- `src/services/pdfService.js`: Entire PDF layout and content generation

**Views:**
- `views/index.ejs`: Configuration form UI
- `views/result.ejs`: Result and PDF download UI

**Styling / Client JS:**
- `public/css/style.css`: All CSS
- `public/js/script.js`: All client-side behavior

## Naming Conventions

**Files:**
- Route files: camelCase matching their primary path segment — `index.js`, `submit.js`, `result.js`, `pdf.js`
- Service files: camelCase with `Service` suffix — `catalogService.js`, `submissionService.js`, `pdfService.js`
- Utility files: camelCase with descriptive noun — `fileUtils.js`
- Views: camelCase — `index.ejs`, `result.ejs`
- Test scripts: kebab-case prefixed with `test-` — `test-pdf-generation.js`

**Directories:**
- Source code: lowercase — `src/`, `routes/`, `services/`, `utils/`
- Static assets: lowercase — `public/`, `assets/`, `views/`
- Product image dirs: match catalog category keys (lowercase) — `walls/`, `innerwalls/`, `decken/`, `heizung/`

**Variables / Functions in JS:**
- camelCase for variables, functions, class methods
- PascalCase for classes — `CatalogService`, `SubmissionService`, `PdfService`
- German domain terms as-is — `submission.bauherr_vorname`, `submission.kfw_standard`, `rooms.erdgeschoss`

## Where to Add New Code

**New catalog category:**
- Add array to `data/catalog.json`
- Add getter method in `src/services/catalogService.js`
- Add validation check in `catalogService.validateSelection()`
- Add form section to `views/index.ejs`
- Add corresponding field to submission object in `src/routes/submit.js`
- Add component page draw call in `src/services/pdfService.js` `generatePDF()`
- Add product images under `assets/variants/{category}/`

**New route:**
- Create `src/routes/{name}.js` following existing pattern (express.Router, module.exports = router)
- Mount in `src/server.js` with `app.use('/{path}', require('./routes/{name}'))`

**New service:**
- Create `src/services/{name}Service.js` as a class, export singleton (`module.exports = new NameService()`)
- Require it in the routes that need it

**New utility function:**
- Add to `src/utils/fileUtils.js` if filesystem-related; create a new `src/utils/{topic}Utils.js` file for other concerns

**New EJS template:**
- Add to `views/` as `{name}.ejs`
- Reference from a route via `res.render('{name}', { ...data })`

**New PDF page type:**
- Add a `draw{PageName}(doc, ...)` method to `PdfService` in `src/services/pdfService.js`
- Call it from `generatePDF()` with `doc.addPage()` before it and `this.drawFooter(doc, pageNum)` after

## Special Directories

**`output/`:**
- Purpose: Runtime PDF output
- Generated: Yes (at runtime by `pdfService`)
- Committed: No (in `.gitignore`)

**`data/submissions/`:**
- Purpose: Persisted user submissions
- Generated: Yes (at runtime by `submissionService`)
- Committed: No (submissions are user data; `.gitignore` excludes JSON files inside)

**`.planning/`:**
- Purpose: GSD planning artifacts and codebase analysis documents
- Generated: Yes (by GSD tooling)
- Committed: Yes (planning documents are tracked)

**`bauteilinformationen/`:**
- Purpose: Source material (photos, PDFs, reference documents from Lehner Haus marketing)
- Generated: No (manually added assets)
- Committed: Yes

**`PDF VORGABEN/`:**
- Purpose: PDF design reference files (BAuteile, Haustyp subdirs) used as design templates
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-02-17*
