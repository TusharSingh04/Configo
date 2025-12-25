import { useRouter } from 'next/router';
import { FlagForm } from '../../components/FlagForm';
import { manage } from '../../lib/api';

export default function NewFlag() {
  const router = useRouter();
  return (
    <main style={{ padding: 24 }}>
      <h2>Create Flag</h2>
      <FlagForm onSubmit={async (v) => {
        await manage.createFlag(v);
        router.push('/flags');
      }} />
    </main>
  );
}
