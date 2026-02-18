const express = require('express');
const router = express.Router();
const catalogService = require('../services/catalogService');
const submissionService = require('../services/submissionService');
const pdfService = require('../services/pdfService');

router.post('/', async (req, res) => {
  try {
    const formData = req.body;

    // Server-side required field validation
    const requiredFields = {
      bauherr_anrede: 'Anrede ist ein Pflichtfeld.',
      bauherr_vorname: 'Vorname ist ein Pflichtfeld.',
      bauherr_nachname: 'Nachname ist ein Pflichtfeld.',
      kfw_standard: 'Bitte wahlen Sie einen Energiestandard.',
      haustyp: 'Bitte wahlen Sie einen Haustyp.',
      wall: 'Bitte wahlen Sie ein Aussenwandsystem.',
      innerwall: 'Bitte wahlen Sie ein Innenwandsystem.',
      decke: 'Bitte wahlen Sie ein Deckensystem.',
      window: 'Bitte wahlen Sie ein Fenstersystem.',
      tiles: 'Bitte wahlen Sie eine Dacheindeckung.',
      dach: 'Bitte wahlen Sie eine Dachform.',
      treppe: 'Bitte wahlen Sie eine Treppenoption.',
      heizung: 'Bitte wahlen Sie ein Heizungssystem.',
      lueftung: 'Bitte wahlen Sie ein Luftungssystem.',
      personenanzahl: 'Bitte geben Sie die Personenanzahl an.',
      grundstueck: 'Bitte geben Sie den Grundstucksstatus an.'
    };

    const missingFields = [];
    for (const [field, message] of Object.entries(requiredFields)) {
      if (!formData[field] || !formData[field].toString().trim()) {
        missingFields.push({ field, message });
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Pflichtfelder fehlen',
        details: missingFields
      });
    }

    // Parse room data
    const rooms = submissionService.parseRoomData(formData);
    
    // Parse eigenleistungen
    const eigenleistungen = submissionService.parseEigenleistungen(formData);

    // Build submission object
    const submission = {
      // Bauherr data
      bauherr_anrede: formData.bauherr_anrede,
      bauherr_vorname: formData.bauherr_vorname,
      bauherr_nachname: formData.bauherr_nachname,
      bauherr_email: formData.bauherr_email,
      bauherr_telefon: formData.bauherr_telefon,

      // House configuration
      kfw_standard: formData.kfw_standard,
      haustyp: formData.haustyp,
      personenanzahl: parseInt(formData.personenanzahl) || 1,
      grundstueck: formData.grundstueck,

      // Building components
      wall: formData.wall,
      innerwall: formData.innerwall,
      decke: formData.decke,
      window: formData.window,
      tiles: formData.tiles,
      dach: formData.dach || null,
      heizung: formData.heizung,
      lueftung: formData.lueftung,
      treppe: formData.treppe || null,

      // Rooms and eigenleistungen
      rooms: rooms,
      eigenleistungen: eigenleistungen,

      // Fachberater (optional)
      berater_name: formData.berater_name || '',
      berater_telefon: formData.berater_telefon || '',
      berater_email: formData.berater_email || '',
      berater_freitext: formData.berater_freitext || ''
    };

    // Validate selection
    const validation = catalogService.validateSelection(submission);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Ungültige Auswahl',
        details: validation.errors
      });
    }

    // Save submission
    const { id, submission: savedSubmission } = await submissionService.saveSubmission(submission);

    // Generate PDF
    await pdfService.generatePDF(savedSubmission);

    // Redirect to result page
    res.redirect(`/result/${id}`);

  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    res.status(500).send('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
  }
});

module.exports = router;
