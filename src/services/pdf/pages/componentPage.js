const path = require('path');
const fs = require('fs');
const layout = require('../layout');

const assetsDir = path.resolve(__dirname, '..', '..', '..', '..', 'assets');

module.exports = {
  async renderComponent(doc, component, categoryTitle, chapterNumber, ctx) {
    // Visual-First Layout: Large product image -> headline -> advantages -> specs -> tip
    const marginLeft = 50;
    const contentWidth = 495;
    let y = 95;

    // === LARGE PRODUCT IMAGE (full content width, first element after header) ===
    const imgHeight = 200;

    // Prefer product image for visual impact, fall back to technical drawing, then placeholder
    const productImgPath = component.filePath
      ? path.resolve(assetsDir, '..', component.filePath)
      : null;
    const techDrawingPath = component.technicalDrawing
      ? path.resolve(assetsDir, '..', component.technicalDrawing)
      : null;

    const imgPath =
      (productImgPath && fs.existsSync(productImgPath))
        ? productImgPath
        : (techDrawingPath && fs.existsSync(techDrawingPath))
          ? techDrawingPath
          : null;

    if (imgPath) {
      try {
        const buffer = await ctx.imageService.getCompressedImage(imgPath);
        if (buffer) {
          doc.image(buffer, marginLeft, y, {
            fit: [contentWidth, imgHeight],
            align: 'center',
            valign: 'center'
          });
        } else {
          layout.drawImagePlaceholder(doc, marginLeft, y, contentWidth, imgHeight, categoryTitle);
        }
      } catch (e) {
        layout.drawImagePlaceholder(doc, marginLeft, y, contentWidth, imgHeight, categoryTitle);
      }
    } else {
      layout.drawImagePlaceholder(doc, marginLeft, y, contentWidth, imgHeight, categoryTitle);
    }

    y += imgHeight + 15;

    // === EMOTIONAL HEADLINE ===
    // Component name in Heading font
    doc.font('Heading').fontSize(18).fillColor(layout.colors.primary);
    doc.text(component.name, marginLeft, y, { width: contentWidth });
    y += 24;

    // Short description (first sentence, strip component name to avoid repetition)
    let shortDesc = component.description ? component.description.split('.')[0] + '.' : '';
    if (shortDesc && component.name) {
      shortDesc = shortDesc.replace(
        new RegExp('^' + component.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'),
        ''
      );
    }
    if (shortDesc && shortDesc.length > 1) {
      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.textLight);
      doc.text(shortDesc, marginLeft, y, { width: contentWidth });
      y += 18;
    }

    // === PREMIUM FEATURES BOX (gold-left-border) ===
    if (component.premiumFeatures && component.premiumFeatures.length > 0) {
      const featColWidth = (contentWidth - 24) / 2;
      const features = component.premiumFeatures.slice(0, 4);
      const featRows = Math.ceil(features.length / 2);

      // Calculate height per row (including possible line wrapping)
      doc.font('Helvetica').fontSize(7.5);
      const maxRowHeights = [];
      for (let r = 0; r < featRows; r++) {
        const leftFeat = features[r * 2] || '';
        const rightFeat = features[r * 2 + 1] || '';
        const leftH = doc.heightOfString(leftFeat, { width: featColWidth - 25 });
        const rightH = doc.heightOfString(rightFeat, { width: featColWidth - 25 });
        maxRowHeights.push(Math.max(leftH, rightH) + 6);
      }
      const totalFeatHeight = maxRowHeights.reduce((a, b) => a + b, 0);
      const boxHeight = 26 + totalFeatHeight + 6;

      doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 4).fill(layout.colors.goldLight);
      doc.rect(marginLeft, y, 3, boxHeight).fill(layout.colors.gold);

      doc.font('Heading-SemiBold').fontSize(9).fillColor(layout.colors.primary);
      doc.text('Ihre Vorteile bei Lehner Haus:', marginLeft + 12, y + 8);

      let featY = y + 26;
      features.forEach((feature, idx) => {
        const row = Math.floor(idx / 2);
        const colX = idx % 2 === 0 ? marginLeft + 12 : marginLeft + 12 + featColWidth;
        const rowY = featY + maxRowHeights.slice(0, row).reduce((a, b) => a + b, 0);

        doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.gold);
        doc.text('\u2713', colX, rowY, { lineBreak: false });
        doc.fillColor(layout.colors.text);
        doc.text(feature, colX + 10, rowY, { width: featColWidth - 25 });
      });

      y += boxHeight + 12;
    }

    // === ADVANTAGES LIST (2-column bullets) ===
    if (component.advantages && component.advantages.length > 0 && y < 620) {
      doc.font('Heading-SemiBold').fontSize(9).fillColor(layout.colors.primary);
      doc.text('Weitere Vorteile:', marginLeft, y);
      y += 16;

      const advColWidth = contentWidth / 2;
      const advGap = 6;
      const advItems = component.advantages.slice(0, 6);
      advItems.forEach((adv, idx) => {
        const colX = idx % 2 === 0 ? marginLeft : marginLeft + advColWidth;
        const rowY = y + Math.floor(idx / 2) * (14 + advGap);

        doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.gold);
        doc.text('\u2022', colX, rowY, { lineBreak: false });
        doc.fillColor(layout.colors.textLight);
        doc.text(adv, colX + 8, rowY, { width: advColWidth - 15 });
      });

      y += Math.ceil(advItems.length / 2) * (14 + advGap) + 8;
    }

    // === TECHNICAL DETAILS (compact 2-column block at bottom) ===
    if (y < 660) {
      const aufbauItems = layout.extractAufbauItems(component, categoryTitle);
      const qualityItems = layout.extractQualityItems(component, categoryTitle);

      if (aufbauItems.length > 0 || qualityItems.length > 0) {
        // Calculate section height
        const techRowHeight = 12;
        const leftRows = aufbauItems.length + 1; // +1 for header
        const rightRows = qualityItems.length + 1; // +1 for header
        const maxRows = Math.max(leftRows, rightRows);

        // Gesamtstaerke line
        const totalThickness = aufbauItems.reduce((sum, item) => {
          const nameLower = (item.name || '').toLowerCase();
          if (nameLower.includes('d\u00e4mmung') || nameLower.includes('insulation') || nameLower.includes('glaswolle')) {
            return sum;
          }
          const match = (item.value || '').match(/([\d,]+)\s*mm/);
          if (match) {
            return sum + parseFloat(match[1].replace(',', '.'));
          }
          return sum;
        }, 0);
        const hasThickness = totalThickness > 0;
        const extraRows = hasThickness ? 1 : 0;

        const sectionHeight = (maxRows + extraRows) * techRowHeight + 20;
        const remainingSpace = 775 - y;
        if (sectionHeight > remainingSpace) {
          // Not enough space, skip technical details
        } else {
          // Gray background box
          doc.roundedRect(marginLeft, y, contentWidth, sectionHeight, 3).fill(layout.colors.grayLight);

          const techY = y + 8;
          const leftColX = marginLeft + 10;
          const leftColWidth = (contentWidth - 30) / 2;
          const rightColX = marginLeft + 10 + leftColWidth + 10;
          const rightColWidth = leftColWidth;

          // Left column: Technische Daten
          doc.font('Heading-SemiBold').fontSize(8).fillColor(layout.colors.primary);
          doc.text('Technische Daten', leftColX, techY);
          let leftY = techY + techRowHeight + 2;

          doc.font('Helvetica').fontSize(7);
          aufbauItems.forEach(item => {
            if (leftY > y + sectionHeight - 14) return;
            doc.fillColor(layout.colors.text);
            doc.text(item.name, leftColX, leftY, { width: leftColWidth - 55, lineBreak: false });
            if (item.value) {
              doc.font('Helvetica-Bold').fillColor(layout.colors.primary);
              doc.text(item.value, leftColX + leftColWidth - 55, leftY, {
                width: 55, align: 'right', lineBreak: false
              });
              doc.font('Helvetica');
            }
            leftY += techRowHeight;
          });

          // Gesamtstaerke
          if (hasThickness && leftY <= y + sectionHeight - 14) {
            leftY += 2;
            doc.moveTo(leftColX, leftY).lineTo(leftColX + leftColWidth - 5, leftY)
              .strokeColor(layout.colors.gold).lineWidth(0.5).stroke();
            leftY += 4;
            doc.font('Helvetica-Bold').fontSize(7).fillColor(layout.colors.primary);
            doc.text('Gesamtst\u00e4rke', leftColX, leftY, { width: leftColWidth - 55, lineBreak: false });
            doc.text(`${totalThickness.toFixed(1).replace('.', ',')} mm`, leftColX + leftColWidth - 55, leftY, {
              width: 55, align: 'right', lineBreak: false
            });
          }

          // Right column: Quality items
          if (qualityItems.length > 0) {
            doc.font('Heading-SemiBold').fontSize(8).fillColor(layout.colors.primary);
            doc.text('Qualit\u00e4tsmerkmale', rightColX, techY);
            let rightY = techY + techRowHeight + 2;

            doc.font('Helvetica').fontSize(7);
            qualityItems.forEach(item => {
              if (rightY > y + sectionHeight - 14) return;
              doc.fillColor(layout.colors.text);
              doc.text(item.label, rightColX, rightY, { width: rightColWidth - 80, lineBreak: false });
              if (item.highlight) {
                doc.font('Helvetica-Bold').fillColor(layout.colors.gold);
              } else {
                doc.font('Helvetica').fillColor(layout.colors.primary);
              }
              doc.text(item.value, rightColX + rightColWidth - 80, rightY, {
                width: 80, align: 'right', lineBreak: false
              });
              doc.font('Helvetica');
              rightY += techRowHeight;
            });
          }

          y += sectionHeight + 10;
        }
      }
    }

    // === COMPARISON TIP BOX (if space remains) ===
    if (component.comparisonNotes && y < 700) {
      const remainingHeight = 775 - y;
      const boxHeight = Math.min(remainingHeight, 130);

      doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 4)
        .strokeColor(layout.colors.gold).lineWidth(1.5).stroke();
      doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 4).fill('#fffef5');

      doc.font('Helvetica-Bold').fontSize(8).fillColor(layout.colors.gold);
      doc.text('Tipp f\u00fcr den Anbietervergleich:', marginLeft + 10, y + 10);

      // Extract relevant tips
      const tips = component.comparisonNotes
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/\u2757|KRITISCHE FRAGEN.*:/g, '').trim())
        .filter(line => line.length > 0);

      doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.text);
      let tipY = y + 26;
      const maxTipY = y + boxHeight - 12;
      const tipWidth = contentWidth - 20;
      tips.forEach(tip => {
        if (tipY + 10 > maxTipY) return;
        const textHeight = doc.heightOfString(tip, { width: tipWidth, fontSize: 7.5 });
        doc.text(tip, marginLeft + 10, tipY, { width: tipWidth });
        tipY += textHeight + 6;
      });
    }
  }
};
