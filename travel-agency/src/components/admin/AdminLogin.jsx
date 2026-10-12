import React, { useState } from 'react';
import { authApi } from '../../services/api';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle } from 'lucide-react';

export const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@punemumbaitravels.in');
  const [password, setPassword] = useState('Admin@123456');
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
            <ShieldAlert size={20} color="#0099FF" />
            <span>ADMINISTRATOR ACCESS</span>
          </div>
          <h2>Pune ↔ Mumbai Travel</h2>
          <p>Control Panel & Dynamic Fare Management System</p>
        </div>

        {error && (
          <div className="admin-error-alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label>Admin Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@punemumbaitravels.in"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-admin-submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Admin Portal'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="admin-demo-notice">
          <CheckCircle size={14} color="#10B981" />
          <span>Default Credentials Loaded for Dev Testing</span>
        </div>
      </div>

      <style>{`
        .admin-login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0B132B;
          padding: 2rem;
          font-family: var(--font-body, system-ui, sans-serif);
        }

        .admin-login-card {
          width: 100%;
          max-width: 440px;
          background: #1C2541;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          color: #FFFFFF;
        }

        .admin-login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.8rem;
          background: rgba(0, 153, 255, 0.15);
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #38BDF8;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }

        .admin-login-header h2 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 0.5rem;
        }

        .admin-login-header p {
          font-size: 0.9rem;
          color: #94A3B8;
        }

        .admin-error-alert {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid #EF4444;
          color: #FCA5A5;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .admin-login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #CBD5E1;
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
          color: #64748B;
        }

        .input-with-icon input {
          width: 100%;
          padding: 0.9rem 1rem 0.9rem 2.8rem;
          background: #0F172A;
          border: 1px solid #334155;
          border-radius: 12px;
          color: #FFFFFF;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .input-with-icon input:focus {
          border-color: #38BDF8;
        }

        .btn-admin-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 1rem;
          background: linear-gradient(135deg, #0099FF 0%, #0066FF 100%);
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 0.5rem;
        }

        .btn-admin-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 153, 255, 0.4);
        }

        .btn-admin-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-demo-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          font-size: 0.8rem;
          color: #64748B;
        }
      `}</style>
    </div>
  );
};
