const express = require('express');
const router = express.Router();
const submissionService = require('../services/submissionService');
const catalogService = require('../services/catalogService');
const logger = require('../utils/logger');
const { SUBMISSION_FIELD_TO_CATEGORY, CATEGORY_LABELS } = require('../constants');

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const submission = await submissionService.getSubmission(id);

    if (!submission) {
      return res.status(404).send('Anfrage nicht gefunden');
    }

    // Look up all selected components from catalog
    const components = [];

    for (const [field, category] of Object.entries(SUBMISSION_FIELD_TO_CATEGORY)) {
      const value = submission[field];
      if (!value || value === 'keine') continue;
      const data = catalogService.getVariantById(category, value);
      if (data) {
        components.push({ label: CATEGORY_LABELS[category], ...data });
      }
    }

    res.render('result', { submission, components });

  } catch (error) {
    logger.error('Route', `GET /result/${req.params.id} — ${error.message}`);
    next(error);
  }
});

module.exports = router;
