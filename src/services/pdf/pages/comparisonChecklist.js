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
    // Werte wie in der Leistungsbeschreibung 09/2026 (Pos. 11.160 / 11.240)
    const uWertText = wall && wall.name && wall.technicalDetails && wall.technicalDetails.uValue
      ? `Welcher U-Wert steht in der Leistungsbeschreibung? Lehner Haus: ${wall.technicalDetails.uValue} (${wall.name}). Je niedriger, desto besser.`
      : 'Welcher U-Wert steht in der Leistungsbeschreibung? Lehner Haus: 0,17 W/(m²K) (CLIMA-tiv) bzw. 0,138 bis 0,15 W/(m²K) (CLIMA-tiv PLUS).';
    const daemmText = wall && wall.technicalDetails && wall.technicalDetails.insulation
      ? `Wie viel Dämmung steckt in der Außenwand? Lehner Haus: ${wall.technicalDetails.insulation}.`
      : 'Wie viel Dämmung steckt in der Außenwand? Lehner Haus: 160 bzw. 240 mm im Gefach plus 80 mm Holzfaser-Dämmplatte.';

    // Fenster-Ug-Wert aus der tatsächlich gewählten Variante (Katalog, technicalDetails.ugValue)
    const fenster = submission ? catalogService.getVariantById('windows', submission.window) : null;
    const ugWert = fenster && fenster.technicalDetails && fenster.technicalDetails.ugValue;
    const fensterText = ugWert
      ? `3-fach Verglasung serienmäßig? Lehner Haus: ja – Ug ${ugWert} (${fenster.name}).`
      : '3-fach Verglasung serienmäßig? Lehner Haus: ja.';

    const checklistItems = [
      ['Doppelte Beplankung', 'Werden die Wände beidseitig doppelt beplankt? Lehner Haus: ja – für Stabilität und Schallschutz.'],
      ['Wandaufbau', 'Steht der Aufbau mit Maß je Schicht in der Leistungsbeschreibung? Lehner Haus: ja.'],
      ['U-Wert Außenwand', uWertText],
      ['Dämmstärke', daemmText],
      ['Fenster Ug-Wert', fensterText],
      ['Kältemittel', 'Natürliches Kältemittel R290? Lehner Haus: ja – zukunftssicher.'],
      ['Diffusionsoffen', 'Ist der Wandaufbau diffusionsoffen? Lehner Haus: ja.'],
      ['Gewährleistung', 'Wie lange haftet der Anbieter für die Konstruktion? Lehner Haus: 40 Jahre auf die statische Grundkonstruktion, 5 Jahre auf die Ausbaugewerke.'],
      ['Gütezeichen', 'Tragen die Bauteile das RAL-Gütezeichen? Lehner Haus: ja.'],
      ['Festpreis', 'Fester Preis oder Circa-Preis, und wie lange gilt er? Lehner Haus: Festpreis mit zwölf Monaten Garantie ab Vertragsbestätigung.']
    ];

    doc.font('Helvetica').fontSize(9);
    checklistItems.forEach(([topic, question], i) => {
      // Bullet point
      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.text);
      doc.text('•', 80, y, { lineBreak: false });

      doc.font('Helvetica-Bold').fillColor(layout.colors.primary);
      doc.text(topic + ':', 92, y, { lineBreak: false });

      doc.font('Helvetica').fillColor(layout.colors.text);
      // Zeilenhöhe nach tatsächlichem Umbruch, sonst überlappen zweizeilige Antworten
      const textHeight = doc.heightOfString(question, { width: 340, lineGap: 1 });
      doc.text(question, 200, y, { width: 340, lineGap: 1 });

      y += Math.max(22, textHeight + 10);
    });

    // Warnhinweis-Box
    y += 10;
    doc.roundedRect(60, y, 475, 80, 8).fill(layout.colors.grayLight);

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

    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
    doc.text('Bei Lehner Haus können Sie jeden dieser Punkte mit "Ja" beantworten.', 80, y + 12, { lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.white);
    doc.text('Überzeugen Sie sich selbst: Besuchen Sie uns im Musterhaus!', 80, y + 28, { lineBreak: false });
  }
};
