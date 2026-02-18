const path = require('path');
const fs = require('fs');
const layout = require('../layout');

const assetsDir = path.resolve(__dirname, '..', '..', '..', '..', 'assets');

module.exports = {
  title: null, // No header/footer for title page

  condition(submission) {
    return true;
  },

  async render(doc, submission, ctx) {
    const heroHeight = 500;

    // === RESOLVE HERO IMAGE ===
    let heroBuffer = null;
    try {
      // Try selected haustyp first
      const haustyp = ctx.catalogService.getVariantById('haustypen', submission.haustyp);
      let heroPath = null;

      if (haustyp && haustyp.filePath) {
        // filePath is like "assets/variants/haustypen/stadtvilla/" — resolve and look for 1.png
        const haustypDir = path.resolve(assetsDir, '..', haustyp.filePath);
        const candidate = path.join(haustypDir, '1.png');
        if (fs.existsSync(candidate)) {
          heroPath = candidate;
        }
      }

      // Fallback: first available haustyp directory
      if (!heroPath) {
        const haustypBase = path.join(assetsDir, 'variants', 'haustypen');
        const fallbackDirs = ['stadtvilla', 'familienhaus', 'bungalow', 'doppelhaus'];
        for (const dir of fallbackDirs) {
          const candidate = path.join(haustypBase, dir, '1.png');
          if (fs.existsSync(candidate)) {
            heroPath = candidate;
            break;
          }
        }
      }

      if (heroPath) {
        heroBuffer = await ctx.imageService.getCompressedImage(heroPath, 1200);
      }
    } catch (e) {
      console.warn('[PDF] Hero image error:', e.message);
      heroBuffer = null;
    }

    // === DRAW HERO AREA ===
    if (heroBuffer) {
      // Full-bleed hero image with clip
      doc.save();
      doc.rect(0, 0, 595, heroHeight).clip();
      doc.image(heroBuffer, 0, 0, { cover: [595, heroHeight], align: 'center', valign: 'center' });
      doc.restore();

      // Gradient overlay on bottom 70% of hero
      const grad = doc.linearGradient(0, heroHeight * 0.3, 0, heroHeight);
      grad.stop(0, layout.colors.primary, 0);
      grad.stop(0.6, layout.colors.primary, 0.5);
      grad.stop(1, layout.colors.primary, 0.9);
      doc.rect(0, heroHeight * 0.3, 595, heroHeight * 0.7).fill(grad);
    } else {
      // Solid color fallback
      doc.rect(0, 0, 595, heroHeight).fill(layout.colors.primary);
    }

    // === LOGO (small, top-left, on top of hero) ===
    try {
      const logoPath = path.resolve(__dirname, '..', '..', '..', '..', 'Logo', 'LehnerLogo_schwaebischgut.jpg');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = await ctx.imageService.getCompressedImage(logoPath, 500);
        if (logoBuffer) {
          doc.image(logoBuffer, 40, 30, { width: 120 });
        }
      }
    } catch (e) {
      // Logo failure is non-critical — skip silently
      console.warn('[PDF] Logo error on title page:', e.message);
    }

    // === TEXT ON GRADIENT OVERLAY ===
    doc.font('Heading').fontSize(26).fillColor(layout.colors.white);
    doc.text('Ihre persönliche', 0, heroHeight - 130, { width: 595, align: 'center' });

    doc.font('Heading').fontSize(32).fillColor(layout.colors.gold);
    doc.text('Leistungsbeschreibung', 0, heroHeight - 90, { width: 595, align: 'center' });

    // === BELOW HERO AREA (navy background) ===
    doc.rect(0, heroHeight, 595, 842 - heroHeight).fill(layout.colors.primary);

    // Customer name
    const anrede = submission.bauherr_anrede || 'Familie';
    doc.font('Heading').fontSize(22).fillColor(layout.colors.white);
    doc.text(`${anrede} ${submission.bauherr_nachname}`, 0, heroHeight + 50, { width: 595, align: 'center' });

    // Date
    const dateStr = new Date(submission.timestamp).toLocaleDateString('de-DE', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.font('Helvetica').fontSize(10).fillColor('#cccccc');
    doc.text(dateStr, 0, heroHeight + 90, { width: 595, align: 'center' });

    // Decorative gold line
    doc.moveTo(200, heroHeight + 130).lineTo(395, heroHeight + 130)
       .lineWidth(1.5).strokeColor(layout.colors.gold).stroke();

    // === FOOTER BAR ===
    doc.rect(0, 790, 595, 1.5).fill(layout.colors.gold);

    doc.font('Helvetica').fontSize(8).fillColor('#999999');
    doc.text('Lehner Haus GmbH \u00B7 Ihr Partner für individuelles Bauen seit über 60 Jahren', 0, 802, { width: 595, align: 'center' });
  }
};
