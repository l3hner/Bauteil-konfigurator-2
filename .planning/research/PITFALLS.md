# Domain Pitfalls

**Domain:** PDFKit-based brochure-quality PDF generation + multi-step wizard UI (Node.js/Express/EJS)
**Researched:** 2026-02-17
**Confidence note:** Based on project context (CLAUDE.md, architecture docs) and training knowledge of PDFKit,
EJS, Express, and wizard UI patterns. WebSearch/Context7 unavailable in this session; flagged where
confidence is lower.

---

## Critical Pitfalls

Mistakes that cause rewrites, major regressions, or broken production deploys.

---

### Pitfall 1: PDFKit Image Buffering Blows Render.com Memory Limit

**What goes wrong:**
Large full-bleed marketing images (1–3 MB each) are read from disk, decoded, and held in memory by
PDFKit for every page of the document simultaneously. A brochure-quality PDF with 8–10 product images
can silently exhaust Render.com's 512 MB (free tier) or 2 GB (starter) RAM limit during generation,
causing the process to be killed mid-stream. The user receives a corrupt or zero-byte PDF with no
error message because the Express response has already started streaming.

**Why it happens:**
PDFKit's `.image()` call reads the entire file into a Buffer. The PDF is assembled in memory
(a single PDFDocument object) before `.pipe()` flushes it. With 10 images at 2 MB each that is 20 MB
of raw bitmap data plus PDFKit's internal representation — multiplied by concurrent requests.

**Consequences:**
- Corrupt PDF downloads with no client-side error indication
- Render.com worker restart causing ~30 s downtime for all users
- Impossible to reproduce locally if dev machine has 16 GB RAM

**Prevention:**
- Resize and compress all product images to ≤ 400 KB before embedding (use `sharp` in a one-time
  preprocessing script, not at request time). Store web-optimised copies alongside originals.
- Enforce a max image dimension (e.g., 1200 × 900 px) in the catalog asset pipeline.
- Add a try/catch around the entire PDF generation with a fallback response (500 JSON) so the HTTP
  response is not corrupted when the generator throws.
- Monitor Render.com memory metrics after each new image set is added.

**Detection (warning signs):**
- PDF files grow above 5 MB — investigate image sizes immediately.
- Render.com dashboard shows memory spikes during PDF generation requests.
- Occasional 502 responses from Render.com correlating with PDF downloads.

**Phase:** Address in the PDF quality upgrade phase, before any large images are added to assets.

---

### Pitfall 2: PDFKit Coordinate System Drift Across Refactors

**What goes wrong:**
The existing pdfService.js is 1,672 lines of imperative `doc.text()`, `doc.rect()`, `doc.image()` calls
with hardcoded x/y pixel coordinates and `doc.moveDown()` calls. When adding new pages (Dächer,
Treppen), changing fonts, or altering the header/footer height, every downstream coordinate is wrong.
Developers adjust one section, break three others, and cannot see the breakage until they generate a
full PDF and scroll through it manually.

**Why it happens:**
PDFKit has no layout engine. Coordinates are absolute or relative to the current cursor. There is no
"reflow" — changing a block's height does not push subsequent content down automatically. With 1,672
lines in a single file, the blast radius of any coordinate change is the entire document.

**Consequences:**
- Text overflows into images or bleeds off the page.
- New catalog categories (Dächer, Treppen) are added but the footer or page number is overwritten.
- Subtle layout corruption that only appears on certain user selections (e.g., long product names).

**Prevention:**
- Extract a `layout.js` constants file defining all margins, gutter widths, column positions, header
  height, footer height, and safe-area boundaries. All pdfService.js code references only these
  constants — no magic numbers.
- Create a `drawPage(doc, content)` abstraction that handles header, footer, and page numbering,
  with the content rendered inside a bounded content area. All new pages use this abstraction.
- After each structural change, generate PDFs for all 7 existing catalog categories plus a maximal
  configuration (all rooms, all Eigenleistungen) and visually verify.
- Add an assertion: after placing all content, verify `doc.y` does not exceed the footer start Y.
  Log a warning to stderr rather than silently overflowing.

**Detection (warning signs):**
- Any time a developer edits a Y-coordinate and then searches for "all the places I need to update."
- Text bleeding off the bottom of a page.
- Page numbers printed over product images.

