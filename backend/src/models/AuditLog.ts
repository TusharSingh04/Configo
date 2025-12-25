export interface AuditLogDoc {
  _id?: string;
  ts: number; // epoch ms
  actor: string; // user or service performing action
  entityType: 'flag';
  entityId: string; // flag key
  action: 'create' | 'update' | 'rollback';
  data: unknown; // append-only snapshot of entity or diff
}
