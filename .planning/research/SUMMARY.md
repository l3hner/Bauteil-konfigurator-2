# Project Research Summary

**Project:** Lehner Haus Konfigurator — PDF + Wizard Upgrade
**Domain:** B2B sales tool — house configurator with brochure-quality PDF generation (Fertighaus / construction sales)
**Researched:** 2026-02-17
**Confidence:** HIGH

## Executive Summary

The Lehner Haus Konfigurator is not a consumer configurator — it is a face-to-face B2B sales tool used by a Fachberater on a tablet during a customer consultation. That context drives every priority decision. The tool's job is to close contracts, not deliver information. The existing Node.js/Express/EJS/PDFKit stack is sound and non-negotiable; the upgrade is entirely additive. Research confirms two independent work tracks: (1) elevating PDF visual quality to brochure standard and (2) converting the current single-long-form to a true step-by-step tablet wizard. These two tracks share only the submission data structure and can be built in parallel after a shared foundation is established.

The recommended approach is to establish architectural foundations first and then work outward. The 1,672-line monolithic `pdfService.js` must be decomposed into per-page modules before any visual quality work begins — attempting to improve layouts in the monolith creates cascading coordinate drift across the entire document. Likewise, the wizard conversion should start with an EJS partial/layout architecture before any step content is written, to avoid the template explosion anti-pattern. Both refactors are prerequisite to adding new catalog categories (Dächer, Treppen), which are themselves prerequisite to a coherent final-step summary.

The top risks are concrete and all preventable: PDF memory exhaustion on Render.com from uncompressed images (critical — address before adding any large assets), wizard state loss on browser back/refresh (high — use sessionStorage from day one), coordinate drift from editing the monolithic pdfService (high — decompose first), and backward compatibility of saved submissions when new catalog fields are added (high — migration script required at deploy time). None of these are fundamental blockers; all have clear prevention strategies documented in research.

---

## Key Findings

### Recommended Stack

The existing stack requires no replacement. The upgrade adds exactly three packages: `sharp` promoted from devDependency to production dependency (image compression before PDF embedding), `express-rate-limit` (protect the CPU-intensive `/submit` endpoint), and `nodemon` as a devDependency for faster PDF iteration. Custom TTF fonts (Montserrat or confirmed brand font) are downloaded as static assets — no npm package needed. All other improvements — true wizard navigation, touch optimization, per-step validation — are achievable in existing vanilla JS and CSS within the no-build-step constraint.

**Core technologies:**
- **PDFKit ^0.14.0**: Keep and extend — `registerFont()` for custom typography, `doc.image(buffer)` with sharp-preprocessed images. No alternative PDF engine justified.
- **sharp ^0.34.5**: Promote to production dep — resize and JPEG-compress product images to under 400 KB before embedding, preventing Render.com memory exhaustion.
- **express-rate-limit ^7.x**: Add — rate-limit `/submit` to 10 requests/60s; one bot request can fill the disk or crash the worker.
- **Vanilla JS + CSS (no framework)**: Keep — true wizard UX is ~150 lines of JS with localStorage/sessionStorage and CSS show/hide. No Alpine.js, HTMX, or React justified given no-build-step constraint.
- **Custom TTF fonts (Montserrat or brand font)**: Download as static assets into `assets/fonts/` — PDFKit `registerFont()` is stable since 0.8.x. Use only for headings; keep Helvetica for body text to avoid file-size bloat.
- **nodemon ^3.x**: Add as devDependency — eliminates manual restarts during PDF coordinate iteration.

**Remove:** `heic-convert`, `open`, `body-parser` (Express 4.16+ has `express.json()`/`express.urlencoded()` built in).

### Expected Features

The research identifies an important gap between current functional state and sales-tool quality. Several features are already collected in the form but never rendered into the PDF (Eigenleistungen, Raumplanung). These are higher priority than adding new features because they close quality gaps customers will notice.

**Must have (table stakes for a sales-consultation tool):**
- True single-step wizard visibility (one section at a time, not all 14 visible at once)
- Tablet touch targets: 44 px minimum on all interactive elements (Apple HIG)
- Product image for every catalog item in PDF, properly sized (not 23 MB PDFs)
- Personalized customer name prominently displayed on title page
- KfW standard clearly explained in PDF
- Server-side validation of all required fields before PDF generation
- Corporate branding consistent throughout — colors, fonts, logo placement

