import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import type { JwtPayload } from '../types';

/** JWT secret for external consumers - uses env var or dev default. */
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

/**
 * Middleware that optionally parses JWT from Authorization: Bearer <token>.
 * Sets req.user and req.userId (for rate limiting) when valid; does not 401.
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const payload = verifyToken(req.headers.authorization);
  if (payload) {
    req.user = payload;
    req.userId = payload.sub;
  }
  next();
}

/**
 * Middleware that requires a valid JWT in Authorization: Bearer <token>.
 * Attaches decoded payload to req.user. Sends 401 if missing or invalid.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const payload = verifyToken(req.headers.authorization);
  if (!payload) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Valid JWT required. Use Authorization: Bearer <token> or log in at POST /auth/login.',
    });
    return;
  }
  req.user = payload;
  req.userId = payload.sub;
  next();
}

/** Re-export for consumers that need the secret (e.g. tests). */
export { verifyToken } from '../services/authService';
