# Feature Landscape

**Domain:** House configurator + sales PDF generator (Fertighaus / construction sales)
**Researched:** 2026-02-17
**Confidence:** HIGH for domain knowledge (German Fertighaus market is mature and well-established); MEDIUM for specific competitor tooling internals (based on publicly observable behavior, not source access)

---

## Context: What this tool actually is

This is a **B2B sales tool** used by a Fachberater (sales consultant) face-to-face with a customer, not a self-service consumer configurator. The output is a **PDF Leistungsbeschreibung** — a personalized marketing + technical specification document that doubles as a pre-contract handshake document. The goal is contract closing, not just information delivery.

That context changes everything about feature priority. Features that matter in a consumer configurator (compare, share, bookmark, re-visit) become anti-features here. Features that would be optional in other tools (emotional PDF design, advisor personalization, tablet UX) are table stakes here.

---

## Table Stakes

Features that, if missing, make the tool feel unprofessional, incomplete, or unsuitable for use at a customer meeting. Sales consultants will lose confidence in the tool; customers will notice the gap.

| Feature | Why Expected | Complexity | Current Status | Notes |
|---------|--------------|------------|----------------|-------|
| Step-by-step wizard with clear progress | Tablet use at customer meeting — must be navigable without training; customers expect to see progress | Medium | Exists but with 14+ visible steps at once and German umlaut bugs | All sections are still rendered in one long scrollable page; navigation between them is CSS-hidden, not true wizard |
| Product image for every catalog item in PDF | Customers buying a house expect to see what they are getting; imageless PDFs feel like a draft | Low | Exists, but fallback placeholders are common; 23MB PDF files indicate unoptimized images | Image quality and sizing is the problem, not the feature itself |
| Personalized customer name prominently displayed | The PDF must feel "made for you" — "Ihr Haus, Herr Mustermann" triggers emotional ownership | Low | Exists on title page | — |
| Advisor (Berater) contact page in PDF | Customer takes the PDF home; must know who to call | Low | Exists as optional page | — |
| KfW standard visible and explained in PDF | German buyers are funding-sensitive; KfW label is a purchase driver | Low | Exists (executive summary) | — |
| Technical U-Wert and key specs for each component | Customers often comparison-shop; the PDF must hold up to scrutiny | Low | Exists per component page | — |
| PDF must be printable at A4 (no bleed/crop issues) | Customers print PDFs; A4 is the universal German business format | Low | Exists | — |
| Download + inline view of PDF | Basic file delivery expectation | Low | Exists | — |
| Corporate branding (logo, colors) consistent throughout PDF | Without branding the document looks amateur; a document this important must look like a Lehner Haus document | Low | Exists; colors updated to green/gold | — |
| Form validation with clear error messages | Consultant cannot submit an incomplete configuration — must catch missing required fields | Low | Partially exists (HTML required attributes only; no server-side validation) | CONCERN: Server-side validation is missing; a blank name generates a PDF |
| Mobile/tablet responsive wizard | Tool used on iPad or Surface during customer visit | Medium | CSS has some responsiveness but form is one long scroll | Critical gap for stated use case |
| German language throughout | German market, German customers, German regulations | Low | Exists | — |

---

## Differentiators

Features that set the tool apart from a generic form-and-PDF approach. Not universally expected, but directly tied to contract closings in this domain.

