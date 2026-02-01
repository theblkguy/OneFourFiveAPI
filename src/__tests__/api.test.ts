import request from 'supertest';
import app from '../index';

/** Get a valid JWT by registering a unique user. */
async function getToken(): Promise<string> {
  const email = `api-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const res = await request(app)
    .post('/auth/register')
    .set('Content-Type', 'application/json')
    .send({ email, password: 'password123' });
  expect(res.status).toBe(201);
  return res.body.token;
}

describe('API integration', () => {
  describe('GET /health', () => {
    it('returns 200 and status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'chord-progression-api' });
    });
  });

  describe('GET /progressions', () => {
    it('returns 401 when no JWT', async () => {
      const res = await request(app).get('/progressions').query({ key: 'C', scale: 'major' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('unauthorized');
    });

    it('returns 400 when key or scale missing', async () => {
      const token = await getToken();
      const res = await request(app)
        .get('/progressions')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 200 and progression for valid key and scale with JWT', async () => {
      const token = await getToken();
      const res = await request(app)
        .get('/progressions')
        .set('Authorization', `Bearer ${token}`)
        .query({ key: 'C', scale: 'major' });
      expect(res.status).toBe(200);
      expect(res.body.key).toBe('C');
      expect(res.body.scale).toBe('major');
      expect(res.body.progression).toBeInstanceOf(Array);
      expect(res.body.bars).toBeGreaterThan(0);
    });

    it('returns minimal response with simple=true', async () => {
      const token = await getToken();
      const res = await request(app)
        .get('/progressions')
        .set('Authorization', `Bearer ${token}`)
        .query({ key: 'C', scale: 'major', simple: 'true' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('progression');
      expect(res.body).not.toHaveProperty('chords');
    });
  });

  describe('POST /progressions/resolve', () => {
    it('returns 401 when no JWT', async () => {
      const res = await request(app)
        .post('/progressions/resolve')
        .set('Content-Type', 'application/json')
        .send({ chords: ['C', 'G', 'Am'], key: 'C', scale: 'major' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('unauthorized');
    });

    it('returns 400 when chords array exceeds limit', async () => {
      const token = await getToken();
      const manyChords = Array(51).fill('C');
      const res = await request(app)
        .post('/progressions/resolve')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send({ chords: manyChords, key: 'C', scale: 'major' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('too many chords');
    });

    it('returns 400 when body missing chords', async () => {
      const token = await getToken();
      const res = await request(app)
        .post('/progressions/resolve')
        .set('Authorization', `Bearer ${token}`)
        .send({ key: 'C', scale: 'major' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 200 and matches for valid chords with JWT', async () => {
      const token = await getToken();
      const res = await request(app)
        .post('/progressions/resolve')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send({ chords: ['C', 'G', 'Am'], key: 'C', scale: 'major' });
      expect(res.status).toBe(200);
      expect(res.body.input_chords).toEqual(['C', 'G', 'Am']);
      expect(res.body.matches).toBeInstanceOf(Array);
    });
  });

  describe('GET /progressions/options', () => {
    it('returns 401 when no JWT', async () => {
      const res = await request(app).get('/progressions/options');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('unauthorized');
    });

    it('returns 200 and options with JWT', async () => {
      const token = await getToken();
      const res = await request(app)
        .get('/progressions/options')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.keys).toBeInstanceOf(Array);
      expect(res.body.scales).toEqual(['major', 'minor']);
      expect(res.body.genres).toBeInstanceOf(Array);
    });
  });

  describe('GET /openapi.json', () => {
    it('returns 200 and OpenAPI spec', async () => {
      const res = await request(app).get('/openapi.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toMatch(/^3\.0/);
      expect(res.body.paths).toBeDefined();
      expect(res.body.paths['/progressions']).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not found');
    });
  });

  describe('Security headers (Helmet)', () => {
    it('includes security headers in response', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('Rate limiting', () => {
    it('includes rate-limit headers in response', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['ratelimit-limit'] ?? res.headers['x-ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining'] ?? res.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });
});
