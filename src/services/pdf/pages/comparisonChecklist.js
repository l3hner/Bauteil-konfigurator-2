const layout = require('../layout');

module.exports = {
  title: 'Ihre Checkliste für den Anbietervergleich',

  condition(submission) {
    return true;
  },

  render(doc, submission, ctx) {
    const catalogService = ctx.catalogService;
    let y = 95;

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
    doc.text('Nutzen Sie diese Checkliste, um unterschiedliche Hersteller objektiv zu vergleichen:', 80, y, { lineBreak: false });

    y += 25;

    // Dynamischer U-Wert Text mit Wandtyp-Bezeichnung
    const wall = submission ? catalogService.getVariantById('walls', submission.wall) : null;
    const uWertText = wall && wall.name
      ? `Exakter U-Wert? Lehner Haus: ${wall.technicalDetails?.uValue || '0,149 W/(m²K)'} (${wall.name}). Je niedriger, desto besser.`
      : 'Exakter U-Wert? Lehner Haus: 0,129 (Climativ-PLUS) bzw. 0,149 W/(m²K) (Climativ). Je niedriger, desto besser.';

    const checklistItems = [
      ['Doppelte Beplankung', 'Werden die Wände beidseitig doppelt beplankt? Lehner Haus: ja – für Stabilität und Schallschutz.'],
      ['Holzwerkstoffe', 'Wird ESB verwendet? ESB plus ist Blauer Engel zertifiziert, emissionsarm und empfohlen von der DGNB.'],
      ['U-Wert Außenwand', uWertText],
      ['Dämmstärke', 'Lehner Haus: bis zu 240 mm Mineralwolldämmung zzgl. 80 mm Holzfaserdämmplatte in der Außenwandkonstruktion.'],
      ['Fenster Ug-Wert', '3-fach Verglasung mit Ug 0,5 W/(m²K)? Lehner Haus: serienmäßig.'],
      ['Kältemittel', 'Natürliches Kältemittel R290? Lehner Haus: ja – zukunftssicher.'],
      ['Diffusionsoffen', 'Ist der Wandaufbau diffusionsoffen? Lehner Haus: ja – baubiologisch optimal.'],
      ['Qualitätszertifikat', 'QDF-Zertifizierung und RAL-Gütezeichen vorhanden? Lehner Haus: ja.'],
      ['Festpreis', 'Echte Festpreis-Garantie oder nur ein Circa-Preis? Bei Lehner Haus: Festpreisgarantie.']
    ];

    doc.font('Helvetica').fontSize(9);
    checklistItems.forEach(([topic, question], i) => {
      // Checkbox with gold border
      doc.rect(80, y, 10, 10).strokeColor(layout.colors.gold).lineWidth(1.5).stroke();

      doc.font('Helvetica-Bold').fillColor(layout.colors.primary);
      doc.text(topic + ':', 95, y, { lineBreak: false });

      doc.font('Helvetica').fillColor(layout.colors.text);
      doc.text(question, 200, y, { width: 340, lineGap: 1 });

      y += 22;
    });

    // Warnhinweis-Box
    y += 10;
    doc.roundedRect(60, y, 475, 80, 8).fill(layout.colors.errorLight);
    doc.rect(60, y, 4, 80).fill(layout.colors.error);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.error);
    doc.text('Vorsicht bei diesen Warnsignalen:', 80, y + 10, { lineBreak: false });

    doc.font('Helvetica').fontSize(8).fillColor(layout.colors.text);
    const warnings = [
      '• Extrem niedriger Preis ohne nachvollziehbare Kalkulation',
      '• Keine konkreten Antworten auf technische Fragen',
      '• Druck zum schnellen Vertragsabschluss',
      '• Keine QDF-Zertifizierung oder RAL-Gütezeichen'
    ];
    warnings.forEach((w, i) => {
      doc.text(w, 80, y + 25 + (i * 10), { lineBreak: false });
    });

    // Lehner Haus Box
    y += 85;
    doc.roundedRect(60, y, 475, 45, 8).fill(layout.colors.primary);
    doc.rect(530, y, 4, 45).fill(layout.colors.gold);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
    doc.text('Bei Lehner Haus können Sie jeden dieser Punkte mit "Ja" beantworten.', 80, y + 12, { lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.white);
    doc.text('Überzeugen Sie sich selbst: Besuchen Sie uns im Musterhaus!', 80, y + 28, { lineBreak: false });
  }
};
