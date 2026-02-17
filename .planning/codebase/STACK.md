# Technology Stack

**Analysis Date:** 2026-02-17

## Languages

**Primary:**
- JavaScript (ES2020+) - All server-side and client-side code; no TypeScript

**Secondary:**
- EJS (Embedded JavaScript) - Server-side HTML templating in `views/`

## Runtime

**Environment:**
- Node.js >=18.0.0 (runtime enforced via `engines` in `package.json`; dev machine runs v22.16.0)

**Package Manager:**
- npm 10.9.2
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Express.js ^4.18.2 - HTTP server, routing, middleware pipeline (`src/server.js`)
- EJS ^3.1.9 - Server-side rendering; templates in `views/` (index.ejs, result.ejs)

**Build/Dev:**
- No build step; raw Node.js execution via `node src/server.js`
- No watch/hot-reload configured; manual restart required during development

## Key Dependencies

**Critical:**
- `pdfkit` ^0.14.0 - Programmatic multi-page A4 PDF generation (`src/services/pdfService.js`); used for the Leistungsbeschreibung output
- `ejs` ^3.1.9 - Template engine for all HTML responses
- `express` ^4.18.2 - Core HTTP framework
- `body-parser` ^1.20.4 - Parses `application/x-www-form-urlencoded` and JSON request bodies

**Utilities:**
- `uuid` ^9.0.1 - Generates UUIDv4 for submission IDs (`src/services/submissionService.js`)
- `qrcode` ^1.5.4 - Generates QR code images embedded in PDF pages (`src/services/pdfService.js`)
- `heic-convert` ^2.1.0 - HEIC/HEIF to JPEG conversion for product images
- `open` ^9.1.0 - Listed as dependency but auto-open browser is implemented via `child_process.exec` calling `xdg-open` directly (Linux/Mac only)

**devDependencies (not installed in production):**
- `jimp` ^1.6.0 - Image manipulation; used in `scripts/generate-placeholder-images.js`
- `sharp` ^0.34.5 - High-performance image processing; used in `scripts/optimize-images.js`

## Configuration

**Environment Variables:**
- `PORT` - HTTP port (default: 3000 locally, set to 10000 on Render)
- `NODE_ENV` - Controls view caching (`production` enables EJS view cache) and browser auto-open behavior

**Build:**
- No build config files (no webpack, vite, tsconfig, etc.)
- Static assets served directly from `public/` and `assets/` via `express.static`

**Data:**
- Product catalog: `data/catalog.json` (loaded synchronously at startup by `CatalogService`)
- Submissions: `data/submissions/*.json` (written per-request by `SubmissionService`)
- Generated PDFs: `output/Leistungsbeschreibung_<uuid>.pdf`

## Platform Requirements

**Development:**
- Node.js >=18.0.0
- npm (any recent version)
- `xdg-open` for browser auto-launch (Linux/Mac); on Windows the auto-open silently fails and a manual URL is printed

**Production:**
- Deployed to Render.com (free tier web service, defined in `render.yaml`)
- Build command: `npm install`
- Start command: `npm start`
- No containerization (no Dockerfile)

---

*Stack analysis: 2026-02-17*