**Should have (differentiators that drive contract closings):**
- Emotional hero image on PDF title page (full-bleed lifestyle photography)
- Eigenleistungen page in PDF — data already collected, never rendered (confirmed gap)
- Raumplanung page rendered correctly — exists in code but produces inconsistent output
- "Warum Lehner Haus?" comparison checklist in PDF — partially exists, needs content quality
- Per-component visual hierarchy: large image first, then advantages, then technical specs
- New catalog categories: Dachkonstruktion and Treppen (explicitly in PROJECT.md requirements)
- Executive summary / key facts one-pager — partially exists, needs completeness review
- QR code with better placement and labeling (already implemented, needs surfacing)
- Glossary of technical terms (already implemented, needs quality review)

**Defer to v2+:**
- Advisor photo upload — requires file upload/storage pipeline, significant scope for incremental gain
- PDF regeneration without re-entry — current workflow (create new submission) is acceptable
- Admin submissions listing — operational utility, does not affect sales quality
- Any form of customer self-service, CRM/ERP integration, user accounts, or automated email

**Confirmed anti-features (do not build):** Price calculator, customer self-service, CRM integration, user accounts, multilingual support, customer-facing PDF URLs, 3D viewer, version history/comparison, automated email.

### Architecture Approach

Two independent work tracks share a single submission data contract. The PDF track decomposes the 1,672-line monolith into per-page modules under `src/services/pdf/pages/`, each exporting `{ condition(data), render(doc, data, layout) }`. The wizard track converts `index.ejs` from a single scrolling form to a JS-driven step machine with localStorage/sessionStorage state, driven by a `WIZARD_STEPS` config array, with final POST contract unchanged. A lightweight `/api/catalog` endpoint enables dynamic KfW re-filtering without page reload. New catalog categories (Dächer, Treppen) are purely additive across all layers — catalog.json, catalogService, submissionService, pdfService, wizard steps, and result.ejs.

**Major components:**
1. **pdfLayout** (`src/services/pdf/layout.js`) — brand constants (colors, fonts, margins), shared draw helpers (header, footer, page number, image with fallback). Pure functions, no side effects. All page modules import from here.
2. **pdfPages modules** (`src/services/pdf/pages/*.js`) — one module per page type; each exports `condition` and `render`. pdfService becomes an orchestrator of ~30 lines.
3. **WizardController** (`public/js/wizard.js`) + **WizardState** (sessionStorage) — step state machine, per-step validation via Constraint Validation API, URL hash for back-button support. Runs entirely in browser; no server session needed.
4. **catalogService** (`src/services/catalogService.js`) — unchanged as single source of validation truth; catalog data injected into EJS or served via `/api/catalog` for wizard dynamic filtering.
5. **submissionService** (`src/services/submissionService.js`) — add defensive null checks for new category fields; migration script for existing submissions.

**Suggested build order (from ARCHITECTURE.md):**
- Layer 0: Catalog expansion (Dächer, Treppen in catalog.json) — unblocks all other work
- Layer 1: PDF layout foundation (extract layout.js) — prerequisite to safe page editing
- Layer 2: PDF page module decomposition — prerequisite to visual quality improvements
- Layer 3: PDF visual quality improvements — page-by-page with isolated modules
- Layer 4: New PDF pages (daecher.js, treppen.js) — additive, depends on Layer 2 + Layer 0
- Layer 5: Wizard UI conversion — independent of PDF track, depends on Layer 0 for new steps
- Layer 6: Result page polish + content review — depends on Layers 4 and 5

### Critical Pitfalls

1. **PDF memory exhaustion on Render.com** — Large uncompressed images (1-3 MB each) held in memory simultaneously across 8-10 product pages can exceed Render.com's 512 MB / 2 GB RAM limits, causing corrupt PDFs and worker restarts. Prevention: pre-process all product images to JPEG ≤ 400 KB using sharp before embedding; add try/catch around entire PDF generation. Address before adding any large images.

