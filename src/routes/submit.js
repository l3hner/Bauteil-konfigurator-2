const express = require('express');
const router = express.Router();
const catalogService = require('../services/catalogService');
const submissionService = require('../services/submissionService');
const pdfService = require('../services/pdfService');
const logger = require('../utils/logger');

router.post('/', async (req, res) => {
  try {
    const formData = req.body;

    // CSRF token validation (double-submit cookie pattern)
    const cookieToken = req.cookies && req.cookies._csrf;
    const formToken = formData._csrf;
    if (!cookieToken || !formToken || cookieToken !== formToken) {
      return res.status(403).json({ error: 'Ungültiges CSRF-Token. Bitte laden Sie die Seite neu.' });
    }

    // Server-side required field validation (only contact data, KfW, persons, land)
    const requiredFields = {
      bauherr_anrede: 'Anrede ist ein Pflichtfeld.',
      bauherr_vorname: 'Vorname ist ein Pflichtfeld.',
      bauherr_nachname: 'Nachname ist ein Pflichtfeld.',
      kfw_standard: 'Bitte wählen Sie einen Energiestandard.',
      personenanzahl: 'Bitte geben Sie die Personenanzahl an.',
      grundstueck: 'Bitte geben Sie den Grundstücksstatus an.'
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

    // E-Mail validation (optional field, but validate format if provided)
    if (formData.bauherr_email && formData.bauherr_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.bauherr_email.trim())) {
        return res.status(400).json({
          error: 'Ungültige E-Mail-Adresse',
          details: [{ field: 'bauherr_email', message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }]
        });
      }
    }

    // Phone validation (optional field, but validate format if provided)
    if (formData.bauherr_telefon && formData.bauherr_telefon.trim()) {
      const phoneRegex = /^[\d\s\-+()\/]+$/;
      const digitsOnly = formData.bauherr_telefon.replace(/\D/g, '');
      if (!phoneRegex.test(formData.bauherr_telefon) || digitsOnly.length < 6) {
        return res.status(400).json({
          error: 'Ungültige Telefonnummer',
          details: [{ field: 'bauherr_telefon', message: 'Bitte geben Sie eine gültige Telefonnummer ein.' }]
        });
      }
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
      haustyp: formData.haustyp || null,
      personenanzahl: parseInt(formData.personenanzahl) || 1,
      grundstueck: formData.grundstueck,

      // Building components (all optional)
      wall: formData.wall || null,
      innerwall: formData.innerwall || null,
      decke: formData.decke || null,
      window: formData.window || null,
      tiles: formData.tiles || null,
      dach: formData.dach || null,
      heizung: formData.heizung || null,
      lueftung: formData.lueftung || null,
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

    // Generate PDF (separate error handling — submission is saved even if PDF fails)
    try {
      await pdfService.generatePDF(savedSubmission);
    } catch (pdfError) {
      logger.error('Submit', `PDF-Generierung fehlgeschlagen für ${id}: ${pdfError.message}`);
      // Redirect anyway — result page can show submission without PDF
    }

    // Redirect to result page
    res.redirect(`/result/${id}`);

  } catch (error) {
    logger.error('Submit', `POST /submit — ${error.message}`);
    res.status(500).send('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
  }
});

module.exports = router;
