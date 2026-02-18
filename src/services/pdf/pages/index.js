const catalogService = require('../../catalogService');
const titlePage = require('./titlePage');
const qdfCertification = require('./qdfCertification');
const executiveSummary = require('./executiveSummary');
const leistungsuebersicht = require('./leistungsuebersicht');
const qualityAdvantages = require('./qualityAdvantages');
const serviceContent = require('./serviceContent');
const { renderComponent } = require('./componentPage');
const { renderHaustyp } = require('./haustypPage');
const floorPlan = require('./floorPlan');
const eigenleistungen = require('./eigenleistungen');
const comparisonChecklist = require('./comparisonChecklist');
const glossary = require('./glossary');
const beraterPage = require('./beraterPage');
const contactPage = require('./contactPage');

function buildPageList(submission) {
  const pages = [
    titlePage,
    qdfCertification,
    executiveSummary,
    leistungsuebersicht,
    qualityAdvantages,
    serviceContent,
  ];

  // Dynamic component pages (same order as current generatePDF)
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

  // Convert component data into page entries
  for (const comp of components) {
    if (comp.data) {
      pages.push({
        title: comp.title,
        condition: () => true,
        render: (doc, submission, ctx) => {
          console.log(`[PDF] Adding page ${ctx.pageNum}: ${comp.title} (${comp.chapter})`);
          if (comp.isHaustyp) {
            return renderHaustyp(doc, comp.data, ctx);
          } else {
            return renderComponent(doc, comp.data, comp.title, comp.chapter, ctx);
          }
        }
      });
    } else {
      console.log(`[PDF] SKIPPED: ${comp.title} - no data`);
    }
  }

  // Post-component pages
  pages.push(floorPlan);
  pages.push(eigenleistungen);
  pages.push(comparisonChecklist);
  pages.push(glossary);
  pages.push(beraterPage);
  pages.push(contactPage);

  return pages;
}

module.exports = { buildPageList };
