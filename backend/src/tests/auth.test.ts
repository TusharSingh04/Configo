import { requirePermission, decodeToken, ROLE_PERMISSIONS } from '../auth/userAuth.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { Request, Response, NextFunction } from 'express';

// Mock Express objects
const createMockRequest = (token?: string, overrides?: Partial<Request>): Partial<Request> => ({
  headers: token ? { authorization: `Bearer ${token}` } : {},
  ...overrides,
});

const createMockResponse = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const createMockNext = (): NextFunction => jest.fn();

describe('RBAC Auth Middleware', () => {
  describe('ROLE_PERMISSIONS', () => {
    it('should have admin with all permissions', () => {
      expect(ROLE_PERMISSIONS.admin).toContain('flag:read');
      expect(ROLE_PERMISSIONS.admin).toContain('flag:write');
      expect(ROLE_PERMISSIONS.admin).toContain('user:manage');
      expect(ROLE_PERMISSIONS.admin).toContain('audit:read');
    });

    it('should have editor with read and write permissions', () => {
      expect(ROLE_PERMISSIONS.editor).toContain('flag:read');
      expect(ROLE_PERMISSIONS.editor).toContain('flag:write');
      expect(ROLE_PERMISSIONS.editor).not.toContain('user:manage');
    });

    it('should have viewer with read-only permissions', () => {
      expect(ROLE_PERMISSIONS.viewer).toContain('flag:read');
      expect(ROLE_PERMISSIONS.viewer).not.toContain('flag:write');
      expect(ROLE_PERMISSIONS.viewer).not.toContain('user:manage');
    });
  });

  describe('decodeToken', () => {
    it('should decode valid JWT', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'editor',
      };
      const token = jwt.sign(payload, config.jwtSecret);

      const decoded = decodeToken(token) as any;
      // JWT adds iat (issued at) automatically, check fields individually
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.iat).toBeDefined();
    });

    it('should throw on invalid JWT', () => {
      expect(() => {
        decodeToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw on expired JWT', () => {
      const expiredToken = jwt.sign(
        { userId: 'test', email: 'test@example.com', role: 'viewer' },
        config.jwtSecret,
        { expiresIn: '-1h' }, // Already expired
      );

      expect(() => {
        decodeToken(expiredToken);
      }).toThrow();
    });
  });

  describe('requirePermission middleware', () => {
    it('should allow admin to perform flag:write', () => {
      const payload = {
        userId: 'admin-user',
        email: 'admin@test.com',
        role: 'admin',
      };
      const token = jwt.sign(payload, config.jwtSecret);
      const req = createMockRequest(token) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const middleware = requirePermission('flag:write');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow editor to perform flag:write', () => {
      const payload = {
        userId: 'editor-user',
        email: 'editor@test.com',
        role: 'editor',
      };
      const token = jwt.sign(payload, config.jwtSecret);
      const req = createMockRequest(token) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const middleware = requirePermission('flag:write');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny viewer from performing flag:write', () => {
      const payload = {
        userId: 'viewer-user',
        email: 'viewer@test.com',
        role: 'viewer',
      };
      const token = jwt.sign(payload, config.jwtSecret);
      const req = createMockRequest(token) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const middleware = requirePermission('flag:write');
      
      expect(() => middleware(req, res, next)).toThrow();
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow viewer to perform flag:read', () => {
      const payload = {
        userId: 'viewer-user',
        email: 'viewer@test.com',
        role: 'viewer',
      };
      const token = jwt.sign(payload, config.jwtSecret);
      const req = createMockRequest(token) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const middleware = requirePermission('flag:read');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny requests without token', () => {
      const req = createMockRequest() as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const middleware = requirePermission('flag:read');
      
      expect(() => middleware(req, res, next)).toThrow();
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny requests with invalid token', () => {
      const req = createMockRequest('invalid-token') as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const middleware = requirePermission('flag:read');
      
      expect(() => middleware(req, res, next)).toThrow();
      expect(next).not.toHaveBeenCalled();
    });

    it('should attach user claims to request', () => {
      const payload = {
        userId: 'test-user',
        email: 'test@test.com',
        role: 'editor',
      };
      const token = jwt.sign(payload, config.jwtSecret);
      const req = createMockRequest(token) as any;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      const middleware = requirePermission('flag:read');
      middleware(req, res, next);

      // JWT adds iat automatically, check fields individually
      expect(req.user.userId).toBe(payload.userId);
      expect(req.user.email).toBe(payload.email);
      expect(req.user.role).toBe(payload.role);
      expect(req.user.iat).toBeDefined();
    });
  });
});