**Phase:** Address as the first task inside the PDF quality upgrade phase, before adding new pages.

---

### Pitfall 3: Wizard State Lost on Browser Back / Refresh (No Persistence Strategy)

**What goes wrong:**
A multi-step wizard implemented in vanilla JS (the current `public/js/script.js` pattern) stores step
data in JavaScript variables or the DOM. When the user taps "back" in the browser, presses refresh,
or the tablet screen times out, all wizard state is silently destroyed. The user restarts from step 1.
On a tablet in a sales meeting this is embarrassing and causes loss of trust.

**Why it happens:**
EJS server-rendered pages do not maintain client state between page loads. Vanilla JS variables are
ephemeral. Without explicit persistence (sessionStorage, URL params, or hidden form fields), any
navigation event destroys state.

**Consequences:**
- Poor UX in sales/showroom context (tablet, face-to-face with customer).
- Sales rep cannot hand the tablet to the customer mid-session.
- Users re-enter data and make different choices, reducing data reliability.

**Prevention:**
- Persist wizard state to `sessionStorage` after every step transition. Restore on load.
- Use the URL query string or hash to encode the current step number so refresh restores position.
- On the final submit step, serialize the full wizard state into a hidden `<form>` and POST it —
  this is the existing server pattern and requires no backend changes.
- Do NOT use `localStorage` (persists across sessions; raises GDPR questions for customer data).

**Detection (warning signs):**
- Any wizard prototype that uses only JS variables for step data.
- Refresh during step 3 of testing drops back to step 1.

**Phase:** Address in the wizard conversion phase, before any user testing.

---

### Pitfall 4: Wizard Validation Bypass via Direct POST

**What goes wrong:**
Converting the form to a multi-step wizard means client-side validation happens per step. But the
`/submit` POST endpoint, which was designed for a single-page form, still accepts any POST body.
A user (or automated client) can POST step-1 data with step-3 fields missing and receive a PDF.
With new catalog categories (Dächer, Treppen), the backend has no required-field enforcement for
the new fields, so the PDF generator receives `undefined` and crashes or silently omits content.

**Why it happens:**
The existing `catalogService.js` whitelist validation only checks that selected IDs exist in the
catalog. It does not enforce that all required categories are present. Adding new categories (Dächer,
Treppen) extends the form but not the validation rules unless explicitly added.

**Consequences:**
- PDFs generated with missing sections (no Dach page, no Treppen page).
- `pdfService.js` crashes with `TypeError: Cannot read property 'name' of undefined` when a
  selection is missing.
- Security surface: skipping validation steps to probe catalog data.

**Prevention:**
- Add a server-side required-fields check in `submissionService.js` or the `/submit` route: every
  catalog category that has a page in the PDF must have a valid selection in the POST body.
- Treat new categories (Dächer, Treppen) as required from day one — add them to the validation
  checklist at the same time as the catalog JSON and PDF page.
- Return a 400 with a descriptive German error message for missing required fields, not a 500.

**Detection (warning signs):**
- Adding a new catalog category to `catalog.json` and the PDF page but not the `/submit` validation.
- Any `undefined` or `null` check inside `pdfService.js` around a catalog item lookup.

**Phase:** Address in the new-categories phase and revisit during wizard conversion.

---

### Pitfall 5: EJS Template Explosion When Wizard Steps Are Added as Separate Partials

**What goes wrong:**
The current architecture is a single `index.ejs` form. A naive wizard conversion creates
`step1.ejs`, `step2.ejs`, ... `stepN.ejs` as separate Express routes and full-page EJS templates.
Each template duplicates the `<head>`, CSS imports, and JS includes. Updating the corporate CSS or
adding a new script requires editing N files. When new catalog categories arrive, step ordering
must be manually synchronized across routes, templates, and the final POST body.

**Why it happens:**
EJS partials (`<%- include(...) %>`) are the correct tool but are easy to skip in favour of copy-paste
when moving fast. Express route handlers are similarly duplicated instead of parameterized.

**Consequences:**
- CSS or branding change requires editing every step file.
- Step ordering bugs where step 3's data lands in the wrong form field on the server.
- Git diffs become enormous, obscuring actual logic changes.

**Prevention:**
- Keep a single EJS layout (`views/layout.ejs`) with `<%- include('partials/step-N') %>` for each
  step's content. One `<head>`, one CSS import, one JS bundle reference.
