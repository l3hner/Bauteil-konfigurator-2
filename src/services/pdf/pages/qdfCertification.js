const layout = require('../layout');

module.exports = {
  title: 'QDF-Zertifizierte Qualität',

  condition(submission) {
    return true;
  },

  render(doc, submission, ctx) {
    let y = 95;

    // Gold highlight box
    doc.roundedRect(60, y, 475, 70, 8).fill(layout.colors.grayLight);
    doc.roundedRect(60, y, 475, 70, 8).strokeColor('#cccccc').lineWidth(1).stroke();

    doc.font('Helvetica-Bold').fontSize(14).fillColor(layout.colors.primary);
    doc.text('QDF-Qualitätszertifikat 2026', 80, y + 15, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.textLight);
    doc.text('Lehner Haus ist Mitglied der Qualitätsgemeinschaft Deutscher Fertigbau (QDF)', 80, y + 35, { width: 430 });
    doc.text('und trägt das RAL-Gütezeichen für geprüfte Qualität.', 80, y + 48, { width: 430 });

    y += 95;

    // Intro
    doc.font('Helvetica').fontSize(11).fillColor(layout.colors.text);
    doc.text('Die QDF-Zertifizierung garantiert höchste Qualitätsstandards in Planung, Produktion und Ausführung. Als zertifiziertes Mitglied unterliegt Lehner Haus regelmäßigen Prüfungen durch unabhängige Institute.', 80, y, { width: 435, lineGap: 2 });

    y += 55;

    // 5 QDF-Vorteile
    doc.font('Helvetica-Bold').fontSize(13).fillColor(layout.colors.primary);
    doc.text('Ihre Vorteile durch QDF-Zertifizierung:', 80, y, { lineBreak: false });

    y += 28;

    const qdfVorteile = [
      ['Geprüfte Produktqualität', 'Alle Bauteile werden nach strengen QDF-Richtlinien produziert und geprüft'],
      ['Unabhängige Überwachung', 'Regelmäßige Kontrollen durch neutrale Prüfinstitute sichern konstante Qualität'],
      ['Transparente Bauprozesse', 'Dokumentierte Arbeitsabläufe für nachvollziehbare Qualitätssicherung'],
      ['Geschulte Fachkräfte', 'Fortlaufende Weiterbildung aller Mitarbeiter nach QDF-Standards'],
      ['Garantierte Bauqualität', 'RAL-Gütezeichen als Nachweis für geprüfte Fertigbauqualität']
    ];

    qdfVorteile.forEach(([title, desc]) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.primary);
      doc.text('•', 80, y, { lineBreak: false });
      doc.text(title, 92, y, { lineBreak: false });

      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.textLight);
      doc.text(desc, 92, y + 13, { width: 436, lineGap: 1 });

      y += 42;
    });

    y += 15;

    // Kernbotschaft Box
    doc.roundedRect(60, y, 475, 85, 8).fill(layout.colors.primary);

    doc.font('Helvetica-Bold').fontSize(12).fillColor(layout.colors.white);
    doc.text('Vertrauen Sie auf geprüfte Qualität', 80, y + 15, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.white);
    doc.text('Die QDF-Zertifizierung ist Ihr Qualitätsversprechen: Jedes Lehner Haus wird nach höchsten Standards geplant, produziert und errichtet. Das RAL-Gütezeichen bestätigt diese Qualität unabhängig.', 80, y + 38, { width: 415, lineGap: 2 });

    y += 95;

    // Zertifikatsnummer
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.textMuted);
    doc.text('QDF-Mitgliedsnummer: DE-QDF-2026-LH | RAL-Gütezeichen: RAL-GZ 422', 80, y, { lineBreak: false });
  }
};
