import { useState, useEffect } from 'react';

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

  // Sync form state when initial prop changes (e.g., after rollback)
  useEffect(() => {
    if (initial) {
      setKey(initial.key || '');
      setType(initial.type || 'boolean');
      setDescription(initial.description || '');
      setEnvs(initial.envs || [
        { env: 'dev', defaultValue: false },
        { env: 'staging', defaultValue: false },
        { env: 'prod', defaultValue: false },
      ]);
    }
  }, [initial]);

  return (
    <>
      <style jsx>{`
        .flag-form {
          display: grid;
          gap: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .form-field {
          display: grid;
          gap: 8px;
        }

        .field-label {
          font-weight: 600;
          font-size: 14px;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .field-input {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.25s ease;
          background: white;
          font-family: inherit;
        }

        .field-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .field-input:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }

        .field-select {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.25s ease;
          background: white;
          cursor: pointer;
          font-family: inherit;
        }

        .field-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .environments-section {
          margin-top: 8px;
        }

        .environments-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .environments-grid {
          display: grid;
          gap: 20px;
        }

        .env-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 12px;
          padding: 24px;
          transition: all 0.3s ease;
        }

        .env-card:hover {
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .env-header {
          font-size: 16px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .env-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .env-badge.dev {
          background: #dbeafe;
          color: #1e40af;
        }

        .env-badge.staging {
          background: #fef3c7;
          color: #92400e;
        }

        .env-badge.prod {
          background: #dcfce7;
          color: #166534;
        }

        .env-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .submit-button {
          padding: 14px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.25s ease;
          justify-self: start;
        }

        .submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .submit-button:active {
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .env-fields {
            grid-template-columns: 1fr;
          }

          .submit-button {
            width: 100%;
          }
        }
      `}</style>

      <form className="flag-form" onSubmit={e => { e.preventDefault(); onSubmit({ key, type, envs, description }); }}>
        {/* Basic Flag Details */}
        <div className="form-grid">
          <div className="form-field">
            <label className="field-label">
              <span>🔑</span>
              <span>Flag Key</span>
            </label>
            <input
              className="field-input"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="my-feature-flag"
              disabled={!!initial?.key}
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              <span>⚙️</span>
              <span>Type</span>
            </label>
            <select className="field-select" value={type} onChange={e => setType(e.target.value as any)}>
              <option value="boolean">Boolean</option>
              <option value="multivariate">Multivariate</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>

        <div className="form-field">
          <label className="field-label">
            <span>📝</span>
            <span>Description</span>
          </label>
          <input
            className="field-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the purpose of this flag"
          />
        </div>

        {/* Environments Section */}
        <div className="environments-section">
          <h3 className="environments-title">
            <span>🌍</span>
            <span>Environments</span>
          </h3>
          <div className="environments-grid">
            {envs.map((env, idx) => (
              <div key={idx} className="env-card">
                <div className="env-header">
                  <span className={`env-badge ${env.env}`}>{env.env}</span>
                </div>
                <div className="env-fields">
                  <div className="form-field">
                    <label className="field-label">Default Value</label>
                    <input
                      className="field-input"
                      value={String(env.defaultValue)}
                      onChange={e => {
                        const v = e.target.value;
                        const next = [...envs];
                        next[idx].defaultValue = v === 'true' ? true : v === 'false' ? false : v;
                        setEnvs(next);
                      }}
                      placeholder="true or false"
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Rollout %</label>
                    <input
                      className="field-input"
                      type="number"
                      min={0}
                      max={100}
                      value={env.rollout?.percentage ?? 0}
                      onChange={e => {
                        const next = [...envs];
                        next[idx].rollout = { percentage: Number(e.target.value) };
                        setEnvs(next);
                      }}
                      placeholder="0-100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="submit-button">
          💾 Save Flag Configuration
        </button>
      </form>
    </>
  );
}