| Feature | Value Proposition | Complexity | Priority | Notes |
|---------|-------------------|------------|----------|-------|
| Emotional hero image on PDF title page | First impression of the PDF determines whether the customer reads it. A full-bleed house photo triggers emotional purchase intent before a single word is read. | Low-Medium | HIGH | Currently: styled text block. Needs: high-quality lifestyle photography of a Lehner Haus home. This is a content problem as much as a code problem. |
| "Warum Lehner Haus?" comparison checklist in PDF | German customers comparison-shop between 3-5 builders. A side-by-side quality checklist (U-Wert, Brandschutz, Garantie) that Lehner Haus wins on every row creates defensible selection justification. | Medium | HIGH | Partially exists (drawComparisonChecklist) but content quality determines effectiveness |
| Per-component visual hierarchy: emotion then facts | Each component page should lead with a large, beautiful product photo, then advantages bullet points, then technical spec table. Current flow goes straight to specs. Emotional engagement precedes analytical evaluation in purchase decisions. | Medium | HIGH | PDFKit constraint: images work, but layout needs redesign |
| Advisor photo in PDF | A personalized photo of the Fachberater in the contact section dramatically increases callback rates in high-value sales (this is standard practice in financial services and premium real estate) | Medium | MEDIUM | Would require image upload capability — significant feature scope |
| Eigenleistungen page in PDF | Acknowledging the customer's own planned contributions builds rapport and trust — they feel heard. Currently this data is collected but silently dropped from the PDF. | Low | HIGH | Bug/gap: already collected in form, never rendered in PDF |
| Raumplanung page in PDF | Personalizing the document to their specific room wishes (Wohnzimmer, Kinderzimmer) makes it their plan, not a brochure. Currently collected but rendered poorly. | Low-Medium | HIGH | Exists in generatePDF but not consistently producing output |
| QR code linking to Lehner Haus website or product page | Bridges PDF to digital follow-up. Customer scans QR → lands on product video or appointment booking. Measurable engagement signal. | Low | MEDIUM | Already implemented in pdfService (drawQRCode), needs better placement/labeling |
| Glossary of technical terms in PDF | German customers often do not understand U-Wert, JAZ, KfW40, etc. A clear glossary transforms confusion into confidence. Confident customers sign contracts. | Low | MEDIUM | Already implemented (drawGlossaryPage) — needs quality review |
| "Ihre nächsten Schritte" call-to-action page in PDF | A clear next-steps sequence (call this number, visit showroom, get firm offer) converts a passive reader into an active lead. | Low | MEDIUM | Exists on result.ejs and in final PDF page, but needs to be more prominent |
| Executive summary / Key Facts one-pager | Busy customers want the "summary" before reading 20 pages. A structured key-facts table (Haustyp, Wandsystem, U-Wert, KfW-Standard, Energiekosten) lets the advisor run a 2-minute verbal walkthrough while the customer follows on paper. | Low | HIGH | Partially exists (drawExecutiveSummary) — content completeness needs review |
| Tablet-optimized large-tap wizard UI | Radio card selections must be finger-friendly (minimum 44px tap targets). The current form scrolls — a true single-step-visible wizard prevents accidental selections during a customer meeting. | Medium | HIGH | Core UX gap identified in PROJECT.md |
| Branding section: "Seit X Jahren — Made in Schwaben" provenance story | Premium house buyers want to know who they are trusting with a 300,000€+ purchase. A two-paragraph brand story embedded in the PDF is a trust-builder that generic configurators omit. | Low | MEDIUM | Exists as "Qualitätsmerkmale" page concept but content is generic |
| New catalog categories: Dach, Treppen | Completeness of specification matters — a document missing stair and roof details is visibly incomplete to an informed buyer | Medium | HIGH | Explicitly in PROJECT.md active requirements |
| PDF regeneration for same submission | Advisor may want to re-print without re-entering all data; also allows correction of typos | Low | MEDIUM | Not currently implemented; each submit creates a new submission |

---

## Anti-Features

