const layout = require('../layout');

module.exports = {
  title: 'Ihre Konfiguration auf einen Blick',

  condition(submission) {
    return true;
  },

  render(doc, submission, ctx) {
    const catalogService = ctx.catalogService;
    let y = 100;
    const { marginLeft, contentWidth } = layout.layout;

    // Key Facts Table
    doc.font(layout.typography.h2.font).fontSize(layout.typography.h2.size).fillColor(layout.colors.primary);
    doc.text('Ihre Hausdaten', marginLeft, y);
    y += 30;

    const haustyp = catalogService.getVariantById('haustypen', submission.haustyp);
    const kfw = submission.kfw_standard === 'KFW55' ? 'KfW 55' : 'KfW 40';

    const keyFacts = [
      ['Bauherr', `${submission.bauherr_vorname} ${submission.bauherr_nachname}`],
      ['Haustyp', haustyp?.name || '-'],
      ['Energiestandard', kfw],
      ['Personenzahl', `${submission.personenanzahl} Personen`],
      ['Grundstück', layout.getGrundstueckText(submission.grundstueck)]
    ];

    // Draw table
    const rowHeight = 22;
    keyFacts.forEach(([label, value]) => {
      // Alternating background
      if (keyFacts.indexOf([label, value]) % 2 === 0) {
        doc.rect(marginLeft, y - 3, contentWidth, rowHeight).fill(layout.colors.grayLight);
      }

      doc.font(layout.typography.body.font).fontSize(layout.typography.body.size).fillColor(layout.colors.text);
      doc.text(label, marginLeft + 10, y, { width: 150, lineBreak: false });
      doc.font(layout.typography.body.font).fillColor(layout.colors.textLight);
      doc.text(value, marginLeft + 170, y, { width: contentWidth - 180, lineBreak: false });
      y += rowHeight;
    });

    // Components Summary
    y += layout.layout.sectionGap;
    doc.font(layout.typography.h2.font).fontSize(layout.typography.h2.size).fillColor(layout.colors.primary);
    doc.text('Gewählte Komponenten', marginLeft, y);
    y += 25;

    const wall = catalogService.getVariantById('walls', submission.wall);
    const innerwall = catalogService.getVariantById('innerwalls', submission.innerwall);
    const decke = catalogService.getVariantById('decken', submission.decke);
    const windowData = catalogService.getVariantById('windows', submission.window);
    const tiles = catalogService.getVariantById('tiles', submission.tiles);
    const dach = catalogService.getVariantById('daecher', submission.dach);
    const heizung = catalogService.getVariantById('heizung', submission.heizung);
    const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);
    const treppe = catalogService.getVariantById('treppen', submission.treppe);

    const components = [
      ['Außenwand', wall?.name, wall?.technicalDetails?.uValue ? 'U-Wert: ' + wall.technicalDetails.uValue : ''],
      ['Innenwand', innerwall?.name, innerwall?.technicalDetails?.soundInsulation],
      ['Decke', decke?.name, ''],
      ['Fenster', windowData?.name, windowData?.technicalDetails?.ugValue ? 'U-Wert: ' + windowData.technicalDetails.ugValue : ''],
      ['Dach', tiles?.name, ''],
      ['Dachform', dach?.name, ''],
      ['Heizung', heizung?.name, heizung?.technicalDetails?.jaz ? 'JAZ ' + heizung.technicalDetails.jaz : '']
    ];

    if (treppe && treppe.id !== 'keine') {
      components.push(['Treppe', treppe?.name, '']);
    }

    if (lueftung && lueftung.id !== 'keine') {
      components.push(['Lüftung', lueftung.name, lueftung.technicalDetails?.heatRecovery]);
    }

    components.forEach(([label, name, spec]) => {
      if (components.indexOf([label, name, spec]) % 2 === 1) {
        doc.rect(marginLeft, y - 3, contentWidth, rowHeight).fill(layout.colors.grayLight);
      }

      doc.font(layout.typography.body.font).fontSize(layout.typography.body.size).fillColor(layout.colors.textMuted);
      doc.text(label, marginLeft + 10, y, { width: 100, lineBreak: false });
      doc.fillColor(layout.colors.text);
      doc.text(name || '-', marginLeft + 120, y, { width: 220, lineBreak: false });
      doc.font(layout.typography.small.font).fontSize(layout.typography.small.size).fillColor(layout.colors.gold);
      doc.text(spec || '', marginLeft + 350, y, { width: contentWidth - 360, align: 'right' });
      y += rowHeight;
    });

    // CTA-Box entfernt (Dokument wird als Zwischenschritt nach Bedarfsanalyse genutzt)
  }
};
