const path = require('path');
const fs = require('fs');
const layout = require('../layout');

const assetsDir = path.resolve(__dirname, '..', '..', '..', '..', 'assets');

module.exports = {
  renderComponent(doc, component, categoryTitle, chapterNumber, ctx) {
    // ELK-Style Layout: Technisches Schnittbild + Aufbau-Liste + Qualitätsmerkmale
    const marginLeft = 50;
    const contentWidth = 495;
    let y = 95;

    // === KAPITEL-HEADER mit Nummerierung ===
    const chapterNum = chapterNumber || '5.1';
    doc.font('Helvetica-Bold').fontSize(11).fillColor(layout.colors.primary);
    doc.text(`${chapterNum} ${categoryTitle.toUpperCase()}`, marginLeft, y);
    y += 18;

    // Komponenten-Name und kurze Beschreibung (keine Wiederholung des Systemnamens)
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.text);
    let shortDesc = component.description ? component.description.split('.')[0] + '.' : '';
    // Systemname aus Beschreibung entfernen falls bereits als Titel angezeigt
    if (shortDesc && component.name) {
      shortDesc = shortDesc.replace(new RegExp('^' + component.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '');
    }
    doc.text(`${component.name}${shortDesc ? ' – ' + shortDesc : ''}`, marginLeft, y, { width: contentWidth });
    y += 25;

    // === 2-SPALTEN LAYOUT: Bild links, Aufbau rechts ===
    const imgWidth = 180;
    const imgHeight = 140;
    const rightColX = marginLeft + imgWidth + 25;
    const rightColWidth = contentWidth - imgWidth - 25;

    // Technische Zeichnung/Schnittbild (bevorzugt) oder Produktbild
    const techDrawingPath = component.technicalDrawing ?
      path.resolve(assetsDir, '..', component.technicalDrawing) : null;
    const productImgPath = component.filePath ?
      path.resolve(assetsDir, '..', component.filePath) : null;

    const imgPath = (techDrawingPath && fs.existsSync(techDrawingPath)) ? techDrawingPath : productImgPath;

    if (imgPath && fs.existsSync(imgPath)) {
      try {
        doc.image(imgPath, marginLeft, y, { fit: [imgWidth, imgHeight] });
      } catch (e) {
        layout.drawImagePlaceholder(doc, marginLeft, y, imgWidth, imgHeight, categoryTitle);
      }
    } else {
      layout.drawImagePlaceholder(doc, marginLeft, y, imgWidth, imgHeight, categoryTitle);
    }

    // === AUFBAU-LISTE (rechte Spalte) - ELK Style ===
    let rightY = y;

    // Aufbau-Header (dynamisch je nach Kategorie)
    const aufbauHeader = categoryTitle.includes('Decke')
      ? 'Aufbau von oben nach unten'
      : 'Aufbau von außen nach innen';
    doc.font('Helvetica-Bold').fontSize(9).fillColor(layout.colors.primary);
    doc.text(aufbauHeader, rightColX, rightY);
    rightY += 4;
    doc.moveTo(rightColX, rightY + 8).lineTo(rightColX + 130, rightY + 8)
       .strokeColor(layout.colors.secondary).lineWidth(0.5).stroke();
    rightY += 16;

    // Aufbau-Schichten aus component.layers oder technicalDetails extrahieren
    const aufbauItems = layout.extractAufbauItems(component, categoryTitle);

    doc.font('Helvetica').fontSize(8);
    aufbauItems.forEach(item => {
      doc.font('Helvetica-Bold').fillColor(layout.colors.text).text('·', rightColX, rightY, { lineBreak: false });
      doc.font('Helvetica').fillColor(layout.colors.text);
      doc.text(item.name, rightColX + 8, rightY, { width: rightColWidth - 70, lineBreak: false });
      if (item.value) {
        doc.font('Helvetica-Bold').fillColor(layout.colors.primary);
        doc.text(item.value, rightColX + rightColWidth - 65, rightY, {
          width: 60, align: 'right', lineBreak: false
        });
      }
      rightY += 15;
      // Kleiner Absatz nach Massivholzrahmenkonstruktion (Layout-Entzerrung)
      if (item.name && item.name.toLowerCase().includes('massivholz') && item.name.toLowerCase().includes('rahmenkonstruktion')) {
        rightY += 8;
      }
    });

    // Gesamtstärke als Summe berechnen (Dämmung nicht einrechnen)
    const totalThickness = aufbauItems.reduce((sum, item) => {
      const nameLower = (item.name || '').toLowerCase();
      if (nameLower.includes('dämmung') || nameLower.includes('insulation') || nameLower.includes('glaswolle')) {
        return sum;
      }
      const match = (item.value || '').match(/([\d,]+)\s*mm/);
      if (match) {
        return sum + parseFloat(match[1].replace(',', '.'));
      }
      return sum;
    }, 0);

    if (totalThickness > 0) {
      rightY += 4;
      doc.moveTo(rightColX, rightY).lineTo(rightColX + rightColWidth, rightY)
         .strokeColor(layout.colors.gold).lineWidth(0.8).stroke();
      rightY += 6;
      doc.font('Helvetica-Bold').fontSize(8).fillColor(layout.colors.primary);
      doc.text('Gesamtstärke', rightColX + 8, rightY, { width: rightColWidth - 70, lineBreak: false });
      doc.text(`${totalThickness.toFixed(1).replace('.', ',')} mm`, rightColX + rightColWidth - 65, rightY, {
        width: 60, align: 'right', lineBreak: false
      });
      rightY += 15;
    }

    // === QUALITÄTSMERKMALE TABELLE ===
    rightY += 12;
    doc.moveTo(rightColX, rightY).lineTo(rightColX + rightColWidth, rightY)
       .strokeColor(layout.colors.secondary).lineWidth(0.5).stroke();
    rightY += 10;

    const qualityItems = layout.extractQualityItems(component, categoryTitle);

    doc.font('Helvetica').fontSize(8);
    qualityItems.forEach(item => {
      doc.fillColor(layout.colors.text).text(item.label, rightColX, rightY, { lineBreak: false });
      if (item.highlight) {
        doc.font('Helvetica-Bold').fillColor(layout.colors.gold);
      } else {
        doc.font('Helvetica').fillColor(layout.colors.primary);
      }
      doc.text(item.value, rightColX + rightColWidth - 100, rightY, { width: 100, align: 'right', lineBreak: false });
      doc.font('Helvetica');
      rightY += 14;
    });

    // === PREMIUM-FEATURES BOX (volle Breite) ===
    y = Math.max(y + imgHeight + 20, rightY + 20);

    if (component.premiumFeatures && component.premiumFeatures.length > 0) {
      const featColWidth = (contentWidth - 24) / 2;
      const features = component.premiumFeatures.slice(0, 4);
      const featRows = Math.ceil(features.length / 2);

      // Höhe pro Zeile berechnen (inkl. möglichem Umbruch)
      doc.font('Helvetica').fontSize(7.5);
      let maxRowHeights = [];
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

      doc.font('Helvetica-Bold').fontSize(9).fillColor(layout.colors.primary);
      doc.text('Ihre Vorteile bei Lehner Haus:', marginLeft + 12, y + 8);

      let featY = y + 26;
      features.forEach((feature, idx) => {
        const row = Math.floor(idx / 2);
        const colX = idx % 2 === 0 ? marginLeft + 12 : marginLeft + 12 + featColWidth;
        const rowY = featY + maxRowHeights.slice(0, row).reduce((a, b) => a + b, 0);

        doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.gold);
        doc.text('✓', colX, rowY, { lineBreak: false });
        doc.fillColor(layout.colors.text);
        doc.text(feature, colX + 10, rowY, { width: featColWidth - 25 });
      });

      y += boxHeight + 12;
    }

    // === VORTEILE-LISTE (kompakt) ===
    if (component.advantages && component.advantages.length > 0 && y < 610) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(layout.colors.primary);
      doc.text('Weitere Vorteile:', marginLeft, y);
      y += 16;

      const advColWidth = contentWidth / 2;
      const advGap = 6;
      component.advantages.slice(0, 6).forEach((adv, idx) => {
        const colX = idx % 2 === 0 ? marginLeft : marginLeft + advColWidth;
        const rowY = y + Math.floor(idx / 2) * (14 + advGap);

        doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.gold);
        doc.text('•', colX, rowY, { lineBreak: false });
        doc.fillColor(layout.colors.textLight);
        doc.text(adv, colX + 8, rowY, { width: advColWidth - 15 });
      });

      y += Math.ceil(Math.min(6, component.advantages.length) / 2) * (14 + advGap) + 8;
    }

    // === VERGLEICHS-HINWEIS BOX (wenn Platz) ===
    if (component.comparisonNotes && y < 690) {
      const remainingHeight = 775 - y;
      const boxHeight = Math.min(remainingHeight, 130);

      doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 4)
         .strokeColor(layout.colors.gold).lineWidth(1.5).stroke();
      doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 4).fill('#fffef5');

      doc.font('Helvetica-Bold').fontSize(8).fillColor(layout.colors.gold);
      doc.text('Tipp für den Anbietervergleich:', marginLeft + 10, y + 10);

      // Relevante Tipps extrahieren
      const tips = component.comparisonNotes
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/❗|KRITISCHE FRAGEN.*:/g, '').trim())
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
