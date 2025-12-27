const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
import { getToken } from './auth';

async function api(path: string, init?: RequestInit) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(init?.headers || {}) } as Record<string, string>;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const manage = {
  listFlags: () => api('/api/manage/flags'),
  getFlag: (key: string) => api(`/api/manage/flags/${key}`),
  createFlag: (flag: any) => api('/api/manage/flags', { method: 'POST', body: JSON.stringify(flag) }),
  updateFlag: (key: string, flag: any) => api(`/api/manage/flags/${key}`, { method: 'PUT', body: JSON.stringify(flag) }),
  rollback: (key: string, toVersion: number) => api(`/api/manage/flags/${key}/rollback`, { method: 'POST', body: JSON.stringify({ toVersion }) }),
};

export const auth = {
  login: (email: string, password: string) => api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (email: string, password: string, requestedRole?: string) => api('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, requestedRole }) }),
  googleSignIn: (idToken: string) => api('/api/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }),
  me: () => api('/api/auth/me'),
};

export const admin = {
  listPendingUsers: () => api('/api/auth/users/pending'),
  listAllUsers: () => api('/api/auth/users'),
  approveUser: (userId: string, approve: boolean, role: string) => api(`/api/auth/users/${userId}/approve`, { 
    method: 'POST', 
    body: JSON.stringify({ approve, role }) 
  }),
};
