const layout = require('../layout');

module.exports = {
  title: 'Ihre Konfiguration auf einen Blick',

  condition(submission) {
    return true;
  },

  render(doc, submission, ctx) {
    const catalogService = ctx.catalogService;
    let y = 100;
    const { marginLeft, contentWidth } = layout.layout;

    // ─── BAUHERR SECTION (full-width card) ────────────────────────────
    const cardHeight = 55;
    const cardPadding = 14;

    // Background card
    doc.roundedRect(marginLeft, y, contentWidth, cardHeight, 4)
      .fill(layout.colors.grayLight);

    // Gold left accent bar
    doc.rect(marginLeft, y, 3, cardHeight)
      .fill(layout.colors.gold);

    // Bauherr name
    const nameText = `${submission.bauherr_vorname || ''} ${submission.bauherr_nachname || ''}`.trim() || '-';
    doc.font('Heading').fontSize(14).fillColor(layout.colors.primary);
    doc.text(nameText, marginLeft + cardPadding, y + 10, { lineBreak: false });

    // Metadata chips row
    const kfwText = submission.kfw_standard === 'KFW55' ? 'KfW 55' : 'KfW 40';
    const grundstueckText = layout.getGrundstueckText(submission.grundstueck);

    const chips = [
      `${submission.personenanzahl || '-'} Personen`,
      kfwText,
      `Grundst.: ${grundstueckText}`
    ];

    // Add formatted date if timestamp exists
    if (submission.timestamp) {
      const date = new Date(submission.timestamp);
      const formattedDate = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      chips.push(formattedDate);
    }

    const chipsText = chips.join('  |  ');
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.textMuted);
    doc.text(chipsText, marginLeft + cardPadding, y + 32, { lineBreak: false });

    y += cardHeight + 20;

    // ─── COMPONENT GRID (3x3) ─────────────────────────────────────────
    const haustyp = catalogService.getVariantById('haustypen', submission.haustyp);
    const wall = catalogService.getVariantById('walls', submission.wall);
    const innerwall = catalogService.getVariantById('innerwalls', submission.innerwall);
    const windowData = catalogService.getVariantById('windows', submission.window);
    const tiles = catalogService.getVariantById('tiles', submission.tiles);
    const dach = catalogService.getVariantById('daecher', submission.dach);
    const heizung = catalogService.getVariantById('heizung', submission.heizung);
    const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);
    const treppe = catalogService.getVariantById('treppen', submission.treppe);

    const keyFacts = [
      { label: 'Haustyp', value: haustyp?.name || '-' },
      { label: 'Aussenwand', value: wall?.name || '-' },
      { label: 'Innenwand', value: innerwall?.name || '-' },
      { label: 'Fenster', value: windowData?.name || '-' },
      { label: 'Dacheindeckung', value: tiles?.name || '-' },
      { label: 'Dachform', value: dach?.name || '-' },
      { label: 'Heizung', value: heizung?.name || '-' },
      { label: 'Lueftung', value: lueftung?.name || 'Keine' },
      { label: 'Treppe', value: treppe?.name || 'Keine' }
    ];

    const cols = 3;
    const gap = 12;
    const cellWidth = Math.floor((contentWidth - (cols - 1) * gap) / cols);
    const cellHeight = 70;
    const rowGap = 10;

    for (let i = 0; i < keyFacts.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = marginLeft + col * (cellWidth + gap);
      const cy = y + row * (cellHeight + rowGap);

      // Cell background
      doc.roundedRect(cx, cy, cellWidth, cellHeight, 4)
        .fill(layout.colors.grayLight);

      // Gold left accent bar
      doc.rect(cx, cy, 3, cellHeight)
        .fill(layout.colors.gold);

      // Label (category name)
      doc.font('Helvetica').fontSize(7).fillColor(layout.colors.textMuted);
      doc.text(keyFacts[i].label, cx + 12, cy + 10, {
        width: cellWidth - 20,
        lineBreak: false
      });

      // Value (component name)
      doc.font('Helvetica-Bold').fontSize(9).fillColor(layout.colors.primary);
      doc.text(keyFacts[i].value, cx + 12, cy + 26, {
        width: cellWidth - 20
      });
    }

    // Advance y past the 3x3 grid
    y += 3 * (cellHeight + rowGap) + 15;

    // ─── TECHNICAL HIGHLIGHTS (optional) ──────────────────────────────
    if (y < 700) {
      const techSpecs = [];

      if (wall?.technicalDetails?.uValue) {
        techSpecs.push({ label: 'U-Wert Wand', value: wall.technicalDetails.uValue });
      }
      if (windowData?.technicalDetails?.ugValue) {
        techSpecs.push({ label: 'U-Wert Fenster', value: windowData.technicalDetails.ugValue });
      }
      if (heizung?.technicalDetails?.jaz) {
        techSpecs.push({ label: 'JAZ Heizung', value: heizung.technicalDetails.jaz });
      }
      if (lueftung?.technicalDetails?.heatRecovery) {
        techSpecs.push({ label: 'WRG', value: lueftung.technicalDetails.heatRecovery });
      }

      if (techSpecs.length > 0) {
        const barHeight = 30;

        // Background bar
        doc.roundedRect(marginLeft, y, contentWidth, barHeight, 4)
          .fill(layout.colors.grayLight);

        // Build spec text with alternating label/value styling
        let textX = marginLeft + 12;
        const textY = y + 10;

        for (let i = 0; i < techSpecs.length; i++) {
          const spec = techSpecs[i];

          // Label
          doc.font('Helvetica').fontSize(8).fillColor(layout.colors.textMuted);
          const labelWidth = doc.widthOfString(`${spec.label}: `);
          doc.text(`${spec.label}: `, textX, textY, { lineBreak: false });
          textX += labelWidth;

          // Value in gold
          doc.font('Helvetica-Bold').fontSize(8).fillColor(layout.colors.gold);
          const valueWidth = doc.widthOfString(spec.value);
          doc.text(spec.value, textX, textY, { lineBreak: false });
          textX += valueWidth;

          // Separator
          if (i < techSpecs.length - 1) {
            doc.font('Helvetica').fontSize(8).fillColor(layout.colors.textMuted);
            const sepWidth = doc.widthOfString('  |  ');
            doc.text('  |  ', textX, textY, { lineBreak: false });
            textX += sepWidth;
          }
        }
      }
    }
  }
};
