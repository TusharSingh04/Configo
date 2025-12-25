import { EnvConfig, Environment, FlagDoc, VariantOption } from '../models/Flag';
import { deterministicHash } from '../utils/hash';

export interface EvaluationContext { [key: string]: string | number | boolean | null | undefined; }

export interface EvaluationResult {
  key: string;
  value: unknown; // evaluated value
  variant?: string; // chosen variant if multivariate
  reason: string; // explanation for audit/debug
}

function matchesRules(rules: NonNullable<EnvConfig['rules']>, ctx: EvaluationContext): boolean {
  for (const rule of rules) {
    const v = ctx[rule.attribute];
    switch (rule.op) {
      case 'eq': if (v !== rule.value) return false; break;
      case 'neq': if (v === rule.value) return false; break;
      case 'in': if (!Array.isArray(rule.value) || !rule.value.includes(v as any)) return false; break;
      case 'nin': if (Array.isArray(rule.value) && rule.value.includes(v as any)) return false; break;
    }
  }
  return true;
}

function pickVariant(variants: VariantOption[], keySalt: string, ctx: EvaluationContext): VariantOption {
  // Deterministic weighted selection based on hash of keySalt + stable id (userId preferred)
  const id = (ctx['userId'] ?? ctx['id'] ?? 'anon').toString();
  const r = deterministicHash(`${keySalt}:${id}`);
  const total = variants.reduce((s, v) => s + (v.weight ?? 1), 0);
  let acc = 0;
  for (const v of variants) {
    acc += (v.weight ?? 1) / total;
    if (r <= acc) return v;
  }
  return variants[variants.length - 1];
}

export function evaluateFlag(flag: FlagDoc, env: Environment, ctx: EvaluationContext): EvaluationResult {
  const envCfg = flag.envs.find(e => e.env === env);
  if (!envCfg) {
    return { key: flag.key, value: flag.envs[0]?.defaultValue, reason: 'env-missing-fallback' };
  }
  if (envCfg.rules && envCfg.rules.length > 0 && !matchesRules(envCfg.rules, ctx)) {
    return { key: flag.key, value: envCfg.defaultValue, reason: 'rules-no-match-fallback' };
  }
  if (envCfg.rollout) {
    const id = (ctx['userId'] ?? ctx['id'] ?? 'anon').toString();
    const salt = envCfg.rollout.salt ?? `${flag.key}:${flag.version}:${env}`;
    const r = deterministicHash(`${salt}:${id}`) * 100;
    if (r > envCfg.rollout.percentage) {
      return { key: flag.key, value: envCfg.defaultValue, reason: 'rollout-percentage-fallback' };
    }
  }
  // Passed rules and rollout
  if (flag.type === 'multivariate' && envCfg.variants && envCfg.variants.length > 0) {
    const chosen = pickVariant(envCfg.variants, `${flag.key}:${flag.version}:${env}`, ctx);
    return { key: flag.key, value: chosen.value ?? chosen.key, variant: chosen.key, reason: 'variant-selected' };
  }
  if (flag.type === 'json' && envCfg.variants && envCfg.variants.length > 0) {
    // For json flags, variants can carry JSON values; pick one deterministically
    const chosen = pickVariant(envCfg.variants, `${flag.key}:${flag.version}:${env}`, ctx);
    return { key: flag.key, value: chosen.value ?? envCfg.defaultValue, variant: chosen.key, reason: 'json-selected' };
  }
  // boolean or default
  return { key: flag.key, value: envCfg.defaultValue, reason: 'default' };
}