2. **PDFKit coordinate drift** — The 1,672-line monolith has hardcoded x/y coordinates with no layout engine. Changing header height or font size breaks all downstream coordinates silently. Prevention: extract `layout.js` with all margin/position constants first; create a `drawPage()` abstraction for safe-area content; add a `doc.y` assertion before footer. Address as first task in PDF quality phase.

3. **Wizard state lost on browser back/refresh** — Vanilla JS variables are ephemeral; tablet screen timeouts or accidental back navigation in a sales meeting destroys all progress. Prevention: persist every step transition to `sessionStorage` (not `localStorage` — GDPR concern for customer data); use URL hash for current step number. Note: ARCHITECTURE.md recommends localStorage; PITFALLS.md correctly flags GDPR concern for customer PII — use sessionStorage.

4. **New catalog categories break existing submissions** — JSON files on disk have no schema migration. Old submissions lack `dach`/`treppe` fields; accessing them after deploy causes 500 errors. Prevention: write `scripts/migrate-submissions.js` before deploying new categories; add defensive null checks in pdfService for every new optional field; add `schemaVersion` field to submission JSON.

5. **Validation bypass via direct POST** — Client-side wizard validation is cosmetic; the server `/submit` endpoint accepts any POST body. Missing selections for new categories cause pdfService crashes on `undefined`. Prevention: add explicit server-side required-field check for every catalog category that has a PDF page; return 400 with German error message, not 500.

---

## Implications for Roadmap

Based on combined research, the build order follows strict dependencies: shared foundations before feature work, PDF refactor before visual quality, wizard architecture before wizard content, migration script before new categories deploy to production.

### Phase 1: Foundations and Catalog Expansion

**Rationale:** The catalog expansion (Dächer, Treppen) is the single change that unblocks the most downstream work — it cannot be deferred without blocking both new PDF pages and new wizard steps. The PDF layout.js extraction is the prerequisite that makes all subsequent PDF visual work safe. Both are low-risk, high-enabling changes. Neither affects any existing user-facing behavior.

**Delivers:** Catalog data with Dachkonstruktion and Treppen categories; `layout.js` brand constants extracted; `data/pdf-content.json` for marketing copy separation; migration script for existing submissions.

**Addresses:** New catalog categories (FEATURES.md), coordinate drift prevention (PITFALLS.md Pitfall 2), marketing copy separation (PITFALLS.md Pitfall 6).

**Avoids:** Starting visual quality work in the monolith (guarantees coordinate regressions); starting wizard conversion before step definitions include new categories.

### Phase 2: PDF Service Decomposition

**Rationale:** The 1,672-line monolith cannot be visually improved safely — any coordinate change has a blast radius of the entire document. This phase extracts each page into its own module. It produces no user-visible change but makes Phase 3 possible without regression risk. Each extraction is independently testable by generating a full PDF and visually inspecting that page.

**Delivers:** `src/services/pdf/pages/*.js` modules for all existing page types; pdfService reduced to ~30-line orchestrator; confirmed no regression in existing PDF output.

**Addresses:** Monolith anti-pattern (ARCHITECTURE.md), coordinate drift pitfall (PITFALLS.md Pitfall 2), page-number off-by-one prevention (PITFALLS.md Pitfall 15).

**Avoids:** Adding new pages or visual improvements directly to the monolith.

### Phase 3: PDF Visual Quality and Gap Closure

**Rationale:** With isolated page modules, each page can be improved independently. The Eigenleistungen gap (data collected, never rendered) and Raumplanung inconsistency are the highest-priority fixes — they require no new UI and close visible incompleteness. The visual hierarchy reorder (image first, then emotion, then specs) and sharp image compression directly address the 23 MB PDF problem and brochure quality bar.

**Delivers:** Eigenleistungen page rendering (confirmed gap closed); Raumplanung rendering fixed; per-component pages redesigned with emotional visual hierarchy; image compression via sharp (target: PDFs under 5 MB); custom font on title/headings; new Dachkonstruktion and Treppen PDF pages; emotional title page hero image support.

