const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const catalogService = require('./catalogService');
const layout = require('./pdf/layout');

class PdfService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../output');
    this.assetsDir = path.join(__dirname, '../../assets');
    this.hasCustomFonts = false;
  }

  async ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generatePDF(submission) {
    await this.ensureOutputDir();

    const outputPath = path.join(this.outputDir, `Leistungsbeschreibung_${submission.id}.pdf`);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      autoFirstPage: false,
      bufferPages: false
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    let pageNum = 1;

    // Seite 1: Titel
    doc.addPage();
    this.drawTitlePage(doc, submission);

    // Seite 2: QDF-Zertifizierung (NEU)
    doc.addPage();
    pageNum++;
    layout.drawHeader(doc, 'QDF-Zertifizierte Qualität');
    this.drawQDFCertificationPage(doc);
    layout.drawFooter(doc, pageNum);

    // Seite 3: Executive Summary (Key Facts auf 1 Seite)
    doc.addPage();
    pageNum++;
    layout.drawHeader(doc, 'Ihre Konfiguration auf einen Blick');
    this.drawExecutiveSummary(doc, submission);
    layout.drawFooter(doc, pageNum);

    // Seite 4: Leistungsübersicht (Kompakt auf einer Seite)
    doc.addPage();
    pageNum++;
    layout.drawHeader(doc, 'Ihre Leistungen im Überblick');
    this.drawLeistungsuebersicht(doc, submission);
    layout.drawFooter(doc, pageNum);

    // Seite 5: Ihre 7 Qualitätsvorteile
    doc.addPage();
    pageNum++;
    layout.drawHeader(doc, 'Ihre 7 Qualitätsvorteile');
    this.drawQualityAdvantagesPage(doc);
    layout.drawFooter(doc, pageNum);

    // Seite 5: Service
    doc.addPage();
    pageNum++;
    layout.drawHeader(doc, 'Unser Service für Sie');
    this.drawServiceContent(doc);
    layout.drawFooter(doc, pageNum);

    // Komponenten-Seiten mit ELK-Style Kapitel-Nummerierung
    const innerwallData = catalogService.getVariantById('innerwalls', submission.innerwall);
    if (!innerwallData && submission.innerwall) {
      console.error('[PDF] ERROR: Innenwand not found:', submission.innerwall);
      console.error('[PDF] Available:', catalogService.getInnerwalls().map(iw => iw.id));
    }

    const components = [
      { title: 'Ihr Haustyp', data: catalogService.getVariantById('haustypen', submission.haustyp), chapter: '5.1', isHaustyp: true },
      { title: 'Außenwandsystem', data: catalogService.getVariantById('walls', submission.wall), chapter: '5.2' },
      { title: 'Innenwandsystem', data: innerwallData, chapter: '5.3' },
      { title: 'Deckensystem', data: catalogService.getVariantById('decken', submission.decke), chapter: '5.4' },
      { title: 'Fenstersystem', data: catalogService.getVariantById('windows', submission.window), chapter: '5.5' },
      { title: 'Dacheindeckung', data: catalogService.getVariantById('tiles', submission.tiles), chapter: '5.6' },
      { title: 'Dachform', data: catalogService.getVariantById('daecher', submission.dach), chapter: '5.7' },
      { title: 'Heizungssystem', data: catalogService.getVariantById('heizung', submission.heizung), chapter: '6.1' }
    ];

    // Treppe hinzufügen wenn gewählt (nicht 'keine')
    if (submission.treppe && submission.treppe !== 'keine') {
      const treppe = catalogService.getVariantById('treppen', submission.treppe);
      if (treppe && treppe.id !== 'keine') {
        components.push({ title: 'Treppensystem', data: treppe, chapter: '5.8' });
      }
    }

    // Lüftung hinzufügen wenn gewählt
    if (submission.lueftung && submission.lueftung !== 'keine') {
      const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);
      if (lueftung && lueftung.id !== 'keine') {
        components.push({ title: 'Lüftungssystem', data: lueftung, chapter: '6.2' });
      }
    }

    for (const comp of components) {
      if (comp.data) {
        console.log(`[PDF] Adding page ${pageNum + 1}: ${comp.title} (${comp.chapter})`);
        doc.addPage();
        pageNum++;
        layout.drawHeader(doc, comp.title);

        // Spezielle Seite für Haustyp (Flyer-Stil)
        if (comp.isHaustyp) {
          this.drawHaustypPage(doc, comp.data);
        } else {
          this.drawComponentContent(doc, comp.data, comp.title, comp.chapter);
        }

        layout.drawFooter(doc, pageNum);
      } else {
        console.log(`[PDF] SKIPPED: ${comp.title} - no data`);
      }
    }

    // Raumplanung (wenn Räume definiert)
    const hasRooms = (submission.rooms?.erdgeschoss?.length > 0) ||
                     (submission.rooms?.obergeschoss?.length > 0) ||
                     (submission.rooms?.untergeschoss?.length > 0);

    if (hasRooms) {
      doc.addPage();
      pageNum++;
      layout.drawHeader(doc, 'Ihre Raumplanung');
      this.drawFloorPlanPage(doc, submission);
      layout.drawFooter(doc, pageNum);
    }

    // Qualitäts-Checkliste Seite
    doc.addPage();
    pageNum++;
    layout.drawHeader(doc, 'Ihre Checkliste für den Anbietervergleich');
    this.drawComparisonChecklist(doc, submission);
    layout.drawFooter(doc, pageNum);

    // Glossar-Seite
    doc.addPage();
    pageNum++;
    layout.drawHeader(doc, 'Glossar – Fachbegriffe erklärt');
    this.drawGlossaryPage(doc);
    layout.drawFooter(doc, pageNum);

    // Fachberater-Seite (wenn ausgefüllt)
    const hasBerater = submission.berater_name || submission.berater_freitext;
    if (hasBerater) {
      doc.addPage();
      pageNum++;
      layout.drawHeader(doc, 'Ihr persönlicher Fachberater');
      this.drawBeraterPage(doc, submission);
      layout.drawFooter(doc, pageNum);
    }

    // Abschluss-Seite: Kontakt + QR-Codes
    doc.addPage();
    pageNum++;
    layout.drawHeader(doc, 'Kontakt');
    await this.drawContactPage(doc, submission);
    layout.drawFooter(doc, pageNum);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    });
  }

  drawTitlePage(doc, submission) {
    // Ruhiges, hochwertiges Deckblatt: viel Weißraum oben, dezenter grüner Bereich unten
    const splitY = 420;
    doc.rect(0, splitY, 595, 842 - splitY).fill(layout.colors.primary);

    // Lehner Haus Logo (zentriert im Weißraum)
    const logoPath = path.resolve(__dirname, '..', '..', 'Logo', 'LehnerLogo_schwaebischgut.jpg');
    console.log('[PDF] Logo-Pfad:', logoPath, '| Existiert:', fs.existsSync(logoPath));
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 172.5, 100, { width: 250 });
      } catch (e) {
        console.error('[PDF] Logo konnte nicht geladen werden:', e.message);
        doc.font(layout.typography.hero.font).fontSize(layout.typography.hero.size).fillColor(layout.colors.primary);
        doc.text('LEHNER HAUS', 0, 140, { width: 595, align: 'center' });
        doc.font('Helvetica').fontSize(18).fillColor(layout.colors.textMuted);
        doc.text('schwäbisch gut', 0, 195, { width: 595, align: 'center' });
      }
    } else {
      console.warn('[PDF] Logo-Datei nicht gefunden:', logoPath);
      doc.font(layout.typography.hero.font).fontSize(layout.typography.hero.size).fillColor(layout.colors.primary);
      doc.text('LEHNER HAUS', 0, 140, { width: 595, align: 'center' });
      doc.font('Helvetica').fontSize(18).fillColor(layout.colors.textMuted);
      doc.text('schwäbisch gut', 0, 195, { width: 595, align: 'center' });
    }

    // Dezente goldene Trennlinie
    doc.moveTo(180, splitY).lineTo(415, splitY).lineWidth(1.5).strokeColor(layout.colors.gold).stroke();

    // Untertitel im grünen Bereich
    doc.font('Helvetica-Bold').fontSize(26).fillColor(layout.colors.white);
    doc.text('Ihre persönliche', 0, splitY + 35, { width: 595, align: 'center' });

    doc.fontSize(32).fillColor(layout.colors.gold);
    doc.text('Leistungsbeschreibung', 0, splitY + 68, { width: 595, align: 'center' });

    // Bauherr-Name
    const anrede = submission.bauherr_anrede || 'Familie';
    doc.font('Helvetica-Bold').fontSize(20).fillColor(layout.colors.white);
    doc.text(`${anrede} ${submission.bauherr_nachname}`, 0, splitY + 140, { width: 595, align: 'center' });

    // Datum
    const dateStr = new Date(submission.timestamp).toLocaleDateString('de-DE', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.font('Helvetica').fontSize(10).fillColor('#cccccc');
    doc.text(dateStr, 0, splitY + 175, { width: 595, align: 'center' });

    // Footer Titelseite
    doc.rect(0, 790, 595, 1.5).fill(layout.colors.gold);

    doc.font('Helvetica').fontSize(8).fillColor('#999999');
    doc.text('Lehner Haus GmbH · Ihr Partner für individuelles Bauen seit über 60 Jahren', 0, 802, { width: 595, align: 'center' });
  }

  // NEU: QDF-Zertifizierung Seite
  drawQDFCertificationPage(doc) {
    let y = 95;

    // Gold highlight box
    doc.roundedRect(60, y, 475, 70, 8).fill(layout.colors.goldLight);
    doc.roundedRect(60, y, 475, 70, 8).stroke(layout.colors.gold);

    doc.font('Helvetica-Bold').fontSize(14).fillColor(layout.colors.primary);
    doc.text('QDF-Qualitätszertifikat 2026', 80, y + 15, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.textLight);
    doc.text('Lehner Haus ist Mitglied der Qualitätsgemeinschaft Deutscher Fertigbau (QDF)', 80, y + 35, { width: 430 });
    doc.text('und trägt das RAL-Gütezeichen für geprüfte Qualität.', 80, y + 48, { width: 430 });

    y += 95;

    // Intro
    doc.font('Helvetica').fontSize(11).fillColor(layout.colors.text);
    doc.text('Die QDF-Zertifizierung garantiert höchste Qualitätsstandards in Planung, Produktion und Ausführung. Als zertifiziertes Mitglied unterliegt Lehner Haus regelmäßigen Prüfungen durch unabhängige Institute.', 80, y, { width: 435, lineGap: 2 });

    y += 55;

    // 5 QDF-Vorteile
    doc.font('Helvetica-Bold').fontSize(13).fillColor(layout.colors.primary);
    doc.text('Ihre Vorteile durch QDF-Zertifizierung:', 80, y, { lineBreak: false });

    y += 28;

    const qdfVorteile = [
      ['Geprüfte Produktqualität', 'Alle Bauteile werden nach strengen QDF-Richtlinien produziert und geprüft'],
      ['Unabhängige Überwachung', 'Regelmäßige Kontrollen durch neutrale Prüfinstitute sichern konstante Qualität'],
      ['Transparente Bauprozesse', 'Dokumentierte Arbeitsabläufe für nachvollziehbare Qualitätssicherung'],
      ['Geschulte Fachkräfte', 'Fortlaufende Weiterbildung aller Mitarbeiter nach QDF-Standards'],
      ['Garantierte Bauqualität', 'RAL-Gütezeichen als Nachweis für geprüfte Fertigbauqualität']
    ];

    qdfVorteile.forEach(([title, desc]) => {
      // Gold checkmark circle
      doc.circle(90, y + 7, 8).fill(layout.colors.gold);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
      doc.text('✓', 86, y + 3, { lineBreak: false });

      doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.primary);
      doc.text(title, 108, y, { lineBreak: false });

      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.textLight);
      doc.text(desc, 108, y + 13, { width: 420, lineGap: 1 });

      y += 42;
    });

    y += 15;

    // Kernbotschaft Box
    doc.roundedRect(60, y, 475, 85, 8).fill(layout.colors.primary);

    doc.font('Helvetica-Bold').fontSize(12).fillColor(layout.colors.white);
    doc.text('Vertrauen Sie auf geprüfte Qualität', 80, y + 15, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.white);
    doc.text('Die QDF-Zertifizierung ist Ihr Qualitätsversprechen: Jedes Lehner Haus wird nach höchsten Standards geplant, produziert und errichtet. Das RAL-Gütezeichen bestätigt diese Qualität unabhängig.', 80, y + 38, { width: 415, lineGap: 2 });

    y += 85;

    // Zertifikatsnummer
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.textMuted);
    doc.text('QDF-Mitgliedsnummer: DE-QDF-2026-LH | RAL-Gütezeichen: RAL-GZ 422', 80, y, { lineBreak: false });
  }

  // NEU: 7 Qualitätsvorteile Seite (Card-Grid Layout)
  drawQualityAdvantagesPage(doc) {
    let y = 95;

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
    doc.text('Bei Lehner Haus erhalten Sie Premium-Qualität in jedem Detail:', 80, y, { width: 435 });

    y += 30;

    const vorteile = [
      { nr: '1', title: 'F90 Brandschutz', desc: 'Außenwände mit 90-minütigem Feuerwiderstand von außen' },
      { nr: '2', title: 'Diffusionsoffen', desc: 'Kontrollierte Feuchteregulierung, kein Schimmelrisiko' },
      { nr: '3', title: 'Kostensicherheit', desc: 'Klare Leistungen, definierte Qualitäten – keine „ab-Preise"' },
      { nr: '4', title: 'Familienunternehmen', desc: 'In dritter Generation – über 60 Jahre Erfahrung im Holzbau' },
      { nr: '5', title: 'QDF & RAL geprüft', desc: 'Zertifizierte Qualität, unabhängig überwacht' },
      { nr: '6', title: 'Transparenz', desc: 'Definierte Materialien, keine anonymen Preisgruppen' },
      { nr: '7', title: 'Festpreis-Garantie', desc: 'Echte Kostensicherheit ohne Interpretationsspielraum' }
    ];

    const cardWidth = 145;
    const cardHeight = 115;
    const gap = 18;
    const startX = 70;
    const cardsPerRow = 3;

    vorteile.forEach((vorteil, idx) => {
      const row = Math.floor(idx / cardsPerRow);
      const col = idx % cardsPerRow;
      const cx = startX + col * (cardWidth + gap);
      const cy = y + row * (cardHeight + gap);

      // Card Background
      doc.roundedRect(cx, cy, cardWidth, cardHeight, 8).fill('#f9f9f9');
      doc.roundedRect(cx, cy, cardWidth, cardHeight, 8)
         .strokeColor(layout.colors.gold).lineWidth(1).stroke();

      // Nummer-Badge (links oben)
      doc.circle(cx + 15, cy + 15, 12).fill(layout.colors.gold);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
      doc.text(vorteil.nr, cx + 10, cy + 9, { width: 10, align: 'center' });

      // Titel (keine Icons mehr)
      doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.primary);
      doc.text(vorteil.title, cx + 8, cy + 45, { width: cardWidth - 16, align: 'center' });

      // Beschreibung
      doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.textLight);
      doc.text(vorteil.desc, cx + 8, cy + 65, { width: cardWidth - 16, align: 'center', lineGap: 0.8 });
    });

    y += Math.ceil(vorteile.length / cardsPerRow) * (cardHeight + gap) + 15;

    // Callout Box
    doc.roundedRect(60, y, 475, 50, 8).fill(layout.colors.primaryDark);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.gold);
    doc.text('Fragen Sie bei anderen Anbietern gezielt nach diesen Punkten!', 80, y + 12, { lineBreak: false });

    doc.font('Helvetica').fontSize(8).fillColor(layout.colors.white);
    doc.text('Nicht alle diese Leistungen sind branchenüblich. Bei Lehner Haus sind sie Standard.', 80, y + 30, { lineBreak: false });
  }

  drawExecutiveSummary(doc, submission) {
    let y = 100;
    const { marginLeft, contentWidth } = layout.layout;

    // Key Facts Table
    doc.font(layout.typography.h2.font).fontSize(layout.typography.h2.size).fillColor(layout.colors.primary);
    doc.text('Ihre Hausdaten', marginLeft, y);
    y += 30;

    const haustyp = catalogService.getVariantById('haustypen', submission.haustyp);
    const kfw = submission.kfw_standard === 'KFW55' ? 'KfW 55' : 'KfW 40';

    const keyFacts = [
      ['Bauherr', `${submission.bauherr_vorname} ${submission.bauherr_nachname}`],
      ['Haustyp', haustyp?.name || '-'],
      ['Energiestandard', kfw],
      ['Personenzahl', `${submission.personenanzahl} Personen`],
      ['Grundstück', layout.getGrundstueckText(submission.grundstueck)]
    ];

    // Draw table
    const rowHeight = 22;
    keyFacts.forEach(([label, value]) => {
      // Alternating background
      if (keyFacts.indexOf([label, value]) % 2 === 0) {
        doc.rect(marginLeft, y - 3, contentWidth, rowHeight).fill(layout.colors.grayLight);
      }

      doc.font(layout.typography.body.font).fontSize(layout.typography.body.size).fillColor(layout.colors.text);
      doc.text(label, marginLeft + 10, y, { width: 150, lineBreak: false });
      doc.font(layout.typography.body.font).fillColor(layout.colors.textLight);
      doc.text(value, marginLeft + 170, y, { width: contentWidth - 180, lineBreak: false });
      y += rowHeight;
    });

    // Components Summary
    y += layout.layout.sectionGap;
    doc.font(layout.typography.h2.font).fontSize(layout.typography.h2.size).fillColor(layout.colors.primary);
    doc.text('Gewählte Komponenten', marginLeft, y);
    y += 25;

    const wall = catalogService.getVariantById('walls', submission.wall);
    const innerwall = catalogService.getVariantById('innerwalls', submission.innerwall);
    const decke = catalogService.getVariantById('decken', submission.decke);
    const windowData = catalogService.getVariantById('windows', submission.window);
    const tiles = catalogService.getVariantById('tiles', submission.tiles);
    const dach = catalogService.getVariantById('daecher', submission.dach);
    const heizung = catalogService.getVariantById('heizung', submission.heizung);
    const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);
    const treppe = catalogService.getVariantById('treppen', submission.treppe);

    const components = [
      ['Außenwand', wall?.name, wall?.technicalDetails?.uValue ? 'U-Wert: ' + wall.technicalDetails.uValue : ''],
      ['Innenwand', innerwall?.name, innerwall?.technicalDetails?.soundInsulation],
      ['Decke', decke?.name, ''],
      ['Fenster', windowData?.name, windowData?.technicalDetails?.ugValue ? 'U-Wert: ' + windowData.technicalDetails.ugValue : ''],
      ['Dach', tiles?.name, ''],
      ['Dachform', dach?.name, ''],
      ['Heizung', heizung?.name, heizung?.technicalDetails?.jaz ? 'JAZ ' + heizung.technicalDetails.jaz : '']
    ];

    if (treppe && treppe.id !== 'keine') {
      components.push(['Treppe', treppe?.name, '']);
    }

    if (lueftung && lueftung.id !== 'keine') {
      components.push(['Lüftung', lueftung.name, lueftung.technicalDetails?.heatRecovery]);
    }

    components.forEach(([label, name, spec]) => {
      if (components.indexOf([label, name, spec]) % 2 === 1) {
        doc.rect(marginLeft, y - 3, contentWidth, rowHeight).fill(layout.colors.grayLight);
      }

      doc.font(layout.typography.body.font).fontSize(layout.typography.body.size).fillColor(layout.colors.textMuted);
      doc.text(label, marginLeft + 10, y, { width: 100, lineBreak: false });
      doc.fillColor(layout.colors.text);
      doc.text(name || '-', marginLeft + 120, y, { width: 220, lineBreak: false });
      doc.font(layout.typography.small.font).fontSize(layout.typography.small.size).fillColor(layout.colors.gold);
      doc.text(spec || '', marginLeft + 350, y, { width: contentWidth - 360, align: 'right' });
      y += rowHeight;
    });

    // CTA-Box entfernt (Dokument wird als Zwischenschritt nach Bedarfsanalyse genutzt)
  }

  // NEU: Kompakte Leistungsübersicht auf einer Seite
  drawLeistungsuebersicht(doc, submission) {
    let y = 95;
    const { marginLeft, contentWidth } = layout.layout;

    // Dynamische Werte aus Submission
    const windowData = catalogService.getVariantById('windows', submission.window);
    const heizung = catalogService.getVariantById('heizung', submission.heizung);
    const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);

    // Fenster-Beschreibung dynamisch
    const fensterText = windowData ? windowData.name : '3-fach verglaste Kunststofffenster';
    // Heizung dynamisch
    const heizungText = heizung ? heizung.name : 'Luft-Wasser-Wärmepumpe';
    // Lüftung dynamisch
    const hasLueftung = lueftung && lueftung.id !== 'keine';
    const lueftungText = hasLueftung ? lueftung.name : null;

    // 3-Spalten Layout
    const colWidth = 155;
    const colGap = 10;
    const col1X = marginLeft;
    const col2X = marginLeft + colWidth + colGap;
    const col3X = marginLeft + 2 * (colWidth + colGap);

    // === SPALTE 1: PLANUNG ===
    doc.roundedRect(col1X, y, colWidth, 22, 4).fill(layout.colors.primary);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
    doc.text('Planung & Service', col1X + 8, y + 6);

    let y1 = y + 30;
    const planungItems = [
      'Feste kompetente Ansprechpartner',
      'Vor-Ort Bemusterung',
      'Bauleitung',
      'Energieberater (EnEV)',
      'Energieausweis',
      'KfW-Bestätigung'
    ];

    doc.font('Helvetica').fontSize(7.5).fillColor(layout.colors.text);
    planungItems.forEach(item => {
      doc.fillColor(layout.colors.gold).text('•', col1X + 3, y1, { lineBreak: false });
      doc.fillColor(layout.colors.text).text(item, col1X + 12, y1, { width: colWidth - 15 });
      y1 += 11;
    });

    // === SPALTE 2: ROHBAU ===
    doc.roundedRect(col2X, y, colWidth, 22, 4).fill(layout.colors.primary);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
    doc.text('Rohbau', col2X + 8, y + 6);

    let y2 = y + 30;
    const rohbauItems = [
      'Gerüst & Kran',
      'Transport',
      'Geschlossene Gebäudehülle',
      'Außenputz',
      'Decke',
      'Innenwände geschlossen',
      'Dach mit Eindeckung',
      'Dachüberstände gestrichen',
      '3-fach verglaste Fenster nach Wahl',
      'Haustür (Dreifachverriegelung)',
      'Alu-Rollläden',
      'Alu-Außenfensterbänke',
      'Dachrinnen & Fallrohre (Titanzink)'
    ];

    doc.font('Helvetica').fontSize(7.5);
    rohbauItems.forEach(item => {
      doc.fillColor(layout.colors.gold).text('•', col2X + 3, y2, { lineBreak: false });
      doc.fillColor(layout.colors.text).text(item, col2X + 12, y2, { width: colWidth - 15 });
      y2 += 11;
    });

    // === SPALTE 3: AUSBAU ===
    doc.roundedRect(col3X, y, colWidth, 22, 4).fill(layout.colors.primary);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
    doc.text('Bezugsfertiger Ausbau', col3X + 8, y + 6);

    let y3 = y + 30;
    const ausbauItems = [
      'Estrich mit Fußbodenheizung',
      'Blower-Door-Test',
      'Komplette Elektroinstallation inkl. Zählerschrank'
    ];

    // Lüftung nur wenn gewählt
    if (lueftungText) {
      ausbauItems.push(lueftungText);
    }

    // Innenausbau
    ausbauItems.push(
      'Fliesen',
      'Sanitärobjekte von Markenherstellern',
      'Laminat oder Parkett',
      'Malerarbeiten (weiß streichen)',
      'Innentüren',
      'Sanitärinstallation'
    );

    doc.font('Helvetica').fontSize(7.5);
    ausbauItems.forEach(item => {
      doc.fillColor(layout.colors.gold).text('•', col3X + 3, y3, { lineBreak: false });
      doc.fillColor(layout.colors.text).text(item, col3X + 12, y3, { width: colWidth - 15 });
      y3 += 11;
    });

    // Maximale Y-Position für Box unten
    const maxY = Math.max(y1, y2, y3) + 15;

    // === HIGHLIGHT BOX: Gewählte Komponenten ===
    doc.roundedRect(marginLeft, maxY, contentWidth, 100, 8).fill(layout.colors.goldLight);
    doc.rect(marginLeft, maxY, 4, 100).fill(layout.colors.gold);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.primary);
    doc.text('Ihre zusätzlich gewählten Ausstattungsmerkmale:', marginLeft + 15, maxY + 10);

    const wall = catalogService.getVariantById('walls', submission.wall);
    const innerwall = catalogService.getVariantById('innerwalls', submission.innerwall);
    const decke = catalogService.getVariantById('decken', submission.decke);
    const tiles = catalogService.getVariantById('tiles', submission.tiles);
    const dach = catalogService.getVariantById('daecher', submission.dach);
    const treppe = catalogService.getVariantById('treppen', submission.treppe);

    const highlights = [
      wall ? `Außenwand: ${wall.name}` : null,
      innerwall ? `Innenwand: ${innerwall.name}` : null,
      decke ? `Decke: ${decke.name}` : null,
      windowData ? `Fenster: ${windowData.name}` : null,
      tiles ? `Dacheindeckung: ${tiles.name}` : null,
      dach ? `Dachform: ${dach.name}` : null,
      heizung ? `Heizung: ${heizung.name}` : null,
      (treppe && treppe.id !== 'keine') ? `Treppe: ${treppe.name}` : null,
      hasLueftung ? `Lüftung: ${lueftungText}` : null
    ].filter(Boolean);

    doc.font('Helvetica').fontSize(8).fillColor(layout.colors.text);
    let hx = marginLeft + 15;
    let hy = maxY + 28;
    const colHalfWidth = contentWidth / 2 - 20;

    highlights.forEach((h, i) => {
      const isRightCol = i >= Math.ceil(highlights.length / 2);
      const xPos = isRightCol ? marginLeft + contentWidth / 2 : marginLeft + 15;
      const yPos = isRightCol ? maxY + 28 + (i - Math.ceil(highlights.length / 2)) * 13 : maxY + 28 + i * 13;

      doc.fillColor(layout.colors.gold).text('✓', xPos, yPos, { lineBreak: false });
      doc.fillColor(layout.colors.text).text(h, xPos + 12, yPos, { width: colHalfWidth });
    });

    // === FOOTER BOX ===
    const footerY = maxY + 115;
    doc.roundedRect(marginLeft, footerY, contentWidth, 40, 6).fill(layout.colors.primary);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(layout.colors.white);
    doc.text('Alle Leistungen inklusive - keine versteckten Kosten!', marginLeft + 15, footerY + 10);

    doc.font('Helvetica').fontSize(8).fillColor(layout.colors.white);
    doc.text('Festpreis-Garantie von Lehner Haus: Ihr Preis steht von Anfang an fest.', marginLeft + 15, footerY + 24);
  }

  drawOverviewContent(doc, submission) {
    const haustyp = catalogService.getVariantById('haustypen', submission.haustyp);
    const kfw = submission.kfw_standard === 'KFW55' ? 'KfW 55' : 'KfW 40';

    let y = 100;

    // Bauherr-Daten
    const lines = [
      ['Bauherr:', `${submission.bauherr_vorname} ${submission.bauherr_nachname}`],
      ['E-Mail:', submission.bauherr_email || '-'],
      ['Telefon:', submission.bauherr_telefon || '-'],
      ['Haustyp:', haustyp?.name || '-'],
      ['Energiestandard:', kfw],
      ['Personenanzahl:', `${submission.personenanzahl} Personen`],
      ['Grundstück:', layout.getGrundstueckText(submission.grundstueck)]
    ];

    lines.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').fontSize(11).fillColor(layout.colors.primary);
      doc.text(label, 80, y, { lineBreak: false });
      doc.font('Helvetica').fillColor(layout.colors.textLight);
      doc.text(value, 250, y, { lineBreak: false });
      y += 22;
    });

    // Komponenten-Liste
    y += 25;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(layout.colors.primary);
    doc.text('Ihre Komponenten:', 80, y, { lineBreak: false });
    y += 22;

        const wall = catalogService.getVariantById('walls', submission.wall);
    const innerwall = catalogService.getVariantById('innerwalls', submission.innerwall);
    const decke = catalogService.getVariantById('decken', submission.decke);
    const windowData = catalogService.getVariantById('windows', submission.window);
    const tiles = catalogService.getVariantById('tiles', submission.tiles);
    const dach = catalogService.getVariantById('daecher', submission.dach);
    const heizung = catalogService.getVariantById('heizung', submission.heizung);
    const lueftung = catalogService.getVariantById('lueftung', submission.lueftung);
    const treppe = catalogService.getVariantById('treppen', submission.treppe);

    const componentsList = [
      { label: 'Außenwand', data: wall },
      { label: 'Innenwand', data: innerwall },
      { label: 'Decke', data: decke },
      { label: 'Fenster', data: windowData },
      { label: 'Dacheindeckung', data: tiles },
      { label: 'Dachform', data: dach },
      { label: 'Heizung', data: heizung }
    ];

    // Treppe nur hinzufügen wenn nicht "keine"
    if (treppe && treppe.id !== 'keine') {
      componentsList.push({ label: 'Treppe', data: treppe });
    }

    // Lüftung nur hinzufügen wenn nicht "keine"
    if (lueftung && lueftung.id !== 'keine') {
      componentsList.push({ label: 'Lüftung', data: lueftung });
    }

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.textLight);
    componentsList.forEach(({ label, data }) => {
      if (data) {
        doc.font('Helvetica-Bold').fillColor(layout.colors.primary);
        doc.text(`${label}:`, 90, y, { continued: true });
        doc.font('Helvetica').fillColor(layout.colors.textLight);
        doc.text(` ${data.name}`, { lineBreak: false });
        y += 18;
      }
    });

    // Vorteile-Box with gold accent
    y += 30;
    doc.roundedRect(60, y, 475, 110, 8).fill(layout.colors.goldLight);
    doc.rect(60, y, 4, 110).fill(layout.colors.gold);

    doc.font('Helvetica-Bold').fontSize(12).fillColor(layout.colors.primary);
    doc.text('Ihre Vorteile mit Lehner Haus', 80, y + 15, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
    const vorteile = [
      'Festpreis-Garantie ohne versteckte Kosten',
      'Persönliche Betreuung bis zum Einzug',
      'Über 60 Jahre Erfahrung im Hausbau',
      'QDF-zertifizierte Qualität mit RAL-Gütezeichen',
      '5 Jahre Gewährleistung auf alle Bauleistungen'
    ];

    vorteile.forEach((v, i) => {
      doc.fillColor(layout.colors.gold).text('✓', 80, y + 38 + (i * 14), { lineBreak: false });
      doc.fillColor(layout.colors.text).text(v, 95, y + 38 + (i * 14), { lineBreak: false });
    });
  }

  drawServiceContent(doc) {
    let y = 100;

    doc.font('Helvetica').fontSize(11).fillColor(layout.colors.text);
    doc.text('Bei Lehner Haus erhalten Sie alles aus einer Hand – schwäbisch gut seit über 60 Jahren.', 80, y, { lineBreak: false });

    y = 130;

    const services = [
      ['Individuelle Planung', '100% freie Grundrissgestaltung – keine Katalog-Zwänge'],
      ['Budgetoptimierte Grundrisse', 'Optimale Raumaufteilung für jedes Budget'],
      ['Individuelle Ausbaustufen', 'Flexible Ausstattungsoptionen nach Ihren Wünschen'],
      ['Wohngesunde Materialien', 'ESB-Platten statt OSB – zertifiziert emissionsarm'],
      ['Premium-Ausstattung', 'Vaillant & Viessmann Wärmepumpen, Markenhersteller im Sanitärbereich, wie z. B. Laufen, Villeroy & Boch oder gleichwertig'],
      ['Kompletter Innenausbau', 'Elektroinstallation, Sanitärinstallation und Bodenbeläge – alles aus einer Hand'],
      ['Persönliche Projektbetreuung', 'Ihr Ansprechpartner von Planung bis Schlüsselübergabe'],
      ['Zugeschnittene Hausempfehlungen', 'Individuelle Beratung passend zu Ihren Bedürfnissen'],
      ['Festpreis-Garantie', 'Keine versteckten Kosten, keine bösen Überraschungen'],
      ['Kosten- und Terminsicherheit', 'Verbindliche Termine und transparente Kosten'],
      ['Nachhaltige Wertbeständigkeit', '40 Jahre Garantie auf die statische Grundkonstruktion des Lehner Hauses.'],
      ['Qualitätssicherung', 'QDF-zertifiziert mit RAL-Gütezeichen und Eigenüberwachung']
    ];

    services.forEach(([title, text]) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(layout.colors.primary);
      doc.text(title, 80, y, { lineBreak: false });
      doc.font('Helvetica').fontSize(8).fillColor(layout.colors.text);
      doc.text(text, 80, y + 11, { lineBreak: false });
      y += 28;
    });

    // Highlight-Box
    y += 15;
    doc.roundedRect(60, y, 475, 55, 8).fill(layout.colors.primary);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(layout.colors.white);
    doc.text('Seit 3 Generationen vertrauen uns über 5.000 Baufamilien.', 80, y + 12, { lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.white);
    doc.text('QDF-zertifiziert | RAL-Gütezeichen | Mitglied im BDF', 80, y + 32, { lineBreak: false });
  }

  drawComponentContent(doc, component, categoryTitle, chapterNumber) {
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
      path.join(__dirname, '../..', component.technicalDrawing) : null;
    const productImgPath = component.filePath ?
      path.join(__dirname, '../..', component.filePath) : null;

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

  // Spezielle Haustyp-Seite im Flyer-Stil
  drawHaustypPage(doc, component) {
    const marginLeft = 50;
    const contentWidth = 495;

    // === 3 BILDER nebeneinander (oben) ===
    // filePath zeigt auf den Unterordner, z.B. "assets/variants/haustypen/stadtvilla/"
    // Darin liegen 1.png, 2.png, 3.png
    const imgDir = component.filePath ? path.join(__dirname, '../..', component.filePath) : null;
    const imgWidth = Math.floor((contentWidth - 20) / 3);
    const imgHeight = 160;

    for (let i = 0; i < 3; i++) {
      const imgX = marginLeft + i * (imgWidth + 10);
      const imgFile = imgDir ? path.join(imgDir, `${i + 1}.png`) : null;

      if (imgFile && fs.existsSync(imgFile)) {
        try {
          // Clipping für gleiche Höhe bei allen Bildern
          doc.save();
          doc.rect(imgX, 95, imgWidth, imgHeight).clip();
          doc.image(imgFile, imgX, 95, { fit: [imgWidth, imgHeight], align: 'center', valign: 'center' });
          doc.restore();
        } catch (e) {
          doc.restore();
          layout.drawImagePlaceholder(doc, imgX, 95, imgWidth, imgHeight, 'Haustyp');
        }
      } else {
        layout.drawImagePlaceholder(doc, imgX, 95, imgWidth, imgHeight, 'Haustyp');
      }

      // "Beispielbilder" als echte Bildunterschrift direkt unter dem Bild
      doc.font('Helvetica').fontSize(7).fillColor(layout.colors.textMuted);
      doc.text('Beispielbilder', imgX, 95 + imgHeight + 2, { width: imgWidth, align: 'center' });
    }

    let y = 95 + imgHeight + 14;

    // Haustyp-Name
    doc.font('Helvetica-Bold').fontSize(22).fillColor(layout.colors.primary);
    doc.text(component.name, marginLeft, y, { width: contentWidth });

    y += 35;

    // === Beschreibung ===
    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
    const desc = component.details || component.description || '';
    doc.text(desc, marginLeft, y, { width: contentWidth, lineGap: 2 });

    y += 60;

    // === Vorteile Grid (2 Spalten) ===
    if (component.advantages && component.advantages.length > 0) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor(layout.colors.primary);
      doc.text('Ihre Vorteile mit diesem Haustyp:', marginLeft, y);
      y += 20;

      const colWidth = contentWidth / 2;
      component.advantages.forEach((adv, idx) => {
        const colX = idx % 2 === 0 ? marginLeft : marginLeft + colWidth;
        const rowY = y + Math.floor(idx / 2) * 18;

        doc.font('Helvetica').fontSize(9).fillColor(layout.colors.gold);
        doc.text('✓', colX, rowY, { lineBreak: false });
        doc.fillColor(layout.colors.text);
        doc.text(adv, colX + 12, rowY, { width: colWidth - 20 });
      });

      y += Math.ceil(component.advantages.length / 2) * 18 + 15;
    }

    // === Lehner Haus Qualitäts-Badge ===
    if (y < 700) {
      doc.roundedRect(marginLeft, y, contentWidth, 80, 6).fill(layout.colors.goldLight);
      doc.rect(marginLeft, y, 4, 80).fill(layout.colors.gold);

      doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.primary);
      doc.text('100% individuelle Grundrissgestaltung', marginLeft + 15, y + 10);

      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.text);
      doc.text('Bei Lehner Haus sind Sie nicht an Kataloggrundrisse gebunden.', marginLeft + 15, y + 28, { width: contentWidth - 30 });

      doc.font('Helvetica').fontSize(9).fillColor(layout.colors.text);
      doc.text('Ihr Traumhaus wird nach Ihren Wünschen geplant.', marginLeft + 15, y + 48, { width: contentWidth - 30 });
      doc.text('Schwäbisch gut seit über 60 Jahren.', marginLeft + 15, y + 60, { width: contentWidth - 30 });
    }
  }

  // NEU: U-Wert Bar-Chart Infografik
  drawUValueBarChart(doc, x, y, uValue, maxWidth) {
    const chartWidth = Math.min(200, maxWidth - 20);
    const barHeight = 12;
    const maxU = 0.50; // Skala bis 0,5 W/(m²K)

    doc.font('Helvetica-Bold').fontSize(8).fillColor(layout.colors.primary);
    doc.text('U-Wert-Vergleich:', x, y, { lineBreak: false });
    y += 14;

    // Ihr Wert (Gold)
    const uValueNum = parseFloat(uValue.toString().replace(',', '.'));
    const yourBar = Math.min(1, uValueNum / maxU) * chartWidth;

    doc.font('Helvetica').fontSize(7).fillColor(layout.colors.textMuted);
    doc.text(`Ihr Wert: ${uValue}`, x + 5, y + 2, { lineBreak: false });

    doc.rect(x + 5, y + 12, yourBar, barHeight).fill(layout.colors.gold);
    doc.font('Helvetica-Bold').fontSize(7).fillColor(layout.colors.gold);
    doc.text('★ Exzellent', x + 10 + yourBar, y + 14, { lineBreak: false });

    // Standard (0,24)
    y += 22;
    doc.font('Helvetica').fontSize(7).fillColor(layout.colors.textMuted);
    doc.text('Standard: 0,24', x + 5, y + 2, { lineBreak: false });
    const stdBar = (0.24 / maxU) * chartWidth;
    doc.rect(x + 5, y + 12, stdBar, barHeight).fill('#95a5a6');

    // Minimum (0,40)
    y += 22;
    doc.text('Minimum: 0,40', x + 5, y + 2, { lineBreak: false });
    const minBar = (0.40 / maxU) * chartWidth;
    doc.rect(x + 5, y + 12, minBar, barHeight).fill('#cccccc');

    return y + 28;
  }

  // NEU: SCOP-Gauge Infografik (Halbkreis)
  drawSCOPGauge(doc, x, y, scop) {
    const centerX = x + 100;
    const centerY = y + 55;
    const radius = 45;

    // Hintergrund-Bogen (Grau)
    doc.save();
    doc.arc(centerX, centerY, radius, Math.PI, 0, false)
       .lineWidth(8)
       .strokeColor('#e0e0e0')
       .stroke();

    // SCOP-Wert Bogen (Gold) - Max SCOP 6
    const scopNum = parseFloat(scop.toString().replace(',', '.'));
    const scopAngle = Math.PI * Math.min(1, scopNum / 6);
    doc.arc(centerX, centerY, radius, Math.PI, Math.PI + scopAngle, false)
       .lineWidth(8)
       .strokeColor(layout.colors.gold)
       .stroke();
    doc.restore();

    // SCOP-Wert in der Mitte
    doc.font('Helvetica-Bold').fontSize(16).fillColor(layout.colors.primary);
    doc.text(`SCOP ${scop}`, centerX - 28, centerY - 8, { width: 56, align: 'center' });

    // Sterne
    const stars = '★'.repeat(Math.min(5, Math.round(scopNum)));
    doc.fontSize(10).fillColor(layout.colors.gold);
    doc.text(stars, centerX - 28, centerY + 10, { width: 56, align: 'center' });

    // Label
    doc.font('Helvetica').fontSize(7).fillColor(layout.colors.textMuted);
    doc.text('Energieeffizienz: Exzellent', centerX - 45, centerY + 30, { width: 90, align: 'center' });

    return y + 110;
  }

  // NEU: QR-Code Generator
  async drawQRCode(doc, x, y, url, label) {
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

  async drawFinalContent(doc, submission) {
    let y = 100;

    doc.font('Helvetica').fontSize(11).fillColor(layout.colors.textLight);
    doc.text('Vielen Dank für Ihr Interesse an Lehner Haus.', 80, y, { lineBreak: false });

    y += 35;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(layout.colors.primary);
    doc.text('So geht es weiter:', 80, y, { lineBreak: false });

    y += 25;
    const steps = [
      'Persönliches Beratungsgespräch',
      'Besichtigung unserer Musterhäuser',
      'Detaillierte Kostenaufstellung',
      'Erstellung Ihres Angebots'
    ];

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.textLight);
    steps.forEach((step, i) => {
      doc.text(`${i + 1}. ${step}`, 90, y, { lineBreak: false });
      y += 18;
    });

    // NEU: Bedarfsanalyse-Box
    y += 25;
    doc.roundedRect(60, y, 475, 100, 8).fill(layout.colors.goldLight);
    doc.rect(60, y, 4, 100).fill(layout.colors.gold);

    doc.font('Helvetica-Bold').fontSize(13).fillColor(layout.colors.primary);
    doc.text('Ihr nächster Schritt: Persönliche Bedarfsanalyse', 80, y + 12, { lineBreak: false });

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
    doc.text('In einem persönlichen Gespräch erfassen wir gemeinsam:', 80, y + 32, { lineBreak: false });

    const bedarfsItems = [
      'Ihre Wünsche und Vorstellungen für Ihr Traumhaus',
      'Finanzielle Rahmenbedingungen und Fördermöglichkeiten',
      'Grundstückssituation und baurechtliche Gegebenheiten',
      'Zeitplanung und Ihre persönlichen Prioritäten'
    ];

    bedarfsItems.forEach((item, i) => {
      doc.fillColor(layout.colors.gold).text('•', 90, y + 48 + (i * 12), { lineBreak: false });
      doc.fillColor(layout.colors.text).text(item, 100, y + 48 + (i * 12), { lineBreak: false });
    });

    // Kontakt-Box (Berater oder Standard)
    y += 125;
    doc.roundedRect(60, y, 475, 90, 8).fill(layout.colors.primary);
    doc.rect(530, y + 10, 4, 70).fill(layout.colors.gold);

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

    // QR-Codes (3 nebeneinander)
    y += 110;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(layout.colors.primary);
    doc.text('Schnellzugriff:', 80, y, { lineBreak: false });

    y += 20;

    // QR-Code 1: Website
    await this.drawQRCode(doc, 100, y, 'https://www.lehner-haus.de', 'Website besuchen');

    // QR-Code 2: E-Mail
    await this.drawQRCode(doc, 220, y, 'mailto:info@lehner-haus.de', 'E-Mail senden');

    // QR-Code 3: Telefon
    await this.drawQRCode(doc, 340, y, 'tel:+497321096700', 'Anrufen');
  }

  async drawContactPage(doc, submission) {
    let y = 120;

    // Kontakt-Box
    doc.roundedRect(60, y, 475, 90, 8).fill(layout.colors.primary);
    doc.rect(530, y + 10, 4, 70).fill(layout.colors.gold);

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
    await this.drawQRCode(doc, 100, y, 'https://www.lehner-haus.de', 'Website besuchen');
    await this.drawQRCode(doc, 220, y, 'mailto:info@lehner-haus.de', 'E-Mail senden');
    await this.drawQRCode(doc, 340, y, 'tel:+497321096700', 'Anrufen');
  }

  drawComparisonChecklist(doc, submission) {
    let y = 95;

    doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
    doc.text('Nutzen Sie diese Checkliste, um unterschiedliche Hersteller objektiv zu vergleichen:', 80, y, { lineBreak: false });

    y += 25;

    // Dynamischer U-Wert Text mit Wandtyp-Bezeichnung
    const wall = submission ? catalogService.getVariantById('walls', submission.wall) : null;
    const uWertText = wall && wall.name
      ? `Exakter U-Wert? Lehner Haus: ${wall.technicalDetails?.uValue || '0,149 W/(m²K)'} (${wall.name}). Je niedriger, desto besser.`
      : 'Exakter U-Wert? Lehner Haus: 0,129 (Climativ-PLUS) bzw. 0,149 W/(m²K) (Climativ). Je niedriger, desto besser.';

    const checklistItems = [
      ['Doppelte Beplankung', 'Werden die Wände beidseitig doppelt beplankt? Lehner Haus: ja – für Stabilität und Schallschutz.'],
      ['Holzwerkstoffe', 'Wird ESB verwendet? ESB plus ist Blauer Engel zertifiziert, emissionsarm und empfohlen von der DGNB.'],
      ['U-Wert Außenwand', uWertText],
      ['Dämmstärke', 'Lehner Haus: bis zu 240 mm Mineralwolldämmung zzgl. 80 mm Holzfaserdämmplatte in der Außenwandkonstruktion.'],
      ['Fenster Ug-Wert', '3-fach Verglasung mit Ug 0,5 W/(m²K)? Lehner Haus: serienmäßig.'],
      ['Kältemittel', 'Natürliches Kältemittel R290? Lehner Haus: ja – zukunftssicher.'],
      ['Diffusionsoffen', 'Ist der Wandaufbau diffusionsoffen? Lehner Haus: ja – baubiologisch optimal.'],
      ['Qualitätszertifikat', 'QDF-Zertifizierung und RAL-Gütezeichen vorhanden? Lehner Haus: ja.'],
      ['Festpreis', 'Echte Festpreis-Garantie oder nur ein Circa-Preis? Bei Lehner Haus: Festpreisgarantie.']
    ];

    doc.font('Helvetica').fontSize(9);
    checklistItems.forEach(([topic, question], i) => {
      // Checkbox with gold border
      doc.rect(80, y, 10, 10).strokeColor(layout.colors.gold).lineWidth(1.5).stroke();

      doc.font('Helvetica-Bold').fillColor(layout.colors.primary);
      doc.text(topic + ':', 95, y, { lineBreak: false });

      doc.font('Helvetica').fillColor(layout.colors.text);
      doc.text(question, 200, y, { width: 340, lineGap: 1 });

      y += 22;
    });

    // Warnhinweis-Box
    y += 10;
    doc.roundedRect(60, y, 475, 80, 8).fill(layout.colors.errorLight);
    doc.rect(60, y, 4, 80).fill(layout.colors.error);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.error);
    doc.text('Vorsicht bei diesen Warnsignalen:', 80, y + 10, { lineBreak: false });

    doc.font('Helvetica').fontSize(8).fillColor(layout.colors.text);
    const warnings = [
      '• Extrem niedriger Preis ohne nachvollziehbare Kalkulation',
      '• Keine konkreten Antworten auf technische Fragen',
      '• Druck zum schnellen Vertragsabschluss',
      '• Keine QDF-Zertifizierung oder RAL-Gütezeichen'
    ];
    warnings.forEach((w, i) => {
      doc.text(w, 80, y + 25 + (i * 10), { lineBreak: false });
    });

    // Lehner Haus Box
    y += 85;
    doc.roundedRect(60, y, 475, 45, 8).fill(layout.colors.primary);
    doc.rect(530, y, 4, 45).fill(layout.colors.gold);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.white);
    doc.text('Bei Lehner Haus können Sie jeden dieser Punkte mit "Ja" beantworten.', 80, y + 12, { lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.white);
    doc.text('Überzeugen Sie sich selbst: Besuchen Sie uns im Musterhaus!', 80, y + 28, { lineBreak: false });
  }

  drawBeraterPage(doc, submission) {
    let y = 95;
    const marginLeft = 60;
    const contentWidth = 475;

    // Berater-Kontaktbox
    if (submission.berater_name) {
      doc.roundedRect(marginLeft, y, contentWidth, 80, 8).fill(layout.colors.primary);
      doc.rect(marginLeft + contentWidth - 4, y, 4, 80).fill(layout.colors.gold);

      doc.font('Helvetica-Bold').fontSize(14).fillColor(layout.colors.white);
      doc.text(submission.berater_name, marginLeft + 20, y + 15);

      let contactY = y + 38;
      if (submission.berater_telefon) {
        doc.font('Helvetica').fontSize(10).fillColor(layout.colors.white);
        doc.text(`Telefon: ${submission.berater_telefon}`, marginLeft + 20, contactY);
        contactY += 16;
      }
      if (submission.berater_email) {
        doc.font('Helvetica').fontSize(10).fillColor(layout.colors.white);
        doc.text(`E-Mail: ${submission.berater_email}`, marginLeft + 20, contactY);
      }

      y += 100;
    }

    // Freitext
    if (submission.berater_freitext) {
      const cleanFreitext = submission.berater_freitext.replace(/\r/g, '');
      doc.roundedRect(marginLeft, y, contentWidth, 0, 6).fill(layout.colors.goldLight);
      doc.rect(marginLeft, y, 4, 0).fill(layout.colors.gold);

      // Höhe dynamisch berechnen
      doc.font('Helvetica').fontSize(10);
      const textHeight = doc.heightOfString(cleanFreitext, { width: contentWidth - 40 });
      const boxHeight = textHeight + 40;

      doc.roundedRect(marginLeft, y, contentWidth, boxHeight, 6).fill(layout.colors.goldLight);
      doc.rect(marginLeft, y, 4, boxHeight).fill(layout.colors.gold);

      doc.font('Helvetica-Bold').fontSize(11).fillColor(layout.colors.primary);
      doc.text('Persönliche Nachricht:', marginLeft + 15, y + 12);

      doc.font('Helvetica').fontSize(10).fillColor(layout.colors.text);
      doc.text(cleanFreitext, marginLeft + 15, y + 30, { width: contentWidth - 30, lineGap: 2 });
    }
  }

  drawGlossaryPage(doc) {
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

  drawFloorPlanPage(doc, submission) {
    let y = 100;
    const marginLeft = 60;
    const contentWidth = 475;

    const rooms = submission.rooms || {};
    const floors = [
      { name: 'Erdgeschoss', rooms: rooms.erdgeschoss || [] },
      { name: 'Obergeschoss', rooms: rooms.obergeschoss || [] },
      { name: 'Untergeschoss (Partnerkeller oder bauseits)', rooms: rooms.untergeschoss || [] }
    ].filter(floor => floor.rooms.length > 0);

    if (floors.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(layout.colors.textMuted);
      doc.text('Keine Räume definiert', marginLeft, y);
      return;
    }

    floors.forEach((floor, floorIdx) => {
      if (floorIdx > 0) y += 25;

      // Geschoss-Header
      doc.roundedRect(marginLeft, y, contentWidth, 28, 4).fill(layout.colors.primary);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(layout.colors.white);
      doc.text(floor.name, marginLeft + 15, y + 8);
      y += 40;

      // Raum-Liste
      floor.rooms.forEach((room, idx) => {
        const roomName = room.name || `Raum ${idx + 1}`;

        doc.font('Helvetica').fontSize(10).fillColor(layout.colors.gold);
        doc.text('•', marginLeft + 10, y, { lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(10).fillColor(layout.colors.text);
        doc.text(roomName, marginLeft + 22, y, { lineBreak: false });
        if (room.details) {
          const nameWidth = doc.widthOfString(roomName, { font: 'Helvetica-Bold', fontSize: 10 });
          doc.font('Helvetica').fontSize(10).fillColor(layout.colors.textLight);
          doc.text(` \u2013 ${room.details}`, marginLeft + 22 + nameWidth, y, { width: contentWidth - nameWidth - 32 });
        }
        y += 18;
      });
    });

    // Hinweis
    y += 20;
    doc.roundedRect(marginLeft, y, contentWidth, 40, 6).fill(layout.colors.goldLight);
    doc.rect(marginLeft, y, 4, 40).fill(layout.colors.gold);
    doc.font('Helvetica').fontSize(9).fillColor(layout.colors.text);
    doc.text('Durch unsere freie Raumplanung können wir all Ihre Wünsche umsetzen. Bei Lehner Haus haben Sie 100 % freie Grundrissgestaltung.', marginLeft + 15, y + 12, { width: contentWidth - 30 });
  }

}

module.exports = new PdfService();
