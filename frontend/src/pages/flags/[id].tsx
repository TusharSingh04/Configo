import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FlagForm } from '../../components/FlagForm';
import { manage, auth as authApi } from '../../lib/api';
import { clearToken } from '../../lib/auth';
import Link from 'next/link';

export default function EditFlag() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [initial, setInitial] = useState<any | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch current user to check role
    authApi.me()
      .then(data => setUser(data.user))
      .catch(() => {
        clearToken();
        router.push('/');
      });

    if (id) manage.getFlag(id).then(setInitial);
  }, [id]);

  if (!id) return <main style={{ padding: 24 }}>Loading…</main>;
  if (!initial || !user) return <main style={{ padding: 24 }}>Fetching flag…</main>;

  const canEdit = user.role === 'editor' || user.role === 'admin';

  return (
    <>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :global(body) {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        .page-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
          padding: 40px 20px;
        }

        .page-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .content-wrapper {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .back-button {
          display: inline-flex !important;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: white !important;
          border: 2px solid #e2e8f0 !important;
          border-radius: 10px;
          text-decoration: none !important;
          color: #475569 !important;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 24px;
          cursor: pointer;
        }

        .back-button:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          border-color: #667eea !important;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .back-button:active {
          transform: translateY(-1px);
        }

        .header-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 28px 32px;
          margin-bottom: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
        }

        .flag-key {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .metadata {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .metadata-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f1f5f9;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .metadata-label {
          color: #94a3b8;
          font-weight: 500;
        }

        .metadata-value {
          color: #1e293b;
        }

        .form-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 24px;
        }

        .rollback-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .rollback-form {
          display: grid;
          gap: 16px;
          max-width: 400px;
        }

        .form-label {
          display: grid;
          gap: 8px;
        }

        .form-label-text {
          font-weight: 600;
          font-size: 14px;
          color: #334155;
        }

        .form-input {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.25s ease;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .rollback-button {
          padding: 12px 24px;
          background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .rollback-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 152, 0, 0.4);
        }

        .rollback-button:active {
          transform: translateY(0);
        }

        .read-only-notice {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 28px 32px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 2px solid #fbbf24;
        }

        .read-only-title {
          font-size: 18px;
          font-weight: 700;
          color: #92400e;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .read-only-text {
          color: #78350f;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 20px 12px;
          }

          .header-section,
          .form-section,
          .rollback-section,
          .read-only-notice {
            padding: 20px;
          }

          .page-title {
            font-size: 22px;
          }

          .metadata {
            flex-direction: column;
          }

          .rollback-form {
            max-width: 100%;
          }
        }
      `}</style>

      <div className="page-container">
        <div className="content-wrapper">
          {/* Back Navigation */}
          <Link href="/flags" legacyBehavior>
            <a className="back-button">
              <span>←</span>
              <span>Back to Flags</span>
            </a>
          </Link>

          {/* Header Section */}
          <div className="header-section">
            <h1 className="page-title">
              Edit Flag: <span className="flag-key">{id}</span>
            </h1>
            <div className="metadata">
              <div className="metadata-pill">
                <span className="metadata-label">Role:</span>
                <span className="metadata-value">{user.role}</span>
              </div>
              <div className="metadata-pill">
                <span className="metadata-label">Version:</span>
                <span className="metadata-value">v{initial.version}</span>
              </div>
            </div>
          </div>

          {canEdit ? (
            <>
              {/* Edit Form Section */}
              <div className="form-section">
                <h2 className="section-title">Edit Flag Configuration</h2>
                <FlagForm initial={initial} onSubmit={async (v) => {
                  await manage.updateFlag(id, v);
                  router.push('/flags');
                }} />
              </div>

              {/* Rollback Section */}
              <div className="rollback-section">
                <h2 className="section-title">Rollback to Previous Version</h2>
                <form className="rollback-form" onSubmit={async (e) => {
                  e.preventDefault();
                  const to = Number((e.target as any).version.value);
                  const rolled = await manage.rollback(id, to);
                  setInitial(rolled);
                  alert('Rolled back successfully');
                }}>
                  <label className="form-label">
                    <span className="form-label-text">Version to rollback to:</span>
                    <input
                      name="version"
                      type="number"
                      className="form-input"
                      placeholder="Enter version number"
                      required
                    />
                  </label>
                  <button type="submit" className="rollback-button">
                    Rollback Flag
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="read-only-notice">
              <div className="read-only-title">
                <span>🔒</span>
                <span>Read-Only Mode</span>
              </div>
              <p className="read-only-text">
                As a viewer, you can only view flags. To edit or rollback, please request editor or admin permissions from an administrator.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
