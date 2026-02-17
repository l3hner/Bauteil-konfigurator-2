# Codebase Concerns

**Analysis Date:** 2026-02-17

## Tech Debt

**Monolithic PDF service:**
- Issue: `src/services/pdfService.js` is 1,672 lines containing all page drawing logic in a single class with no separation of concerns. Each "page" is a private method on one god-object.
- Files: `src/services/pdfService.js`
- Impact: Extremely hard to modify a single page without risk of breaking layout constants shared across methods. Adding or removing a page requires reading the entire file to understand side-effects.
- Fix approach: Extract each page drawing method into its own module under `src/services/pdf/pages/` and import them into a thin orchestrator.

**`fileUtils.js` safety functions are unused:**
- Issue: `src/utils/fileUtils.js` exports `isPathSafe`, `getFileHash`, `fileExists`, and `getFileExtension`, but none of these are imported or called anywhere in the actual route or service code. Path safety is instead handled with ad-hoc `.replace()` inline in `submissionService.js` and `pdf.js`.
- Files: `src/utils/fileUtils.js`, `src/routes/pdf.js`, `src/services/submissionService.js`
- Impact: The safety utility is dead code. The actual path-safety approach is inconsistent and the utility provides no protection.
- Fix approach: Either import `isPathSafe` in the two places that construct filesystem paths from user input, or delete `fileUtils.js` entirely.

**Catalog loaded only at startup — no hot-reload:**
- Issue: `CatalogService` loads `data/catalog.json` synchronously once in its constructor (`this.catalog = this.loadCatalog()`). Changing the catalog requires a server restart.
- Files: `src/services/catalogService.js` (lines 7–8)
- Impact: Operational friction when updating catalog content. No way to update products without downtime.
- Fix approach: Add a `reload()` method or use a file watcher (`fs.watch`) to invalidate the cache when the file changes.

**`open` package listed as dependency but `xdg-open` subprocess is used instead:**
- Issue: `package.json` lists `"open": "^9.1.0"` as a runtime dependency, but `src/server.js` does not use this package. Instead it uses `require('child_process').exec` and shells out to `xdg-open`, which only works on Linux.
- Files: `src/server.js` (line 50–54), `package.json`
- Impact: On Windows (the current dev environment) and macOS, the auto-open silently fails. The `open` npm package is never called but still gets installed.
- Fix approach: Replace the `child_process.exec` + `xdg-open` call with `require('open')(url)` which handles all platforms correctly.

**`heic-convert` listed as dependency but never used:**
- Issue: `package.json` includes `"heic-convert": "^2.1.0"` in dependencies. No source file in `src/` imports it.
- Files: `package.json`
- Impact: Unnecessary production dependency adds install time and potential security surface.
- Fix approach: Remove from `package.json` and run `npm install`.

---

## Known Bugs

**`Array.prototype.indexOf` always returns -1 for inline arrays:**
- Symptoms: Alternating row background shading in the Executive Summary and component tables on PDF pages never alternates correctly — every row gets the same background color.
- Files: `src/services/pdfService.js` (lines 456, 495)
- Trigger: Calling `keyFacts.indexOf([label, value])` where `[label, value]` is a freshly-created array literal. `indexOf` uses reference equality, so the newly-created array is never found in the outer array. The result is always `-1`, meaning `(-1) % 2 === -1` which is never `=== 0` or `=== 1` as intended.
- Workaround: None currently.
- Correct fix: Use the loop index variable `forEach((item, idx) => ...)` for the modulo check instead of `indexOf`.

**Empty PDF generated for some submissions:**
- Symptoms: `output/Leistungsbeschreibung_b6df1b5e-44c0-4d38-ac2c-cc9ce58e0e85.pdf` is 0 bytes on disk while the matching JSON submission exists.
- Files: `src/services/pdfService.js`, `src/routes/submit.js`
- Trigger: Likely a stream error during PDF generation that causes `doc.end()` to be called but the stream to be closed prematurely. The `Promise` in `generatePDF` only resolves on the `finish` event but does not guarantee the file is non-empty on error paths.
- Workaround: None. Users would see a broken PDF link.
- Fix approach: After `stream.on('finish')` resolves, verify file size > 0 before redirecting. Add error-event handling to `stream` that cleans up the partial file.

**Berater freitext box drawn with height 0:**
- Symptoms: When `submission.berater_freitext` is set, the `drawBeraterPage` method first draws a `roundedRect` with height `0` before recalculating and redrawing it. The first zero-height rectangle is a no-op but wastes a draw call.
- Files: `src/services/pdfService.js` (lines 1523–1532)
- Trigger: Every PDF with a Fachberater freitext entry.
- Workaround: Cosmetically harmless, but indicates copy-paste error.

