import Link from 'next/link';
import { useEffect, useState } from 'react';
import { manage, auth as authApi } from '../../lib/api';
import { clearToken } from '../../lib/auth';
import { useRouter } from 'next/router';

export default function FlagsList() {
  const router = useRouter();
  const [flags, setFlags] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Fetch current user to check role
    authApi.me()
      .then(data => setUser(data.user))
      .catch(() => {
        clearToken();
        router.push('/');
      });

    manage.listFlags()
      .then(d => setFlags(d.flags))
      .catch(e => {
        setError(String(e));
        // Redirect to login if unauthorized
        if (String(e).includes('401')) {
          clearToken();
          router.push('/');
        }
      });
  }, []);

  function handleLogout() {
    clearToken();
    router.push('/');
  }

  const canEdit = user && (user.role === 'editor' || user.role === 'admin');
  const isAdmin = user && user.role === 'admin';

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

        .dashboard-container {
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
          position: relative;
          background: white;
          width: 100%;
          overflow-x: hidden;
        }

        .nav-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 20px 24px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .nav-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .role-badge {
          display: inline-block;
          padding: 6px 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .gradient-background {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          position: relative;
          padding: 0;
          margin: 0;
          padding-top: 81px;
        }

        .gradient-background::before {
          content: '';
          position: absolute;
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

        .main-content {
          max-width: 100%;
          margin: 0;
          padding: 40px 20px 60px 20px;
          position: relative;
          z-index: 1;
        }

        .action-tiles {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .action-tile {
          background: white;
          border-radius: 10px;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #1e293b;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: 2px solid #e2e8f0;
          white-space: nowrap;
          font-size: 14px;
          font-weight: 600;
        }

        .action-tile:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          border-color: #cbd5e1;
        }

        .action-tile:active {
          transform: translateY(-1px);
        }

        .action-tile.primary:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #667eea;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .action-tile.secondary:hover {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          color: white;
          border-color: #64748b;
          box-shadow: 0 8px 24px rgba(100, 116, 139, 0.4);
        }

        .action-tile.danger:hover {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border-color: #ef4444;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
        }

        .tile-icon {
          font-size: 20px;
          transition: all 0.3s ease;
        }

        .tile-title {
          margin: 0;
        }

        .error-message {
          background: rgba(254, 226, 226, 0.95);
          backdrop-filter: blur(10px);
          color: #dc2626;
          padding: 14px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          border-left: 4px solid #dc2626;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
          position: relative;
          z-index: 1;
        }

        .flags-grid {
          display: grid;
          gap: 20px;
          list-style: none;
          padding: 0 20px;
          margin: 0;
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
        }

        .flag-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease-in-out;
          border: 1px solid rgba(255, 255, 255, 0.6);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 24px;
          align-items: center;
        }

        .flag-card:hover {
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
          transform: translateY(-3px);
          border-color: rgba(102, 126, 234, 0.4);
        }

        .flag-number {
          font-size: 36px;
          font-weight: 800;
          background: linear-gradient(135deg, #475569 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          min-width: 60px;
          text-align: center;
        }

        .flag-content {
          display: grid;
          gap: 16px;
        }

        .flag-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .flag-name {
          font-size: 19px;
          font-weight: 700;
          color: #4c1d95;
          text-decoration: none;
          transition: all 0.2s;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .flag-name:hover {
          color: #5b21b6;
          text-decoration: underline;
        }

        .flag-attributes {
          display: flex;
          gap: 40px;
          flex-wrap: wrap;
        }

        .flag-attribute {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .attribute-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #475569;
          letter-spacing: 0.8px;
        }

        .attribute-value {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .empty-state-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-state-title {
          font-size: 20px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
        }

        .empty-state-text {
          font-size: 14px;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .nav-content {
            flex-direction: column;
            gap: 12px;
          }

          .nav-left {
            flex-direction: column;
            gap: 8px;
          }

          .action-tiles {
            flex-direction: column;
            width: 100%;
          }

          .action-tile {
            width: 100%;
            justify-content: center;
          }

          .main-content {
            padding: 20px 10px 40px 10px;
          }

          .flags-grid {
            padding: 0 10px;
          }

          .flag-card {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 20px;
          }

          .flag-number {
            text-align: left;
            min-width: auto;
          }

          .flag-attributes {
            gap: 24px;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* Navigation Header */}
        <nav className="nav-header">
          <div className="nav-content">
            <div className="nav-left">
              <h1 className="page-title">Feature Flags</h1>
              {user && <span className="role-badge">{user.role}</span>}
            </div>
            
            {/* Action Tiles in Header */}
            <div className="action-tiles">
              {canEdit && (
                <Link href="/flags/new" className="action-tile primary">
                  <span className="tile-icon">➕</span>
                  <span className="tile-title">Create New Flag</span>
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin/users" className="action-tile secondary">
                  <span className="tile-icon">👥</span>
                  <span className="tile-title">Admin Panel</span>
                </Link>
              )}
              <button onClick={handleLogout} className="action-tile danger">
                <span className="tile-icon">🚪</span>
                <span className="tile-title">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Gradient Background Wrapper */}
        <div className="gradient-background">
          {/* Main Content */}
          <main className="main-content">
            {error && <div className="error-message">{error}</div>}
          
          {flags.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏴</div>
              <h2 className="empty-state-title">No Feature Flags Yet</h2>
              <p className="empty-state-text">
                {canEdit ? 'Create your first feature flag to get started' : 'No flags available to display'}
              </p>
            </div>
          ) : (
            <ul className="flags-grid">
              {flags.map((f, index) => (
                <li key={f.key} className="flag-card">
                  <div className="flag-number">{String(index + 1).padStart(2, '0')}</div>
                  <div className="flag-content">
                    <div className="flag-header">
                      <Link href={`/flags/${f.key}`} className="flag-name">
                        {f.key}
                      </Link>
                    </div>
                    <div className="flag-attributes">
                      <div className="flag-attribute">
                        <span className="attribute-label">Version</span>
                        <span className="attribute-value">v{f.version}</span>
                      </div>
                      <div className="flag-attribute">
                        <span className="attribute-label">Type</span>
                        <span className="attribute-value">{f.type}</span>
                      </div>
                      <div className="flag-attribute">
                        <span className="attribute-label">Status</span>
                        <span className="attribute-value">Active</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          </main>
        </div>
      </div>
    </>
  );
}
