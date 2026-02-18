# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Fachberater erstellen in wenigen Minuten eine personalisierte, visuell überzeugende Leistungsbeschreibung, die den Kunden begeistert und zum Vertragsabschluss führt.
**Current focus:** Phase 5 in progress — Wizard UI

## Current Position

Phase: 5 of 5 (Wizard UI)
Plan: 2 of 3 completed in current phase
Status: Executing phase 5
Last activity: 2026-02-18 — Completed 05-02 product image cards and server-side validation

Progress: [██████████████████] 93%

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: 3.4 min
- Total execution time: 0.82 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-catalog-expansion | 3 | 10 min | 3.3 min |
| 02-pdf-architektur | 3 | 14 min | 4.7 min |
| 03-pdf-design | 3 | 8 min | 2.7 min |
| 04-pdf-inhalte-und-bugs | 3 | 9 min | 3.0 min |
| 05-wizard-ui | 2 | 8 min | 4.0 min |

**Recent Trend:**
- Last 5 plans: 05-02 (4 min), 05-01 (4 min), 04-02 (5 min), 04-03 (2 min), 04-01 (2 min)
- Trend: Consistent

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [05-02]: Haustypen image src uses filePath + '1.png' (directory-based filePath from catalog)
- [05-02]: radio-card--with-image class conditionally applied -- cards without filePath are text-only (no broken images)
- [05-02]: Server-side validation returns 400 JSON (not redirect) -- wizard client-side validation is UX guard, server is security boundary
- [05-02]: 16 required fields validated server-side matching wizard client-side required fields
- [05-01]: WizardState uses IIFE module pattern -- encapsulated state with clean global API (save/load/restore/clear)
- [05-01]: KfW-dependent restore uses setTimeout(0) -- lets updateWallOptions/updateLueftungOptions rebuild DOM before re-selecting saved radios
- [05-01]: initSmoothScroll/initScrollSpy kept as dead code in script.js -- not deleted, for potential non-wizard use
- [05-01]: Script load order: wizardState.js -> wizard.js -> script.js (dependency chain for globals)
- [Roadmap]: Phase 5 (Wizard) depends only on Phase 1, not Phase 4 — can be parallelized after Phase 1 ships
- [Roadmap]: sessionStorage (not localStorage) for wizard state — GDPR concern for customer PII (name, email, phone)
- [Roadmap]: PDF decomposition (Phase 2) is a strict prerequisite before any visual quality work — coordinate drift risk
- [01-03]: Schema version stamped on data object before spread — ensures schemaVersion persists through write
- [01-03]: Migration script uses per-file error handling — one bad file does not abort migration
- [01-03]: Submission data files are gitignored — only migration script is committed, not user data
- [01-02]: Dachform before Dacheindeckung, Treppen after — logical roof grouping in form
- [01-02]: Treppensystem PDF page uses same conditional skip as Lueftung — consistent behavior for 'keine'
- [01-02]: All dach/treppe lookups use optional chaining — safe for old submissions without these fields
- [02-03]: sharp in production dependencies — needed at runtime for PDF image compression
- [02-03]: maxWidth=800 default (4x oversampling at 72 DPI), JPEG quality 75 mozjpeg, PNG compressionLevel 8
- [02-03]: Images < 10 KB skip sharp processing — avoids overhead on generated placeholders
- [02-03]: Error fallback reads raw file — single bad image does not break PDF generation
- [02-03]: ctx.imageService pattern — compression service passed through render context to page modules
- [02-02]: Page module contract: { title, condition, render } for standard pages; { renderComponent } and { renderHaustyp } for shared renderers
- [02-02]: Component pages generated dynamically in buildPageList, not as separate static modules
- [02-02]: contactPage.render is async (QR code); orchestrator uses await for all renders
- [02-02]: Dead code removed: drawOverviewContent, drawFinalContent, drawUValueBarChart, drawSCOPGauge
- [02-01]: layout.js exports flat module (not class) — simpler consumption for page modules
- [02-01]: hasCustomFonts remains on PdfService instance — mutable state, not a design constant
- [01-01]: Roof forms are KfW-neutral — all 4 entries compatible with KFW55 and KFW40
- [01-01]: Treppen 'keine' entry valid for all KfW standards — bungalow choice
- [01-01]: Dach/treppe validation uses optional pattern — null/undefined allowed for backward compat
- [03-01]: Montserrat as heading font with Helvetica-Bold fallback via try/catch — premium feel without hard dependency
- [03-01]: Hero image uses selected haustyp 1.png with fallback chain: stadtvilla -> first available -> solid navy
- [03-01]: Typography references use registered name 'Heading' — enables graceful degradation if fonts missing
- [03-01]: drawHeader uses typography.h1.font reference — all page headers get Montserrat automatically
- [03-01]: drawFooter and drawImagePlaceholder keep Helvetica intentionally — body text stays built-in
- [03-02]: Product image (filePath) preferred over technical drawing for visual impact; technical drawing is fallback
- [03-02]: Component images use fit mode (no crop) while haustyp hero uses cover mode (full-bleed)
- [03-02]: Technical details moved to compact 2-column gray box at page bottom instead of right column
- [03-02]: Heading-SemiBold for section headers (features, advantages) within pages
- [03-03]: All 9 categories always shown in executive summary grid — no conditional exclusion for Lueftung/Treppe
- [03-03]: Gold left accent bar (3px) on every grid card matches drawHeader accent pattern
- [03-03]: Technical highlights bar optional — only renders when specs exist and space remains (y < 700)
- [03-03]: Catalog 'keine' entries show their actual name (e.g. 'Keine Treppe') rather than generic 'Keine'
- [04-01]: Double-bang (!!) on eigenleistungen condition return for explicit boolean — avoids undefined leaking as falsy
- [04-01]: Graduated y-overflow thresholds: floor headers y>720, room items y>740, hint box y+60<780
- [04-03]: Flatten all alpha channels to white -- no image needs transparency in the PDF (all on white pages)
- [04-03]: maxWidth=600 (was 800) provides 1.26x oversampling at 72 DPI -- sufficient for A4 print quality
- [04-03]: JPEG quality stays at 75 -- measured full PDF at 0.27 MB, far under 5 MB target
- [04-02]: emotionalHook placed after name, before description in catalog schema for consistent field ordering
- [04-02]: componentPage fallback: emotionalHook -> description.split('.')[0], name-stripping regex only on description fallback
- [04-02]: haustypPage fallback chain: emotionalHook -> details -> description -> empty string

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2]: Render.com memory tier unknown — if free tier (512 MB), image compression is critical before adding large assets. Verify actual tier before Phase 3.
- [Phase 3]: Montserrat implemented as heading font — can be swapped for brand font if client provides one.
- [Phase 5]: sessionStorage vs. URL params decision needed at plan time — ARCHITECTURE.md and PITFALLS.md conflict on this.

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 05-02-PLAN.md (product image cards and server-side validation). Phase 5 plan 2 of 3 done.
Resume file: None
