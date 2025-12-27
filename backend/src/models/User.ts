export interface UserDoc {
  _id?: any;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  passwordHash?: string; // absent for social login
  salt?: string;         // absent for social login
  status: 'approved' | 'pending' | 'rejected'; // approval status
  requestedRole: 'admin' | 'editor' | 'viewer'; // what role they requested
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string; // admin user ID who approved
}

