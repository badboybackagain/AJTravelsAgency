import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, LogIn, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';

export const CustomerAuthModal = ({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setError('');
    setSuccessMsg('');
    setLoginEmail('');
    setLoginPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPhone('');
    setSignupPassword('');
  };

  const handleSwitchMode = (newMode) => {
    setError('');
    setSuccessMsg('');
    setMode(newMode);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginEmail || !loginPassword) {
      setError('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (res.data?.success && res.data?.data) {
        const { token, user } = res.data.data;
        localStorage.setItem('customerToken', token);
        localStorage.setItem('customerUser', JSON.stringify(user));
        
        setSuccessMsg('Logged in successfully!');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(user);
          handleClose();
        }, 600);
      } else {
        setError(res.data?.message || 'Failed to login. Please check your credentials.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!signupEmail || !signupPassword) {
      setError('Email and Password are required.');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.signup({
        name: signupName.trim(),
        email: signupEmail.trim(),
        phone: signupPhone.trim(),
        password: signupPassword,
      });

      if (res.data?.success && res.data?.data) {
        const { token, user } = res.data.data;
        localStorage.setItem('customerToken', token);
        localStorage.setItem('customerUser', JSON.stringify(user));

        setSuccessMsg('Account created successfully! You are now logged in.');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(user);
          handleClose();
        }, 800);
      } else {
        setError(res.data?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Email may already be registered.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal-content light-blue-theme" onClick={(e) => e.stopPropagation()}>
        {/* Decorative Top Accent Bar */}
        <div className="auth-accent-bar" />

        {/* Modal Close Button */}
        <button className="auth-modal-close" onClick={handleClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-logo-badge">
            <User size={22} color="#FFFFFF" />
          </div>
          <h2 className="auth-modal-title">
            {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="auth-modal-subtitle">
            {mode === 'login'
              ? 'Sign in to access your cab bookings'
              : 'Quick sign up for smooth cab bookings'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="auth-tab-group">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('login')}
          >
            <LogIn size={14} />
            <span>Login</span>
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('signup')}
          >
            <UserPlus size={14} />
            <span>Register</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="auth-alert alert-success">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="auth-alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="auth-input-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={16} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner">Logging in...</span>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Login to Account</span>
                </>
              )}
            </button>

            <div className="auth-footer-prompt">
              Don't have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => handleSwitchMode('signup')}
              >
                Register Account
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="auth-form compact-signup-form">
            {/* 2-Column Row for Name & Phone on larger screens, compact stack on mobile */}
            <div className="auth-form-row">
              <div className="auth-input-group">
                <label htmlFor="signup-name">Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={16} />
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Rahul Sharma"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="signup-phone">Mobile Number</label>
                <div className="input-wrapper">
                  <Phone className="input-icon" size={16} />
                  <input
                    id="signup-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="signup-email">Email Address *</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={16} />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="name@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="signup-password">Password * (min 6 chars)</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Choose password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner">Creating Account...</span>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Register & Create Account</span>
                </>
              )}
            </button>

            <div className="auth-footer-prompt">
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => handleSwitchMode('login')}
              >
                Log In
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .auth-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
          animation: fadeIn 0.2s ease-out;
        }

        .auth-modal-content.light-blue-theme {
          position: relative;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 18px;
          padding: 1.6rem 1.5rem 1.4rem;
          box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.25), 0 0 20px rgba(37, 99, 235, 0.12);
          color: #0F172A;
          animation: scaleUp 0.2s ease-out;
        }

        .auth-modal-content::-webkit-scrollbar {
          width: 4px;
        }
        .auth-modal-content::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }

        .auth-accent-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%);
        }

        .auth-modal-close {
          position: absolute;
          top: 0.85rem;
          right: 0.85rem;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .auth-modal-close:hover {
          background: #FEE2E2;
          color: #DC2626;
          border-color: #FCA5A5;
        }

        .auth-modal-header {
          text-align: center;
          margin-bottom: 1.1rem;
        }

        .auth-logo-badge {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 0.6rem;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
        }

        .auth-modal-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 0.2rem;
          line-height: 1.2;
        }

        .auth-modal-subtitle {
          font-size: 0.8rem;
          color: #64748B;
          margin: 0;
          line-height: 1.3;
        }

        .auth-tab-group {
          display: flex;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 1rem;
        }

        .auth-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.5rem;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: #64748B;
          font-weight: 700;
          font-size: 0.84rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .auth-tab.active {
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.25);
        }

        .auth-alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.85rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 0.9rem;
        }

        .alert-success {
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          color: #166534;
        }

        .alert-error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #991B1B;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .auth-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }

        .auth-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .auth-input-group label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 0.75rem;
          color: #94A3B8;
          pointer-events: none;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.58rem 0.75rem 0.58rem 2.35rem;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 9px;
          color: #0F172A;
          font-size: 0.88rem;
          transition: all 0.2s;
        }

        .input-wrapper input:focus {
          outline: none;
          background: #FFFFFF;
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
        }

        .password-toggle {
          position: absolute;
          right: 0.65rem;
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.2rem;
        }

        .password-toggle:hover {
          color: #475569;
        }

        .auth-submit-btn {
          margin-top: 0.3rem;
          width: 100%;
          padding: 0.72rem;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .auth-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }

        .auth-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-footer-prompt {
          text-align: center;
          font-size: 0.8rem;
          color: #64748B;
          margin-top: 0.2rem;
        }

        .auth-link-btn {
          background: transparent;
          border: none;
          color: #2563EB;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          margin-left: 0.15rem;
        }

        .auth-link-btn:hover {
          color: #1D4ED8;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 480px) {
          .auth-modal-content.light-blue-theme {
            padding: 1.25rem 1rem 1.1rem;
            border-radius: 16px;
          }
          .auth-form-row {
            grid-template-columns: 1fr;
            gap: 0.6rem;
          }
          .auth-logo-badge {
            width: 36px;
            height: 36px;
            margin-bottom: 0.4rem;
            border-radius: 10px;
          }
          .auth-modal-title {
            font-size: 1.2rem;
          }
          .auth-modal-subtitle {
            font-size: 0.76rem;
          }
          .auth-input-group label {
            font-size: 0.68rem;
          }
          .input-wrapper input {
            padding: 0.52rem 0.65rem 0.52rem 2.2rem;
            font-size: 0.85rem;
          }
          .auth-submit-btn {
            padding: 0.65rem;
            font-size: 0.86rem;
          }
        }
      `}</style>
    </div>
  );
};