**Missing umlaut on index page heading:**
- Symptoms: The main form page heading reads "Ihre personliche Leistungsbeschreibung" (missing umlaut ö) and "massgeschneiderte" (missing ä). These are display errors in the German UI.
- Files: `views/index.ejs` (line 97–98)
- Fix approach: Correct to "persönliche" and "maßgeschneiderte".

---

## Security Considerations

**No server-side validation of required Bauherr fields:**
- Risk: Required fields (`bauherr_vorname`, `bauherr_nachname`, `bauherr_email`) are enforced only via HTML `required` attributes on the form. These are trivially bypassed by direct POST requests.
- Files: `src/routes/submit.js`
- Current mitigation: HTML-level `required` attributes only.
- Recommendations: Add server-side presence checks for critical fields before calling `submissionService.saveSubmission()`. Return HTTP 400 with a clear error message if missing.

**No rate limiting on form submission:**
- Risk: The `/submit` POST endpoint has no rate limiting. A bot can flood the server with submissions, generating PDFs (CPU/memory/disk intensive) and filling `data/submissions/` and `output/`.
- Files: `src/server.js`, `src/routes/submit.js`
- Current mitigation: None.
- Recommendations: Add `express-rate-limit` middleware on the `/submit` route. Even a simple limit of 10 requests per IP per minute would prevent abuse.

**No request body size limit:**
- Risk: `body-parser` is configured without an explicit `limit` parameter, defaulting to 100kb for JSON and 100kb for URL-encoded. If room names or freitext fields are excessively large, they could cause memory pressure or unusually large PDF generation.
- Files: `src/server.js` (lines 9–10)
- Current mitigation: Default body-parser limits apply.
- Recommendations: Set an explicit limit: `bodyParser.urlencoded({ extended: true, limit: '50kb' })`.

**Berater freitext rendered directly into PDF without sanitization:**
- Risk: The `berater_freitext` field (free text from form) is passed directly into `doc.text()` in pdfService. While PDFKit's text method does not execute code, special characters or extremely long strings could affect PDF layout.
- Files: `src/services/pdfService.js` (line 1523–1539)
- Current mitigation: `\r` characters are stripped. No other sanitization.
- Recommendations: Truncate freitext to a reasonable maximum (e.g., 1000 characters) before rendering.

---

## Performance Bottlenecks

**Synchronous file I/O inside PDF generation (request thread):**
- Problem: During PDF generation, `pdfService.js` calls `fs.existsSync()` and `fs.mkdirSync()` synchronously for every image check and the output directory check. These block the Node.js event loop on each request.
- Files: `src/services/pdfService.js` (lines 60–62, 225–226, 832–834, 1122)
- Cause: `ensureOutputDir()` is declared `async` but uses `fs.existsSync` + `fs.mkdirSync` instead of `fs.promises.mkdir`.
- Improvement path: Replace `fs.existsSync` + `fs.mkdirSync` with `await fs.promises.mkdir(dir, { recursive: true })`, and replace `fs.existsSync` image checks with `await fs.promises.access()`.

**Catalog loading uses synchronous `fs.readFileSync`:**
- Problem: `catalogService.loadCatalog()` uses `fs.readFileSync` at module initialization time, blocking the event loop at startup.
- Files: `src/services/catalogService.js` (line 11)
- Cause: Called in the constructor before the event loop starts, which is a common pattern but blocks startup proportional to file size.
- Improvement path: Low priority since it runs only once at startup. If startup time becomes an issue, switch to async initialization with a `ready` promise.

**PDFs up to 23MB generated and stored indefinitely:**
- Problem: Two PDFs in `output/` are over 23MB (23,891,159 and 24,020,995 bytes). These are served directly via `res.sendFile()` with no streaming optimization. There is no cleanup routine to remove old PDFs.
- Files: `src/routes/pdf.js`, `output/`
- Cause: Large images (likely from `assets/variants/`) embedded without compression or resizing in the PDF.
- Improvement path: Compress images before embedding (the `scripts/optimize-images.js` script exists but is commented out and requires `sharp` to be installed). Add a background cleanup job to delete PDFs older than N days.

---

## Fragile Areas

**Absolute pixel coordinate layout in PDF:**
- Files: `src/services/pdfService.js` (throughout all draw methods)
- Why fragile: Every element is positioned with hard-coded absolute Y coordinates (e.g., `doc.text('...', 80, y + 35, ...)`). Content that overflows its expected height silently overlaps the next element. There are no bounds checks between sections beyond a few `if (y < 610)` guards.
- Safe modification: Always test with long content (long `berater_freitext`, many rooms, many advantages) when changing any layout coordinate. Verify visually; there are no automated layout tests.
- Test coverage: The test in `test/pdf-generator.test.js` only checks that the output file exists and is larger than a threshold — it does not detect layout overflow.

