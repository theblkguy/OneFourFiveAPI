const request = require('supertest');
const app = require('../index');

describe('API integration', () => {
  describe('GET /health', () => {
    it('returns 200 and status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'chord-progression-api' });
    });
  });

  describe('GET /progressions', () => {
    it('returns 400 when key or scale missing', async () => {
      const res = await request(app).get('/progressions');
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 200 and progression for valid key and scale', async () => {
      const res = await request(app).get('/progressions').query({ key: 'C', scale: 'major' });
      expect(res.status).toBe(200);
      expect(res.body.key).toBe('C');
      expect(res.body.scale).toBe('major');
      expect(res.body.progression).toBeInstanceOf(Array);
      expect(res.body.bars).toBeGreaterThan(0);
    });

    it('returns minimal response with simple=true', async () => {
      const res = await request(app).get('/progressions').query({ key: 'C', scale: 'major', simple: 'true' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('progression');
      expect(res.body).not.toHaveProperty('chords');
    });
  });

  describe('POST /progressions/resolve', () => {
    it('returns 400 when chords array exceeds limit', async () => {
      const manyChords = Array(51).fill('C');
      const res = await request(app)
        .post('/progressions/resolve')
        .set('Content-Type', 'application/json')
        .send({ chords: manyChords, key: 'C', scale: 'major' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('too many chords');
    });

    it('returns 400 when body missing chords', async () => {
      const res = await request(app).post('/progressions/resolve').send({ key: 'C', scale: 'major' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 200 and matches for valid chords', async () => {
      const res = await request(app)
        .post('/progressions/resolve')
        .set('Content-Type', 'application/json')
        .send({ chords: ['C', 'G', 'Am'], key: 'C', scale: 'major' });
      expect(res.status).toBe(200);
      expect(res.body.input_chords).toEqual(['C', 'G', 'Am']);
      expect(res.body.matches).toBeInstanceOf(Array);
    });
  });

  describe('GET /progressions/options', () => {
    it('returns 200 and options', async () => {
      const res = await request(app).get('/progressions/options');
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
