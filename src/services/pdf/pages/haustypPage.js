const path = require('path');
const fs = require('fs');
const layout = require('../layout');

const assetsDir = path.resolve(__dirname, '..', '..', '..', '..', 'assets');

module.exports = {
  async renderHaustyp(doc, component, ctx) {
    const marginLeft = 50;
    const contentWidth = 495;

    // === LARGE HERO IMAGE (full width, cover mode) ===
    const heroHeight = 220;
    const imgDir = component.filePath
      ? path.resolve(assetsDir, '..', component.filePath)
      : null;
    const heroFile = imgDir ? path.join(imgDir, '1.png') : null;

    if (heroFile && fs.existsSync(heroFile)) {
      try {
        const buffer = await ctx.imageService.getCompressedImage(heroFile);
        if (buffer) {
          doc.save();
          doc.rect(marginLeft, 95, contentWidth, heroHeight).clip();
          doc.image(buffer, marginLeft, 95, {
            cover: [contentWidth, heroHeight],
            align: 'center',
            valign: 'center'
          });
          doc.restore();
        } else {
          layout.drawImagePlaceholder(doc, marginLeft, 95, contentWidth, heroHeight, 'Ihr Haustyp');
        }
      } catch (e) {
        try { doc.restore(); } catch (_) { /* no save pending */ }
        layout.drawImagePlaceholder(doc, marginLeft, 95, contentWidth, heroHeight, 'Ihr Haustyp');
      }
    } else {
      layout.drawImagePlaceholder(doc, marginLeft, 95, contentWidth, heroHeight, 'Ihr Haustyp');
    }

    let y = 95 + heroHeight + 15; // 330

    // === HAUSTYP NAME (large heading) ===
    doc.font('Heading').fontSize(22).fillColor(layout.colors.primary);
    doc.text(component.name, marginLeft, y, { width: contentWidth });
    y += 30;

    // === DESCRIPTION (measured dynamically) ===
    const desc = component.details || component.description || '';
    if (desc) {
      doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
      const descHeight = doc.heightOfString(desc, { width: contentWidth, lineGap: 2 });
      doc.text(desc, marginLeft, y, { width: contentWidth, lineGap: 2 });
      y += descHeight + 15;
    }

    // === TWO SMALLER IMAGES SIDE BY SIDE (2.png and 3.png) ===
    if (y < 550 && imgDir) {
      const smallImgWidth = Math.floor((contentWidth - 15) / 2);
      const smallImgHeight = 130;
      let imagesDrawn = false;

      for (let i = 0; i < 2; i++) {
        const imgFile = path.join(imgDir, `${i + 2}.png`);
        const imgX = marginLeft + i * (smallImgWidth + 15);

        if (fs.existsSync(imgFile)) {
          try {
            const buffer = await ctx.imageService.getCompressedImage(imgFile);
            if (buffer) {
              doc.image(buffer, imgX, y, {
                fit: [smallImgWidth, smallImgHeight],
                align: 'center',
                valign: 'center'
              });
              imagesDrawn = true;
            } else {
              layout.drawImagePlaceholder(doc, imgX, y, smallImgWidth, smallImgHeight, 'Haustyp');
              imagesDrawn = true;
            }
          } catch (e) {
            layout.drawImagePlaceholder(doc, imgX, y, smallImgWidth, smallImgHeight, 'Haustyp');
            imagesDrawn = true;
          }
        } else {
          layout.drawImagePlaceholder(doc, imgX, y, smallImgWidth, smallImgHeight, 'Haustyp');
          imagesDrawn = true;
        }
      }

      if (imagesDrawn) {
        // Caption below images
        doc.font('Helvetica').fontSize(7).fillColor(layout.colors.textMuted);
        doc.text('Beispielbilder', marginLeft, y + smallImgHeight + 2, {
          width: contentWidth,
          align: 'center'
        });
        y += smallImgHeight + 18;
      }
    }

    // === ADVANTAGES (2-column checkmarks) ===
    if (component.advantages && component.advantages.length > 0 && y < 680) {
      doc.font('Heading-SemiBold').fontSize(11).fillColor(layout.colors.primary);
      doc.text('Ihre Vorteile mit diesem Haustyp:', marginLeft, y);
      y += 20;

      const colWidth = contentWidth / 2;
      component.advantages.forEach((adv, idx) => {
        const colX = idx % 2 === 0 ? marginLeft : marginLeft + colWidth;
        const rowY = y + Math.floor(idx / 2) * 18;

        doc.font('Helvetica').fontSize(9).fillColor(layout.colors.gold);
        doc.text('\u2713', colX, rowY, { lineBreak: false });
        doc.fillColor(layout.colors.text);
        doc.text(adv, colX + 12, rowY, { width: colWidth - 20 });
      });

      y += Math.ceil(component.advantages.length / 2) * 18 + 15;
    }

    // === QUALITY BADGE BOX ===
    if (y < 700) {
      const badgeHeight = 80;
      const remainingSpace = 775 - y;
      if (remainingSpace >= badgeHeight) {
        doc.roundedRect(marginLeft, y, contentWidth, badgeHeight, 6).fill(layout.colors.goldLight);
        doc.rect(marginLeft, y, 4, badgeHeight).fill(layout.colors.gold);

        doc.font('Heading-SemiBold').fontSize(10).fillColor(layout.colors.primary);
        doc.text('100% individuelle Grundrissgestaltung', marginLeft + 15, y + 10);

        doc.font('Helvetica').fontSize(9).fillColor(layout.colors.text);
        doc.text(
          'Bei Lehner Haus sind Sie nicht an Kataloggrundrisse gebunden.',
          marginLeft + 15, y + 28, { width: contentWidth - 30 }
        );
        doc.text(
          'Ihr Traumhaus wird nach Ihren W\u00fcnschen geplant.',
          marginLeft + 15, y + 44, { width: contentWidth - 30 }
        );
        doc.font('Helvetica').fontSize(9).fillColor(layout.colors.textMuted);
        doc.text(
          'Schw\u00e4bisch gut seit \u00fcber 60 Jahren.',
          marginLeft + 15, y + 60, { width: contentWidth - 30 }
        );
      }
    }
  }
};
