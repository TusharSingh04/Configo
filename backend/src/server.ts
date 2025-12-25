import express from 'express';
import cors from 'cors';
import { config } from './config';
import evalRoutes from './routes/eval';
import manageRoutes from './routes/manage';
import { ApiError } from './utils/errors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

// Separate management and evaluation APIs
app.use('/api/eval', evalRoutes);
app.use('/api/manage', manageRoutes);

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'internal-error' });
});

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});
