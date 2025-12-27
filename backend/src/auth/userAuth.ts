import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { ApiError } from '../utils/errors.js';

export type Role = 'admin' | 'editor' | 'viewer';
export interface UserClaims { sub: string; email?: string; role: Role; }

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['flag:read', 'flag:write', 'audit:read', 'user:manage'],
  editor: ['flag:read', 'flag:write'],
  viewer: ['flag:read'],
};

export function decodeToken(token: string): UserClaims {
  return jwt.verify(token, config.jwtSecret) as UserClaims;
}

export function requireRole(role: Role) {
  return (req: Request & { user?: UserClaims }, _res: Response, next: NextFunction) => {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    try {
      const claims = decodeToken(token);
      req.user = claims;
      if (claims.role !== role && role === 'admin') {
        throw new ApiError(403, 'Forbidden');
      }
      next();
    } catch {
      throw new ApiError(401, 'Invalid user token');
    }
  };
}

export function requirePermission(permission: string) {
  return (req: Request & { user?: UserClaims }, _res: Response, next: NextFunction) => {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    try {
      const claims = decodeToken(token);
      req.user = claims;
      const allowed = ROLE_PERMISSIONS[claims.role] || [];
      if (!allowed.includes(permission)) {
        throw new ApiError(403, 'Forbidden');
      }
      next();
    } catch {
      throw new ApiError(401, 'Invalid user token');
    }
  };
}
