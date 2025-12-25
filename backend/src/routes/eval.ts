import { Router } from 'express';
import { cacheGet, cacheSet } from '../db/redis';
import { config } from '../config';
import { getFlagsCollection } from '../db/mongo';
import { FlagDoc, Environment } from '../models/Flag';
import { evaluateFlag, EvaluationContext } from '../services/evaluator';
import { requireServiceToken } from '../auth/serviceAuth';
import { wrap } from '../utils/errors';

const router = Router();
router.use(requireServiceToken);

async function loadFlagsFromCache(env: Environment): Promise<FlagDoc[] | null> {
  const key = `flags:${env}`;
  try {
    const cached = await cacheGet(key);
    if (!cached) return null;
    try {
      return JSON.parse(cached) as FlagDoc[];
    } catch {
      return null; // corrupted cache -> ignore and fall back
    }
  } catch {
    return null; // cache unavailable -> safe fallback to DB
  }
}

async function writeFlagsCache(env: Environment, flags: FlagDoc[]): Promise<void> {
  const key = `flags:${env}`;
  await cacheSet(key, JSON.stringify(flags), config.cacheTtlSeconds);
}

router.post('/eval', wrap(async (req, res) => {
  const { key, env, context } = req.body as { key: string; env: Environment; context?: EvaluationContext };
  const ctx = context ?? {};
  let flags = await loadFlagsFromCache(env);
  if (!flags) {
    const col = await getFlagsCollection();
    flags = await col.find({}).toArray();
    // cache safe write; ignore failure
    writeFlagsCache(env, flags).catch(() => void 0);
  }
  const flag = flags.find(f => f.key === key);
  if (!flag) return res.status(404).json({ error: 'flag-not-found' });
  const result = evaluateFlag(flag, env, ctx);
  return res.json(result);
}));

router.post('/eval/batch', wrap(async (req, res) => {
  const { keys, env, context } = req.body as { keys: string[]; env: Environment; context?: EvaluationContext };
  const ctx = context ?? {};
  let flags = await loadFlagsFromCache(env);
  if (!flags) {
    const col = await getFlagsCollection();
    flags = await col.find({ key: { $in: keys } }).toArray();
    writeFlagsCache(env, flags).catch(() => void 0);
  }
  const results = keys.map(k => {
    const f = flags!.find(ff => ff.key === k);
    return f ? evaluateFlag(f, env, ctx) : { key: k, value: null, reason: 'flag-not-found' };
  });
  return res.json({ results });
}));

export default router;
