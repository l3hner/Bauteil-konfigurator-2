const request = require('supertest');
const app = require('../src/app');

describe('Routes', () => {
  describe('GET /', () => {
    test('gibt 200 und HTML zurück', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Lehner Haus');
      expect(res.text).toContain('konfigurator-form');
    });

    test('enthält CSRF-Token', async () => {
      const res = await request(app).get('/');
      expect(res.text).toContain('name="_csrf"');
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('GET /health', () => {
    test('gibt JSON mit status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.uptime).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('POST /submit', () => {
    test('lehnt Anfrage ohne CSRF-Token ab', async () => {
      const res = await request(app)
        .post('/submit')
        .send({ bauherr_vorname: 'Test' });
      expect(res.status).toBe(403);
    });

    test('lehnt Anfrage mit fehlenden Pflichtfeldern ab', async () => {
      // Erst CSRF-Token holen
      const getRes = await request(app).get('/');
      const cookies = getRes.headers['set-cookie'];
      const csrfMatch = getRes.text.match(/name="_csrf" value="([^"]+)"/);
      const csrfToken = csrfMatch ? csrfMatch[1] : '';

      const res = await request(app)
        .post('/submit')
        .set('Cookie', cookies)
        .send({ _csrf: csrfToken }); // Keine Pflichtfelder

      expect(res.status).toBe(400);
    });

    test('lehnt ungültige E-Mail ab', async () => {
      const getRes = await request(app).get('/');
      const cookies = getRes.headers['set-cookie'];
      const csrfMatch = getRes.text.match(/name="_csrf" value="([^"]+)"/);
      const csrfToken = csrfMatch ? csrfMatch[1] : '';

      const res = await request(app)
        .post('/submit')
        .set('Cookie', cookies)
        .send({
          _csrf: csrfToken,
          bauherr_anrede: 'Herr',
          bauherr_vorname: 'Test',
          bauherr_nachname: 'User',
          bauherr_email: 'ungueltig',
          kfw_standard: 'KFW55',
          personenanzahl: '2',
          grundstueck: 'vorhanden',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /result/:id', () => {
    test('gibt 404 für nicht-existierende ID', async () => {
      const res = await request(app).get('/result/nicht-existent');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /pdf/:id', () => {
    test('gibt 404 für nicht-existierendes PDF', async () => {
      const res = await request(app).get('/pdf/nicht-existent');
      expect(res.status).toBe(404);
    });
  });

  describe('404 Handler', () => {
    test('gibt 404 für unbekannte Route', async () => {
      const res = await request(app).get('/gibt-es-nicht');
      expect(res.status).toBe(404);
    });
  });
});
