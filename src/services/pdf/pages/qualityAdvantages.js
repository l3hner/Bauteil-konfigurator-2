const layout = require('../layout');

// Dieselben sechs Gründe wie in der Angebotsmappe (eigener Generator außerhalb dieses Repos).
// Jeder Grund ist durch die Leistungsbeschreibung 09/2026 oder den Vertrag gedeckt.
// Wer hier etwas ändert, ändert es bitte auch dort – der Kunde bekommt beide Unterlagen.
module.exports = {
  title: 'Warum Lehner Haus',

  condition(submission) {
    return true;
  },

  render(doc, submission, ctx) {
    const marginLeft = 50;
    const contentWidth = 495;
    let y = 95;

    doc.font('Helvetica').fontSize(11).fillColor(layout.colors.textMuted);
    doc.text('Sechs Gründe – jeder davon steht in der Leistungsbeschreibung oder im Vertrag.', marginLeft, y, {
      width: contentWidth
    });
    y += 32;

    const wall = submission ? ctx.catalogService.getVariantById('walls', submission.wall) : null;
    const wandName = wall && wall.name ? `Die Außenwand ${wall.name}` : 'Die Lehner-Außenwand CLIMA-tiv';

    const gruende = [
      ['Festpreis mit Garantie',
        'Ihr Preis steht fest, sobald der Vertrag bestätigt ist, und bleibt zwölf Monate garantiert. Transport, Montage, Kran und Bauleitung sind enthalten, die Lieferung erfolgt ohne Entfernungsbeschränkung.'],
      ['40 Jahre Gewährleistung',
        'Auf die statische Grundkonstruktion Ihres Lehner-Hauses geben wir 40 Jahre Gewährleistung, auf die Ausbaugewerke fünf Jahre nach BGB.'],
      ['Diffusionsoffene Außenwand',
        `${wandName} ist diffusionsoffen aufgebaut: Holzrahmen mit Dämmung, außen eine Holzfaserplatte, innen doppelt beplankt – für Stabilität, Schallschutz und ein angenehmes Raumklima.`],
      ['Bauleitung inklusive',
        'Ein Bauleiter betreut Sie über die gesamte Bauzeit. Unser eigenes, ständig geschultes Montageteam stellt Ihr Haus auf.'],
      ['Markenfabrikate',
        'Wärmepumpe von Vaillant oder Viessmann, Dachsteine von Nelskamp, Lüftung von Viessmann oder Vaillant – die Fabrikate stehen in der Leistungsbeschreibung.'],
      ['Ausstattung zum Anfassen',
        'Haustür, Innentüren, Böden, Fliesen und Sanitär wählen Sie in unserem Ausstattungsgespräch an Mustern aus – bevor produziert wird.']
    ];

    const gap = 20;
    const boxWidth = (contentWidth - gap) / 2;
    const boxHeight = 148;

    gruende.forEach(([titel, text], idx) => {
      const x = marginLeft + (idx % 2) * (boxWidth + gap);
      const boxY = y + Math.floor(idx / 2) * (boxHeight + gap);

      doc.rect(x, boxY, boxWidth, boxHeight).fill(layout.colors.sandLight);
      doc.rect(x, boxY, 3.5, boxHeight).fill(layout.colors.primary);

      doc.font('Heading').fontSize(20).fillColor(layout.colors.sand);
      doc.text(String(idx + 1).padStart(2, '0'), x + 16, boxY + 16, { lineBreak: false });

      doc.font('Heading-SemiBold').fontSize(11.5).fillColor(layout.colors.primary);
      doc.text(titel, x + 50, boxY + 21, { width: boxWidth - 62, lineBreak: false });

      doc.font('Helvetica').fontSize(9.5).fillColor(layout.colors.text);
      doc.text(text, x + 16, boxY + 52, { width: boxWidth - 30, lineGap: 2 });
    });

    y += 3 * (boxHeight + gap) + 8;

    doc.font('Heading-SemiBold').fontSize(12).fillColor(layout.colors.primary);
    doc.text('Lehner Haus – schwäbisch gut.', marginLeft, y, { lineBreak: false });
  }
};
