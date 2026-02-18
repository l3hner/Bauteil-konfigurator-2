const path = require('path');
const fs = require('fs');
const layout = require('../layout');

module.exports = {
  title: null, // No header/footer for title page

  condition(submission) {
    return true;
  },

  async render(doc, submission, ctx) {
    // Ruhiges, hochwertiges Deckblatt: viel Weißraum oben, dezenter grüner Bereich unten
    const splitY = 420;
    doc.rect(0, splitY, 595, 842 - splitY).fill(layout.colors.primary);

    // Lehner Haus Logo (zentriert im Weißraum)
    const logoPath = path.resolve(__dirname, '..', '..', '..', '..', 'Logo', 'LehnerLogo_schwaebischgut.jpg');
    console.log('[PDF] Logo-Pfad:', logoPath, '| Existiert:', fs.existsSync(logoPath));
    if (fs.existsSync(logoPath)) {
      try {
        const buffer = await ctx.imageService.getCompressedImage(logoPath, 500);
        if (buffer) {
          doc.image(buffer, 172.5, 100, { width: 250 });
        } else {
          doc.font(layout.typography.hero.font).fontSize(layout.typography.hero.size).fillColor(layout.colors.primary);
          doc.text('LEHNER HAUS', 0, 140, { width: 595, align: 'center' });
          doc.font('Helvetica').fontSize(18).fillColor(layout.colors.textMuted);
          doc.text('schwäbisch gut', 0, 195, { width: 595, align: 'center' });
        }
      } catch (e) {
        console.error('[PDF] Logo konnte nicht geladen werden:', e.message);
        doc.font(layout.typography.hero.font).fontSize(layout.typography.hero.size).fillColor(layout.colors.primary);
        doc.text('LEHNER HAUS', 0, 140, { width: 595, align: 'center' });
        doc.font('Helvetica').fontSize(18).fillColor(layout.colors.textMuted);
        doc.text('schwäbisch gut', 0, 195, { width: 595, align: 'center' });
      }
    } else {
      console.warn('[PDF] Logo-Datei nicht gefunden:', logoPath);
      doc.font(layout.typography.hero.font).fontSize(layout.typography.hero.size).fillColor(layout.colors.primary);
      doc.text('LEHNER HAUS', 0, 140, { width: 595, align: 'center' });
      doc.font('Helvetica').fontSize(18).fillColor(layout.colors.textMuted);
      doc.text('schwäbisch gut', 0, 195, { width: 595, align: 'center' });
    }

    // Dezente goldene Trennlinie
    doc.moveTo(180, splitY).lineTo(415, splitY).lineWidth(1.5).strokeColor(layout.colors.gold).stroke();

    // Untertitel im grünen Bereich
    doc.font('Helvetica-Bold').fontSize(26).fillColor(layout.colors.white);
    doc.text('Ihre persönliche', 0, splitY + 35, { width: 595, align: 'center' });

    doc.fontSize(32).fillColor(layout.colors.gold);
    doc.text('Leistungsbeschreibung', 0, splitY + 68, { width: 595, align: 'center' });

    // Bauherr-Name
    const anrede = submission.bauherr_anrede || 'Familie';
    doc.font('Helvetica-Bold').fontSize(20).fillColor(layout.colors.white);
    doc.text(`${anrede} ${submission.bauherr_nachname}`, 0, splitY + 140, { width: 595, align: 'center' });

    // Datum
    const dateStr = new Date(submission.timestamp).toLocaleDateString('de-DE', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.font('Helvetica').fontSize(10).fillColor('#cccccc');
    doc.text(dateStr, 0, splitY + 175, { width: 595, align: 'center' });

    // Footer Titelseite
    doc.rect(0, 790, 595, 1.5).fill(layout.colors.gold);

    doc.font('Helvetica').fontSize(8).fillColor('#999999');
    doc.text('Lehner Haus GmbH · Ihr Partner für individuelles Bauen seit über 60 Jahren', 0, 802, { width: 595, align: 'center' });
  }
};