**Addresses:** Eigenleistungen gap (FEATURES.md, confirmed in CONCERNS.md), PDF visual quality differentiators (FEATURES.md), image memory exhaustion (PITFALLS.md Pitfall 1), PDF file size (PITFALLS.md Pitfall 10).

**Avoids:** Font embedding for body text (keep Helvetica; custom font headings only to stay under 5 MB target).

**Uses:** sharp (promoted to production dep), TTF font files in `assets/fonts/`, `data/pdf-content.json` for marketing copy.

### Phase 4: Wizard UI Conversion

**Rationale:** This track is independent of the PDF track and can be developed concurrently after Phase 1. The wizard conversion has a clear prerequisite: establish the EJS partial/layout architecture before writing any step content, or template explosion is guaranteed. The step order and count must be derived from a `WIZARD_STEPS` config array — never hardcoded.

**Delivers:** True single-step-visible wizard with progress bar; sessionStorage persistence (survives browser back/refresh/screen timeout); per-step Constraint Validation API validation; swipe gesture navigation; 44 px touch targets throughout; URL hash for back-button support; dynamic KfW re-filtering via `/api/catalog` endpoint or EJS-injected catalog JSON; Bauherr data collection with server-side validation.

**Addresses:** Tablet wizard UX gap (FEATURES.md, PROJECT.md), wizard state loss (PITFALLS.md Pitfall 3), EJS template explosion (PITFALLS.md Pitfall 5), KfW logic duplication (PITFALLS.md Pitfall 11), hardcoded step count (PITFALLS.md Pitfall 12), touch target sizing (PITFALLS.md Pitfall 8).

**Avoids:** Per-step server round-trips (localStorage/sessionStorage state, single final POST); React/Vue/Alpine.js (no-build-step constraint); Express session middleware.

### Phase 5: Server Hardening and Infrastructure

**Rationale:** With PDF quality and wizard UX addressed, the remaining gaps are operational: rate limiting on the expensive endpoint, Render.com cold-start mitigation, ephemeral filesystem decision, and submission data protection. These are not features but production readiness requirements before the upgraded tool goes to regular sales use.

**Delivers:** express-rate-limit on `/submit` (10 req/60s); `/health` endpoint for uptime monitor; UptimeRobot or equivalent pinging every 5 minutes during business hours; nodemon for dev workflow; body-parser removed (Express built-ins); explicit decision on Render.com persistent disk vs. ephemeral; EJS `<%-` audit for XSS; startup asset path existence check.

**Addresses:** Rate limiting gap (STACK.md), cold-start timeout (PITFALLS.md Pitfall 7), ephemeral filesystem (PITFALLS.md Pitfall 13), XSS via catalog content (PITFALLS.md Pitfall 14), asset path case sensitivity (PITFALLS.md Pitfall 16), validation bypass (PITFALLS.md Pitfall 4).

### Phase 6: Content Quality and Polish

**Rationale:** Code is complete; sales effectiveness is determined by content quality. Catalog `advantages`, `comparisonNotes`, and `emotionalHook` fields (new) need review and improvement to match brochure standards. The "Warum Lehner Haus?" comparison checklist, glossary, and "Ihre nächsten Schritte" CTA need content quality review. QR code placement needs reconsideration.

**Delivers:** Reviewed and improved catalog item copy for all 9 categories; populated `emotionalHook` field for each item; "Warum Lehner Haus?" checklist with defensible competitive claims; glossary review; QR code with better label/placement; result.ejs updated to display all new categories.

**Addresses:** Sales differentiators (FEATURES.md — comparison checklist, executive summary, brand story, QR code, glossary, CTA).

### Phase Ordering Rationale

- Phases 1-2 (Foundations, Decomposition) are non-negotiable prerequisites. Visual quality work in the monolith guarantees regressions. New categories without migration guarantees production 500s.
- Phase 3 (PDF Quality) and Phase 4 (Wizard) are independent after Phase 1 and can be parallelized or sequenced based on what the Fachberater team needs first (PDF quality vs. tablet UX).
- Phase 5 (Hardening) can be woven into Phase 3/4 or treated as a dedicated phase before go-live.
- Phase 6 (Content) is post-code and requires stakeholder input from Lehner Haus sales/marketing — schedule it when the Fachberater team has capacity to review copy.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Wizard):** sessionStorage vs. URL params trade-offs for wizard state persistence need a concrete decision before implementation. The ARCHITECTURE.md recommendation of localStorage conflicts with PITFALLS.md GDPR concern — resolve this in planning.
- **Phase 5 (Infrastructure):** Render.com persistent disk pricing and availability for the current deployment tier needs verification before committing to a submissions persistence strategy.

