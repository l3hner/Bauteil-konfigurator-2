require('dotenv').config();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false // EJS templates use inline styles/scripts
}));

// Rate limiting for form submission and PDF generation
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 20, // max 20 Submissions pro 15 Min
  message: 'Zu viele Anfragen. Bitte versuchen Sie es in 15 Minuten erneut.'
});
const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // max 50 PDF-Abrufe pro 15 Min
  message: 'Zu viele PDF-Anfragen. Bitte versuchen Sie es später erneut.'
});

// CSRF protection via double-submit token
app.use((req, res, next) => {
  if (req.method === 'GET') {
    const token = crypto.randomBytes(32).toString('hex');
    res.locals.csrfToken = token;
    res.cookie('_csrf', token, { httpOnly: true, sameSite: 'strict' });
  }
  next();
});

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Middleware
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Disable view caching in development
if (process.env.NODE_ENV !== 'production') {
  app.set('view cache', false);
}

// Routes
const indexRouter = require('./routes/index');
const submitRouter = require('./routes/submit');
const resultRouter = require('./routes/result');
const pdfRouter = require('./routes/pdf');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use('/', indexRouter);
app.use('/submit', submitLimiter, submitRouter);
app.use('/result', resultRouter);
app.use('/pdf', pdfLimiter, pdfRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Seite nicht gefunden',
    message: 'Die angeforderte Seite existiert nicht.',
    details: null
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[ERROR] ${req.method} ${req.url} — ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(statusCode).render('error', {
    title: 'Ein Fehler ist aufgetreten',
    message: process.env.NODE_ENV === 'production'
      ? 'Bitte versuchen Sie es später erneut.'
      : err.message,
    details: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Start server
const logger = require('./utils/logger');

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
