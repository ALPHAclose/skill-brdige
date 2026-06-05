import type { AuthenticatedUser } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};