**`drawComponentContent` relies on string matching for category logic:**
- Files: `src/services/pdfService.js` (lines 848, 1037–1063)
- Why fragile: Layout decisions (e.g., "Aufbau von oben nach unten" vs. "von außen nach innen", which technical details to show) are made with `categoryTitle.includes('Decke')`, `categoryTitle.includes('Außenwand')`, etc. Renaming a category title in a draw call will silently break the correct extraction logic.
- Safe modification: Introduce an explicit `category` enum/constant instead of relying on German partial string matching.

**Image paths coupled to `catalog.json` `filePath` field:**
- Files: `src/services/pdfService.js` (lines 827–832, 1114), `data/catalog.json`
- Why fragile: If a `filePath` entry in the catalog points to a missing file, the code falls back to a placeholder silently. There is no startup-time validation that all `filePath` values exist on disk.
- Safe modification: When updating the catalog, manually verify all referenced image paths exist. The script `scripts/generate-placeholder-images.js` can generate placeholders if needed.

**Eigenleistungen page in CLAUDE.md but not in current `generatePDF`:**
- Files: `src/services/pdfService.js` (lines 65–215), `CLAUDE.md`
- Why fragile: The CLAUDE.md documentation describes an "Eigenleistungen" page that is generated "only if any", but the current `generatePDF` method does not include this page in its page sequence. The submission still collects eigenleistungen data — it is just silently dropped from the PDF output.
- Test coverage: None.

---

## Scaling Limits

**File-system-based submission storage:**
- Current capacity: All submissions are JSON files in `data/submissions/`. Currently 3 files.
- Limit: `getAllSubmissions()` reads every file into memory simultaneously with `Promise.all`. At hundreds of submissions this becomes slow; at thousands it risks OOM.
- Scaling path: If submission volume grows, migrate to a lightweight database (SQLite via `better-sqlite3`) or add pagination to `getAllSubmissions`.

**PDFs accumulate without cleanup:**
- Current capacity: `output/` currently holds PDFs totalling roughly 50MB from only a handful of submissions.
- Limit: No automatic cleanup. At scale, disk usage grows unboundedly.
- Scaling path: Add a scheduled cleanup script to delete PDFs older than 30 days, or store PDFs in an external object store.

---

## Dependencies at Risk

**`body-parser` is redundant:**
- Risk: Express 4.16+ includes `express.urlencoded()` and `express.json()` built-in. `body-parser` is an unnecessary extra dependency.
- Impact: Low — `body-parser` is stable. Minor bloat.
- Migration plan: Replace `bodyParser.urlencoded(...)` with `express.urlencoded(...)` and remove the `body-parser` package.

**`open` npm package imported in `package.json` but never called:**
- Risk: Phantom dependency that is installed but provides no value. If it has a security vulnerability it still affects the project.
- Impact: Low.
- Migration plan: Remove `"open"` from dependencies, or actually use it to fix the cross-platform browser-open issue (see Tech Debt above).

---

## Missing Critical Features

**No server-side validation of required Bauherr contact fields:**
- Problem: A submission with empty name/email can be saved, a PDF generated with "Familie " as the heading and empty contact info.
- Blocks: Reliable lead capture for the sales team.

**No admin view of submissions:**
- Problem: The only way to review submissions is to read raw JSON from `data/submissions/`. There is no admin listing page.
- Blocks: Operational use of the tool by non-developers.

**No email notification on submission:**
- Problem: When a user submits their configuration, Lehner Haus receives no notification. The only record is the JSON file on disk.
- Blocks: Timely follow-up with interested customers.

---

## Test Coverage Gaps

**PDF layout and content not tested:**
- What's not tested: Actual PDF content — whether pages appear in the correct order, whether components render correctly, whether the alternating-row bug affects output.
- Files: `test/pdf-generator.test.js`
- Risk: Layout regressions (like the `indexOf` bug) pass tests silently.
- Priority: Medium

**No test runner configured:**
- What's not tested: The test files in `test/` reference Jest (`describe`, `test`, `expect`) but no Jest configuration is present in `package.json` and no `"test"` script is defined.
- Files: `package.json`, `test/pdf-generator.test.js`
- Risk: Tests exist but cannot be run with `npm test`. Their passing status is unknown.
- Priority: High — fix before relying on any test results.

**Form submission and route behavior not tested:**
- What's not tested: The `/submit` route, validation logic, redirect on success, error handling on bad input.
- Files: `src/routes/submit.js`
- Risk: Breaking the form submission flow would go undetected until manual testing.
- Priority: Medium

---

*Concerns audit: 2026-02-17*
