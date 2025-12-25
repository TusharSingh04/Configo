import { MongoClient, Db, Collection } from 'mongodb';
import { config } from '../config';
import { FlagDoc } from '../models/Flag';
import { AuditLogDoc } from '../models/AuditLog';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(config.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000,
  });
  try {
    await client.connect();
    db = client.db();
    console.log('✅ MongoDB connected');
    return db;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    throw err;
  }
}

export async function getFlagsCollection(): Promise<Collection<FlagDoc>> {
  const database = await getDb();
  const col = database.collection<FlagDoc>('flags');
  await col.createIndex({ key: 1 }, { unique: true });
  return col;
}

export async function getAuditCollection(): Promise<Collection<AuditLogDoc>> {
  const database = await getDb();
  const col = database.collection<AuditLogDoc>('audit_logs');
  await col.createIndex({ ts: -1 });
  await col.createIndex({ entityType: 1, entityId: 1, ts: -1 });
  return col;
}
