const layout = require('../layout');

module.exports = {
  title: 'Ihre geplanten Eigenleistungen',

  condition(submission) {
    return !!(submission.eigenleistungen && submission.eigenleistungen.length > 0);
  },

  render(doc, submission, ctx) {
    let y = 100;
    const marginLeft = layout.layout.marginLeft;
    const contentWidth = layout.layout.contentWidth;

    // Intro paragraph
    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.textLight);
    doc.text(
      'Folgende Arbeiten m\u00f6chten Sie in Eigenleistung durchf\u00fchren:',
      marginLeft, y, { width: contentWidth }
    );
    y += 30;

    // Bulleted list of eigenleistungen
    const items = submission.eigenleistungen;
    for (let i = 0; i < items.length; i++) {
      if (y > 720) break; // Leave room for hint box + footer

      // Gold bullet
      doc.font('Helvetica').fontSize(10).fillColor(layout.colors.gray);
      doc.text('\u2022', marginLeft + 10, y, { lineBreak: false });

      // Item text
      doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.text);
      doc.text(items[i], marginLeft + 22, y, { width: contentWidth - 32 });

      y += 18;
    }

    // Hinweis box (only if enough space remaining)
    if (y < 700) {
      y += 20;
      const boxHeight = 45;

      doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 6).fill(layout.colors.grayLight);
      doc.rect(marginLeft, y, 4, boxHeight).fill(layout.colors.gray);

      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.text);
      doc.text(
        'Hinweis: Die genannten Eigenleistungen werden bei der Angebotserstellung ber\u00fccksichtigt. Ihr Fachberater bespricht gerne die Details mit Ihnen.',
        marginLeft + 15, y + 12, { width: contentWidth - 30 }
      );
    }
  }
};
