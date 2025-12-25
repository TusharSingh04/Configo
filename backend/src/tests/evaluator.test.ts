import { evaluateFlag } from '../services/evaluator.ts';
import { FlagDoc } from '../models/Flag.ts';

const flag: FlagDoc = {
  key: 'new-ui',
  type: 'boolean',
  version: 1,
  createdBy: 'tester',
  updatedBy: 'tester',
  updatedAt: Date.now(),
  envs: [
    { env: 'dev', defaultValue: true, rollout: { percentage: 100 } },
    { env: 'prod', defaultValue: false, rollout: { percentage: 50 } }
  ]
};

function run() {
  const r1 = evaluateFlag(flag, 'dev', { userId: 'u1' });
  const r2 = evaluateFlag(flag, 'prod', { userId: 'u1' });
  const r3 = evaluateFlag(flag, 'prod', { userId: 'u2' });
  console.log({ r1, r2, r3 });
}

run();
