import { useEffect, useState } from 'react';
import { admin, auth as authApi } from '../../lib/api';
import { clearToken } from '../../lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface User {
  _id: string;
  email: string;
  role?: string;
  requestedRole?: string;
  status: string;
  createdAt: string;
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalRole, setApprovalRole] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user is admin
    async function checkAccess() {
      try {
        const me = await authApi.me();
        setCurrentUser(me.user);
        if (me.user.role !== 'admin') {
          router.push('/flags');
          return;
        }
        loadUsers();
      } catch {
        clearToken();
        router.push('/');
      }
    }
    checkAccess();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const { users: pending } = await admin.listPendingUsers();
      setUsers(pending);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId: string, role: string) {
    try {
      await admin.approveUser(userId, true, role);
      setUsers(users.filter(u => u._id !== userId));
      alert('User approved');
    } catch (err) {
      alert('Failed to approve user: ' + String(err));
    }
  }

  async function handleReject(userId: string) {
    try {
      await admin.approveUser(userId, false, '');
      setUsers(users.filter(u => u._id !== userId));
      alert('User rejected');
    } catch (err) {
      alert('Failed to reject user: ' + String(err));
    }
  }

  function handleLogout() {
    clearToken();
    router.push('/');
  }

  if (!currentUser) return <main style={{ padding: 24 }}>Loading...</main>;

  if (currentUser.role !== 'admin') {
    return <main style={{ padding: 24 }}><p>Access denied. Only admins can view this page.</p></main>;
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>User Management</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/flags" style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', textDecoration: 'none', borderRadius: 4 }}>
            Go to Flags
          </Link>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Pending Approvals</h2>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: '#d32f2f' }}>Error: {error}</p>}
        {!loading && users.length === 0 && <p>No pending approvals.</p>}
        {!loading && users.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Requested Role</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Created</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{user.email}</td>
                  <td style={{ padding: 8 }}>{user.requestedRole}</td>
                  <td style={{ padding: 8 }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                    <select
                      value={approvalRole[user._id] || user.requestedRole || 'viewer'}
                      onChange={(e) => setApprovalRole({ ...approvalRole, [user._id]: e.target.value })}
                      style={{ padding: 4, borderRadius: 4 }}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleApprove(user._id, approvalRole[user._id] || user.requestedRole || 'viewer')}
                      style={{
                        padding: '4px 12px',
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(user._id)}
                      style={{
                        padding: '4px 12px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
