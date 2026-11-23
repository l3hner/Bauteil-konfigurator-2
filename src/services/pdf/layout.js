// Premium Color Palette (Lehner Haus Corporate: Green)
const colors = {
  primary: '#06402b',
  primaryDark: '#042e1f',
  primaryLight: '#267e61',
  secondary: '#C8102E',
  secondaryLight: '#fef5f5',
  gold: '#D4AF37',
  goldDark: '#b8922e',
  goldLight: '#faf8f0',
  text: '#1d1d1b',
  textLight: '#333333',
  textMuted: '#666666',
  gray: '#999999',
  grayLight: '#f5f5f5',
  // Sandtöne wie in der Angebotsmappe – Linien und Flächen
  sand: '#B5A89C',
  sandLight: '#EFEBE6',
  white: '#FFFFFF',
  error: '#cc0000',
  errorLight: '#fff5f5'
};

// Design System: Typography & Layout
const typography = {
  hero: { font: 'Heading', size: 48, lineHeight: 1.1 },
  h1: { font: 'Heading', size: 20, lineHeight: 1.2 },
  h2: { font: 'Heading-SemiBold', size: 14, lineHeight: 1.3 },
  h3: { font: 'Helvetica-Bold', size: 12, lineHeight: 1.4 },
  body: { font: 'Helvetica', size: 10, lineHeight: 1.5 },
  small: { font: 'Helvetica', size: 8, lineHeight: 1.4 },
  caption: { font: 'Helvetica', size: 7, lineHeight: 1.3 }
};

const layout = {
  pageWidth: 595,
  pageHeight: 842,
  marginLeft: 60,
  marginRight: 60,
  marginTop: 80,
  marginBottom: 60,
  contentWidth: 475, // pageWidth - marginLeft - marginRight
  gridGap: 15,
  sectionGap: 25
};

function drawHeader(doc, title) {
  doc.font(typography.h1.font).fontSize(typography.h1.size).fillColor(colors.primary);
  doc.text(title, 50, 40, { lineBreak: false });

  // Sandlinie unter der Überschrift, wie der Sandbalken der Angebotsmappe
  doc.rect(50, 73, 495, 2.5).fill(colors.sand);
}

function drawFooter(doc, pageNum) {
  // Goldene Trennlinie
  doc.moveTo(50, 800).lineTo(545, 800).lineWidth(0.5).strokeColor(colors.gray).stroke();

  // Links: Website
  doc.font('Helvetica').fontSize(7).fillColor(colors.textMuted);
  doc.text('www.lehner-haus.de', 50, 810, { lineBreak: false });

  // Mitte: Firmenname
  doc.font('Helvetica').fontSize(7).fillColor(colors.textMuted);
  doc.text('Lehner Haus GmbH', 0, 810, { width: 595, align: 'center' });

  // Rechts: Seitenzahl
  doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.primary);
  doc.text(`Seite ${pageNum}`, 495, 810, { width: 50, align: 'right' });
}

function drawImagePlaceholder(doc, x, y, width, height, category) {
  const placeholderColors = {
    'Außenwandsystem': '#2ecc71',      // Grün
    'Innenwandsystem': '#3498db',      // Blau
    'Fenstersystem': '#3498db',        // Blau
    'Dacheindeckung': '#95a5a6',       // Grau
    'Ihr Haustyp': '#9b59b6',          // Lila
    'Heizungssystem': '#e74c3c',       // Rot
    'Lüftungssystem': '#9b59b6'        // Lila
  };

  const color = placeholderColors[category] || '#95a5a6';

  // Farbiges Rechteck
  doc.rect(x, y, width, height).fill(color);

  // Weißer Rahmen
  doc.rect(x, y, width, height).strokeColor('#ffffff').lineWidth(2).stroke();

  // Text
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
  doc.text('Bild', x, y + height/2 - 10, { width: width, align: 'center' });
  doc.text('folgt', x, y + height/2 + 5, { width: width, align: 'center' });
}

