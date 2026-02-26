const layout = require('../layout');

module.exports = {
  title: 'Ihre Konfiguration auf einen Blick',

  condition(submission) {
    return true;
  },

  render(doc, submission, ctx) {
    const catalogService = ctx.catalogService;
    let y = 100;
    const marginLeft = 50;
    const contentWidth = 495;

    // ─── BAUHERR HEADER ─────────────────────────────────────────────
    const nameText = `${submission.bauherr_vorname || ''} ${submission.bauherr_nachname || ''}`.trim() || '-';
    doc.font('Heading').fontSize(16).fillColor(layout.colors.primary);
    doc.text(nameText, marginLeft, y);
    y += 22;

    // Metadata line
    const kfwText = submission.kfw_standard === 'KFW55' ? 'KfW 55' : 'KfW 40';
    const grundstueckText = layout.getGrundstueckText(submission.grundstueck);
    const chips = [
      `${submission.personenanzahl || '-'} Personen`,
      kfwText,
      `Grundstück: ${grundstueckText}`
    ];
    if (submission.timestamp) {
      const date = new Date(submission.timestamp);
      chips.push(date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    }
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.textMuted);
    doc.text(chips.join('   |   '), marginLeft, y);
    y += 18;

    // Separator line
    doc.moveTo(marginLeft, y).lineTo(marginLeft + contentWidth, y)
      .strokeColor('#cccccc').lineWidth(0.5).stroke();
    y += 20;

    // ─── COMPONENT TABLE ─────────────────────────────────────────────
    const haustyp = catalogService.getVariantById('haustypen', submission.haustyp);
    const wall = catalogService.getVariantById('walls', submission.wall);
    const innerwall = catalogService.getVariantById('innerwalls', submission.innerwall);
    const decke = catalogService.getVariantById('decken', submission.decke);
    const windowData = catalogService.getVariantById('windows', submission.window);
    const tiles = catalogService.getVariantById('tiles', submission.tiles);
    const dach = catalogService.getVariantById('daecher', submission.dach);
    const heizung = catalogService.getVariantById('heizung', submission.heizung);
    const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);
    const treppe = catalogService.getVariantById('treppen', submission.treppe);

    const rows = [
      { label: 'Haustyp', value: haustyp?.name || '-' },
      { label: 'Außenwand', value: wall?.name || '-' },
      { label: 'Innenwand', value: innerwall?.name || '-' },
      { label: 'Geschossdecke', value: decke?.name || '-' },
      { label: 'Fenster', value: windowData?.name || '-' },
      { label: 'Dacheindeckung', value: tiles?.name || '-' },
      { label: 'Dachaufbau', value: dach?.name || '-' },
      { label: 'Heizung', value: heizung?.name || '-' },
      { label: 'Lüftung', value: lueftung?.name || 'Keine' },
      { label: 'Treppe', value: treppe?.name || 'Keine' }
    ];

    // Table header
    doc.font('Heading-SemiBold').fontSize(8).fillColor(layout.colors.textMuted);
    doc.text('Kategorie', marginLeft + 12, y, { width: 140, lineBreak: false });
    doc.text('Ihre Auswahl', marginLeft + 160, y, { width: contentWidth - 160 });
    y += 14;

    // Header underline
    doc.moveTo(marginLeft, y).lineTo(marginLeft + contentWidth, y)
      .strokeColor(layout.colors.primary).lineWidth(0.5).stroke();
    y += 6;

    // Table rows with alternating background
    const rowHeight = 28;
    const labelWidth = 140;
    const valueX = marginLeft + 160;

    rows.forEach((row, idx) => {
      // Alternating row background
      if (idx % 2 === 0) {
        doc.rect(marginLeft, y, contentWidth, rowHeight).fill(layout.colors.grayLight);
      }

      const textY = y + 8;

      // Category label
      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.textMuted);
      doc.text(row.label, marginLeft + 12, textY, { width: labelWidth, lineBreak: false });

      // Component value
      doc.font('Helvetica-Bold').fontSize(9).fillColor(layout.colors.primary);
      doc.text(row.value, valueX, textY, { width: contentWidth - 170 });

      y += rowHeight;
    });

    // Bottom table line
    doc.moveTo(marginLeft, y).lineTo(marginLeft + contentWidth, y)
      .strokeColor(layout.colors.primary).lineWidth(0.5).stroke();
    y += 20;

    // ─── TECHNICAL HIGHLIGHTS ────────────────────────────────────────
    if (y < 700) {
      const techSpecs = [];

      if (wall?.technicalDetails?.uValue) {
        techSpecs.push({ label: 'U-Wert Wand', value: wall.technicalDetails.uValue });
      }
      if (windowData?.technicalDetails?.ugValue) {
        techSpecs.push({ label: 'U-Wert Fenster', value: windowData.technicalDetails.ugValue });
      }
      if (lueftung?.technicalDetails?.heatRecovery) {
        techSpecs.push({ label: 'WRG', value: lueftung.technicalDetails.heatRecovery });
      }

      if (techSpecs.length > 0) {
        doc.font('Heading-SemiBold').fontSize(9).fillColor(layout.colors.primary);
        doc.text('Technische Kennwerte', marginLeft, y);
        y += 16;

        let textX = marginLeft;

        for (let i = 0; i < techSpecs.length; i++) {
          const spec = techSpecs[i];

          // Label
          doc.font('Helvetica').fontSize(8.5).fillColor(layout.colors.textMuted);
          const labelW = doc.widthOfString(`${spec.label}: `);
          doc.text(`${spec.label}: `, textX, y, { lineBreak: false });
          textX += labelW;

          // Value
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(layout.colors.primary);
          const valueW = doc.widthOfString(spec.value);
          doc.text(spec.value, textX, y, { lineBreak: false });
          textX += valueW;

          // Separator
          if (i < techSpecs.length - 1) {
            doc.font('Helvetica').fontSize(8.5).fillColor(layout.colors.gray);
            const sepW = doc.widthOfString('    |    ');
            doc.text('    |    ', textX, y, { lineBreak: false });
            textX += sepW;
          }
        }
      }
    }
  }
};
