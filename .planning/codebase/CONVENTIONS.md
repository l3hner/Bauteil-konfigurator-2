# Coding Conventions

**Analysis Date:** 2026-02-17

## Naming Patterns

**Files:**
- Route files: lowercase, noun-only (`index.js`, `submit.js`, `result.js`, `pdf.js`)
- Service files: camelCase with `Service` suffix (`catalogService.js`, `submissionService.js`, `pdfService.js`)
- Utility files: camelCase with `Utils` suffix (`fileUtils.js`)
- Script files: kebab-case (`generate-placeholder-images.js`, `create-dummy-assets.js`, `optimize-images.js`)
- Test files: prefixed with `test-` for manual scripts, `.test.js` suffix for Jest tests (`test-catalog-debug.js`, `pdf-generator.test.js`)

**Functions:**
- Service methods: camelCase verbs (`getWalls`, `getVariantById`, `validateSelection`, `parseRoomData`, `saveSubmission`)
- Helper functions: camelCase verbs (`getFileHash`, `isPathSafe`, `getFileExtension`, `fileExists`)
- Frontend functions: camelCase verbs (`updateWallOptions`, `createPlaceholderImage`)

**Variables:**
- camelCase for all variables and parameters
- German domain terms preserved as-is in data: `bauherr`, `eigenleistungen`, `erdgeschoss`, `obergeschoss`, `untergeschoss`
- Descriptive names: `sanitizedId`, `filePath`, `submissionsDir`
- Constants in SCREAMING_SNAKE_CASE only in scripts: `COLORS`

**Classes:**
- PascalCase: `CatalogService`, `SubmissionService`, `PdfService`, `ToastNotification`
- Exported as singleton instances: `module.exports = new CatalogService()`

## Code Style

**Formatting:**
- No formatter configured (no `.prettierrc`, no `biome.json`, no eslint config)
- Services use 2-space indentation consistently
- `fileUtils.js` uses 4-space indentation (inconsistency)
- Frontend `script.js` uses 4-space indentation
- Single quotes for strings in Node.js backend code
- Template literals for string interpolation

**Linting:**
- No linting tool configured
- No eslint or prettier in devDependencies

**Module system:**
- CommonJS (`require`/`module.exports`) throughout — no ES modules
- Services follow the pattern: require dependencies at top, define class, export singleton

## Import Organization

**Order (Node.js backend):**
1. Node built-ins (`fs`, `path`, `crypto`)
2. Third-party packages (`express`, `pdfkit`, `uuid`)
3. Local services/utilities (`../services/catalogService`)

**Pattern:**
```js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const catalogService = require('../services/catalogService');
```

**Path Aliases:**
- None — relative paths only: `../services/catalogService`, `../../data/catalog.json`

## Error Handling

**Strategy:** try/catch everywhere, log to console, return safe fallback or HTTP error response.

**Route-level pattern:**
```js
try {
  // business logic
} catch (error) {
  console.error('Fehler beim Verarbeiten der Anfrage:', error);
  res.status(500).send('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
}
```

**Service-level pattern (synchronous):**
```js
try {
  const data = fs.readFileSync(this.catalogPath, 'utf8');
  return JSON.parse(data);
} catch (error) {
  console.error('Fehler beim Laden des Katalogs:', error);
  return { walls: [], innerwalls: [] }; // safe empty fallback
}
```

**Service-level pattern (async):**
```js
try {
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
} catch (error) {
  console.error('Fehler beim Laden der Submission:', error);
  return null;
}
```

**Validation pattern (whitelist):**
```js
const validation = catalogService.validateSelection(submission);
if (!validation.valid) {
  return res.status(400).json({ error: 'Ungültige Auswahl', details: validation.errors });
}
```

**HTTP status codes used:**
- `200` — implicit success
- `400` — invalid user input (validation failure)
- `404` — resource not found
- `500` — unexpected server error

## Logging

**Framework:** `console` only — no logging library.

**Patterns:**
- Route debug logs use bracket prefixes: `console.log('[Route /] Loading catalog...')`
- Service error logs use German messages: `console.error('Fehler beim Laden des Katalogs:', error)`
- PDF service uses bracket category prefixes: `console.error('[PDF] ERROR: Innenwand not found:', ...)`
- File utility uses bracket prefixes: `console.error('[HASH] Fehler bei ${filePath}:', err.message)`
- Console logs are left in production code — no log levels or environment gating beyond the auto-open browser block

## Comments

**When to Comment:**
- German-language inline comments for domain logic (e.g., `// Bei KfW 55 nur "keine" Lüftung`)
- English comments for structural sections (e.g., `// Middleware`, `// Routes`, `// Error handling`)
- JSDoc-style comments used in `fileUtils.js` for utility functions

**JSDoc/TSDoc:**
- Used in `src/utils/fileUtils.js` for each exported function
- Not used in service classes or route handlers

**Example from `fileUtils.js`:**
```js
/**
 * Prüft ob ein Pfad sicher innerhalb eines Basisverzeichnisses liegt
 * Verhindert Path-Traversal-Angriffe
 */
function isPathSafe(targetPath, basePath) { ... }
```

**Section separators in frontend:**
- Large uppercase banner comments used in `public/js/script.js`:
```js
// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
```

## Function Design

**Size:** Methods in service classes can be long (pdfService methods run 50-200+ lines for PDF drawing). Route handlers are short (10-30 lines).

**Parameters:** Simple positional parameters. Services use `this` for shared state (`this.catalog`, `this.outputDir`).

**Return Values:**
- Synchronous getters return arrays or objects, never throw — fallback to `[]` or `{}`
- Async methods return the result or `null` on error
- Validation returns `{ valid: boolean, errors: string[] }`

## Module Design

**Exports:**
- Services: singleton instance `module.exports = new CatalogService()`
- Utilities: named function exports `module.exports = { getFileHash, isPathSafe, ... }`
- Routes: Express Router instance `module.exports = router`

**Barrel Files:** None — imports always go directly to the specific module.

## Class vs Function Pattern

- Business logic lives in ES6 classes (`CatalogService`, `SubmissionService`, `PdfService`)
- Utility helpers are plain functions (`fileUtils.js`)
- Frontend uses ES6 classes for UI components (`ToastNotification`)
- Singleton export pattern for all service classes

## Security Conventions

- Always sanitize IDs before filesystem access: `id.replace(/[^a-zA-Z0-9-]/g, '')`
- Always use `path.join()` — never string concatenation for file paths
- Validate all user selections against the catalog whitelist before processing
- Path traversal check available in `src/utils/fileUtils.js` `isPathSafe()`

---

*Convention analysis: 2026-02-17*
