const layout = require('../layout');

module.exports = {
  title: 'Ihre 7 Qualitätsvorteile',

  condition(submission) {
    return true;
  },

  render(doc, submission, ctx) {
    let y = 95;

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
    doc.text('Bei Lehner Haus erhalten Sie Premium-Qualität in jedem Detail:', 80, y, { width: 435 });

    y += 30;

    const vorteile = [
      { nr: '1', title: 'F90 Brandschutz', desc: 'Außenwände mit 90-minütigem Feuerwiderstand von außen' },
      { nr: '2', title: 'Diffusionsoffen', desc: 'Kontrollierte Feuchteregulierung, kein Schimmelrisiko' },
      { nr: '3', title: 'Kostensicherheit', desc: 'Klare Leistungen, definierte Qualitäten – keine „ab-Preise"' },
      { nr: '4', title: 'Familienunternehmen', desc: 'In dritter Generation – über 60 Jahre Erfahrung im Holzbau' },
      { nr: '5', title: 'QDF & RAL geprüft', desc: 'Zertifizierte Qualität, unabhängig überwacht' },
      { nr: '6', title: 'Transparenz', desc: 'Definierte Materialien, keine anonymen Preisgruppen' },
      { nr: '7', title: 'Festpreis-Garantie', desc: 'Echte Kostensicherheit ohne Interpretationsspielraum' }
    ];

    const cardWidth = 145;
    const cardHeight = 115;
    const gap = 18;
    const startX = 70;
    const cardsPerRow = 3;

    vorteile.forEach((vorteil, idx) => {
      const row = Math.floor(idx / cardsPerRow);
      const col = idx % cardsPerRow;
      const cx = startX + col * (cardWidth + gap);
      const cy = y + row * (cardHeight + gap);

      // Card Background
      doc.roundedRect(cx, cy, cardWidth, cardHeight, 8).fill('#f9f9f9');
      doc.roundedRect(cx, cy, cardWidth, cardHeight, 8)
         .strokeColor(layout.colors.gold).lineWidth(1).stroke();

      // Nummer-Badge (links oben)
      doc.circle(cx + 15, cy + 15, 12).fill(layout.colors.gold);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
      doc.text(vorteil.nr, cx + 10, cy + 9, { width: 10, align: 'center' });

      // Titel (keine Icons mehr)
      doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.primary);
      doc.text(vorteil.title, cx + 8, cy + 45, { width: cardWidth - 16, align: 'center' });

      // Beschreibung
      doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.textLight);
      doc.text(vorteil.desc, cx + 8, cy + 65, { width: cardWidth - 16, align: 'center', lineGap: 0.8 });
    });

    y += Math.ceil(vorteile.length / cardsPerRow) * (cardHeight + gap) + 15;

    // Callout Box
    doc.roundedRect(60, y, 475, 50, 8).fill(layout.colors.primaryDark);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.gold);
    doc.text('Fragen Sie bei anderen Anbietern gezielt nach diesen Punkten!', 80, y + 12, { lineBreak: false });

    doc.font('Helvetica').fontSize(8).fillColor(layout.colors.white);
    doc.text('Nicht alle diese Leistungen sind branchenüblich. Bei Lehner Haus sind sie Standard.', 80, y + 30, { lineBreak: false });
  }
};