Phases with standard patterns (skip research-phase):
- **Phase 2 (PDF Decomposition):** Pure Node.js module extraction — well-documented pattern, no external dependencies.
- **Phase 3 (PDF Visual Quality):** PDFKit image and font APIs are stable and well-documented; sharp API is stable at 0.34.x.
- **Phase 6 (Content):** Not a technical problem — needs stakeholder collaboration, not research.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing package.json is the source of truth; PDFKit and sharp APIs verified against working codebase; only express-rate-limit and nodemon versions need `npm info` confirmation before install |
| Features | HIGH | Domain knowledge cross-verified against 5 publicly observable German Fertighaus configurators; current status assessments read directly from pdfService.js, CONCERNS.md, and PROJECT.md |
| Architecture | HIGH | All patterns are established Node.js/Express/PDFKit conventions; localStorage/sessionStorage wizard pattern is industry standard; no speculative integrations |
| Pitfalls | HIGH (most), MEDIUM (Render.com specifics) | PDFKit limitations, wizard state loss, and schema migration are fundamental and well-established; Render.com memory limits and cold-start timeout behavior are documented but the specific interaction with PDF generation is inferred, not measured |

**Overall confidence:** HIGH

### Gaps to Address

- **sessionStorage vs. localStorage for wizard state:** ARCHITECTURE.md recommends localStorage; PITFALLS.md correctly flags GDPR concern for customer PII (name, email, phone in wizard). Resolve in planning: use sessionStorage (cleared on tab close) for submission data, localStorage only for non-PII preferences (e.g., remembered KfW standard).
- **Actual Render.com memory tier:** The current deployment tier is unknown from research. Verify whether it is free (512 MB) or starter (2 GB) — this changes the urgency of image compression before deployment.
- **Lehner Haus corporate font:** Research recommends Montserrat as a default. If Lehner Haus has a brand font file, it should replace Montserrat. Confirm with client before Phase 3.
- **Render.com persistent disk decision:** Data/submissions directory is ephemeral without a paid persistent disk addon. This is an operational decision (cost vs. reliability) that must be made before Phase 5.
- **express-rate-limit v7.x current version:** Confirm with `npm info express-rate-limit version` before install — training data cutoff is January 2025.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase: `package.json`, `src/services/pdfService.js` (1,672 lines read), `.planning/codebase/CONCERNS.md`, `CLAUDE.md` — authoritative current state
- PDFKit 0.14.x API: `registerFont()`, `doc.image()`, `doc.bufferedPageRange()` — stable since v0.8.x
- HTML5 Constraint Validation API — baseline browser API, available since 2015
- sessionStorage/localStorage browser APIs — fundamental web platform

### Secondary (MEDIUM confidence)
- German Fertighaus configurator publicly observable behavior (Fingerhaus, WeberHaus, Allkauf Haus, Massa Haus, Town & Country Haus) — domain feature pattern cross-verification
- sharp 0.34.x API: `.resize()`, `.jpeg({ quality })`, `.toBuffer()` — stable core API, training data as of Jan 2025
- express-rate-limit v7.x — training data as of Jan 2025; verify current version before install
- Render.com memory limits and ephemeral filesystem — official Render documentation as of training data
- PDFKit font embedding behavior and subsetting limitations — GitHub issues and documentation patterns

### Tertiary (LOW confidence — validate during implementation)
- Specific Render.com cold-start timeout values — inferred from documented spin-down behavior, not measured on this deployment
- PDF file size with custom fonts under specific catalog configurations — estimated from PDFKit embedding behavior, not measured against actual product images

---
*Research completed: 2026-02-17*
*Ready for roadmap: yes*
