const layout = require('../layout');

module.exports = {
  title: 'Unser Service für Sie',

  condition(submission) {
    return true;
  },

  render(doc, submission, ctx) {
    let y = 100;

    doc.font('Helvetica').fontSize(11).fillColor(layout.colors.text);
    doc.text('Bei Lehner Haus erhalten Sie alles aus einer Hand – schwäbisch gut seit über 60 Jahren.', 80, y, { lineBreak: false });

    y = 130;

    const services = [
      ['Individuelle Planung', '100% freie Grundrissgestaltung – keine Katalog-Zwänge'],
      ['Budgetoptimierte Grundrisse', 'Optimale Raumaufteilung für jedes Budget'],
      ['Individuelle Ausbaustufen', 'Flexible Ausstattungsoptionen nach Ihren Wünschen'],
      ['Wohngesunde Materialien', 'ESB-Platten statt OSB – zertifiziert emissionsarm'],
      ['Premium-Ausstattung', 'Vaillant & Viessmann Wärmepumpen, Markenhersteller im Sanitärbereich, wie z. B. Laufen, Villeroy & Boch oder gleichwertig'],
      ['Kompletter Innenausbau', 'Elektroinstallation, Sanitärinstallation und Bodenbeläge – alles aus einer Hand'],
      ['Persönliche Projektbetreuung', 'Ihr Ansprechpartner von Planung bis Schlüsselübergabe'],
      ['Zugeschnittene Hausempfehlungen', 'Individuelle Beratung passend zu Ihren Bedürfnissen'],
      ['Festpreis-Garantie', 'Keine versteckten Kosten, keine bösen Überraschungen'],
      ['Kosten- und Terminsicherheit', 'Verbindliche Termine und transparente Kosten'],
      ['Nachhaltige Wertbeständigkeit', '40 Jahre Garantie auf die statische Grundkonstruktion des Lehner Hauses.'],
      ['Qualitätssicherung', 'QDF-zertifiziert mit RAL-Gütezeichen und Eigenüberwachung']
    ];

    services.forEach(([title, text]) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(layout.colors.primary);
      doc.text(title, 80, y, { lineBreak: false });
      doc.font('Helvetica').fontSize(8).fillColor(layout.colors.text);
      doc.text(text, 80, y + 11, { lineBreak: false });
      y += 28;
    });

    // Highlight-Box
    y += 15;
    doc.roundedRect(60, y, 475, 55, 8).fill(layout.colors.primary);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(layout.colors.white);
    doc.text('Seit 3 Generationen vertrauen uns über 5.000 Baufamilien.', 80, y + 12, { lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.white);
    doc.text('QDF-zertifiziert | RAL-Gütezeichen | Mitglied im BDF', 80, y + 32, { lineBreak: false });
  }
};
