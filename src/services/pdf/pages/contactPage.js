const QRCode = require('qrcode');
const layout = require('../layout');

// Local helper: QR-Code Generator (from original drawQRCode)
async function drawQRCode(doc, x, y, url, label) {
  try {
    // QR-Code als Data URL generieren
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 100,
      margin: 1,
      color: { dark: layout.colors.primary, light: '#ffffff' }
    });

    // Als Bild einbetten
    doc.image(qrDataUrl, x, y, { width: 80, height: 80 });

    // Label
    doc.font('Helvetica').fontSize(7).fillColor(layout.colors.textMuted);
    doc.text(label, x, y + 85, { width: 80, align: 'center' });
  } catch (e) {
    console.error('[PDF] QR-Code Fehler:', e);
    // Fallback: Link als Text
    doc.font('Helvetica').fontSize(7).fillColor(layout.colors.textLight);
    doc.text(url, x, y, { width: 80 });
  }
}

module.exports = {
  title: 'Kontakt',

  condition(submission) {
    return true;
  },

  async render(doc, submission, ctx) {
    let y = 120;

    // Kontakt-Box
    doc.roundedRect(60, y, 475, 90, 8).fill(layout.colors.primary);
    doc.rect(530, y + 10, 4, 70).fill(layout.colors.gray);

    if (submission.berater_name) {
      doc.font('Helvetica-Bold').fontSize(13).fillColor(layout.colors.white);
      doc.text('Ihr Ansprechpartner', 80, y + 12, { lineBreak: false });

      doc.font('Helvetica').fontSize(10).fillColor(layout.colors.white);
      doc.text(submission.berater_name, 80, y + 35, { lineBreak: false });
      if (submission.berater_telefon) {
        doc.text(`Telefon: ${submission.berater_telefon}`, 80, y + 50, { lineBreak: false });
      }
      if (submission.berater_email) {
        doc.text(`E-Mail: ${submission.berater_email}`, 80, y + 65, { lineBreak: false });
      }
    } else {
      doc.font('Helvetica-Bold').fontSize(13).fillColor(layout.colors.white);
      doc.text('Ihr Ansprechpartner', 80, y + 12, { lineBreak: false });

      doc.font('Helvetica').fontSize(10).fillColor(layout.colors.white);
      doc.text('Lehner Haus GmbH', 80, y + 35, { lineBreak: false });
      doc.text('Telefon: 07321 96700', 80, y + 50, { lineBreak: false });
      doc.text('E-Mail: info@lehner-haus.de', 80, y + 65, { lineBreak: false });
    }

    // QR-Codes
    y += 120;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(layout.colors.primary);
    doc.text('Schnellzugriff:', 80, y, { lineBreak: false });

    y += 20;
    await drawQRCode(doc, 100, y, 'https://www.lehner-haus.de', 'Website besuchen');
    await drawQRCode(doc, 220, y, 'mailto:info@lehner-haus.de', 'E-Mail senden');
    await drawQRCode(doc, 340, y, 'tel:+497321096700', 'Anrufen');
  }
};