- Drive step ordering from a config array (e.g., `const WIZARD_STEPS = ['haustyp', 'walls', ...]`)
  so adding a step means adding one entry, not creating a new route + template.
- Use a single GET `/` route that renders the wizard shell; step content is shown/hidden by JS or
  fetched via small AJAX partials — consistent with the current no-build-step constraint.

**Detection (warning signs):**
- More than two EJS files with `<html>` at the top level.
- Editing a CSS class name and finding it in 6 files.

**Phase:** Address at the very start of the wizard conversion phase, as an architectural decision.

---

### Pitfall 6: Marketing Text Hardcoded in pdfService.js Instead of a Content Layer

**What goes wrong:**
The existing PDF service already contains large blocks of German marketing text inline in the 1,672-line
JS file (the Lehner Haus services section: "Individuelle Planung & Beratung", "Festpreis-Garantie",
etc.). Upgrading to brochure quality will add more emotional marketing copy per component. Editing
copy requires a developer, touching the same file that controls layout coordinates, creating merge
conflicts and regression risk.

**Why it happens:**
PDFKit is code, not a template engine. The natural path is to put text next to the `doc.text()` call
that renders it.

**Consequences:**
- Sales/marketing team cannot update copy without a developer deployment.
- Copy changes cause accidental layout regressions (a longer sentence pushes subsequent elements down).
- Translations or seasonal campaign changes are high-friction.

**Prevention:**
- Extract all German marketing text to a `data/pdf-content.json` (or `data/pdf-content.js`) file.
  `pdfService.js` only references `content.serviceSection.title` — it never contains a German sentence.
- Keep the `comparisonNotes` and `advantages` fields in `catalog.json` — they are already there.
  Add an `emotionalHook` field to each catalog item for the brochure headline.
- This also makes A/B testing copy easier in the future.

**Detection (warning signs):**
- Any German sentence longer than 5 words inside `pdfService.js`.
- A developer asking "where do I change the text on page 3?"

**Phase:** Address in the PDF quality upgrade phase, before writing new marketing copy.

---

### Pitfall 7: Render.com Cold Start Timeout During PDF Generation

**What goes wrong:**
Render.com free and starter instances spin down after 15 minutes of inactivity. The first request
after spin-up (a cold start) can take 10–30 seconds. If that first request is a PDF generation
(which itself takes 2–5 seconds on a warm instance), the total response time can exceed 30 seconds,
hitting Render's request timeout or the browser's fetch timeout. The user sees a blank result page
or a network error.

**Why it happens:**
PDFKit PDF generation is synchronous-heavy (file reads, Buffer allocations, stream piping). On a
cold-started instance with high memory pressure from loading the catalog and assets, it is slower.

**Consequences:**
- Users in sales meetings experience a timeout on the first PDF generation of the day.
- The result page (`/result/:id`) loads but the PDF link 404s because the file was never written.

**Prevention:**
- Add a health-check endpoint (`GET /health` returning 200) and configure an external uptime monitor
  (UptimeRobot free tier) to ping it every 5 minutes, preventing spin-down during business hours.
- Make PDF generation asynchronous: the `/submit` POST saves the submission and redirects to
  `/result/:id` immediately. The result page polls `GET /pdf-status/:id` until the PDF is ready,
  then enables the download link. This decouples PDF generation latency from the user-facing redirect.
- This is a bigger architecture change — defer to the PDF quality phase if async is acceptable scope.

**Detection (warning signs):**
- Render.com logs showing requests timing out between 09:00 and 09:05 (first morning use).
- PDF links on the result page returning 404 for the first request of the day.

**Phase:** Address during the PDF quality upgrade phase or as a separate infrastructure hardening task.

---

### Pitfall 8: Tablet Touch Targets Too Small in Wizard Navigation

**What goes wrong:**
Wizard "Next" and "Back" buttons and catalog item selection cards are designed on a desktop browser
and look fine at 1280 px wide. On a 10-inch tablet in portrait mode (768 × 1024 px), the touch
targets shrink. Catalog cards with product images become too narrow to tap accurately; "Next" buttons
near the bottom of the viewport are cut off by the browser's address bar or OS swipe gesture area.

**Why it happens:**
The current `public/css/style.css` is not known to use a mobile-first or tablet-specific breakpoint.
A wizard conversion without explicit tablet testing will inherit desktop-sized interactions.

