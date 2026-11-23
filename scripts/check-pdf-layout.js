// Rendert jede Bauteilvariante des Katalogs auf eine eigene PDF-Seite und meldet,
// wie weit die Seite gefüllt ist und ob Abschnitte nicht mehr gepasst haben.
// Aufruf:  node scripts/check-pdf-layout.js   → output/_layout-check.pdf
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const layout = require('../src/services/pdf/layout');
const catalogService = require('../src/services/catalogService');
const imageService = require('../src/services/imageService');
const { renderComponent } = require('../src/services/pdf/pages/componentPage');

const CATEGORIES = [
  ['walls', 'Außenwandsystem'],
  ['innerwalls', 'Innenwandsystem'],
  ['decken', 'Deckensystem'],
  ['windows', 'Fenstersystem'],
  ['tiles', 'Dacheindeckung'],
  ['daecher', 'Dachaufbau'],
  ['heizung', 'Heizungssystem'],
  ['treppen', 'Treppensystem'],
  ['lueftung', 'Lüftungssystem']
];

(async () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/catalog.json'), 'utf8'));
  const outPath = path.join(__dirname, '../output/_layout-check.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  const fontsDir = path.resolve(__dirname, '../assets/fonts');
  doc.registerFont('Heading', path.join(fontsDir, 'Montserrat-Bold.ttf'));
  doc.registerFont('Heading-SemiBold', path.join(fontsDir, 'Montserrat-SemiBold.ttf'));

  const ctx = { pageNum: 0, catalogService, imageService };
  let problems = 0;

  for (const [key, title] of CATEGORIES) {
    for (const item of catalog[key] || []) {
      if (item.id === 'keine') continue;
      doc.addPage();
      ctx.pageNum++;
      layout.drawHeader(doc, title);
      const { endY, dropped } = await renderComponent(doc, item, title, '', ctx);
      layout.drawFooter(doc, ctx.pageNum);
      const fill = Math.round(((endY - 95) / (775 - 95)) * 100);
      const flag = dropped.length ? `  !! FEHLT: ${dropped.join(', ')}` : '';
      if (dropped.length) problems++;
      console.log(`S.${String(ctx.pageNum).padStart(2)}  ${key.padEnd(10)} ${item.id.padEnd(28)} bis y=${endY} (${fill} %)${flag}`);
    }
  }

  doc.end();
  await new Promise(resolve => stream.on('finish', resolve));
  console.log(`\n${ctx.pageNum} Seiten → ${outPath}`);
  console.log(problems ? `${problems} Seite(n) mit abgeschnittenem Inhalt` : 'Kein Inhalt abgeschnitten.');
  process.exit(problems ? 1 : 0);
})();
