import { getDb } from '../db/mongo.js';
import logger from '../utils/logger.js';
import { AuditLogDoc } from '../models/AuditLog.js';

export interface AuditLogEntry {
  actor: string; // email or service name
  entityType: 'flag';
  entityId: string;
  action: 'create' | 'update' | 'rollback';
  data: any; // Change details, snapshot, or metadata
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    previousValue?: any;
    newValue?: any;
  };
}

export async function createAuditLog(entry: AuditLogEntry): Promise<AuditLogDoc | null> {
  try {
    const database = await getDb();
    const auditCollection = database.collection<AuditLogDoc>('auditLogs');

    const log: AuditLogDoc = {
      ts: Date.now(),
      actor: entry.actor,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      data: entry.data,
    };

    const result = await auditCollection.insertOne(log);

    logger.info('Audit log created', {
      actor: entry.actor,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
    });

    return { ...log, _id: result.insertedId.toString() };
  } catch (error) {
    logger.error('Failed to create audit log', {
      error: error instanceof Error ? error.message : String(error),
      entry,
    });
    return null;
  }
}

export async function getAuditLogs(
  filters?: {
    entityType?: string;
    entityId?: string;
    actor?: string;
    action?: string;
    startTime?: number;
    endTime?: number;
  },
  limit: number = 100,
  skip: number = 0,
): Promise<AuditLogDoc[]> {
  try {
    const database = await getDb();
    const auditCollection = database.collection<AuditLogDoc>('auditLogs');

    const query: any = {};

    if (filters?.entityType) query.entityType = filters.entityType;
    if (filters?.entityId) query.entityId = filters.entityId;
    if (filters?.actor) query.actor = filters.actor;
    if (filters?.action) query.action = filters.action;

    if (filters?.startTime || filters?.endTime) {
      query.ts = {};
      if (filters?.startTime) query.ts.$gte = filters.startTime;
      if (filters?.endTime) query.ts.$lte = filters.endTime;
    }

    const logs = await auditCollection
      .find(query)
      .sort({ ts: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    return logs;
  } catch (error) {
    logger.error('Failed to fetch audit logs', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string,
): Promise<AuditLogDoc[]> {
  return getAuditLogs({ entityType, entityId }, 1000);
}

export async function getAuditLogsByUser(
  email: string,
): Promise<AuditLogDoc[]> {
  return getAuditLogs({ actor: email }, 1000);
}

export async function deleteOldAuditLogs(daysOld: number = 90): Promise<number> {
  try {
    const database = await getDb();
    const auditCollection = database.collection<AuditLogDoc>('auditLogs');

    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    const result = await auditCollection.deleteMany({ ts: { $lt: cutoffTime } });

    logger.info('Deleted old audit logs', {
      count: result.deletedCount,
      daysOld,
    });

    return result.deletedCount || 0;
  } catch (error) {
    logger.error('Failed to delete old audit logs', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
