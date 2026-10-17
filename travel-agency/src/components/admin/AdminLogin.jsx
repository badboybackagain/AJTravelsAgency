import React, { useState } from 'react';
import { authApi } from '../../services/api';
import { Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';

export const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      const resData = response.data.data || response.data;
      const { token, user } = resData;

      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminEmail', user?.email || email);
      localStorage.setItem('adminUser', JSON.stringify(user));
      
      if (onLoginSuccess) {
        onLoginSuccess(user);
      } else {
        window.location.href = '/admin/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-badge">
            <ShieldAlert size={18} color="#0284C7" />
            <span>ADMINISTRATOR ACCESS</span>
          </div>
          <h2>AJ Travel Agency</h2>
          <p>Executive Control Panel & Fleet Management</p>
        </div>

        {error && (
          <div className="admin-error-alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form" autoComplete="off">
          {/* Prevent browser from automatically prefilling saved credentials */}
          <input type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" readOnly />
          <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" readOnly />

          <div className="form-group">
            <label>Admin Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                name="admin_login_user"
                id="admin_login_user"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ajtravelagency.in"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                name="admin_login_pass"
                id="admin_login_pass"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-admin-submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Control Center'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      <style>{`
        .admin-login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F8FAFC;
          padding: 2rem;
          font-family: var(--font-body, system-ui, sans-serif);
        }

        .admin-login-card {
          width: 100%;
          max-width: 440px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04);
          color: #0F172A;
        }

        .admin-login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.85rem;
          background: #F0F9FF;
          border: 1px solid #BAE6FD;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #0284C7;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }

        .admin-login-header h2 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.4rem;
        }

        .admin-login-header p {
          font-size: 0.875rem;
          color: #64748B;
        }

        .admin-error-alert {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #B91C1C;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .admin-login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .form-group label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: #94A3B8;
        }

        .input-with-icon input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.8rem;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          color: #0F172A;
          font-size: 0.9375rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .input-with-icon input:focus {
          border-color: #0284C7;
          background: #FFFFFF;
        }

        .btn-admin-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.9rem;
          background: #0284C7;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
        }

        .btn-admin-submit:hover:not(:disabled) {
          background: #0369A1;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
        }

        .btn-admin-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
