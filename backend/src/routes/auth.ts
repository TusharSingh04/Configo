import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { ApiError, wrap } from '../utils/errors.js';
import { getUsersCollection } from '../db/mongo.js';
import { UserDoc } from '../models/User.js';
import { generateSalt, hashPassword, verifyPassword } from '../utils/password.js';
import { requirePermission, decodeToken } from '../auth/userAuth.js';
import { createAuditLog } from '../services/auditService.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import logger from '../utils/logger.js';

const router = Router();

function signToken(user: UserDoc) {
  const claims = { sub: String(user._id), email: user.email, role: user.role };
  return jwt.sign(claims, config.jwtSecret, { expiresIn: '7d' });
}

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'missing-credentials');
  const users = await getUsersCollection();
  const user = await users.findOne({ email });
  if (!user || !user.salt || !user.passwordHash) throw new ApiError(401, 'invalid-credentials');
  if (user.status !== 'approved') throw new ApiError(403, 'account-not-approved');
  const ok = verifyPassword(password, user.salt, user.passwordHash);
  if (!ok) throw new ApiError(401, 'invalid-credentials');
  
  // Log successful login
  await createAuditLog({
    actor: email,
    entityType: 'flag',
    entityId: 'login',
    action: 'create',
    data: { loginMethod: 'password' },
  });
  
  const token = signToken(user);
  res.json({ token, user: { email: user.email, role: user.role, status: user.status } });
}));

router.post('/signup', wrap(async (req, res) => {
  const { email, password, requestedRole } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'missing-credentials');
  const users = await getUsersCollection();
  const exists = await users.findOne({ email });
  if (exists) throw new ApiError(409, 'email-in-use');
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const finalRole = (requestedRole === 'editor' ? 'editor' : 'viewer');
  const doc: UserDoc = {
    email,
    role: finalRole,
    requestedRole: finalRole,
    status: 'pending',
    passwordHash,
    salt,
    createdAt: new Date(),
  };
  const ins = await users.insertOne(doc);
  const created = { ...doc, _id: ins.insertedId };
  
  // Log signup event
  await createAuditLog({
    actor: email,
    entityType: 'flag',
    entityId: 'signup',
    action: 'create',
    data: { requestedRole: finalRole, method: 'email-password' },
  });
  
  res.status(201).json({
    message: 'signup-pending-approval',
    user: { email: created.email, requestedRole: created.requestedRole, status: created.status },
  });
}));

router.post('/google', wrap(async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken || !config.googleClientId) throw new ApiError(400, 'missing-id-token');
  // Lazy import to avoid hard dependency when not used
  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client(config.googleClientId);
  const ticket = await client.verifyIdToken({ idToken, audience: config.googleClientId });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new ApiError(401, 'google-verify-failed');
  const email = payload.email;
  const users = await getUsersCollection();
  let user = await users.findOne({ email });
  if (!user) {
    const doc: Omit<UserDoc, '_id'> = { email, role: 'viewer', requestedRole: 'viewer', status: 'pending', createdAt: new Date() };
    const ins = await users.insertOne(doc as UserDoc);
    const created = { ...doc, _id: ins.insertedId };
    
    // Log Google signup
    await createAuditLog({
      actor: email,
      entityType: 'flag',
      entityId: 'signup',
      action: 'create',
      data: { method: 'google-oauth' },
    });
    
    return res.status(201).json({
      message: 'account-pending-approval',
      user: { email: created.email, requestedRole: created.requestedRole, status: created.status },
    });
  }
  if (user.status !== 'approved') throw new ApiError(403, 'account-not-approved');
  
  // Log Google login
  await createAuditLog({
    actor: email,
    entityType: 'flag',
    entityId: 'login',
    action: 'create',
    data: { loginMethod: 'google-oauth' },
  });
  
  const token = signToken(user);
  res.json({ token, user: { email: user.email, role: user.role, status: user.status } });
}));

router.get('/me', wrap(async (req, res) => {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) throw new ApiError(401, 'no-token');
  try {
    const claims = decodeToken(token);
    res.json({ user: claims });
  } catch {
    throw new ApiError(401, 'invalid-token');
  }
}));

// Admin: list pending approvals
router.get('/users/pending', requirePermission('user:manage'), wrap(async (_req, res) => {
  const users = await getUsersCollection();
  const pending = await users.find(
    { status: 'pending' },
    { projection: { email: 1, requestedRole: 1, status: 1, createdAt: 1 } }
  ).toArray();
  res.json({ users: pending });
}));

// Admin: approve or reject user
router.post('/users/:userId/approve', requirePermission('user:manage'), wrap(async (req, res) => {
  const { userId } = req.params;
  const { approve, role } = req.body || {};
  if (typeof approve !== 'boolean') throw new ApiError(400, 'missing-approve-flag');
  
  const { ObjectId } = await import('mongodb');
  const users = await getUsersCollection();
  
  let objectId: any;
  try {
    objectId = new ObjectId(userId);
  } catch {
    throw new ApiError(400, 'invalid-user-id');
  }
  
  const user = await users.findOne({ _id: objectId });
  if (!user) throw new ApiError(404, 'user-not-found');
  
  const adminId = (req as any).user?.sub ?? 'unknown';
  const adminEmail = (req as any).user?.email ?? 'system';
  
  const update = approve
    ? { status: 'approved' as const, role, approvedAt: new Date(), approvedBy: adminId }
    : { status: 'rejected' as const, approvedAt: new Date(), approvedBy: adminId };
  
  await users.updateOne({ _id: user._id }, { $set: update });
  
  // Log approval decision
  await createAuditLog({
    actor: adminEmail,
    entityType: 'flag',
    entityId: user.email,
    action: 'create',
    data: { role: role || user.requestedRole },
  });
  
  // Send email notification
  if (approve) {
    const emailTemplate = emailTemplates.userApproved(user.email, role || user.requestedRole);
    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });
  } else {
    const emailTemplate = emailTemplates.userRejected(user.email);
    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });
  }
  
  res.json({ message: approve ? 'user-approved' : 'user-rejected', userId });
}));

// Admin: list all users
router.get('/users', requirePermission('user:manage'), wrap(async (_req, res) => {
  const users = await getUsersCollection();
  const list = await users.find({}, { projection: { email: 1, role: 1, status: 1, createdAt: 1 } }).toArray();
  res.json({ users: list });
}));

// Get audit logs
router.get('/audit', requirePermission('audit:read'), wrap(async (req, res) => {
  const { getAuditLogs } = await import('../services/auditService.js');
  
  const query = req.query as any;
  const logs = await getAuditLogs(
    {
      entityType: query.entityType,
      entityId: query.entityId,
      actor: query.actor,
      action: query.action,
      startTime: query.startTime ? Number(query.startTime) : undefined,
      endTime: query.endTime ? Number(query.endTime) : undefined,
    },
    Number(query.limit || 100),
    Number(query.skip || 0),
  );
  res.json({ logs });
}));

export default router;

