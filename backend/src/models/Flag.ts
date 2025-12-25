export type Environment = 'dev' | 'staging' | 'prod';
export type FlagType = 'boolean' | 'multivariate' | 'json';

export interface TargetRule {
  attribute: string; // e.g., userId, role
  op: 'eq' | 'neq' | 'in' | 'nin';
  value: string | number | (string | number)[];
}

export interface PercentageRollout {
  percentage: number; // 0..100
  salt?: string; // optional extra salt per flag/version
}

export interface VariantOption {
  key: string; // variant name
  weight?: number; // weight for multivariate
  value?: unknown; // value for json/multivariate
}

export interface EnvConfig {
  env: Environment;
  defaultValue: unknown; // mandatory fallback per env
  rules?: TargetRule[]; // attribute-based targeting
  rollout?: PercentageRollout; // percentage rollout
  variants?: VariantOption[]; // multivariate/json
}

export interface FlagDoc {
  _id?: string;
  key: string; // unique flag key
  type: FlagType;
  envs: EnvConfig[]; // per-env configuration
  version: number; // monotonic version
  createdBy: string;
  updatedBy: string;
  updatedAt: number; // epoch ms
  description?: string;
}