**Consequences:**
- Sales reps struggle to tap the correct catalog item in front of customers.
- The configurator feels unprofessional in its primary use context (showroom tablet).

**Prevention:**
- Define a single tablet breakpoint (768 px) from day one of wizard CSS work.
- Minimum touch target: 44 × 44 px (Apple HIG) for all interactive elements.
- Catalog selection cards: full-width in portrait mode, two-column in landscape.
- Test on an actual tablet device (or browser dev tools tablet emulation) at every UI checkpoint.
- Add `<meta name="viewport" content="width=device-width, initial-scale=1">` if not already present.

**Detection (warning signs):**
- Styling work done exclusively in a desktop browser window.
- Catalog cards narrower than 150 px on mobile viewport.
- CSS breakpoints only at 1024 px and above.

**Phase:** Address at the start of the wizard conversion phase as a design constraint, not a retrofit.

---

### Pitfall 9: New Catalog Categories (Dächer, Treppen) Break Existing Submissions

**What goes wrong:**
Existing saved submissions in `data/submissions/` do not contain `dach` or `treppe` fields. When the
result page or PDF generator tries to render a submission created before the new categories were added,
it reads `undefined` and either crashes or produces a PDF with broken pages. This is especially
problematic if old submissions are re-rendered (e.g., a customer returns to view their saved config).

**Why it happens:**
JSON files on disk have no schema migration. The submission structure grows but old files are not
backfilled. The PDF generator assumes all fields are present.

**Consequences:**
- Old PDF links break after the new categories are deployed.
- Rendering any old submission throws a 500.
- Customers who saved a configuration before the update cannot retrieve it.

**Prevention:**
- Write a migration script (`scripts/migrate-submissions.js`) that reads all existing submission
  JSON files, adds `dach: null` and `treppe: null` (or a sensible default), and writes them back.
  Run this as part of the deployment checklist when new categories go live.
- In `pdfService.js`, defensively check for each optional/new category: `if (submission.dach) { ... }`.
  New pages are only generated when the field is present and valid.
- Document the submission schema version in each file (`"schemaVersion": 2`) for future migrations.

**Detection (warning signs):**
- Opening an old submission JSON and noting it lacks the new field.
- A `TypeError` on `submission.dach.name` in pdfService.js.

**Phase:** Address in the new-categories phase, specifically before deploying to production.

---

### Pitfall 10: PDF Font Embedding Increases File Size Beyond Email Attachment Limits

**What goes wrong:**
Upgrading to brochure quality typically means adding a custom brand font (e.g., a Lehner Haus
corporate typeface) via PDFKit's `doc.registerFont()`. PDFKit embeds the full TTF/OTF font file into
the PDF — not a subset. A single custom font adds 300–700 KB to every generated PDF. With two
weights (regular + bold) that is 600 KB–1.4 MB added to each file. Combined with large product
images, PDFs can reach 15–20 MB — too large for email attachments (most servers reject > 10 MB) and
slow to download on tablet cellular connections.

**Why it happens:**
PDFKit does not perform font subsetting by default. Developers focus on visual quality and don't
measure output file size until it is too late.

**Consequences:**
- Sales rep cannot email the PDF to the customer during the meeting.
- PDF download stalls on a slow showroom WiFi connection.
- Render.com bandwidth costs increase.

**Prevention:**
- Measure PDF file size after every significant asset or font addition. Fail if > 5 MB.
- Use PDFKit's built-in standard fonts (Helvetica, Times-Roman) for body text — these are NOT
  embedded, saving 500+ KB. Reserve custom fonts for the title page only.
- Alternatively, pre-subset fonts using `pyftsubset` (fonttools) or a Node.js equivalent before
  providing them to PDFKit. Only include the characters used in the document.
- Compress all product images to JPEG at 80% quality, 1200 px wide maximum, before embedding.

**Detection (warning signs):**
- Generated PDF is > 5 MB after adding a custom font.
- `doc.registerFont('CustomFont', 'assets/fonts/brand.ttf')` used for body text across all pages.

**Phase:** Address in the PDF quality upgrade phase, during the asset preparation step.

---

## Moderate Pitfalls

---

### Pitfall 11: KfW-Dependent Logic Duplicated Between Client JS and Server

