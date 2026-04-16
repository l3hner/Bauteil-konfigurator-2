const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const sanitizedId = id.replace(/[^a-zA-Z0-9-]/g, '');
    
    const pdfPath = path.join(__dirname, '../../output', `Leistungsbeschreibung_${sanitizedId}.pdf`);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).send('PDF nicht gefunden');
    }

    // Check if download is requested
    const download = req.query.download === '1';

    if (download) {
      res.download(pdfPath, `Leistungsbeschreibung_Lehner_Haus_${sanitizedId}.pdf`);
    } else {
      res.sendFile(pdfPath);
    }

  } catch (error) {
    logger.error('PDF', `GET /pdf/${req.params.id} — ${error.message}`);
    res.status(500).send('Ein Fehler ist aufgetreten');
  }
});

module.exports = router;
