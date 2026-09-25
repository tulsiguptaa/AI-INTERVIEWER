import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function Login({ onSwitchToSignup, onLoginSuccess }) {
  const [formData, setFormData] = useState({
    student_email: '',
    student_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleQuickDemo = () => {
    setFormData({
      student_email: 'alex.candidate@example.com',
      student_password: 'Candidate2026!',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.student_email.trim() || !formData.student_password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/accounts/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_email: formData.student_email.trim(),
          student_password: formData.student_password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid email or password. Please verify your credentials.');
      }

      setSuccess('Authentication successful! Loading your dashboard...');
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      }, 700);
    } catch (err) {
      setError(err.message || 'Connection error: Ensure the backend server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="intervue-form" onSubmit={handleSubmit} noValidate>
        {/* Subtle quick demo pill for testing */}
        <div className="intervue-demo-row">
          <button
            type="button"
            className="intervue-demo-pill"
            onClick={handleQuickDemo}
            title="Auto-fill sample credentials"
          >
            <Zap size={12} className="demo-zap" />
            <span>Fill demo account</span>
          </button>
        </div>

        {error && (
          <div className="intervue-alert intervue-alert-error" role="alert">
            <AlertCircle size={16} className="alert-icon" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="intervue-alert intervue-alert-success" role="status">
            <CheckCircle2 size={16} className="alert-icon" />
            <span>{success}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="intervue-field">
          <label className="intervue-label" htmlFor="login_email">
            Email
          </label>
          <div className="intervue-input-box">
            <span className="intervue-input-icon">
              <Mail size={17} />
            </span>
            <input
              id="login_email"
              name="student_email"
              type="email"
              className="intervue-input"
              placeholder="you@example.com"
              value={formData.student_email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="intervue-field">
          <div className="intervue-label-row">
            <label className="intervue-label" htmlFor="login_password">
              Password
            </label>
            <button
              type="button"
              className="intervue-forgot-btn"
              onClick={() => setForgotModalOpen(true)}
            >
              Forgot password?
            </button>
          </div>
          <div className="intervue-input-box">
            <span className="intervue-input-icon">
              <Lock size={17} />
            </span>
            <input
              id="login_password"
              name="student_password"
              type={showPassword ? 'text' : 'password'}
              className="intervue-input"
              placeholder="Enter your password"
              value={formData.student_password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="intervue-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {/* Keep Me Signed In Checkbox */}
        <label className="intervue-checkbox-row">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span className="intervue-custom-checkbox"></span>
          <span className="intervue-checkbox-text">Keep me signed in</span>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          className="intervue-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="intervue-spinner"></div>
              <span>Signing in...</span>
            </>
          ) : (
            'Sign in'
          )}
        </button>

        {/* Divider */}
        <div className="intervue-divider">
          <span>or continue with</span>
        </div>

        {/* Social SSO Grid */}
        <div className="intervue-social-grid">
          <button
            type="button"
            className="intervue-social-btn"
            onClick={async () => {
              try {
                const res = await fetch('http://127.0.0.1:8000/api/accounts/google/status/');
                const data = await res.json();
                if (!data.configured) {
                  setError('Google Client ID is missing. Please save GOOGLE_CLIENT_ID in your .env file and save it (Ctrl+S).');
                  return;
                }
              } catch (_) {}
              window.location.href = 'http://127.0.0.1:8000/accounts/google/login/';
            }}
          >
            <svg className="social-icon" width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            className="intervue-social-btn"
            onClick={() => {
              setError('GitHub SSO integration ready in production tier.');
            }}
          >
            <svg className="social-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path
                fill="#ffffff"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Switch Link */}
        <div className="intervue-switch-row">
          <span>Don't have an account?</span>
          <button
            type="button"
            className="intervue-switch-btn"
            onClick={onSwitchToSignup}
          >
            Sign up
          </button>
        </div>
      </form>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        initialEmail={formData.student_email}
      />
    </>
  );
}
