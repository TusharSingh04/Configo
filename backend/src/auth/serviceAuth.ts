import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { ApiError } from '../utils/errors';

export function requireServiceToken(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || token !== config.serviceToken) {
    throw new ApiError(401, 'Invalid service token');
  }
  next();
}
