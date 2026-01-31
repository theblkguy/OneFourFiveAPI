const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const progressionsRouter = require('./routes/progressions');
const openApiSpec = require('./openapi/spec');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: [],
    },
  },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use((req, res, next) => {
  if (req.path === '/progressions/resolve' && req.method === 'POST') {
    return express.json({ limit: '100kb' })(req, res, next);
  }
  return express.json({ limit: '10kb' })(req, res, next);
});

// OpenAPI spec (for external tools) and interactive docs
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(openApiSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'OneFourFive API — Docs',
}));

const publicDir = path.resolve(__dirname, '..', 'public');
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) res.status(500).send('Server error loading page');
  });
});
app.use(express.static(publicDir));
app.use('/progressions', progressionsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chord-progression-api' });
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: `No route for ${req.method} ${req.path}` });
});

// Global error handler – avoids leaking stack traces in production
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(err);
  res.status(500).json({ error: 'Internal server error', message: 'An unexpected error occurred' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Chord Progression API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
