import request from 'supertest';
import app from '../index';

describe('Auth', () => {
  const validEmail = `test-${Date.now()}@example.com`;
  const validPassword = 'password123';

  describe('POST /auth/register', () => {
    it('returns 201 and token + user for valid body', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send({ email: validEmail, password: validPassword });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toMatchObject({ email: validEmail });
      expect(res.body.user.id).toBeDefined();
      expect(res.body.user.createdAt).toBeDefined();
      expect(res.body.expiresIn).toBeDefined();
    });

    it('returns 400 when email or password missing', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send({ email: validEmail });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when password too short', async () => {
      const res = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send({ email: 'short@example.com', password: 'short' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 409 when email already taken', async () => {
      await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send({ email: validEmail, password: validPassword });
      const res = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send({ email: validEmail, password: 'otherpass123' });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('email_taken');
    });
  });

  describe('POST /auth/login', () => {
    it('returns 200 and token for valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: validEmail, password: validPassword });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toMatchObject({ email: validEmail });
      expect(res.body.expiresIn).toBeDefined();
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: validEmail, password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('invalid_credentials');
    });

    it('returns 401 for unknown email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: 'nobody@example.com', password: 'password123' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('invalid_credentials');
    });

    it('returns 400 when email or password missing', async () => {
      const res = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: validEmail });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
});
