const layout = require('../layout');

module.exports = {
  title: 'Ihr persönlicher Fachberater',

  condition(submission) {
    return !!(submission.berater_name || submission.berater_freitext);
  },

  render(doc, submission, ctx) {
    let y = 95;
    const marginLeft = 60;
    const contentWidth = 475;

    // Berater-Kontaktbox
    if (submission.berater_name) {
      doc.roundedRect(marginLeft, y, contentWidth, 80, 8).fill(layout.colors.primary);

      doc.font('Helvetica-Bold').fontSize(14).fillColor(layout.colors.white);
      doc.text(submission.berater_name, marginLeft + 20, y + 15);

      let contactY = y + 38;
      if (submission.berater_telefon) {
        doc.font('Helvetica').fontSize(10).fillColor(layout.colors.white);
        doc.text(`Telefon: ${submission.berater_telefon}`, marginLeft + 20, contactY);
        contactY += 16;
      }
      if (submission.berater_email) {
        doc.font('Helvetica').fontSize(10).fillColor(layout.colors.white);
        doc.text(`E-Mail: ${submission.berater_email}`, marginLeft + 20, contactY);
      }

      y += 100;
    }

    // Freitext
    if (submission.berater_freitext) {
      const cleanFreitext = submission.berater_freitext.replace(/\r/g, '');

      // Höhe dynamisch berechnen
      doc.font('Helvetica').fontSize(10);
      const textHeight = doc.heightOfString(cleanFreitext, { width: contentWidth - 40 });
      const boxHeight = textHeight + 40;

      doc.font('Helvetica-Bold').fontSize(11).fillColor(layout.colors.primary);
      doc.text('Persönliche Nachricht:', marginLeft + 15, y + 12);

      doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
      doc.text(cleanFreitext, marginLeft + 15, y + 30, { width: contentWidth - 30, lineGap: 2 });
    }
  }
};
