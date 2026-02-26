const express = require('express');
const router = express.Router();
const submissionService = require('../services/submissionService');
const catalogService = require('../services/catalogService');

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await submissionService.getSubmission(id);

    if (!submission) {
      return res.status(404).send('Anfrage nicht gefunden');
    }

    // Look up all selected components from catalog
    const components = [];

    const lookups = [
      { key: 'haustyp', category: 'haustypen', label: 'Haustyp' },
      { key: 'wall', category: 'walls', label: 'Außenwandsystem' },
      { key: 'innerwall', category: 'innerwalls', label: 'Innenwandsystem' },
      { key: 'decke', category: 'decken', label: 'Deckensystem' },
      { key: 'window', category: 'windows', label: 'Fenstersystem' },
      { key: 'dach', category: 'daecher', label: 'Dachaufbau' },
      { key: 'tiles', category: 'tiles', label: 'Dacheindeckung' },
      { key: 'heizung', category: 'heizung', label: 'Heizungssystem' },
      { key: 'treppe', category: 'treppen', label: 'Treppensystem' },
      { key: 'lueftung', category: 'lueftung', label: 'Lüftungssystem' },
    ];

    for (const { key, category, label } of lookups) {
      const value = submission[key];
      if (!value || value === 'keine') continue;
      const data = catalogService.getVariantById(category, value);
      if (data) {
        components.push({ label, ...data });
      }
    }

    res.render('result', { submission, components });

  } catch (error) {
    console.error('Fehler beim Laden der Ergebnisseite:', error);
    res.status(500).send('Ein Fehler ist aufgetreten');
  }
});

module.exports = router;
