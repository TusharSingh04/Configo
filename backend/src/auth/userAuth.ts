import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { ApiError } from '../utils/errors.js';

export interface UserClaims { sub: string; role: 'admin' | 'viewer'; }

export function requireRole(role: 'admin' | 'viewer') {
  return (req: Request & { user?: UserClaims }, _res: Response, next: NextFunction) => {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    try {
      const claims = jwt.verify(token, config.jwtSecret) as UserClaims;
      req.user = claims;
      if (role === 'admin' && claims.role !== 'admin') {
        throw new ApiError(403, 'Forbidden');
      }
      next();
    } catch {
      throw new ApiError(401, 'Invalid user token');
    }
  };
}
