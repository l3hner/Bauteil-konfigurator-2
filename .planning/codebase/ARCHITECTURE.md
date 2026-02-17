# Architecture

**Analysis Date:** 2026-02-17

## Pattern Overview

**Overall:** MVC-style server-rendered web application (Express + EJS)

**Key Characteristics:**
- Stateless HTTP request/response cycle; no sessions or in-memory state
- Catalog loaded once at startup (singleton CatalogService), submissions and PDFs persisted to disk
- Synchronous catalog reads, async filesystem writes for submissions and PDFs
- Services are exported as singletons (`module.exports = new SomeService()`)

## Layers

**Routes (HTTP Interface):**
- Purpose: Parse HTTP requests, call services, return HTTP responses or redirects
- Location: `src/routes/`
- Contains: `index.js`, `submit.js`, `result.js`, `pdf.js`
- Depends on: `catalogService`, `submissionService`, `pdfService`
- Used by: Express app in `src/server.js`

**Services (Business Logic):**
- Purpose: Core application logic — catalog access, validation, submission persistence, PDF generation
- Location: `src/services/`
- Contains: `catalogService.js`, `submissionService.js`, `pdfService.js`
- Depends on: `data/catalog.json`, `data/submissions/`, `output/`, `assets/variants/`
- Used by: Route handlers

**Utilities:**
- Purpose: Low-level filesystem helpers (hashing, path safety, existence checks)
- Location: `src/utils/fileUtils.js`
- Contains: `getFileHash`, `isPathSafe`, `getFileExtension`, `fileExists`
- Used by: Services (as needed)

**Views (Presentation):**
- Purpose: Server-rendered HTML via EJS templates
- Location: `views/`
- Contains: `index.ejs` (configuration form), `result.ejs` (post-submission summary), `error.ejs`, `layout.ejs`
- Depends on: Data passed from route handlers via `res.render()`

**Static Assets:**
- Purpose: Client-side CSS, JavaScript, and product images
- Location: `public/` (CSS, JS), `assets/variants/` (product images)
- Key file: `public/js/script.js` (KfW-dependent dynamic form logic, toast notifications)

## Data Flow

**Configuration Form → PDF Generation:**

1. Browser requests `GET /` — `src/routes/index.js` loads all catalog categories via `catalogService` and renders `views/index.ejs`
2. User fills multi-step form and submits — browser posts to `POST /submit`
3. `src/routes/submit.js` parses raw form body, calls `submissionService.parseRoomData()` and `submissionService.parseEigenleistungen()`, builds structured submission object
4. `catalogService.validateSelection(submission)` checks each selection ID exists in catalog — returns `{ valid, errors }`
5. `submissionService.saveSubmission(submission)` generates UUID, writes JSON file to `data/submissions/{uuid}.json`, returns `{ id, submission }`
6. `pdfService.generatePDF(savedSubmission)` streams a multi-page PDFKit document to `output/Leistungsbeschreibung_{id}.pdf`
7. Route redirects browser to `GET /result/{id}`
8. `result.js` loads submission JSON via `submissionService.getSubmission(id)`, renders `views/result.ejs`

**PDF Retrieval:**

1. Browser requests `GET /pdf/{id}` (or `GET /pdf/{id}?download=1`)
2. `src/routes/pdf.js` sanitizes the ID, resolves path to `output/Leistungsbeschreibung_{id}.pdf`
3. Responds with `res.sendFile()` (inline) or `res.download()` (attachment)

**State Management:**
- No server-side session state. All state is in JSON files on disk (`data/submissions/`) or derived from URL params.
- Client-side form state managed in browser DOM; `public/js/script.js` handles KfW-dependent field visibility.

## Key Abstractions

**CatalogService (`src/services/catalogService.js`):**
- Purpose: Single source of truth for product catalog; provides filtered reads and whitelist validation
- Pattern: Singleton class, catalog loaded once from `data/catalog.json` at require time
- Key methods: `getWalls()`, `getWallsByKfw(kfw)`, `getLueftung(kfw)`, `getVariantById(category, id)`, `validateSelection(selection)`

**SubmissionService (`src/services/submissionService.js`):**
- Purpose: Persist and retrieve user configurations; parse raw form data into structured objects
- Pattern: Singleton class with async filesystem operations
- Key methods: `saveSubmission(data)`, `getSubmission(id)`, `parseRoomData(formData)`, `parseEigenleistungen(formData)`

**PdfService (`src/services/pdfService.js`):**
- Purpose: Generate professional multi-page branded PDF (1,672 lines)
- Pattern: Singleton class with internal design system (colors, typography, layout constants)
- Key method: `generatePDF(submission)` — orchestrates page sequence and delegates to `draw*` methods
- Page draw methods: `drawTitlePage`, `drawQDFCertificationPage`, `drawExecutiveSummary`, `drawLeistungsuebersicht`, `drawQualityAdvantagesPage`, `drawServiceContent`, `drawComponentContent`, `drawHaustypPage`, `drawFloorPlanPage`, `drawComparisonChecklist`, `drawGlossaryPage`, `drawBeraterPage`, `drawHeader`, `drawFooter`

**Catalog Item (data shape):**
- Fields: `id`, `name`, `description`, `advantages[]`, `comparisonNotes`, `kfwCompatible[]`, `filePath`, `technicalDrawing`, `layers[]`, `technicalDetails`, `premiumFeatures[]`, `fireRating`

## Entry Points

**HTTP Server:**
- Location: `src/server.js`
- Triggers: `node src/server.js` (via `npm start`)
- Responsibilities: Configure Express middleware, mount routers, register 404/500 error handlers, listen on `PORT` (default 3000)

**Configuration Form:**
- Location: `src/routes/index.js` → `views/index.ejs`
- Triggers: `GET /`
- Responsibilities: Load catalog, render full multi-step form with all selectable components

**Form Submission:**
- Location: `src/routes/submit.js`
- Triggers: `POST /submit`
- Responsibilities: Parse, validate, persist, generate PDF, redirect

## Error Handling

**Strategy:** Route-level try/catch; errors logged to `console.error`; HTTP error responses sent as plain text or JSON

**Patterns:**
- Invalid catalog selections: `400 JSON { error, details }` from `submit.js`
- Missing submission/PDF: `404` plain text from `result.js` and `pdf.js`
- Unexpected exceptions: `500` plain text from all routes
- CatalogService load failure: Falls back to empty arrays per category (application remains online but unusable)
- Invalid submission ID: `sanitizedId` strips non-alphanumeric chars before filesystem access; `getSubmission` returns `null` on file read error

## Cross-Cutting Concerns

**Logging:** `console.log` / `console.error` throughout; route and service operations log to stdout with `[Route /]` or `[PDF]` prefixes; no structured logging framework

**Validation:** Whitelist validation in `catalogService.validateSelection()` — each user-selected ID is checked against the in-memory catalog before persistence

**Path Safety:** `src/utils/fileUtils.js:isPathSafe()` available for path traversal prevention; submission IDs sanitized via regex `id.replace(/[^a-zA-Z0-9-]/g, '')` before filesystem access

**KfW Business Rules:** `catalogService.getLueftung(kfw)` filters ventilation options by KfW standard; `catalogService.getWallsByKfw(kfw)` filters walls; client-side `public/js/script.js` hides/shows form sections based on selected KfW standard

---

*Architecture analysis: 2026-02-17*
