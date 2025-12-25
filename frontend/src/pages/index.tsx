import { useState } from 'react';
import { setToken, clearToken, getToken } from '../lib/auth';

export default function Home() {
  const [token, setStateToken] = useState<string>(getToken() || '');
  return (
    <main style={{ padding: 24 }}>
      <h1>Feature Flags Dashboard</h1>
      <p>Paste a JWT with role claim (`admin` or `viewer`).</p>
      <input style={{ width: '100%', padding: 8 }} value={token} onChange={e => setStateToken(e.target.value)} placeholder="Bearer token" />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => { setToken(token); alert('Token saved'); }}>Save Token</button>
        <button onClick={() => { clearToken(); setStateToken(''); alert('Token cleared'); }}>Clear Token</button>
      </div>
      <p style={{ marginTop: 16 }}>
        Navigate to <a href="/flags">Flags</a>
      </p>
    </main>
  );
}
