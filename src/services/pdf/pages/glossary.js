const layout = require('../layout');

module.exports = {
  title: 'Glossar – Fachbegriffe erklärt',

  condition(submission) {
    return true;
  },

  render(doc, submission, ctx) {
    let y = 95;
    const marginLeft = 60;
    const contentWidth = 475;

    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.textMuted);
    doc.text('Die wichtigsten Fachbegriffe aus Ihrer Leistungsbeschreibung im Überblick:', marginLeft, y, { width: contentWidth });
    y += 25;

    const glossarItems = [
      ['U-Wert', 'Wärmedurchgangskoeffizient – gibt an, wie viel Wärme durch ein Bauteil verloren geht. Je niedriger, desto besser die Dämmung. Einheit: W/(m²K).'],
      ['Ug-Wert', 'Wärmedurchgangskoeffizient der Verglasung (g = glazing). Beschreibt die Wärmedämmung des Glases. Je niedriger, desto weniger Wärmeverlust.'],
      ['KVH', 'Konstruktionsvollholz – technisch getrocknetes Vollholz für tragende Konstruktionen. Formstabil, maßhaltig und frei von Insektenbefall.'],
      ['LSH', 'Leimschichtholz – verleimtes Holz aus mehreren Schichten für besonders belastbare Konstruktionen.'],
      ['RC2', 'Resistance Class 2 – Sicherheitsklasse für Fenster und Türen. Bietet geprüften Einbruchschutz mit Pilzkopfverriegelung.'],
      ['F90', 'Feuerwiderstandsklasse – das Bauteil widersteht einem Brand mindestens 90 Minuten lang. Standard bei Lehner Haus.'],
      ['ESB', 'Elka Strong Board – Holzwerkstoffplatte aus frischem Fichtenholz. Wohngesund zertifiziert (Blauer Engel), geringe Emissionen.'],
      ['WLG / WLS', 'Wärmeleitgruppe / Wärmeleitstufe – Kennzahl für die Dämmeigenschaft eines Materials. Je niedriger die Zahl, desto besser die Dämmung.'],
      ['SCOP', 'Seasonal Coefficient of Performance – jahreszeitbezogene Effizienz einer Wärmepumpe. SCOP 5,0 bedeutet: aus 1 kWh Strom werden 5 kWh Wärme.'],
      ['R290', 'Natürliches Kältemittel (Propan) für Wärmepumpen. Klimafreundlich und zukunftssicher, da synthetische Kältemittel schrittweise verboten werden.'],
      ['WRG', 'Wärmerückgewinnung – Technologie in Lüftungsanlagen, die Wärme aus der Abluft zurückgewinnt und an die Frischluft überträgt.'],
      ['QDF', 'Qualitätsgemeinschaft Deutscher Fertigbau – unabhängiger Qualitätsverband mit strengen Prüfstandards für Fertighaushersteller.'],
      ['RAL', 'RAL-Gütezeichen – unabhängiges Qualitätssiegel, das regelmäßig durch neutrale Institute überprüft wird.'],
      ['dB(A)', 'Dezibel (A-bewertet) – Maßeinheit für Lautstärke. 35 dB(A) = Flüstern, 50 dB(A) = normales Gespräch.'],
      ['DGNB', 'Deutsche Gesellschaft für Nachhaltiges Bauen – vergibt Zertifikate für nachhaltiges und ressourcenschonendes Bauen.'],
      ['EnEV / GEG', 'Energieeinsparverordnung / Gebäudeenergiegesetz – gesetzliche Vorgaben für die energetische Qualität von Gebäuden.'],
      ['LCA', 'Lebenszyklusanalyse – bewertet die Umweltwirkungen eines Gebäudes über seinen gesamten Lebenszyklus.'],
      ['ECOSE', 'Bindemittel-Technologie von Knauf Insulation – formaldehydfrei, auf Basis natürlicher Rohstoffe. Wohngesünder als herkömmliche Mineralwolle.']
    ];

    const colWidth = contentWidth / 2 - 8;
    const itemsPerCol = Math.ceil(glossarItems.length / 2);

    glossarItems.forEach((item, idx) => {
      const col = idx < itemsPerCol ? 0 : 1;
      const row = col === 0 ? idx : idx - itemsPerCol;
      const x = marginLeft + col * (colWidth + 16);
      const rowY = y + row * 38;

      doc.font('Helvetica-Bold').fontSize(8).fillColor(layout.colors.primary);
      doc.text(item[0], x, rowY, { width: colWidth });
      doc.font('Helvetica').fontSize(7).fillColor(layout.colors.text);
      doc.text(item[1], x, rowY + 10, { width: colWidth, lineGap: 0.5 });
    });
  }
};
