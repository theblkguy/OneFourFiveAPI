import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { AuthenticatedRequest } from './auth';
import { Request } from 'express';

/**
 * Default rate limit settings for progression routes.
 * Can be overridden via environment variables.
 */
const PROGRESSION_WINDOW_MS = parseInt(process.env.PROGRESSION_RATE_LIMIT_WINDOW_MS ?? '', 10) || 15 * 60 * 1000; // 15 minutes
const PROGRESSION_MAX_REQUESTS = parseInt(process.env.PROGRESSION_RATE_LIMIT_MAX ?? '', 10) || 100;

/**
 * Key generator for per-user/token rate limiting.
 * Uses userId from JWT if available, falls back to IP address.
 */
function getUserOrIpKey(req: Request): string {
  const authReq = req as AuthenticatedRequest;

  // If authenticated, use user ID for rate limiting
  if (authReq.userId) {
    return `user:${authReq.userId}`;
  }

  // Fall back to IP-based rate limiting for anonymous requests
  // Use req.ip which express-rate-limit recommends for proper IPv6 handling
  return `ip:${req.ip ?? 'unknown'}`;
}

/**
 * Rate limiter for progression routes.
 * - Authenticated users: rate limited per user ID
 * - Anonymous users: rate limited per IP address
 */
export const progressionRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: PROGRESSION_WINDOW_MS,
  max: PROGRESSION_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserOrIpKey,
  message: {
    error: 'Too many requests',
    message: `Rate limit exceeded. Maximum ${PROGRESSION_MAX_REQUESTS} requests per ${PROGRESSION_WINDOW_MS / 60000} minutes.`,
  },
  // Skip rate limiting for OPTIONS requests (CORS preflight)
  skip: (req) => req.method === 'OPTIONS',
  // Disable keyGeneratorIpFallback validation - we handle IP fallback correctly via req.ip
  // which Express normalizes for both IPv4 and IPv6
  validate: { keyGeneratorIpFallback: false },
});

/**
 * Factory function to create custom rate limiters with specific settings.
 */
export function createRateLimiter(options: Partial<Options> = {}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: PROGRESSION_WINDOW_MS,
    max: PROGRESSION_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getUserOrIpKey,
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    },
    skip: (req) => req.method === 'OPTIONS',
    validate: { keyGeneratorIpFallback: false },
    ...options,
  });
}

export { PROGRESSION_WINDOW_MS, PROGRESSION_MAX_REQUESTS, getUserOrIpKey };
