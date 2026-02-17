# External Integrations

**Analysis Date:** 2026-02-17

## APIs & External Services

**None.** This application makes no outbound HTTP calls to external APIs at runtime. All logic is self-contained.

## Data Storage

**Databases:**
- None. No database engine is used.

**File System (primary persistence):**
- Submission records: `data/submissions/<uuid>.json` - one JSON file per user configuration, written by `src/services/submissionService.js`
- Product catalog: `data/catalog.json` - static JSON file, read-only at runtime, loaded once at startup
- Generated PDFs: `output/Leistungsbeschreibung_<uuid>.pdf` - written by `src/services/pdfService.js` on each form submission

**File Storage:**
- Local filesystem only. No cloud object storage (no S3, GCS, Azure Blob, etc.)

**Caching:**
- None. EJS view cache is enabled in `production` NODE_ENV via Express (`app.set('view cache', false)` in dev). No Redis or in-memory cache layer.

## Authentication & Identity

**Auth Provider:**
- None. The application has no authentication or user accounts. It is a publicly accessible form with no login.

## PDF & QR Generation (internal libraries, not external services)

**PDFKit:**
- Used locally inside `src/services/pdfService.js`
- Generates A4 PDFs with embedded product images from `assets/variants/`
- No external PDF service API

**QRCode:**
- `qrcode` npm package generates QR code data URLs embedded in PDF pages
- No external QR service; generated in-process

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, Datadog, Rollbar, or similar service is integrated.

**Logs:**
- `console.error()` / `console.log()` to stdout only
- On Render.com the platform captures stdout logs via its dashboard

## CI/CD & Deployment

**Hosting:**
- Render.com (free tier web service)
- Configuration: `render.yaml` at project root
- Service name: `lehner-konfigurator`
- Build: `npm install`
- Start: `npm start` (runs `node src/server.js`)
- Port: 10000 (set via `PORT` env var by Render)

**CI Pipeline:**
- None. No GitHub Actions, CircleCI, or other CI pipeline configured.

## Environment Configuration

**Required env vars (production):**
- `NODE_ENV=production` - set in `render.yaml`; enables EJS view cache, disables browser auto-open
- `PORT=10000` - set in `render.yaml`; Render also injects this automatically

**Optional env vars (development):**
- `PORT` - override default port 3000 (e.g. `PORT=3001 npm start`)

**Secrets location:**
- No secrets required. No API keys, database credentials, or service tokens are used.
- `.env` file: not present and not needed

## Webhooks & Callbacks

**Incoming:**
- None. No webhook endpoints.

**Outgoing:**
- None. No outbound webhooks or HTTP calls to external services.

## Image Handling

**HEIC conversion:**
- `heic-convert` ^2.1.0 is listed as a runtime dependency for handling HEIC/HEIF product images uploaded to `assets/variants/`
- Conversion is done locally; no external image processing service

**Dev-time image tools (not in production):**
- `jimp` ^1.6.0 - run via `node scripts/generate-placeholder-images.js`
- `sharp` ^0.34.5 - run via `node scripts/optimize-images.js`

---

*Integration audit: 2026-02-17*
