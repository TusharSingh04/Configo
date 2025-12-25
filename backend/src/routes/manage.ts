import { Router } from 'express';
import { requireRole } from '../auth/userAuth';
import { wrap } from '../utils/errors';
import { upsertFlag, listFlags, rollbackFlag, getFlagByKey } from '../services/flagService';

const router = Router();

router.get('/flags', requireRole('viewer'), wrap(async (_req, res) => {
  const flags = await listFlags();
  res.json({ flags });
}));

router.get('/flags/:key', requireRole('viewer'), wrap(async (req, res) => {
  const flag = await getFlagByKey(req.params.key);
  if (!flag) return res.status(404).json({ error: 'flag-not-found' });
  res.json(flag);
}));

router.post('/flags', requireRole('admin'), wrap(async (req, res) => {
  const actor = (req as any).user?.sub ?? 'unknown';
  const created = await upsertFlag(actor, req.body);
  res.json(created);
}));

router.put('/flags/:key', requireRole('admin'), wrap(async (req, res) => {
  const actor = (req as any).user?.sub ?? 'unknown';
  const updated = await upsertFlag(actor, { ...req.body, key: req.params.key });
  res.json(updated);
}));

router.post('/flags/:key/rollback', requireRole('admin'), wrap(async (req, res) => {
  const actor = (req as any).user?.sub ?? 'unknown';
  const toVersion = Number(req.body.toVersion);
  const rolled = await rollbackFlag(actor, req.params.key, toVersion);
  if (!rolled) return res.status(404).json({ error: 'version-not-found' });
  res.json(rolled);
}));

export default router;