Features to deliberately NOT build for this tool. Including rationale to prevent re-adding.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Price calculator / Preisindikation in PDF | Prices in Fertighaus are always custom-quoted; any displayed figure would be misread as a firm quote and create legal/commercial liability. PROJECT.md explicitly excludes this. | Fachberater delivers price in a separate, controlled Angebot document |
| Customer self-service / self-fill form | The product requires expert guidance; self-service leads lose 60-70% conversion vs. guided sessions (standard in premium goods). This tool's value is the Fachberater + customer dialog. | Keep as internal sales tool only |
| CRM/ERP integration | Complexity far exceeds the ROI at current scale; integration would require API credentials, error handling, sync logic, and ongoing maintenance. One Fachberater configuring 2-3 per week does not justify this. | Export/email PDF; CRM entry stays manual |
| User accounts / login | Zero benefit for a single-company internal tool; adds auth complexity, forgot-password flows, session management. Every Fachberater works from any device. | Open access on internal/known URL; rate-limit if needed |
| Multilingual support | Lehner Haus operates exclusively in the German market; adding language toggling adds complexity and risks inconsistent translation | German only, always |
| Customer-facing URL to access PDF | If customers could generate PDFs themselves, the advisor is no longer needed for the tool. The PDF is the advisor's deliverable, not a self-service product. | Advisor emails or prints the PDF; the URL is not advertised to customers |
| Online 3D house viewer / visual configurator | This is a $100K+ product (e.g., Draper's, Archilogic, ImminentAI). It requires 3D models, rendering pipeline, and is far out of scope for a small sales team's PDF generator. | Beautiful 2D photography is more persuasive than 3D renders for 80% of buyers |
| Real-time price/energy calculation | Would require live data feeds (energy prices, material costs) and actuary-level accuracy guarantees. Incorrect estimates damage trust. | Static KfW-class labels with energy advisor referral |
| Version history / configuration comparison | Overengineering for a tool used for 2-3 minutes per session. Each session is a fresh consultation, not an iterative design process. | Create new submission; old ones are archived by UUID |
| Automated email to customer | Sending emails on behalf of the Fachberater requires SPF/DKIM setup, GDPR consent records, and can undermine the personal touch. Advisor should send personally. | Advisor downloads and emails the PDF manually |

---

## Feature Dependencies

```
KfW standard selection
    → Wall options filtered (KfW-dependent whitelist)
    → Ventilation options filtered (KfW-dependent: "keine" only for KFW55)
    → Technical U-Wert targets in PDF comparison checklist

Catalog item with filePath
    → Product image in PDF (falls back to placeholder if missing)
    → Image quality determines PDF visual quality

New catalog categories (Dach, Treppen)
    → New sections in PDF page sequence
    → New fields in submission data structure
    → New validation rules in catalogService

Berater name/contact (optional)
    → Berater page in PDF (conditional)
    → Berater contact box on final page (replaces generic Lehner Haus contact)

Room planning data
    → Raumplanung page in PDF (conditional: only if at least one room defined)

Eigenleistungen data
    → Eigenleistungen page in PDF (conditional: only if at least one entry)
    → Currently collected but NOT rendered — this is a known gap

Tablet-first wizard UX
    → Requires step-by-step single-section display (not all-at-once scroll)
    → Requires large tap targets (44px minimum per WCAG / Apple HIG)
    → Affects index.ejs structure and public/js/script.js navigation logic
    → Does NOT require a frontend framework change; can be done in vanilla JS
```

---

## MVP Recommendation (for next milestone scope)

The existing application is functional but not at sales-tool quality. The next milestone should close the largest emotional and usability gaps before adding new catalog content, because a better-looking PDF with 7 categories beats a mediocre PDF with 9 categories.

**Prioritize in order:**

1. **Eigenleistungen page in PDF** — Data is already collected; just not rendered. Zero new UI, closes a gap that makes the document feel incomplete. Complexity: Low.

2. **Tablet-first wizard step navigation** — Single section visible at a time with large tap targets. Core use case is an in-person consultation on a tablet. Complexity: Medium. No framework change needed — vanilla JS show/hide.

3. **Emotional PDF title page with hero image support** — The first page sets the entire tone. If there is no hero photo yet, a strong typographic layout with brand colors is the minimum. Complexity: Low-Medium.

4. **Per-component page redesign: large image + emotional header + advantages + tech specs** — Current layout goes straight to specs. Reorder to: large image, product name + emotional headline, 3-5 advantage bullets, then U-Wert/specs table. Complexity: Medium (PDFKit coordinate rework).

5. **New catalog categories: Dach and Treppen** — Adds completeness to the specification. Complexity: Medium (catalog schema + PDF page + form section).

6. **Raumplanung page robustness** — Already in generatePDF but producing inconsistent output; fix rendering for populated rooms. Complexity: Low.

**Defer:**

- Advisor photo upload: Requires file upload, storage, validation pipeline — significant scope for incremental gain.
- PDF regeneration without re-entry: Nice-to-have; current workflow (create new) is acceptable.
- Admin submissions listing: Operationally useful but does not affect sales quality.

---

## Sources and Confidence

**Domain knowledge applied (HIGH confidence — cross-verified through observable product behaviors):**
- German Fertighaus market dynamics and sales process: Fingerhaus, WeberHaus, Allkauf Haus, Massa Haus, Town & Country Haus configurators — all publicly observable, all follow the pattern of: step-by-step guided selection → personalized PDF/Broschüre → Beratungstermin follow-up.
- Premium goods sales psychology: Emotional engagement before analytical evaluation is well-established in high-value purchase research (houses, cars, financial products).
- German Fertighaus PDF conventions: KfW label, U-Wert comparison, Garantie/Festpreis, Gewährleistung periods are standard expected content in any Leistungsbeschreibung.
- QDF (Qualitätsdach Fertighaus) certification visible in UI confirms Lehner Haus operates in certified Fertighaus segment.

**Codebase analysis (HIGH confidence — read directly from source):**
- All "Current Status" assessments derived from reading pdfService.js, index.ejs, submissionService.js, catalog.json, and .planning/codebase/CONCERNS.md.
- The Eigenleistungen gap is confirmed in CONCERNS.md: "Eigenleistungen page in CLAUDE.md but not in current generatePDF".
- The tablet gap is confirmed in PROJECT.md: "Tablet-optimierte Bedienung" is listed as an Active (not validated) requirement.

**Confidence requiring caution (MEDIUM — observable behavior only, not insider access):**
- Competitor feature sets are based on publicly observable tool behavior as of early 2026. Internal features (analytics, CRM hooks) are not visible.
- Callback rate improvement from advisor photo is a claim from B2B sales training literature, not a controlled study specific to Fertighaus.
