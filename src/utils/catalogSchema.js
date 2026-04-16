const { CATEGORIES } = require('../constants');
const logger = require('./logger');

/**
 * Validiert den gesamten Katalog beim Laden.
 * Prüft Pflichtfelder und loggt Warnungen für fehlende Daten.
 */
function validateCatalog(catalog) {
  const errors = [];
  const warnings = [];

  // Alle erwarteten Kategorien müssen existieren
  const expectedCategories = Object.values(CATEGORIES);
  for (const category of expectedCategories) {
    if (!catalog[category]) {
      errors.push(`Kategorie "${category}" fehlt im Katalog`);
      continue;
    }
    if (!Array.isArray(catalog[category])) {
      errors.push(`Kategorie "${category}" ist kein Array`);
      continue;
    }

    // Jeder Eintrag braucht mindestens id, name, description
    catalog[category].forEach((item, index) => {
      if (!item.id) {
        errors.push(`${category}[${index}]: "id" fehlt`);
      }
      if (!item.name) {
        errors.push(`${category}[${index}]: "name" fehlt`);
      }
      if (!item.description) {
        warnings.push(`${category}[${index}] (${item.id || '?'}): "description" fehlt`);
      }

      // Duplikat-Check
      const duplicates = catalog[category].filter(other => other.id === item.id);
      if (duplicates.length > 1 && index === catalog[category].indexOf(item)) {
        errors.push(`${category}: Doppelte ID "${item.id}"`);
      }
    });
  }

  // Unbekannte Kategorien warnen
  for (const key of Object.keys(catalog)) {
    if (!expectedCategories.includes(key)) {
      warnings.push(`Unbekannte Kategorie "${key}" im Katalog`);
    }
  }

  if (errors.length > 0) {
    logger.error('CatalogSchema', `${errors.length} Fehler: ${errors.join('; ')}`);
  }
  if (warnings.length > 0) {
    logger.warn('CatalogSchema', `${warnings.length} Warnungen: ${warnings.join('; ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: expectedCategories.reduce((acc, cat) => {
      acc[cat] = Array.isArray(catalog[cat]) ? catalog[cat].length : 0;
      return acc;
    }, {})
  };
}

module.exports = { validateCatalog };
