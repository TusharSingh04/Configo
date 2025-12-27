import { evaluateFlag } from '../services/evaluator.js';
import { FlagDoc } from '../models/Flag.js';

describe('Flag Evaluator', () => {
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

  it('should evaluate boolean flag with 100% rollout in dev', () => {
    const result = evaluateFlag(flag, 'dev', { userId: 'u1' });
    expect(result.value).toBe(true);
    expect(result.reason).toBeDefined();
  });

  it('should evaluate boolean flag with 50% rollout in prod', () => {
    const result = evaluateFlag(flag, 'prod', { userId: 'u1' });
    expect(typeof result.value).toBe('boolean');
    expect(result.reason).toBeDefined();
  });

  it('should return consistent values for same user', () => {
    const result1 = evaluateFlag(flag, 'prod', { userId: 'consistent-user' });
    const result2 = evaluateFlag(flag, 'prod', { userId: 'consistent-user' });
    expect(result1.value).toBe(result2.value);
  });

  it('should return default value when env not found', () => {
    const result = evaluateFlag(flag, 'staging', { userId: 'u1' });
    expect(result.value).toBe(flag.envs[0].defaultValue);
  });
});

