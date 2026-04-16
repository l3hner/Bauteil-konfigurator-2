const fs = require('fs');
const path = require('path');
const pdfService = require('../src/services/pdfService');

describe('PDF-Generierung', () => {
  const testId = 'test-pdf-integration';
  const outputPath = path.join(__dirname, '../output', `Leistungsbeschreibung_${testId}.pdf`);

  afterAll(() => {
    // Cleanup
    try { fs.unlinkSync(outputPath); } catch (_) { /* ignore */ }
  });

  test('generiert PDF-Datei für minimale Submission', async () => {
    const submission = {
      id: testId,
      timestamp: new Date().toISOString(),
      bauherr_anrede: 'Herr',
      bauherr_vorname: 'Test',
      bauherr_nachname: 'PDF',
      bauherr_email: 'test@example.com',
      bauherr_telefon: '0123456789',
      kfw_standard: 'KFW55',
      haustyp: null,
      personenanzahl: 2,
      grundstueck: 'vorhanden',
      wall: null,
      innerwall: null,
      decke: null,
      window: null,
      tiles: null,
      dach: null,
      heizung: null,
      lueftung: null,
      treppe: null,
      rooms: { erdgeschoss: [], obergeschoss: [], untergeschoss: [] },
      eigenleistungen: [],
      berater_name: '',
      berater_telefon: '',
      berater_email: '',
      berater_freitext: '',
    };

    const result = await pdfService.generatePDF(submission);

    // PDF-Datei existiert
    expect(fs.existsSync(result)).toBe(true);

    // PDF ist nicht leer (mindestens 1 KB)
    const stats = fs.statSync(result);
    expect(stats.size).toBeGreaterThan(1024);

    // PDF beginnt mit %PDF Header
    const header = Buffer.alloc(5);
    const fd = fs.openSync(result, 'r');
    fs.readSync(fd, header, 0, 5, 0);
    fs.closeSync(fd);
    expect(header.toString()).toBe('%PDF-');
  }, 30000); // 30s Timeout für PDF-Generierung
});
