import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FlagForm } from '../../components/FlagForm';
import { manage } from '../../lib/api';

export default function EditFlag() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [initial, setInitial] = useState<any | null>(null);
  useEffect(() => { if (id) manage.getFlag(id).then(setInitial); }, [id]);
  if (!id) return <main style={{ padding: 24 }}>Loading…</main>;
  if (!initial) return <main style={{ padding: 24 }}>Fetching flag…</main>;
  return (
    <main style={{ padding: 24 }}>
      <h2>Edit Flag: {id}</h2>
      <FlagForm initial={initial} onSubmit={async (v) => {
        await manage.updateFlag(id, v);
        router.push('/flags');
      }} />
      <hr />
      <h3>Rollback</h3>
      <form onSubmit={async (e) => {
        e.preventDefault();
        const to = Number((e.target as any).version.value);
        await manage.rollback(id, to);
        alert('Rolled back');
      }}>
        <label>Version to rollback to: <input name="version" type="number" /></label>
        <button type="submit">Rollback</button>
      </form>
    </main>
  );
}
