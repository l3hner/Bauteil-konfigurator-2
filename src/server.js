const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info('Server', `Lehner Konfigurator läuft auf http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);

  // Auto-open browser (nur lokal, nicht auf Render/Production)
  if (process.env.NODE_ENV !== 'production') {
    const open = require('child_process').exec;
    open(`xdg-open http://localhost:${PORT}`, (err) => {
      if (err) {
        logger.info('Server', `Bitte öffnen Sie http://localhost:${PORT} in Ihrem Browser`);
      }
    });
  }
});
