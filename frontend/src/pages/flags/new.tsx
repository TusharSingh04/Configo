import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FlagForm } from '../../components/FlagForm';
import { manage, auth as authApi } from '../../lib/api';
import { clearToken } from '../../lib/auth';
import Link from 'next/link';

export default function NewFlag() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me()
      .then(data => {
        setUser(data.user);
        // Redirect if viewer (no write permission)
        if (data.user.role === 'viewer') {
          router.push('/flags');
        }
      })
      .catch(() => {
        clearToken();
        router.push('/');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main style={{ padding: 24 }}>Loading...</main>;
  if (!user || user.role === 'viewer') return <main style={{ padding: 24 }}>Access denied.</main>;

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/flags" style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', textDecoration: 'none', borderRadius: 4 }}>
          ← Back to Flags
        </Link>
      </div>
      <h2>Create Flag</h2>
      <FlagForm onSubmit={async (v) => {
        await manage.createFlag(v);
        router.push('/flags');
      }} />
    </main>
  );
}
