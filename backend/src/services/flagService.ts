import { getFlagsCollection, getAuditCollection } from '../db/mongo.js';
import { FlagDoc } from '../models/Flag.js';
import { AuditLogDoc } from '../models/AuditLog.js';

export async function getFlagByKey(key: string): Promise<FlagDoc | null> {
  const col = await getFlagsCollection();
  return col.findOne({ key });
}

export async function listFlags(): Promise<FlagDoc[]> {
  const col = await getFlagsCollection();
  return col.find({}).sort({ key: 1 }).toArray();
}

export async function upsertFlag(actor: string, flag: Omit<FlagDoc, 'version' | 'updatedAt' | 'updatedBy'> & Partial<Pick<FlagDoc, 'version'>>): Promise<FlagDoc> {
  const col = await getFlagsCollection();
  const existing = await col.findOne({ key: flag.key });
  const next: FlagDoc = {
    ...flag,
    version: (existing?.version ?? 0) + 1,
    updatedAt: Date.now(),
    updatedBy: actor,
    createdBy: existing?.createdBy ?? actor,
  } as FlagDoc;
  await col.updateOne({ key: flag.key }, { $set: next }, { upsert: true });
  await appendAudit({ ts: Date.now(), actor, entityType: 'flag', entityId: flag.key, action: existing ? 'update' : 'create', data: next });
  return next;
}

export async function rollbackFlag(actor: string, key: string, toVersion: number): Promise<FlagDoc | null> {
  const col = await getFlagsCollection();
  const audit = await getAuditCollection();
  const entry = await audit.findOne({ entityType: 'flag', entityId: key, action: { $in: ['create', 'update'] }, 'data.version': toVersion });
  if (!entry || typeof entry.data !== 'object') return null;
  const snapshot = entry.data as FlagDoc;
  // Apply snapshot values but set the displayed version to the target version
  const next: FlagDoc = { ...snapshot, updatedAt: Date.now(), updatedBy: actor, version: toVersion };
  await col.updateOne({ key }, { $set: next }, { upsert: true });
  await appendAudit({ ts: Date.now(), actor, entityType: 'flag', entityId: key, action: 'rollback', data: { toVersion, appliedVersion: next.version } });
  return next;
}

async function appendAudit(entry: AuditLogDoc): Promise<void> {
  const col = await getAuditCollection();
  await col.insertOne(entry);
}
