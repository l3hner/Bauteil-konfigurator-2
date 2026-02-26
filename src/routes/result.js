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

    // Look up display names from catalog
    const haustypData = submission.haustyp ? catalogService.getVariantById('haustypen', submission.haustyp) : null;
    const dachData = submission.dach ? catalogService.getVariantById('daecher', submission.dach) : null;

    res.render('result', {
      submission,
      haustypName: haustypData ? haustypData.name : submission.haustyp,
      dachName: dachData ? dachData.name : submission.dach
    });

  } catch (error) {
    console.error('Fehler beim Laden der Ergebnisseite:', error);
    res.status(500).send('Ein Fehler ist aufgetreten');
  }
});

module.exports = router;
