# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Fachberater erstellen in wenigen Minuten eine personalisierte, visuell überzeugende Leistungsbeschreibung, die den Kunden begeistert und zum Vertragsabschluss führt.
**Current focus:** Phase 3 in progress — PDF Visual Quality (corporate branding + hero title page done)

## Current Position

Phase: 3 of 5 (PDF Design)
Plan: 1 of 3 completed in current phase
Status: In progress
Last activity: 2026-02-18 — Completed 03-01 corporate branding & hero title page

Progress: [█████████░] 53%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 3.9 min
- Total execution time: 0.45 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-catalog-expansion | 3 | 10 min | 3.3 min |
| 02-pdf-architektur | 3 | 14 min | 4.7 min |
| 03-pdf-design | 1 | 4 min | 4.0 min |

**Recent Trend:**
- Last 5 plans: 03-01 (4 min), 02-03 (3 min), 02-02 (6 min), 02-01 (5 min), 01-02 (5 min)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2]: Render.com memory tier unknown — if free tier (512 MB), image compression is critical before adding large assets. Verify actual tier before Phase 3.
- [Phase 3]: Montserrat implemented as heading font — can be swapped for brand font if client provides one.
- [Phase 5]: sessionStorage vs. URL params decision needed at plan time — ARCHITECTURE.md and PITFALLS.md conflict on this.

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 03-01-PLAN.md (corporate branding & hero title page). Navy/red palette and Montserrat fonts active. Ready for 03-02.
Resume file: None
