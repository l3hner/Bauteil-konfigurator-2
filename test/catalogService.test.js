const catalogService = require('../src/services/catalogService');
const { KFW_STANDARDS, CATEGORIES } = require('../src/constants');

describe('CatalogService', () => {
  describe('Katalog laden', () => {
    test('lädt alle 10 Kategorien', () => {
      const categories = catalogService.getAllCategories();
      expect(categories.length).toBeGreaterThanOrEqual(10);
    });

    test('jede Kategorie ist ein nicht-leeres Array', () => {
      for (const cat of Object.values(CATEGORIES)) {
        const items = catalogService.getCategory(cat);
        expect(Array.isArray(items)).toBe(true);
      }
    });

    test('jeder Eintrag hat id und name', () => {
      for (const cat of Object.values(CATEGORIES)) {
        const items = catalogService.getCategory(cat);
        items.forEach(item => {
          expect(item.id).toBeDefined();
          expect(item.name).toBeDefined();
        });
      }
    });
  });

  describe('Getter-Methoden', () => {
    test('getWalls() gibt Wände zurück', () => {
      const walls = catalogService.getWalls();
      expect(walls.length).toBeGreaterThan(0);
      expect(walls[0].id).toBeDefined();
    });

    test('getHaustypen() gibt Haustypen zurück', () => {
      const haustypen = catalogService.getHaustypen();
      expect(haustypen.length).toBeGreaterThan(0);
    });

    test('getVariantById() findet existierende Variante', () => {
      const walls = catalogService.getWalls();
      const found = catalogService.getVariantById(CATEGORIES.WALLS, walls[0].id);
      expect(found).toBeDefined();
      expect(found.id).toBe(walls[0].id);
    });

    test('getVariantById() gibt undefined für unbekannte ID', () => {
      const found = catalogService.getVariantById(CATEGORIES.WALLS, 'nicht-existent');
      expect(found).toBeUndefined();
    });

    test('getVariantById() gibt undefined für unbekannte Kategorie', () => {
      const found = catalogService.getVariantById('fantasie', 'irgendwas');
      expect(found).toBeUndefined();
    });
  });

  describe('KfW-Filterung', () => {
    test('getWallsByKfw(KFW55) gibt nur KFW55-kompatible Wände', () => {
      const walls = catalogService.getWallsByKfw(KFW_STANDARDS.KFW55);
      walls.forEach(wall => {
        expect(wall.kfwCompatible).toContain(KFW_STANDARDS.KFW55);
      });
    });

    test('getLueftung(KFW55) gibt nur "keine"', () => {
      const lueftung = catalogService.getLueftung(KFW_STANDARDS.KFW55);
      lueftung.forEach(l => {
        expect(l.id).toBe('keine');
      });
    });

    test('getLueftung(KFW40) gibt keine "keine"-Option', () => {
      const lueftung = catalogService.getLueftung(KFW_STANDARDS.KFW40);
      lueftung.forEach(l => {
        expect(l.id).not.toBe('keine');
      });
    });
  });

  describe('validateSelection()', () => {
    test('akzeptiert gültige Auswahl', () => {
      const walls = catalogService.getWalls();
      const result = catalogService.validateSelection({
        wall: walls[0].id,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('akzeptiert leere Auswahl (alle optional)', () => {
      const result = catalogService.validateSelection({});
      expect(result.valid).toBe(true);
    });

    test('lehnt ungültige Wand-ID ab', () => {
      const result = catalogService.validateSelection({
        wall: 'fake-wall-id',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('ignoriert "keine" als gültigen Sonderwert', () => {
      const result = catalogService.validateSelection({
        lueftung: 'keine',
      });
      expect(result.valid).toBe(true);
    });
  });
});
