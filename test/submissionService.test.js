const path = require('path');
const fs = require('fs').promises;
const submissionService = require('../src/services/submissionService');

const TEST_SUBMISSIONS_DIR = path.join(__dirname, '../data/submissions');

describe('SubmissionService', () => {
  let testSubmissionId;

  describe('parseRoomData()', () => {
    test('parst einzelnen Raum pro Geschoss', () => {
      const formData = {
        eg_rooms: 'Wohnzimmer',
        eg_details: 'groß',
        og_rooms: 'Schlafzimmer',
        og_details: 'mit Balkon',
      };

      const rooms = submissionService.parseRoomData(formData);
      expect(rooms.erdgeschoss).toHaveLength(1);
      expect(rooms.erdgeschoss[0].name).toBe('Wohnzimmer');
      expect(rooms.erdgeschoss[0].details).toBe('groß');
      expect(rooms.obergeschoss).toHaveLength(1);
      expect(rooms.untergeschoss).toHaveLength(0);
    });

    test('parst mehrere Räume als Array', () => {
      const formData = {
        eg_rooms: ['Wohnzimmer', 'Küche', 'Bad'],
        eg_details: ['groß', 'offen', ''],
      };

      const rooms = submissionService.parseRoomData(formData);
      expect(rooms.erdgeschoss).toHaveLength(3);
      expect(rooms.erdgeschoss[1].name).toBe('Küche');
      expect(rooms.erdgeschoss[2].details).toBe('');
    });

    test('filtert leere Räume', () => {
      const formData = {
        eg_rooms: ['Wohnzimmer', '', 'Küche'],
        eg_details: ['groß', '', 'offen'],
      };

      const rooms = submissionService.parseRoomData(formData);
      expect(rooms.erdgeschoss).toHaveLength(2);
    });

    test('gibt leere Arrays bei fehlenden Daten', () => {
      const rooms = submissionService.parseRoomData({});
      expect(rooms.erdgeschoss).toHaveLength(0);
      expect(rooms.obergeschoss).toHaveLength(0);
      expect(rooms.untergeschoss).toHaveLength(0);
    });
  });

  describe('parseEigenleistungen()', () => {
    test('parst einzelne Eigenleistung', () => {
      const result = submissionService.parseEigenleistungen({
        eigenleistungen: 'Malerarbeiten',
      });
      expect(result).toEqual(['Malerarbeiten']);
    });

    test('parst mehrere Eigenleistungen', () => {
      const result = submissionService.parseEigenleistungen({
        eigenleistungen: ['Malerarbeiten', 'Bodenbeläge', ''],
      });
      expect(result).toEqual(['Malerarbeiten', 'Bodenbeläge']);
    });

    test('filtert leere Strings', () => {
      const result = submissionService.parseEigenleistungen({
        eigenleistungen: ['', '  ', 'Tapezieren'],
      });
      expect(result).toEqual(['Tapezieren']);
    });

    test('gibt leeres Array bei fehlenden Daten', () => {
      const result = submissionService.parseEigenleistungen({});
      expect(result).toEqual([]);
    });
  });

  describe('saveSubmission() + getSubmission()', () => {
    test('speichert und lädt Submission', async () => {
      const data = {
        bauherr_vorname: 'Test',
        bauherr_nachname: 'User',
        kfw_standard: 'KFW55',
        personenanzahl: 2,
        grundstueck: 'vorhanden',
      };

      const { id, submission } = await submissionService.saveSubmission(data);
      testSubmissionId = id;

      expect(id).toBeDefined();
      expect(submission.id).toBe(id);
      expect(submission.timestamp).toBeDefined();
      expect(submission.bauherr_vorname).toBe('Test');
      expect(submission.schemaVersion).toBe(2);

      // Laden
      const loaded = await submissionService.getSubmission(id);
      expect(loaded).toBeDefined();
      expect(loaded.id).toBe(id);
      expect(loaded.bauherr_vorname).toBe('Test');
    });

    test('gibt null für nicht-existierende Submission', async () => {
      const result = await submissionService.getSubmission('nicht-existent-id');
      expect(result).toBeNull();
    });

    test('sanitisiert ID (Path-Traversal-Schutz)', async () => {
      const result = await submissionService.getSubmission('../../../etc/passwd');
      expect(result).toBeNull();
    });
  });

  // Cleanup test submission
  afterAll(async () => {
    if (testSubmissionId) {
      try {
        await fs.unlink(path.join(TEST_SUBMISSIONS_DIR, `${testSubmissionId}.json`));
      } catch (_) { /* ignore */ }
    }
  });
});