**What goes wrong:**
The existing `public/js/script.js` already implements KfW-dependent filtering (KfW55 shows "keine"
ventilation; KfW40 shows dezentral/zentral). The wizard conversion risks reimplementing this logic
in the wizard step JS without removing the old code, resulting in two sources of truth. A future
catalog change (e.g., a new KfW standard) must be updated in two places and the mismatch causes
a user to see options on step N that are then rejected by the server.

**Prevention:**
- Define KfW filter rules once in a shared config (`data/catalog.json` `kfwCompatible` arrays are
  already there). The client JS reads the catalog via a `GET /api/catalog` endpoint (or a `<script>`
  block that injects the catalog as JSON) and applies the same filter the server uses.
- Never hardcode KfW tier names as strings in more than one file.

**Phase:** Wizard conversion phase.

---

### Pitfall 12: Wizard Step Count Mismatch Between UI and Progress Indicator

**What goes wrong:**
A progress bar ("Step 3 of 7") is built for 7 steps. When a new catalog category (Dächer, Treppen)
is added, the step count becomes 9. The progress bar still says "of 7." Developers update the step
content but forget the progress indicator and the submit button condition (`if (step === 7)`).

**Prevention:**
- Derive step count programmatically from the same `WIZARD_STEPS` config array used for rendering.
  `totalSteps = WIZARD_STEPS.length` — never hardcode `7` in the UI.
- Gate the submit button on `currentStep === WIZARD_STEPS.length - 1`, not a magic number.

**Phase:** Wizard conversion phase, architecture decision.

---

### Pitfall 13: `data/submissions/` Directory Fills Up on Render.com Ephemeral Filesystem

**What goes wrong:**
Render.com's disk is ephemeral on non-persistent-disk plans. On redeploy, all files in
`data/submissions/` and `output/` are deleted. Customers who bookmarked their result URL return to
a 404. Additionally, if the app runs for months without a redeploy, the submissions directory
accumulates thousands of JSON and PDF files, slowing directory reads.

**Prevention:**
- Document this limitation prominently in the deployment checklist. Decide before the milestone
  whether a persistent disk addon is acceptable or whether submissions should be stored in a database.
- Add a cleanup cron or TTL policy (delete submissions > 90 days old) if persistent disk is enabled.
- The result page should note that PDF links are temporary (e.g., "Ihr PDF ist 30 Tage verfügbar").

**Phase:** Infrastructure/deployment phase or early in PDF quality phase.

---

### Pitfall 14: EJS `comparisonNotes` Field Rendered Unescaped Allows XSS in Result Page

**What goes wrong:**
If `catalog.json` `comparisonNotes` values ever contain HTML (e.g., added by a non-developer
updating the catalog), and the EJS template uses `<%-` (unescaped output) to render them for
formatting, any `<script>` tag in the catalog becomes executable in the user's browser.

**Prevention:**
- Always use `<%= %>` (escaped) for user-supplied or catalog-sourced text in EJS.
- Use `<%-` only for known-safe HTML fragments (e.g., EJS partials).
- Audit all EJS templates for `<%-` usage when catalog content is expanded.

**Phase:** New-categories / catalog content phase.

---

## Minor Pitfalls

---

### Pitfall 15: PDF Page Numbering Off-by-One After Conditional Pages

**What goes wrong:**
The PDF has conditional pages (Lüftungssystem only if selected; Raumplanung only if rooms defined;
Eigenleistungen only if any). Page numbers are calculated statically ("Page 5 of 8") rather than
dynamically. Adding Dächer and Treppen pages breaks the static count; conditional logic makes the
total unpredictable.

**Prevention:**
- Use PDFKit's `doc.bufferedPageRange()` to count actual pages after generation, then add a
  second pass to stamp page numbers. Or maintain a page counter variable that only increments when
  a page is actually added.

**Phase:** PDF quality upgrade phase, when new pages are added.

---

### Pitfall 16: Catalog Image `filePath` References Break After Asset Reorganization

**What goes wrong:**
Adding Dächer and Treppen requires new asset subdirectories (`assets/variants/daecher/`,
`assets/variants/treppen/`). If the `catalog.json` `filePath` values use inconsistent casing
(`Daecher` vs `daecher`) or separators, they work on Windows (case-insensitive) but fail on
Render.com (Linux, case-sensitive filesystem).

