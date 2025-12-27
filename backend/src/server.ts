import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import evalRoutes from './routes/eval.js';
import manageRoutes from './routes/manage.js';
import authRoutes from './routes/auth.js';
import swaggerRoutes from './routes/swagger.js';
import { ApiError } from './utils/errors.js';
import logger from './utils/logger.js';
import { apiLimiter, authLimiter } from './utils/rateLimit.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });
  next();
});

// Swagger documentation
app.use('/api-docs', swaggerRoutes);

// Apply rate limiters
app.use('/api/manage', apiLimiter);
app.use('/api/eval', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/google', authLimiter);

// Separate management and evaluation APIs
app.use('/api/eval', evalRoutes);
app.use('/api/manage', manageRoutes);
app.use('/api/auth', authRoutes);

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ApiError) {
    logger.warn('API Error', {
      status: err.status,
      message: err.message,
    });
    return res.status(err.status).json({ error: err.message });
  }
  logger.error('Unhandled error', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  res.status(500).json({ error: 'internal-error' });
});

app.listen(config.port, () => {
  logger.info(`Backend listening on port ${config.port}`, {
    port: config.port,
    environment: process.env.NODE_ENV || 'development',
  });
  logger.info('API Documentation available at http://localhost:4000/api-docs');
});


