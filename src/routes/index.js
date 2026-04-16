const express = require('express');
const router = express.Router();
const catalogService = require('../services/catalogService');
const logger = require('../utils/logger');

router.get('/', (req, res) => {
  const catalog = {
    walls: catalogService.getWalls(),
    innerwalls: catalogService.getInnerwalls(),
    decken: catalogService.getDecken(),
    windows: catalogService.getWindows(),
    tiles: catalogService.getTiles(),
    haustypen: catalogService.getHaustypen(),
    heizung: catalogService.getHeizung(),
    daecher: catalogService.getDaecher(),
    treppen: catalogService.getTreppen()
  };

  logger.debug('Route', `GET / — Katalog geladen (${Object.values(catalog).reduce((s, a) => s + a.length, 0)} Einträge)`);

  res.render('index', { catalog, csrfToken: res.locals.csrfToken });
});

module.exports = router;