**Prevention:**
- Enforce lowercase, hyphenated directory names for all asset paths.
- Add a startup check: iterate all `catalog.json` `filePath` values and verify each file exists
  with `fs.existsSync()`. Log a warning (not a crash) for any missing asset.
- Test asset paths on Linux before deployment (or in a Docker container locally).

**Phase:** New-categories phase, asset preparation step.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| PDF quality upgrade — add large images | Memory exhaustion on Render.com (Pitfall 1) | Pre-resize to ≤ 400 KB before embedding |
| PDF quality upgrade — new marketing copy | Copy hardcoded in pdfService.js (Pitfall 6) | Extract to `data/pdf-content.json` first |
| PDF quality upgrade — custom font | File size bloat > 10 MB (Pitfall 10) | Use standard fonts for body, subset custom font |
| PDF quality upgrade — new conditional pages | Coordinate drift / page number errors (Pitfalls 2, 15) | layout.js constants + dynamic page counter |
| Wizard conversion — architecture | EJS template explosion (Pitfall 5) | Single layout.ejs + partials from day one |
| Wizard conversion — state | State lost on refresh/back (Pitfall 3) | sessionStorage persistence before user testing |
| Wizard conversion — KfW logic | Logic duplicated client/server (Pitfall 11) | Single catalog-driven filter, injected as JSON |
| Wizard conversion — progress bar | Hardcoded step count (Pitfall 12) | Derive from WIZARD_STEPS config array |
| New categories (Dächer, Treppen) | Old submissions crash (Pitfall 9) | Migration script + defensive null checks |
| New categories (Dächer, Treppen) | Validation bypass (Pitfall 4) | Add new fields to server-side required list |
| New categories (Dächer, Treppen) | Asset path case sensitivity (Pitfall 16) | Lowercase paths, startup existence check |
| Infrastructure / Render.com | Cold start timeout on first PDF (Pitfall 7) | UptimeRobot ping every 5 min |
| Infrastructure / Render.com | Ephemeral filesystem wipes submissions (Pitfall 13) | Document + decide persistence strategy early |
| Catalog content expansion | XSS via unescaped EJS output (Pitfall 14) | Audit `<%-` usage, switch to `<%= %>` |

---

## Sources

Confidence levels reflect available evidence:

| Pitfall | Confidence | Basis |
|---------|------------|-------|
| 1 (Memory / Render.com) | MEDIUM | PDFKit Buffer behavior well-documented; Render.com memory limits from official docs; confirmed pattern |
| 2 (Coordinate drift) | HIGH | Core PDFKit limitation — no layout engine; widely reported in PDFKit GitHub issues |
| 3 (Wizard state loss) | HIGH | Fundamental browser behavior; universal wizard pattern |
| 4 (Validation bypass) | HIGH | REST API security fundamentals; specific to this app's existing validation gap |
| 5 (EJS template explosion) | HIGH | EJS architecture pattern; specific to current single-file structure |
| 6 (Hardcoded copy) | HIGH | Directly observed from project context (marketing text in pdfService.js noted in CLAUDE.md) |
| 7 (Render.com cold start) | MEDIUM | Render.com spin-down behavior documented; timeout interaction with PDF generation is inferred |
| 8 (Touch targets) | HIGH | Apple HIG 44 px standard; common tablet-first oversight |
| 9 (Schema migration) | HIGH | No-database JSON file storage + no migration tooling = guaranteed forward-compat problem |
| 10 (Font embedding size) | MEDIUM | PDFKit font embedding behavior known; subsetting requirement documented; file size thresholds are guidelines |
| 11 (KfW logic duplication) | HIGH | Directly observed: KfW logic in client JS noted in CLAUDE.md; wizard conversion creates duplication risk |
| 12 (Step count) | HIGH | Universal wizard pattern pitfall |
| 13 (Ephemeral FS) | MEDIUM | Render.com ephemeral disk noted in Render docs; persistent disk is an addon |
| 14 (XSS/EJS) | MEDIUM | EJS `<%-` XSS risk well-known; actual catalog.json content not inspected |
| 15 (Page number off-by-one) | HIGH | Direct consequence of conditional pages + static count; inherent to current architecture |
| 16 (Asset path case) | HIGH | Linux case-sensitive FS vs Windows case-insensitive — classic cross-platform issue |
