const layout = require('../layout');

module.exports = {
  title: 'Ihre Leistungen im Überblick',

  condition(submission) {
    return true;
  },

  render(doc, submission, ctx) {
    const catalogService = ctx.catalogService;
    let y = 95;
    const { marginLeft, contentWidth } = layout.layout;

    // Dynamische Werte aus Submission
    const windowData = catalogService.getVariantById('windows', submission.window);
    const heizung = catalogService.getVariantById('heizung', submission.heizung);
    const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);

    // Fenster-Beschreibung dynamisch
    const fensterText = windowData ? windowData.name : '3-fach verglaste Kunststofffenster';
    // Heizung dynamisch
    const heizungText = heizung ? heizung.name : 'Luft-Wasser-Wärmepumpe';
    // Lüftung dynamisch
    const hasLueftung = lueftung && lueftung.id !== 'keine';
    const lueftungText = hasLueftung ? lueftung.name : null;

    // 3-Spalten Layout
    const colWidth = 155;
    const colGap = 10;
    const col1X = marginLeft;
    const col2X = marginLeft + colWidth + colGap;
    const col3X = marginLeft + 2 * (colWidth + colGap);

    // === SPALTE 1: PLANUNG ===
    doc.roundedRect(col1X, y, colWidth, 22, 4).fill(layout.colors.primary);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
    doc.text('Planung & Service', col1X + 8, y + 6);

    let y1 = y + 30;
    const planungItems = [
      'Feste kompetente Ansprechpartner',
      'Vor-Ort Bemusterung',
      'Bauleitung',
      'Energieberater (EnEV)',
      'Energieausweis',
      'KfW-Bestätigung'
    ];

    doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.text);
    planungItems.forEach(item => {
      doc.fillColor(layout.colors.primary).text('•', col1X + 3, y1, { lineBreak: false });
      doc.fillColor(layout.colors.text).text(item, col1X + 12, y1, { width: colWidth - 15 });
      const itemHeight = doc.heightOfString(item, { width: colWidth - 15, fontSize: 7.5 });
      y1 += Math.max(11, itemHeight + 3);
    });

    // === SPALTE 2: ROHBAU ===
    doc.roundedRect(col2X, y, colWidth, 22, 4).fill(layout.colors.primary);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
    doc.text('Rohbau', col2X + 8, y + 6);

    let y2 = y + 30;
    const rohbauItems = [
      'Gerüst & Kran',
      'Transport',
      'Geschlossene Gebäudehülle',
      'Außenputz',
      'Decke',
      'Innenwände geschlossen',
      'Dach mit Eindeckung',
      'Dachüberstände gestrichen',
      '3-fach verglaste Fenster nach Wahl',
      'Haustür (Dreifachverriegelung)',
      'Alu-Rollläden',
      'Alu-Außenfensterbänke',
      'Dachrinnen & Fallrohre (Titanzink)'
    ];

    doc.font('Helvetica').fontSize(7.5);
    rohbauItems.forEach(item => {
      doc.fillColor(layout.colors.primary).text('•', col2X + 3, y2, { lineBreak: false });
      doc.fillColor(layout.colors.text).text(item, col2X + 12, y2, { width: colWidth - 15 });
      const itemHeight = doc.heightOfString(item, { width: colWidth - 15, fontSize: 7.5 });
      y2 += Math.max(11, itemHeight + 3);
    });

    // === SPALTE 3: AUSBAU ===
    doc.roundedRect(col3X, y, colWidth, 22, 4).fill(layout.colors.primary);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
    doc.text('Bezugsfertiger Ausbau', col3X + 8, y + 6);

    let y3 = y + 30;
    const ausbauItems = [
      'Estrich mit Fußbodenheizung',
      'Blower-Door-Test',
      'Komplette Elektroinstallation inkl. Zählerschrank'
    ];

    // Lüftung nur wenn gewählt
    if (lueftungText) {
      ausbauItems.push(lueftungText);
    }

    // Innenausbau
    ausbauItems.push(
      'Fliesen',
      'Sanitärobjekte von Markenherstellern',
      'Laminat oder Parkett',
      'Malerarbeiten (weiß streichen)',
      'Innentüren',
      'Sanitärinstallation'
    );

    doc.font('Helvetica').fontSize(7.5);
    ausbauItems.forEach(item => {
      doc.fillColor(layout.colors.primary).text('•', col3X + 3, y3, { lineBreak: false });
      doc.fillColor(layout.colors.text).text(item, col3X + 12, y3, { width: colWidth - 15 });
      const itemHeight = doc.heightOfString(item, { width: colWidth - 15, fontSize: 7.5 });
      y3 += Math.max(11, itemHeight + 3);
    });

    // Maximale Y-Position für Box unten
    const maxY = Math.max(y1, y2, y3) + 15;

    // === HIGHLIGHT BOX: Gewählte Komponenten ===
    doc.moveTo(marginLeft, maxY).lineTo(marginLeft + contentWidth, maxY)
      .strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.roundedRect(marginLeft, maxY + 2, contentWidth, 98, 8).fill(layout.colors.grayLight);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.primary);
    doc.text('Ihre zusätzlich gewählten Ausstattungsmerkmale:', marginLeft + 15, maxY + 10);

    const wall = catalogService.getVariantById('walls', submission.wall);
    const innerwall = catalogService.getVariantById('innerwalls', submission.innerwall);
    const decke = catalogService.getVariantById('decken', submission.decke);
    const tiles = catalogService.getVariantById('tiles', submission.tiles);
    const dach = catalogService.getVariantById('daecher', submission.dach);
    const treppe = catalogService.getVariantById('treppen', submission.treppe);

    const highlights = [
      wall ? `Außenwand: ${wall.name}` : null,
      innerwall ? `Innenwand: ${innerwall.name}` : null,
      decke ? `Decke: ${decke.name}` : null,
      windowData ? `Fenster: ${windowData.name}` : null,
      tiles ? `Dacheindeckung: ${tiles.name}` : null,
      dach ? `Dachaufbau: ${dach.name}` : null,
      heizung ? `Heizung: ${heizung.name}` : null,
      (treppe && treppe.id !== 'keine') ? `Treppe: ${treppe.name}` : null,
      hasLueftung ? `Lüftung: ${lueftungText}` : null
    ].filter(Boolean);

    doc.font('Helvetica').fontSize(8).fillColor(layout.colors.text);
    let hx = marginLeft + 15;
    let hy = maxY + 28;
    const colHalfWidth = contentWidth / 2 - 20;

    highlights.forEach((h, i) => {
      const isRightCol = i >= Math.ceil(highlights.length / 2);
      const xPos = isRightCol ? marginLeft + contentWidth / 2 : marginLeft + 15;
      const yPos = isRightCol ? maxY + 28 + (i - Math.ceil(highlights.length / 2)) * 13 : maxY + 28 + i * 13;

      doc.fillColor(layout.colors.primary).text('✓', xPos, yPos, { lineBreak: false });
      doc.fillColor(layout.colors.text).text(h, xPos + 12, yPos, { width: colHalfWidth });
    });

    // === FOOTER BOX ===
    const footerY = maxY + 115;
    doc.roundedRect(marginLeft, footerY, contentWidth, 40, 6).fill(layout.colors.primary);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(layout.colors.white);
    doc.text('Alle Leistungen inklusive - keine versteckten Kosten!', marginLeft + 15, footerY + 10);

    doc.font('Helvetica').fontSize(8).fillColor(layout.colors.white);
    doc.text('Festpreis-Garantie von Lehner Haus: Ihr Preis steht von Anfang an fest.', marginLeft + 15, footerY + 24);
  }
};
