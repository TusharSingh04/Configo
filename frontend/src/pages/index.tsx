import { useEffect, useState } from 'react';
import { auth } from '../lib/api';
import { setToken, clearToken } from '../lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const [gsiError, setGsiError] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!clientId) {
      // Don't show error if client ID is not set - Google Sign-In is optional
      return;
    }
    
    // Dynamically load Google Identity Services if not present
    const existing = document.getElementById('google-identity-services');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Wait a moment for google object to be available
        setTimeout(() => {
          if (window.google?.accounts?.id) {
            setGsiReady(true);
            setGsiError(null);
          }
        }, 100);
      };
      script.onerror = () => {
        // Silently fail - Google Sign-In is optional
        setGsiError(null);
        setGsiReady(false);
      };
      document.body.appendChild(script);
    } else {
      // Script already exists
      if (window.google?.accounts?.id) {
        setGsiReady(true);
        setGsiError(null);
      }
    }
  }, [clientId]);

  useEffect(() => {
    // Render the Google button once the library is ready
    if (!gsiReady || !clientId) return;
    
    const target = document.getElementById('google-signin-button');
    if (window.google?.accounts?.id && target && target.children.length === 0) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSignIn,
        });
        window.google.accounts.id.renderButton(target, { theme: 'outline', size: 'large', width: 320 });
      } catch (err) {
        // Silently fail if initialization fails
        console.error('Google Sign-In error:', err);
      }
    }
  }, [gsiReady, clientId]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { token } = await auth.login(email, password);
      setToken(token);
      router.push('/flags');
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await auth.signup(email, password, role);
      setSuccess('Signup successful! Your request is pending admin approval. You will be notified once approved.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('viewer');
      setTimeout(() => setMode('login'), 3000);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }

  async function handleGoogleSignIn(response: any) {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { token } = await auth.googleSignIn(response.credential);
      setToken(token);
      router.push('/flags');
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }

  return (
    <>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .auth-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          padding: 20px;
        }
        
        .auth-card {
          max-width: 400px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 28px 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease-in-out;
        }
        
        .auth-card:hover {
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
          transform: translateY(-4px);
        }
        
        .header-section {
          text-align: center;
          margin-bottom: 24px;
        }
        
        .header-title {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 6px;
        }
        
        .header-subtitle {
          color: #666;
          font-size: 14px;
        }
        
        .mode-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          background: #f5f5f5;
          padding: 4px;
          border-radius: 8px;
        }
        
        .mode-button {
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: transparent;
          color: #666;
          cursor: pointer;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s ease-in-out;
        }
        
        .mode-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .mode-button:hover:not(.active) {
          background: #e8e8e8;
        }
        
        .form-container {
          display: grid;
          gap: 14px;
        }
        
        .form-label {
          display: grid;
          gap: 5px;
        }
        
        .form-label span {
          font-weight: 500;
          font-size: 13px;
          color: #333;
        }
        
        .form-input {
          padding: 10px 12px;
          border-radius: 8px;
          border: 2px solid #e0e0e0;
          font-size: 14px;
          transition: all 0.25s ease-in-out;
          background: white;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }
        
        .form-input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }
        
        .form-select {
          padding: 10px 12px;
          border-radius: 8px;
          border: 2px solid #e0e0e0;
          font-size: 14px;
          transition: all 0.25s ease-in-out;
          background: white;
          cursor: pointer;
        }
        
        .form-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .submit-button {
          padding: 11px 16px;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.25s ease-in-out;
          margin-top: 4px;
        }
        
        .submit-button.login {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .submit-button.signup {
          background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
        }
        
        .submit-button:hover:not(:disabled) {
          transform: scale(1.02) translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        .submit-button:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        .submit-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }
        
        .divider {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
        }
        
        .divider-text {
          text-align: center;
          margin-bottom: 14px;
          color: #666;
          font-size: 13px;
        }
        
        .google-button-container {
          display: flex;
          justify-content: center;
          min-height: 44px;
        }
        
        .google-button-container :global(div) {
          transition: transform 0.2s ease-in-out;
        }
        
        .google-button-container :global(div:hover) {
          transform: scale(1.02);
        }
        
        .message {
          margin-top: 10px;
          text-align: center;
          padding: 8px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
        }
        
        .message.error {
          color: #d32f2f;
          background: rgba(211, 47, 47, 0.1);
        }
        
        .message.success {
          color: #388e3c;
          background: rgba(56, 142, 60, 0.1);
        }
        
        .clear-session-container {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .clear-session-button {
          padding: 8px 18px;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          cursor: pointer;
          color: #333;
          font-weight: 500;
          font-size: 13px;
          transition: all 0.25s ease-in-out;
        }
        
        .clear-session-button:hover {
          background: white;
          border-color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .note-text {
          margin-top: 8px;
          color: #888;
          font-size: 12px;
          text-align: center;
        }
        
        .note-text small {
          color: #666;
          font-size: 13px;
        }
      `}</style>
      
      <main className="auth-container">
        <div className="auth-card">
          <div className="header-section">
            <h1 className="header-title">Welcome to Configo</h1>
            <p className="header-subtitle">Feature flag management made simple</p>
          </div>

          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              className={`mode-button ${mode === 'login' ? 'active' : ''}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
              className={`mode-button ${mode === 'signup' ? 'active' : ''}`}
            >
              Create Account
            </button>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={onLogin} className="form-container">
              <label className="form-label">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  className="form-input"
                  placeholder="you@example.com"
                />
              </label>
              <label className="form-label">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="form-input"
                  placeholder="••••••"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="submit-button login"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={onSignup} className="form-container">
              <label className="form-label">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  className="form-input"
                  placeholder="you@example.com"
                />
              </label>
              <label className="form-label">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="form-input"
                  placeholder="••••••"
                />
              </label>
              <label className="form-label">
                <span>Confirm Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="form-input"
                  placeholder="••••••"
                />
              </label>
              <label className="form-label">
                <span>Requested Role</span>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'viewer' | 'editor')}
                  disabled={loading}
                  className="form-select"
                >
                  <option value="viewer">Viewer (read-only access)</option>
                  <option value="editor">Editor (can edit flags)</option>
                </select>
                <small className="note-text">Your role request will be reviewed by an admin.</small>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="submit-button signup"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Error/Success Messages */}
          {error && <div className="message error">{error}</div>}
          {success && <div className="message success">{success}</div>}

          {/* Google Sign-In */}
          {clientId && (
            <div className="divider">
              <p className="divider-text">Or continue with Google</p>
              <div id="google-signin-button" className="google-button-container"></div>
              <p className="note-text">
                Note: Google sign-ins remain pending until an admin approves your account.
              </p>
            </div>
          )}
        </div>

        <div className="clear-session-container">
          <button
            onClick={() => { clearToken(); window.location.reload(); }}
            className="clear-session-button"
          >
            Clear Session
          </button>
        </div>

        <script src="https://accounts.google.com/gapi/client" async defer></script>
      </main>
    </>
  );
}
