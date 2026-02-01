import type { JwtPayload } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      /** Set by optionalAuth for rate limiting (user id from JWT sub). */
      userId?: string;
    }
  }
}

export {};
