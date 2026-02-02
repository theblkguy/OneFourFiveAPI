import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JwtPayload } from '../types';

/** JWT secret for external consumers - used only when NOT using Neon Auth */
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-min-16-chars';

/**
 * Extends Express Request to include optional user info extracted from JWT.
 */
export interface AuthenticatedRequest extends Request {
  /** User ID from JWT (undefined if no valid token provided) */
  userId?: string;
  /** Full JWT payload (undefined if no valid token provided) */
  jwtPayload?: JwtPayload;
  /** Alias for jwtPayload for compatibility */
  user?: JwtPayload;
}

/** Lazy-initialized Neon Auth JWKS. Uses NEON_AUTH_URL from env. */
let neonAuthJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getNeonAuthJwks(): ReturnType<typeof createRemoteJWKSet> | null {
  const url = process.env.NEON_AUTH_URL;
  if (!url) return null;
  if (!neonAuthJwks) {
    neonAuthJwks = createRemoteJWKSet(new URL(`${url}/.well-known/jwks.json`));
  }
  return neonAuthJwks;
}

/**
 * Verifies a Bearer token. Uses Neon Auth JWKS when NEON_AUTH_URL is set;
 * otherwise falls back to custom JWT verification (for backwards compatibility).
 */
async function verifyTokenAsync(authHeader: string | undefined): Promise<JwtPayload | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const neonUrl = process.env.NEON_AUTH_URL;
  if (neonUrl) {
    const JWKS = getNeonAuthJwks();
    if (!JWKS) return null;
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: new URL(neonUrl).origin,
      });
      const sub = payload.sub as string | undefined;
      const email = (payload.email ?? payload.emailVerified ?? '') as string;
      if (!sub) return null;
      return { sub, email };
    } catch {
      return null;
    }
  }

  // Fallback: custom JWT (e.g. development without Neon Auth)
  const { verifyToken } = await import('../services/authService');
  return verifyToken(authHeader);
}

/**
 * Middleware that optionally parses JWT from Authorization: Bearer <token>.
 * Sets req.user and req.userId (for rate limiting) when valid; does not 401.
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  verifyTokenAsync(req.headers.authorization).then((payload) => {
    if (payload) {
      req.user = payload;
      req.userId = payload.sub;
    }
    next();
  }).catch(next);
}

/**
 * Middleware that requires a valid JWT in Authorization: Bearer <token>.
 * Attaches decoded payload to req.user. Sends 401 if missing or invalid.
 * Supports Neon Auth (when NEON_AUTH_URL is set) or custom JWT.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  verifyTokenAsync(req.headers.authorization).then((payload) => {
    if (!payload) {
      const neonUrl = process.env.NEON_AUTH_URL;
      const msg = neonUrl
        ? 'Valid JWT required. Log in via Neon Auth (see frontend).'
        : 'Valid JWT required. Use Authorization: Bearer <token> or log in at POST /auth/login.';
      res.status(401).json({ error: 'unauthorized', message: msg });
      return;
    }
    req.user = payload;
    req.userId = payload.sub;
    next();
  }).catch(next);
}

/** Re-export for consumers (tests). Uses sync custom JWT verification only. */
export { verifyToken } from '../services/authService';
