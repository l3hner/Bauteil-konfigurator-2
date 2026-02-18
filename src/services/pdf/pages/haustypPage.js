const path = require('path');
const fs = require('fs');
const layout = require('../layout');

const assetsDir = path.resolve(__dirname, '..', '..', '..', '..', 'assets');

module.exports = {
  renderHaustyp(doc, component, ctx) {
    const marginLeft = 50;
    const contentWidth = 495;

    // === 3 BILDER nebeneinander (oben) ===
    // filePath zeigt auf den Unterordner, z.B. "assets/variants/haustypen/stadtvilla/"
    // Darin liegen 1.png, 2.png, 3.png
    const imgDir = component.filePath ? path.resolve(assetsDir, '..', component.filePath) : null;
    const imgWidth = Math.floor((contentWidth - 20) / 3);
    const imgHeight = 160;

    for (let i = 0; i < 3; i++) {
      const imgX = marginLeft + i * (imgWidth + 10);
      const imgFile = imgDir ? path.join(imgDir, `${i + 1}.png`) : null;

      if (imgFile && fs.existsSync(imgFile)) {
        try {
          // Clipping für gleiche Höhe bei allen Bildern
          doc.save();
          doc.rect(imgX, 95, imgWidth, imgHeight).clip();
          doc.image(imgFile, imgX, 95, { fit: [imgWidth, imgHeight], align: 'center', valign: 'center' });
          doc.restore();
        } catch (e) {
          doc.restore();
          layout.drawImagePlaceholder(doc, imgX, 95, imgWidth, imgHeight, 'Haustyp');
        }
      } else {
        layout.drawImagePlaceholder(doc, imgX, 95, imgWidth, imgHeight, 'Haustyp');
      }

      // "Beispielbilder" als echte Bildunterschrift direkt unter dem Bild
      doc.font('Helvetica').fontSize(7).fillColor(layout.colors.textMuted);
      doc.text('Beispielbilder', imgX, 95 + imgHeight + 2, { width: imgWidth, align: 'center' });
    }

    let y = 95 + imgHeight + 14;

    // Haustyp-Name
    doc.font('Helvetica-Bold').fontSize(22).fillColor(layout.colors.primary);
    doc.text(component.name, marginLeft, y, { width: contentWidth });

    y += 35;

    // === Beschreibung ===
    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
    const desc = component.details || component.description || '';
    doc.text(desc, marginLeft, y, { width: contentWidth, lineGap: 2 });

    y += 60;

    // === Vorteile Grid (2 Spalten) ===
    if (component.advantages && component.advantages.length > 0) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor(layout.colors.primary);
      doc.text('Ihre Vorteile mit diesem Haustyp:', marginLeft, y);
      y += 20;

      const colWidth = contentWidth / 2;
      component.advantages.forEach((adv, idx) => {
        const colX = idx % 2 === 0 ? marginLeft : marginLeft + colWidth;
        const rowY = y + Math.floor(idx / 2) * 18;

        doc.font('Helvetica').fontSize(9).fillColor(layout.colors.gold);
        doc.text('✓', colX, rowY, { lineBreak: false });
        doc.fillColor(layout.colors.text);
        doc.text(adv, colX + 12, rowY, { width: colWidth - 20 });
      });

      y += Math.ceil(component.advantages.length / 2) * 18 + 15;
    }

    // === Lehner Haus Qualitäts-Badge ===
    if (y < 700) {
      doc.roundedRect(marginLeft, y, contentWidth, 80, 6).fill(layout.colors.goldLight);
      doc.rect(marginLeft, y, 4, 80).fill(layout.colors.gold);

      doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.primary);
      doc.text('100% individuelle Grundrissgestaltung', marginLeft + 15, y + 10);

      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.text);
      doc.text('Bei Lehner Haus sind Sie nicht an Kataloggrundrisse gebunden.', marginLeft + 15, y + 28, { width: contentWidth - 30 });

      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.text);
      doc.text('Ihr Traumhaus wird nach Ihren Wünschen geplant.', marginLeft + 15, y + 48, { width: contentWidth - 30 });
      doc.text('Schwäbisch gut seit über 60 Jahren.', marginLeft + 15, y + 60, { width: contentWidth - 30 });
    }
  }
};
