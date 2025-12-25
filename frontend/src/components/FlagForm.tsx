import { useState } from 'react';

export type FlagFormValue = {
  key: string;
  type: 'boolean' | 'multivariate' | 'json';
  envs: any[];
  description?: string;
};

export function FlagForm({ initial, onSubmit }: { initial?: Partial<FlagFormValue>; onSubmit: (v: FlagFormValue) => void }) {
  const [key, setKey] = useState(initial?.key || '');
  const [type, setType] = useState<FlagFormValue['type']>(initial?.type || 'boolean');
  const [description, setDescription] = useState(initial?.description || '');
  const [envs, setEnvs] = useState<any[]>(initial?.envs || [
    { env: 'dev', defaultValue: false },
    { env: 'staging', defaultValue: false },
    { env: 'prod', defaultValue: false },
  ]);

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ key, type, envs, description }); }}>
      <label>Key<br /><input value={key} onChange={e => setKey(e.target.value)} /></label>
      <br />
      <label>Type<br />
        <select value={type} onChange={e => setType(e.target.value as any)}>
          <option value="boolean">boolean</option>
          <option value="multivariate">multivariate</option>
          <option value="json">json</option>
        </select>
      </label>
      <br />
      <label>Description<br /><input value={description} onChange={e => setDescription(e.target.value)} /></label>
      <h4>Environments</h4>
      {envs.map((env, idx) => (
        <div key={idx} style={{ border: '1px solid #ccc', padding: 8, marginBottom: 8 }}>
          <strong>{env.env}</strong>
          <div>
            <label>Default Value<br /><input value={String(env.defaultValue)} onChange={e => {
              const v = e.target.value;
              const next = [...envs];
              next[idx].defaultValue = v === 'true' ? true : v === 'false' ? false : v;
              setEnvs(next);
            }} /></label>
          </div>
          <div>
            <label>Rollout %<br /><input type="number" min={0} max={100} value={env.rollout?.percentage ?? 0} onChange={e => {
              const next = [...envs];
              next[idx].rollout = { percentage: Number(e.target.value) };
              setEnvs(next);
            }} /></label>
          </div>
        </div>
      ))}
      <button type="submit">Save</button>
    </form>
  );
}
