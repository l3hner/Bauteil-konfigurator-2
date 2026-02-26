const path = require('path');
const fs = require('fs');
const layout = require('../layout');

const assetsDir = path.resolve(__dirname, '..', '..', '..', '..', 'assets');

module.exports = {
  async renderComponent(doc, component, categoryTitle, chapterNumber, ctx) {
    const marginLeft = 50;
    const contentWidth = 495;
    let y = 95;

    // === COMPONENT NAME (above image, full width) ===
    doc.font('Heading').fontSize(18).fillColor(layout.colors.primary);
    doc.text(component.name, marginLeft, y, { width: contentWidth });
    y += doc.heightOfString(component.name, { width: contentWidth, font: 'Heading', fontSize: 18 }) + 8;

    // Emotional hook as subtitle
    const emotionalText = component.emotionalHook || '';
    let shortDesc = emotionalText || (component.description ? component.description.split('.')[0] + '.' : '');
    if (!emotionalText && shortDesc && component.name) {
      shortDesc = shortDesc.replace(
        new RegExp('^' + component.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'),
        ''
      );
    }
    if (shortDesc && shortDesc.length > 1) {
      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.textLight);
      doc.text(shortDesc, marginLeft, y, { width: contentWidth, lineGap: 1 });
      y += doc.heightOfString(shortDesc, { width: contentWidth, fontSize: 9 }) + 10;
    }

    // === SIDE-BY-SIDE: IMAGE LEFT + TECHNICAL DETAILS RIGHT ===
    const imgSize = 200;
    const rightX = marginLeft + imgSize + 15;
    const rightWidth = contentWidth - imgSize - 15;
    const sideStartY = y;

    // --- Image left ---
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
            fit: [imgSize, imgSize],
            align: 'center',
            valign: 'top'
          });
        } else {
          layout.drawImagePlaceholder(doc, marginLeft, y, imgSize, imgSize, categoryTitle);
        }
      } catch (e) {
        layout.drawImagePlaceholder(doc, marginLeft, y, imgSize, imgSize, categoryTitle);
      }
    } else {
      layout.drawImagePlaceholder(doc, marginLeft, y, imgSize, imgSize, categoryTitle);
    }

    // --- Technical details right of image ---
    let rightY = sideStartY;

    const aufbauItems = layout.extractAufbauItems(component, categoryTitle);
    const qualityItems = layout.extractQualityItems(component, categoryTitle);

    // Aufbau / Technische Daten
    if (aufbauItems.length > 0) {
      doc.font('Heading-SemiBold').fontSize(9).fillColor(layout.colors.primary);
      doc.text('Technische Daten', rightX, rightY);
      rightY += 14;

      doc.font('Helvetica').fontSize(7.5);
      aufbauItems.forEach(item => {
        if (rightY > sideStartY + imgSize - 10) return;
        doc.fillColor(layout.colors.text);
        const nameHeight = doc.heightOfString(item.name, { width: rightWidth - 65, fontSize: 7.5 });
        doc.text(item.name, rightX, rightY, { width: rightWidth - 65 });
        if (item.value) {
          doc.font('Helvetica-Bold').fillColor(layout.colors.primary);
          doc.text(item.value, rightX + rightWidth - 60, rightY, {
            width: 60, align: 'right', lineBreak: false
          });
          doc.font('Helvetica');
        }
        rightY += Math.max(14, nameHeight + 3);
      });

      // Gesamtstärke (Hohlraumdämmung ausschließen, strukturelle Schichten mitzählen)
      const totalThickness = aufbauItems.reduce((sum, item) => {
        const nameLower = (item.name || '').toLowerCase();
        // Nur Hohlraumdämmung ausschließen (Name beginnt mit "Dämmung"), nicht strukturelle Schichten
        if (nameLower.startsWith('dämmung') || nameLower.includes('insulation') || nameLower.includes('glaswolle')) {
          return sum;
        }
        const match = (item.value || '').match(/([\d,]+)\s*mm/);
        if (match) {
          return sum + parseFloat(match[1].replace(',', '.'));
        }
        return sum;
      }, 0);

      if (totalThickness > 0 && rightY < sideStartY + imgSize - 20) {
        rightY += 2;
        doc.moveTo(rightX, rightY).lineTo(rightX + rightWidth - 5, rightY)
          .strokeColor(layout.colors.gray).lineWidth(0.5).stroke();
        rightY += 4;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(layout.colors.primary);
        doc.text('Gesamtstärke', rightX, rightY, { width: rightWidth - 60, lineBreak: false });
        doc.text(`${totalThickness.toFixed(1).replace('.', ',')} mm`, rightX + rightWidth - 60, rightY, {
          width: 60, align: 'right', lineBreak: false
        });
        rightY += 14;
      }
    }

    // Qualitätsmerkmale (under Aufbau, still in right column)
    if (qualityItems.length > 0 && rightY < sideStartY + imgSize - 20) {
      rightY += 6;
      doc.font('Heading-SemiBold').fontSize(9).fillColor(layout.colors.primary);
      doc.text('Qualitätsmerkmale', rightX, rightY);
      rightY += 14;

      doc.font('Helvetica').fontSize(7.5);
      qualityItems.forEach(item => {
        if (rightY > sideStartY + imgSize - 5) return;
        doc.fillColor(layout.colors.text);
        doc.text(item.label, rightX, rightY, { width: rightWidth - 80, lineBreak: false });
        if (item.highlight) {
          doc.font('Helvetica-Bold').fillColor(layout.colors.gray);
        } else {
          doc.font('Helvetica').fillColor(layout.colors.primary);
        }
        doc.text(item.value, rightX + rightWidth - 80, rightY, {
          width: 80, align: 'right', lineBreak: false
        });
        doc.font('Helvetica');
        rightY += 12;
      });
    }

    // Move y past image area
    y = Math.max(sideStartY + imgSize + 5, rightY + 5);

    // === PREMIUM FEATURES (full width, compact) ===
    if (component.premiumFeatures && component.premiumFeatures.length > 0 && y < 620) {
      doc.font('Heading-SemiBold').fontSize(9).fillColor(layout.colors.primary);
      doc.text('Ihre Vorteile bei Lehner Haus:', marginLeft, y);
      y += 14;

      const featColWidth = contentWidth / 2;
      const features = component.premiumFeatures.slice(0, 4);
      features.forEach((feature, idx) => {
        const colX = idx % 2 === 0 ? marginLeft : marginLeft + featColWidth;
        const rowY = y + Math.floor(idx / 2) * 16;

        doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.gray);
        doc.text('\u2713', colX, rowY, { lineBreak: false });
        doc.fillColor(layout.colors.text);
        doc.text(feature, colX + 10, rowY, { width: featColWidth - 15 });
      });

      y += Math.ceil(features.length / 2) * 16 + 10;
    }

    // === ADVANTAGES LIST (2-column bullets) ===
    if (component.advantages && component.advantages.length > 0 && y < 640) {
      doc.font('Heading-SemiBold').fontSize(9).fillColor(layout.colors.primary);
      doc.text('Weitere Vorteile:', marginLeft, y);
      y += 14;

      const advColWidth = contentWidth / 2;
      const advItems = component.advantages.slice(0, 6);
      advItems.forEach((adv, idx) => {
        const colX = idx % 2 === 0 ? marginLeft : marginLeft + advColWidth;
        const rowY = y + Math.floor(idx / 2) * 16;

        doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.gray);
        doc.text('\u2022', colX, rowY, { lineBreak: false });
        doc.fillColor(layout.colors.textLight);
        doc.text(adv, colX + 8, rowY, { width: advColWidth - 15 });
      });

      y += Math.ceil(advItems.length / 2) * 16 + 8;
    }

    // === COMPARISON TIP (horizontal line separator, no box) ===
    if (component.comparisonNotes && y < 710) {
      // Horizontal separator line
      doc.moveTo(marginLeft, y).lineTo(marginLeft + contentWidth, y)
        .strokeColor('#cccccc').lineWidth(0.5).stroke();
      y += 10;

      doc.font('Helvetica-Bold').fontSize(8).fillColor(layout.colors.primary);
      doc.text('Tipp für den Anbietervergleich:', marginLeft, y);
      y += 14;

      // Extract relevant tips
      const tips = component.comparisonNotes
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/\u2757|KRITISCHE FRAGEN.*:/g, '').trim())
        .filter(line => line.length > 0);

      doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.text);
      const maxTipY = 775;
      const tipWidth = contentWidth;
      tips.forEach(tip => {
        if (y + 10 > maxTipY) return;
        const textHeight = doc.heightOfString(tip, { width: tipWidth, fontSize: 7.5 });
        doc.text(tip, marginLeft, y, { width: tipWidth });
        y += textHeight + 4;
      });
    }
  }
};
