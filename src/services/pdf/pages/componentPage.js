const path = require('path');
const fs = require('fs');
const layout = require('../layout');

const assetsDir = path.resolve(__dirname, '..', '..', '..', '..', 'assets');

// Schriftgrößen der Bauteilseite. Bis 11/2026 lief der Fließtext in 7,5 pt und die Seite
// war nur zur Hälfte gefüllt; jetzt 9 pt, damit die Seite auch gedruckt gut lesbar ist.
const SIZE = {
  name: 20,
  hook: 10.5,
  section: 11,
  table: 9,
  body: 9.5,
  tipHead: 10,
  tip: 9
};
const PAGE_BOTTOM = 775; // darunter beginnt die Fußzeile

module.exports = {
  /**
   * Zeichnet eine Bauteilseite.
   * @returns {{ endY: number, dropped: string[] }} Endposition und Abschnitte, die nicht mehr
   *          auf die Seite gepasst haben (für scripts/check-pdf-layout.js).
   */
  async renderComponent(doc, component, categoryTitle, chapterNumber, ctx) {
    const marginLeft = 50;
    const contentWidth = 495;
    const dropped = [];
    let y = 95;

    // === COMPONENT NAME (above image, full width) ===
    doc.font('Heading').fontSize(SIZE.name).fillColor(layout.colors.primary);
    doc.text(component.name, marginLeft, y, { width: contentWidth });
    y += doc.heightOfString(component.name, { width: contentWidth }) + 6;

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
      doc.font('Helvetica').fontSize(SIZE.hook).fillColor(layout.colors.textLight);
      doc.text(shortDesc, marginLeft, y, { width: contentWidth, lineGap: 2 });
      y += doc.heightOfString(shortDesc, { width: contentWidth, lineGap: 2 }) + 14;
    }

    // === SIDE-BY-SIDE: IMAGE LEFT + TECHNICAL DETAILS RIGHT ===
    const imgSize = 225;
    const gap = 20;
    const valueWidth = 70;
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

    // Einträge ohne Bild (z. B. Flachdach) bekommen keine graue Platzhalterfläche,
    // die Technischen Daten laufen dann über die volle Breite.
    const rightX = imgPath ? marginLeft + imgSize + gap : marginLeft;
    const rightWidth = imgPath ? contentWidth - imgSize - gap : contentWidth;

    let actualImgHeight = imgPath ? imgSize : 0;
    if (imgPath) {
      try {
        const buffer = await ctx.imageService.getCompressedImage(imgPath);
        if (buffer) {
          const img = doc.openImage(buffer);
          const scale = Math.min(imgSize / img.width, imgSize / img.height);
          actualImgHeight = img.height * scale;
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
    }

    // --- Technical details right of image ---
    let rightY = sideStartY;

    const aufbauItems = layout.extractAufbauItems(component, categoryTitle);
    const qualityItems = layout.extractQualityItems(component, categoryTitle);

    // Aufbau / Technische Daten
    if (aufbauItems.length > 0) {
      doc.font('Heading-SemiBold').fontSize(SIZE.section).fillColor(layout.colors.primary);
      doc.text('Technische Daten', rightX, rightY);
      rightY += 18;

      aufbauItems.forEach(item => {
        doc.font('Helvetica').fontSize(SIZE.table).fillColor(layout.colors.text);
        // Zeilen ohne Wert dürfen die ganze Spaltenbreite nutzen
        const nameWidth = item.value ? rightWidth - valueWidth - 8 : rightWidth;
        const nameHeight = doc.heightOfString(item.name, { width: nameWidth });
        doc.text(item.name, rightX, rightY, { width: nameWidth });
        if (item.value) {
          doc.font('Helvetica-Bold').fillColor(layout.colors.primary);
          doc.text(item.value, rightX + rightWidth - valueWidth, rightY, {
            width: valueWidth, align: 'right', lineBreak: false
          });
        }
        rightY += Math.max(16, nameHeight + 6);
      });

      // Gesamtstärke (Hohlraumdämmung ausschließen, strukturelle Schichten mitzählen)
      const totalThickness = aufbauItems.reduce((sum, item) => {
        const nameLower = (item.name || '').toLowerCase();
        // Hohlraumdämmung sitzt IM Gefach struktureller Schichten (Deckenbalken, Rahmenkonstruktion)
        // und darf nicht zur Gesamtstärke addiert werden. Strukturelle Schichten mit "Dämmung" im
        // Namen (z.B. "Holzfaser-Wärme-Dämmplatten") werden über startsWith ausgeschlossen.
        if (
          nameLower.startsWith('dämmung') ||
          nameLower.startsWith('wärmedämmung') ||
          nameLower.startsWith('wärme-/schalldämmung') ||
          nameLower.startsWith('knauf insulation') ||
          nameLower.startsWith('mineralwolle') ||
          nameLower.includes('glaswolle')
        ) {
          return sum;
        }
        const match = (item.value || '').match(/([\d,]+)\s*mm/);
        if (match) {
          return sum + parseFloat(match[1].replace(',', '.'));
        }
        return sum;
      }, 0);

      // Summenzeile: Der Katalog kann sie je Eintrag vorgeben (totalThickness: { label, value },
      // z. B. Wandstärke einschließlich Außenputz laut Leistungsbeschreibung) oder mit
      // totalThickness: false abschalten (Dach, Fenster, Technik). Sonst wird gerechnet.
      const fixedTotal = component.totalThickness;
      const totalLabel = fixedTotal && fixedTotal.label ? fixedTotal.label : 'Gesamtstärke';
      const totalValue = fixedTotal && fixedTotal.value
        ? fixedTotal.value
        : `${totalThickness.toFixed(1).replace('.', ',')} mm`;

      if (fixedTotal !== false && (totalThickness > 0 || (fixedTotal && fixedTotal.value))) {
        rightY += 2;
        doc.moveTo(rightX, rightY).lineTo(rightX + rightWidth, rightY)
          .strokeColor(layout.colors.gray).lineWidth(0.5).stroke();
        rightY += 5;
        doc.font('Helvetica-Bold').fontSize(SIZE.table).fillColor(layout.colors.primary);
        doc.text(totalLabel, rightX, rightY, { width: rightWidth - valueWidth, lineBreak: false });
        doc.text(totalValue, rightX + rightWidth - valueWidth, rightY, {
          width: valueWidth, align: 'right', lineBreak: false
        });
        rightY += 16;
      }
    }

    // Qualitätsmerkmale (under Aufbau, still in right column)
    if (qualityItems.length > 0) {
      rightY += 8;
      doc.font('Heading-SemiBold').fontSize(SIZE.section).fillColor(layout.colors.primary);
      doc.text('Qualitätsmerkmale', rightX, rightY);
      rightY += 18;

      const qValueWidth = 110;
      qualityItems.forEach(item => {
        doc.font('Helvetica').fontSize(SIZE.table).fillColor(layout.colors.text);
        doc.text(item.label, rightX, rightY, { width: rightWidth - qValueWidth - 6, lineBreak: false });
        doc.font('Helvetica-Bold').fillColor(layout.colors.primary);
        const valueHeight = doc.heightOfString(item.value, { width: qValueWidth, align: 'right' });
        doc.text(item.value, rightX + rightWidth - qValueWidth, rightY, { width: qValueWidth, align: 'right' });
        rightY += Math.max(15, valueHeight + 4);
      });
    }

    // Move y past image area (use actual image height, not full imgSize)
    y = Math.max(sideStartY + actualImgHeight, rightY) + 20;

    // Zweispaltige Liste mit Zeilenhöhe nach tatsächlichem Umbruch
    const drawTwoColumnList = (items, startY, drawMarker, textColor) => {
      const colWidth = contentWidth / 2;
      const textWidth = colWidth - 24;
      let rowY = startY;
      doc.font('Helvetica').fontSize(SIZE.body);
      for (let i = 0; i < items.length; i += 2) {
        const left = items[i];
        const right = items[i + 1];
        doc.font('Helvetica').fontSize(SIZE.body);
        const leftH = doc.heightOfString(left, { width: textWidth, lineGap: 1 });
        const rightH = right ? doc.heightOfString(right, { width: textWidth, lineGap: 1 }) : 0;

        drawMarker(marginLeft, rowY);
        doc.font('Helvetica').fontSize(SIZE.body).fillColor(textColor);
        doc.text(left, marginLeft + 13, rowY, { width: textWidth, lineGap: 1 });
        if (right) {
          drawMarker(marginLeft + colWidth, rowY);
          doc.font('Helvetica').fontSize(SIZE.body).fillColor(textColor);
          doc.text(right, marginLeft + colWidth + 13, rowY, { width: textWidth, lineGap: 1 });
        }
        rowY += Math.max(leftH, rightH) + 7;
      }
      return rowY;
    };

    // === PREMIUM FEATURES (full width) ===
    if (component.premiumFeatures && component.premiumFeatures.length > 0) {
      if (y < 640) {
        doc.font('Heading-SemiBold').fontSize(SIZE.section).fillColor(layout.colors.primary);
        doc.text('Ihre Vorteile bei Lehner Haus:', marginLeft, y);
        y += 20;
        y = drawTwoColumnList(
          component.premiumFeatures.slice(0, 4),
          y,
          (x, markerY) => layout.drawCheck(doc, x, markerY + 1, layout.colors.primary, 7),
          layout.colors.text
        ) + 12;
      } else {
        dropped.push('Ihre Vorteile');
      }
    }

    // === ADVANTAGES LIST (2-column bullets) ===
    if (component.advantages && component.advantages.length > 0) {
      if (y < 660) {
        doc.font('Heading-SemiBold').fontSize(SIZE.section).fillColor(layout.colors.primary);
        doc.text('Weitere Vorteile:', marginLeft, y);
        y += 20;
        y = drawTwoColumnList(
          component.advantages.slice(0, 6),
          y,
          (x, markerY) => {
            doc.font('Helvetica').fontSize(SIZE.body).fillColor(layout.colors.gray);
            doc.text('•', x + 2, markerY, { lineBreak: false });
          },
          layout.colors.text
        ) + 10;
      } else {
        dropped.push('Weitere Vorteile');
      }
    }

    // === COMPARISON TIP (horizontal line separator, no box) ===
    if (component.comparisonNotes) {
      if (y < 715) {
        // Horizontal separator line
        doc.moveTo(marginLeft, y).lineTo(marginLeft + contentWidth, y)
          .strokeColor('#cccccc').lineWidth(0.5).stroke();
        y += 14;

        doc.font('Helvetica-Bold').fontSize(SIZE.tipHead).fillColor(layout.colors.primary);
        doc.text('Tipp für den Anbietervergleich:', marginLeft, y);
        y += 17;

        // Extract relevant tips
        const tips = component.comparisonNotes
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/❗|KRITISCHE FRAGEN.*:/g, '').trim())
          .filter(line => line.length > 0);

        doc.font('Helvetica').fontSize(SIZE.tip).fillColor(layout.colors.text);
        let cut = 0;
        tips.forEach(tip => {
          const textHeight = doc.heightOfString(tip, { width: contentWidth, lineGap: 1 });
          if (y + textHeight > PAGE_BOTTOM) {
            cut++;
            return;
          }
          doc.text(tip, marginLeft, y, { width: contentWidth, lineGap: 1 });
          y += textHeight + 5;
        });
        if (cut > 0) dropped.push(`${cut} Tipp-Zeile(n)`);
      } else {
        dropped.push('Tipp für den Anbietervergleich');
      }
    }

    return { endY: Math.round(y), dropped };
  }
};
