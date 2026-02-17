# Testing Patterns

**Analysis Date:** 2026-02-17

## Test Framework

**Runner:**
- No test runner is configured in `package.json`
- `test/pdf-generator.test.js` uses Jest-style `describe`/`test`/`expect` syntax but Jest is not installed
- No `jest`, `mocha`, `vitest`, or similar package in `package.json` dependencies or devDependencies
- No `test` script defined in `package.json`

**Assertion Library:**
- Jest-style `expect()` used in `test/pdf-generator.test.js` (not currently runnable)

**Run Commands:**
```bash
# No test runner configured — tests cannot be run via npm test
# Manual test scripts are run directly:
node test/test-pdf-generation.js      # Manual smoke test for PDF generation
node test/test-catalog-debug.js       # Manual debug test for catalog service
node test/test-catalog-getvariant.js  # Manual debug test for getVariantById
node test/test-innerwall-loading.js   # Manual debug test for innerwall loading
node test/test-specific-pdf.js        # Manual test for a specific submission PDF
node test/verify-fixes.js             # Manual verification script for bug fixes
```

## Test File Organization

**Location:**
- All test files in `test/` directory at project root
- Test fixtures in `test-fixtures/` directory at project root
- Tests are NOT co-located with source files

**Naming:**
- Manual scripts: `test-{subject}.js` (e.g., `test-catalog-debug.js`)
- Jest-style file: `{subject}.test.js` (e.g., `pdf-generator.test.js`)
- Verification script: `verify-fixes.js`

**Structure:**
```
test/
├── pdf-generator.test.js         # Jest-style test (not wired to a runner)
├── test-catalog-debug.js         # Manual debug script
├── test-catalog-getvariant.js    # Manual debug script
├── test-innerwall-loading.js     # Manual debug script
├── test-pdf-generation.js        # Manual smoke test
├── test-specific-pdf.js          # Manual targeted test
└── verify-fixes.js               # Manual verification checklist

test-fixtures/
└── golden-sample.json            # Full submission fixture for PDF generation
```

## Test Structure

**Jest-style suite (not currently runnable) in `test/pdf-generator.test.js`:**
```js
describe('PDF Generator Tests', () => {
  const fixturesDir = path.join(__dirname, '../test-fixtures');
  const outputDir = path.join(__dirname, '../output');

  test('Golden sample generates PDF with floor plans', async () => {
    const submission = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const pdfPath = await pdfService.generatePDF(submission);
    expect(fs.existsSync(pdfPath)).toBe(true);
    const stats = fs.statSync(pdfPath);
    expect(stats.size).toBeGreaterThan(1000);
  });

  test('Submission without rooms skips floor plan page', async () => {
    const submission = { id: 'test-no-rooms', rooms: { erdgeschoss: [], ... } };
    const pdfPath = await pdfService.generatePDF(submission);
    expect(fs.existsSync(pdfPath)).toBe(true);
  });
});
```

**Manual script pattern in `test/test-pdf-generation.js`:**
```js
async function testPDFGeneration() {
  console.log('Testing PDF Generation...');
  const outputPath = await pdfService.generatePDF(testSubmission);
  if (fs.existsSync(outputPath)) {
    console.log('PDF generated successfully!');
  } else {
    console.log('ERROR: PDF file not found after generation');
  }
}
testPDFGeneration();
```

**Patterns:**
- Setup: load fixture from `test-fixtures/golden-sample.json` or construct inline object
- No beforeEach/afterEach teardown — generated PDFs in `output/` accumulate
- Assertions: file existence check + file size check (heuristic for page count)
- Async tests use `async/await`

## Mocking

**Framework:** None — no mocking library installed.

**Patterns:**
- No mocking is used anywhere in the test suite
- Tests call real services with real file system reads/writes
- `test-catalog-debug.js` uses `delete require.cache[require.resolve(...)]` to force a module reload:
```js
delete require.cache[require.resolve('./src/services/catalogService')];
const cs2 = require('./src/services/catalogService');
```

**What to Mock:**
- If a test runner is added: `fs` for unit tests of service methods
- `pdfService.generatePDF` for route handler tests

**What NOT to Mock:**
- The catalog JSON file — tests rely on it being present and valid

## Fixtures and Factories

**Test Data:**
```json
// test-fixtures/golden-sample.json — full realistic submission:
{
  "id": "golden-sample",
  "bauherr_vorname": "...",
  "kfw_standard": "KFW40",
  "wall": "climativ-plus",
  "rooms": { "erdgeschoss": [...], "obergeschoss": [...] }
}
```

**Inline construction pattern used in `test/pdf-generator.test.js`:**
```js
const submission = {
  id: 'test-no-rooms',
  timestamp: new Date().toISOString(),
  bauherr_vorname: 'Test',
  bauherr_nachname: 'User',
  bauherr_email: 'test@example.de',
  kfw_standard: 'KFW55',
  wall: 'climativ-esb',
  innerwall: 'innenwand-esb-gipskarton',
  rooms: { erdgeschoss: [], obergeschoss: [], untergeschoss: [] },
  eigenleistungen: []
};
```

**Location:**
- `test-fixtures/golden-sample.json` — the only fixture file

## Coverage

**Requirements:** None enforced — no coverage configuration exists.

**View Coverage:** Not possible without a test runner configured.

## Test Types

**Unit Tests:**
- Not present. Debug scripts test individual service methods manually but do not assert correctness with a test framework.

**Integration Tests:**
- `test/pdf-generator.test.js` is integration-level: calls `pdfService.generatePDF()` end-to-end and asserts on output file existence and size.
- Manual scripts (`test-catalog-debug.js`, `test-catalog-getvariant.js`) exercise real service method calls with real catalog data.

**E2E Tests:**
- Not used. No browser automation (Puppeteer for testing, Playwright, Cypress) configured.

## Common Patterns

**Async Testing:**
```js
test('generates PDF', async () => {
  const pdfPath = await pdfService.generatePDF(submission);
  expect(fs.existsSync(pdfPath)).toBe(true);
});
```

**File output assertion (primary pattern for PDF tests):**
```js
const stats = fs.statSync(pdfPath);
expect(stats.size).toBeGreaterThan(1000); // At least 1KB
expect(stats.size).toBeGreaterThan(5000); // >5KB indicates multiple pages
```

**Error path testing:**
```js
test('Invalid room data does not crash generator', async () => {
  const submission = { ..., rooms: null }; // deliberately invalid
  const pdfPath = await pdfService.generatePDF(submission);
  expect(fs.existsSync(pdfPath)).toBe(true); // should not throw
});
```

**Verification script pattern (used in `test/verify-fixes.js`):**
```js
const pdfSource = fs.readFileSync('src/services/pdfService.js', 'utf8');
const hasFeature = pdfSource.includes('expected string');
console.log('Feature present:', hasFeature ? 'YES' : 'NO');
```

## Adding Tests

To make the Jest-style tests in `test/pdf-generator.test.js` runnable:

1. Install Jest: `npm install --save-dev jest`
2. Add to `package.json`:
   ```json
   "scripts": { "test": "jest" }
   ```
3. Run: `npm test`

New test files should follow the Jest pattern already established in `test/pdf-generator.test.js` and be placed in `test/`.

---

*Testing analysis: 2026-02-17*
