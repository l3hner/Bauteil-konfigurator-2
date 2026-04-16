const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { KFW_STANDARDS, CATEGORIES, CATEGORY_LABELS, SUBMISSION_FIELD_TO_CATEGORY } = require('../constants');
const { validateCatalog } = require('../utils/catalogSchema');

class CatalogService {
  constructor() {
    this.catalogPath = path.join(__dirname, '../../data/catalog.json');
    this.catalog = null;
    this._loadAndValidate();
  }

  _loadAndValidate() {
    try {
      const data = fs.readFileSync(this.catalogPath, 'utf8');
      this.catalog = JSON.parse(data);

      const result = validateCatalog(this.catalog);
      if (result.valid) {
        const total = Object.values(result.stats).reduce((s, n) => s + n, 0);
        logger.info('Catalog', `Katalog geladen: ${total} Einträge in ${Object.keys(result.stats).length} Kategorien`);
      } else {
        logger.error('Catalog', 'Katalog hat Validierungsfehler — einige Funktionen könnten fehlschlagen');
      }
    } catch (error) {
      logger.error('Catalog', `Fehler beim Laden des Katalogs: ${error.message}`);
      this.catalog = Object.values(CATEGORIES).reduce((acc, cat) => { acc[cat] = []; return acc; }, {});
    }
  }

  getCategory(category) {
    return this.catalog[category] || [];
  }

  getWalls() { return this.getCategory(CATEGORIES.WALLS); }
  getInnerwalls() { return this.getCategory(CATEGORIES.INNERWALLS); }
  getDaecher() { return this.getCategory(CATEGORIES.DAECHER); }
  getDecken() { return this.getCategory(CATEGORIES.DECKEN); }
  getTreppen() { return this.getCategory(CATEGORIES.TREPPEN); }
  getWindows() { return this.getCategory(CATEGORIES.WINDOWS); }
  getTiles() { return this.getCategory(CATEGORIES.TILES); }
  getHaustypen() { return this.getCategory(CATEGORIES.HAUSTYPEN); }
  getHeizung() { return this.getCategory(CATEGORIES.HEIZUNG); }

  getWallsByKfw(kfwStandard) {
    return this.getWalls().filter(wall =>
      wall.kfwCompatible && wall.kfwCompatible.includes(kfwStandard)
    );
  }

  getLueftung(kfwStandard) {
    const allLueftung = this.getCategory(CATEGORIES.LUEFTUNG);

    if (kfwStandard === KFW_STANDARDS.KFW55) {
      return allLueftung.filter(l => l.id === 'keine');
    } else if (kfwStandard === KFW_STANDARDS.KFW40) {
      return allLueftung.filter(l => l.id !== 'keine');
    }

    return allLueftung;
  }

  getVariantById(category, id) {
    return this.getCategory(category).find(v => v.id === id);
  }

  getAllCategories() {
    return Object.keys(this.catalog);
  }

  validateSelection(selection) {
    const errors = [];

    for (const [field, category] of Object.entries(SUBMISSION_FIELD_TO_CATEGORY)) {
      const value = selection[field];
      if (value && value !== 'keine' && !this.getVariantById(category, value)) {
        errors.push(`Ungültige ${CATEGORY_LABELS[category] || category}-Auswahl: "${value}"`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

module.exports = new CatalogService();
