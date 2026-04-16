// KfW Energiestandards
const KFW_STANDARDS = {
  KFW55: 'KFW55',
  KFW40: 'KFW40',
};

const KFW_LABELS = {
  [KFW_STANDARDS.KFW55]: 'KfW 55',
  [KFW_STANDARDS.KFW40]: 'KfW 40',
};

// Katalog-Kategorien
const CATEGORIES = {
  WALLS: 'walls',
  INNERWALLS: 'innerwalls',
  DECKEN: 'decken',
  WINDOWS: 'windows',
  TILES: 'tiles',
  HAUSTYPEN: 'haustypen',
  HEIZUNG: 'heizung',
  LUEFTUNG: 'lueftung',
  DAECHER: 'daecher',
  TREPPEN: 'treppen',
};

// Komponenten-Labels (deutsch, für UI und PDF)
const CATEGORY_LABELS = {
  [CATEGORIES.WALLS]: 'Außenwandsystem',
  [CATEGORIES.INNERWALLS]: 'Innenwandsystem',
  [CATEGORIES.DECKEN]: 'Deckensystem',
  [CATEGORIES.WINDOWS]: 'Fenstersystem',
  [CATEGORIES.TILES]: 'Dacheindeckung',
  [CATEGORIES.HAUSTYPEN]: 'Haustyp',
  [CATEGORIES.HEIZUNG]: 'Heizungssystem',
  [CATEGORIES.LUEFTUNG]: 'Lüftungssystem',
  [CATEGORIES.DAECHER]: 'Dachaufbau',
  [CATEGORIES.TREPPEN]: 'Treppensystem',
};

// Mapping: Submission-Feld → Kategorie
const SUBMISSION_FIELD_TO_CATEGORY = {
  haustyp: CATEGORIES.HAUSTYPEN,
  wall: CATEGORIES.WALLS,
  innerwall: CATEGORIES.INNERWALLS,
  decke: CATEGORIES.DECKEN,
  window: CATEGORIES.WINDOWS,
  dach: CATEGORIES.DAECHER,
  tiles: CATEGORIES.TILES,
  heizung: CATEGORIES.HEIZUNG,
  treppe: CATEGORIES.TREPPEN,
  lueftung: CATEGORIES.LUEFTUNG,
};

module.exports = {
  KFW_STANDARDS,
  KFW_LABELS,
  CATEGORIES,
  CATEGORY_LABELS,
  SUBMISSION_FIELD_TO_CATEGORY,
};