// Hilfsmethode: Aufbau-Schichten extrahieren (ELK-Style)
function extractAufbauItems(component, categoryTitle) {
  // Wenn component.layers definiert ist, diese direkt verwenden (ELK-Style)
  if (component.layers && component.layers.length > 0) {
    return component.layers.map(layer => ({
      name: layer.name,
      value: layer.value || '',
      note: layer.note || ''
    }));
  }

  // Fallback: Aus technicalDetails extrahieren
  const items = [];
  const td = component.technicalDetails || {};

  // Je nach Kategorie unterschiedliche Aufbau-Struktur
  if (categoryTitle.includes('Außenwand') || categoryTitle.includes('wand')) {
    if (td.insulation) items.push({ name: 'Wärmedämmung', value: td.insulation.match(/\d+\s*mm/)?.[0] || td.insulation });
    if (td.wallThickness) items.push({ name: 'Wandstärke gesamt', value: td.wallThickness });
    if (td.fireRating) items.push({ name: 'Brandschutz', value: td.fireRating.split(' ')[0] });
    if (component.constructionType) items.push({ name: 'Bauweise', value: component.constructionType });
  } else if (categoryTitle.includes('Innenwand')) {
    if (td.wallThickness) items.push({ name: 'Wandstärke', value: td.wallThickness });
    if (td.soundInsulation) items.push({ name: 'Schallschutz', value: td.soundInsulation });
    if (td.plasterThickness) items.push({ name: 'Beplankung', value: td.plasterThickness });
  } else if (categoryTitle.includes('Decke')) {
    if (td.construction) items.push({ name: 'Konstruktion', value: '' });
    if (td.soundInsulation) items.push({ name: 'Trittschall', value: td.soundInsulation });
  } else if (categoryTitle.includes('Fenster')) {
    if (td.glazing) items.push({ name: 'Verglasung', value: '' });
    if (td.profile) items.push({ name: 'Profil', value: '' });
    if (td.securityFeatures) items.push({ name: 'Sicherheit', value: 'RC2' });
  } else if (categoryTitle.includes('Dach')) {
    if (td.material) items.push({ name: 'Material', value: td.material });
    if (td.surface) items.push({ name: 'Oberfläche', value: td.surface });
    if (td.weight) items.push({ name: 'Gewicht', value: td.weight });
  } else if (categoryTitle.includes('Heizung')) {
    if (td.refrigerant) items.push({ name: 'Kältemittel', value: td.refrigerant.split(' ')[0] });
    if (td.noise) items.push({ name: 'Schallpegel', value: td.noise });
  } else if (categoryTitle.includes('Lüftung')) {
    if (td.heatRecovery) items.push({ name: 'Wärmerückgewinnung', value: td.heatRecovery });
    if (td.filters) items.push({ name: 'Filter', value: td.filters });
    if (td.energySaving) items.push({ name: 'Energieeinsparung', value: td.energySaving });
  }

  // Fallback: Alle technischen Details hinzufügen wenn Liste leer.
  // Die Schlüssel sind interne englische Feldnamen (construction, insulation …) und die Werte
  // ganze Sätze — deshalb den Wert als eigene Zeile ausgeben statt Schlüssel links / Wert rechts.
  if (items.length === 0 && td) {
    Object.values(td).slice(0, 5).forEach(value => {
      items.push({ name: String(value), value: '' });
    });
  }

  return items;
}

// Häkchen als Vektor zeichnen: Die eingebaute Helvetica kennt das Zeichen U+2713 nicht
// und druckt stattdessen einen Apostroph.
function drawCheck(doc, x, y, color, size = 6) {
  doc.save();
  doc.lineWidth(1.1).lineCap('round').lineJoin('round').strokeColor(color || colors.primary);
  doc.moveTo(x, y + size * 0.55)
    .lineTo(x + size * 0.38, y + size * 0.9)
    .lineTo(x + size, y + size * 0.1)
    .stroke();
  doc.restore();
}

// Hilfsmethode: Qualitätsmerkmale extrahieren
function extractQualityItems(component, categoryTitle) {
  const items = [];
  const td = component.technicalDetails || {};

  // Hauptqualitätsmerkmale je nach Kategorie
  if (td.uValue) {
    items.push({ label: 'Wärmedämmwert (U)', value: td.uValue, highlight: true });
  }
  if (td.ugValue) {
    items.push({ label: 'U-Wert Fenster', value: td.ugValue, highlight: true });
  }
  if (td.fireRating) {
    // Wert wie in der Leistungsbeschreibung (z. B. "F30B/F90B"), nicht umrechnen
    items.push({ label: 'Brandschutzklasse', value: td.fireRating });
  }
  if (td.soundInsulation) {
    items.push({ label: 'Schallschutz', value: td.soundInsulation });
  }
  // SCOP wird nicht mehr angezeigt
  if (td.heatRecovery) {
    items.push({ label: 'Wärmerückgewinnung', value: td.heatRecovery, highlight: true });
  }
  if (td.lifespan) {
    items.push({ label: 'Lebensdauer', value: td.lifespan });
  }
  // Position wird nicht mehr angezeigt

  return items.slice(0, 4); // Max 4 Qualitätsmerkmale
}

function getGrundstueckText(status) {
  const map = { 'vorhanden': 'vorhanden', 'in_aussicht': 'in Aussicht', 'suche': 'auf der Suche' };
  return map[status] || status || '-';
}

module.exports = { colors, typography, layout, drawHeader, drawFooter, drawImagePlaceholder, drawCheck, extractAufbauItems, extractQualityItems, getGrundstueckText };
