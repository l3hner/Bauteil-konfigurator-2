const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const layout = require('./pdf/layout');
const { buildPageList } = require('./pdf/pages');
const catalogService = require('./catalogService');
const imageService = require('./imageService');

class PdfService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../output');
  }

  async ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generatePDF(submission) {
    await this.ensureOutputDir();
    const outputPath = path.join(this.outputDir, `Leistungsbeschreibung_${submission.id}.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false, bufferPages: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Register custom fonts with Helvetica fallback
    const fontsDir = path.resolve(__dirname, '../../assets/fonts');
    try {
      doc.registerFont('Heading', path.join(fontsDir, 'Montserrat-Bold.ttf'));
      doc.registerFont('Heading-SemiBold', path.join(fontsDir, 'Montserrat-SemiBold.ttf'));
      console.log('[PDF] Custom fonts registered: Montserrat');
    } catch (e) {
      console.warn('[PDF] Font fallback to Helvetica:', e.message);
      doc.registerFont('Heading', 'Helvetica-Bold');
      doc.registerFont('Heading-SemiBold', 'Helvetica-Bold');
    }

    const pages = buildPageList(submission);
    let pageNum = 0;
    const ctx = { pageNum: 0, catalogService, imageService };

    for (const page of pages) {
      if (!page.condition(submission)) continue;
      doc.addPage();
      pageNum++;
      ctx.pageNum = pageNum;
      if (page.title) layout.drawHeader(doc, page.title);
      await page.render(doc, submission, ctx);
      if (page.title) layout.drawFooter(doc, pageNum);
    }

    doc.end();
    imageService.clearCache();
    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    });
  }
}

module.exports = new PdfService();
