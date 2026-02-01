import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { createUser, findByEmail } from '../data/userStore';
import type { AuthSuccess, User, JwtPayload, RegisterBody, LoginBody } from '../types';

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 16) {
      throw new Error('JWT_SECRET must be set and at least 16 characters in production');
    }
    return secret;
  }
  return secret && secret.length >= 16 ? secret : 'dev-secret-min-16-chars';
}

function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN ?? '7d';
}

function toUser(stored: { id: string; email: string; createdAt: string }): User {
  return { id: stored.id, email: stored.email, createdAt: stored.createdAt };
}

export interface RegisterResultSuccess {
  success: true;
  data: AuthSuccess;
}

export interface RegisterResultError {
  success: false;
  error: string;
  message: string;
}

export type RegisterResult = RegisterResultSuccess | RegisterResultError;

export function register(body: RegisterBody | null | undefined): RegisterResult {
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email) {
    return { success: false, error: 'validation_error', message: 'Email is required' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { success: false, error: 'validation_error', message: 'Invalid email format' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { success: false, error: 'validation_error', message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }

  try {
    const existing = findByEmail(email);
    if (existing) {
      return { success: false, error: 'email_taken', message: 'An account with this email already exists' };
    }
    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const user = createUser(email, passwordHash);
    const secret = getSecret();
    const expiresIn = getExpiresIn();
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      secret,
      { expiresIn } as SignOptions
    );
    return {
      success: true,
      data: { token, user, expiresIn },
    };
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      return { success: false, error: 'email_taken', message: 'An account with this email already exists' };
    }
    if (err instanceof Error && err.message.includes('JWT_SECRET')) {
      throw err;
    }
    return { success: false, error: 'registration_failed', message: 'Registration failed' };
  }
}

export interface LoginResultSuccess {
  success: true;
  data: AuthSuccess;
}

export interface LoginResultError {
  success: false;
  error: string;
  message: string;
}

export type LoginResult = LoginResultSuccess | LoginResultError;

export function login(body: LoginBody | null | undefined): LoginResult {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return { success: false, error: 'validation_error', message: 'Email and password are required' };
  }

  const stored = findByEmail(email);
  if (!stored) {
    return { success: false, error: 'invalid_credentials', message: 'Invalid email or password' };
  }
  const match = bcrypt.compareSync(password, stored.passwordHash);
  if (!match) {
    return { success: false, error: 'invalid_credentials', message: 'Invalid email or password' };
  }

  try {
    const secret = getSecret();
    const expiresIn = getExpiresIn();
    const user = toUser(stored);
    const signOptions: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
    const token = jwt.sign({ sub: user.id, email: user.email }, secret, signOptions);
    return {
      success: true,
      data: { token, user, expiresIn },
    };
  } catch (err) {
    if (err instanceof Error && err.message.includes('JWT_SECRET')) {
      throw err;
    }
    return { success: false, error: 'login_failed', message: 'Login failed' };
  }
}

export function verifyToken(bearerToken: string | undefined): JwtPayload | null {
  if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
    return null;
  }
  const token = bearerToken.slice(7).trim();
  if (!token) return null;
  try {
    const secret = getSecret();
    const payload = jwt.verify(token, secret) as JwtPayload;
    if (!payload.sub || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}
