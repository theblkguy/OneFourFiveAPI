import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import progressionsRouter from './routes/progressions';
import chordsRouter from './routes/chords';
import authRouter from './routes/auth';
import openApiSpec from './openapi/spec';
import { requireAuth, progressionRateLimiter } from './middleware';
import { initializeDatabase } from './db';
import { isVercel } from './lib/runtime';

const app = express();

if (isVercel) {
  // Required for correct client IP behind Vercel's reverse proxy (rate limiting)
  app.set('trust proxy', 1);
}

// CORS: allowed origins when frontend is hosted separately
const ALLOWED_ORIGINS = [
  'https://banjoko.codes',
  'https://www.banjoko.codes',
  'https://onefourfiveapi.onrender.com',
  ...(process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
];
for (const vercelHost of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
  if (vercelHost) {
    ALLOWED_ORIGINS.push(`https://${vercelHost}`);
  }
}
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

const connectSrc = ["'self'", 'https://esm.sh'];
const neonAuthUrl = process.env.NEON_AUTH_URL;
if (neonAuthUrl) {
  try {
    connectSrc.push(new URL(neonAuthUrl).origin);
  } catch {
    // ignore invalid URL
  }
}
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
      fontSrc: ["'self'"],
      connectSrc,
      frameSrc: [],
    },
  },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX ?? '', 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

let dbInitPromise: Promise<void> | null = null;
export function ensureDatabaseReady(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = initializeDatabase();
  }
  return dbInitPromise;
}

// Auth routes are the only handlers that touch Postgres — skip DB init elsewhere on Vercel
if (isVercel) {
  app.use('/auth', (req: Request, res: Response, next: NextFunction) => {
    ensureDatabaseReady().then(() => next()).catch(next);
  });
}

app.use((req: Request, res: Response, next: NextFunction) => {
  if (
    (req.path === '/progressions/resolve' ||
      req.path === '/progressions/complete' ||
      req.path === '/progressions/song') &&
    req.method === 'POST'
  ) {
    return express.json({ limit: '200kb' })(req, res, next);
  }
  if (req.path.startsWith('/chords') && req.method === 'POST') {
    return express.json({ limit: '200kb' })(req, res, next);
  }
  if (req.path.startsWith('/auth')) {
    return express.json({ limit: '10kb' })(req, res, next);
  }
  return express.json({ limit: '10kb' })(req, res, next);
});

// OpenAPI spec (for external tools) and interactive docs
app.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(openApiSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'OneFourFive API — Docs',
}));

// Static demo UI: served by Vercel CDN from /public; Express serves it elsewhere
if (!isVercel) {
  const publicDir = path.resolve(__dirname, '..', 'public');
  app.get('/', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'), (err) => {
      if (err) res.status(500).send('Server error loading page');
    });
  });
  app.use(express.static(publicDir));
}

// Auth: register and login (no JWT required)
app.use('/auth', authRouter);

// Progression endpoints: require JWT; rate limit per user
app.use('/progressions', requireAuth, progressionRateLimiter, progressionsRouter);
app.use('/chords', requireAuth, progressionRateLimiter, chordsRouter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'chord-progression-api' });
});

// Config for frontend (e.g. Neon Auth URL when using Neon Auth)
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    neonAuthUrl: process.env.NEON_AUTH_URL || null,
  });
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: `No route for ${req.method} ${req.path}` });
});

// Global error handler – avoids leaking stack traces in production
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  console.error(err);
  res.status(500).json({ error: 'Internal server error', message: 'An unexpected error occurred' });
});

export default app;
