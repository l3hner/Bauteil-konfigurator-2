const path = require('path');
const fs = require('fs');
const layout = require('../layout');

const assetsDir = path.resolve(__dirname, '..', '..', '..', '..', 'assets');

module.exports = {
  async renderHaustyp(doc, component, ctx) {
    const marginLeft = 50;
    const contentWidth = 495;

    // === SIDE-BY-SIDE: HERO IMAGE LEFT + TEXT RIGHT ===
    const imgSize = 200;
    const textX = marginLeft + imgSize + 15;
    const textWidth = contentWidth - imgSize - 15;
    let y = 95;

    const imgDir = component.filePath
      ? path.resolve(assetsDir, '..', component.filePath)
      : null;
    const heroFile = imgDir ? path.join(imgDir, '1.png') : null;

    if (heroFile && fs.existsSync(heroFile)) {
      try {
        const buffer = await ctx.imageService.getCompressedImage(heroFile);
        if (buffer) {
          doc.image(buffer, marginLeft, y, {
            fit: [imgSize, imgSize],
            align: 'left',
            valign: 'top'
          });
        } else {
          layout.drawImagePlaceholder(doc, marginLeft, y, imgSize, imgSize, 'Ihr Haustyp');
        }
      } catch (e) {
        layout.drawImagePlaceholder(doc, marginLeft, y, imgSize, imgSize, 'Ihr Haustyp');
      }
    } else {
      layout.drawImagePlaceholder(doc, marginLeft, y, imgSize, imgSize, 'Ihr Haustyp');
    }

    // Caption under hero image
    doc.font('Helvetica').fontSize(7).fillColor(layout.colors.textMuted);
    doc.text('Beispielbild', marginLeft, y + imgSize + 2);

    // === TEXT RIGHT OF IMAGE ===
    let textY = y;

    // Haustyp name
    doc.font('Heading').fontSize(22).fillColor(layout.colors.primary);
    doc.text(component.name, textX, textY, { width: textWidth });
    textY += doc.heightOfString(component.name, { width: textWidth, font: 'Heading', fontSize: 22 }) + 8;

    // Description
    const desc = component.emotionalHook || component.details || component.description || '';
    if (desc) {
      doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
      doc.text(desc, textX, textY, { width: textWidth, lineGap: 2 });
      textY += doc.heightOfString(desc, { width: textWidth, lineGap: 2, fontSize: 10 }) + 10;
    }

    // Move y past the image area
    y = Math.max(y + imgSize + 15, textY + 10);

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
                align: 'left',
                valign: 'top'
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
        // Caption below each small image (left-aligned under each)
        doc.font('Helvetica').fontSize(7).fillColor(layout.colors.textMuted);
        doc.text('Beispielbild', marginLeft, y + smallImgHeight + 2);
        doc.text('Beispielbild', marginLeft + smallImgWidth + 15, y + smallImgHeight + 2);
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

        doc.font('Helvetica').fontSize(9).fillColor(layout.colors.gray);
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
        doc.roundedRect(marginLeft, y, contentWidth, badgeHeight, 6).fill(layout.colors.grayLight);
        doc.rect(marginLeft, y, 4, badgeHeight).fill(layout.colors.gray);

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
