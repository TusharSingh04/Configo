import Link from 'next/link';
import { useEffect, useState } from 'react';
import { manage } from '../../lib/api';

export default function FlagsList() {
  const [flags, setFlags] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    manage.listFlags().then(d => setFlags(d.flags)).catch(e => setError(String(e)));
  }, []);
  return (
    <main style={{ padding: 24 }}>
      <h2>Flags</h2>
      <p><Link href="/flags/new">Create New Flag</Link></p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {flags.map((f) => (
          <li key={f.key}>
            <Link href={`/flags/${f.key}`}>{f.key}</Link> — v{f.version} — type {f.type}
          </li>
        ))}
      </ul>
    </main>
  );
}
