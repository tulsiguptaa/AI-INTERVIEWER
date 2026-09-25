import React, { useState, useMemo } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Check, X } from 'lucide-react';

export default function Signup({ onSwitchToLogin, onSignupSuccess }) {
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    student_password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = formData.student_password;
    if (!pwd) return { score: 0, text: 'No password', color: 'gray' };

    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, text: 'Weak', color: '#ef4444' };
      case 2:
        return { score: 2, text: 'Fair', color: '#f59e0b' };
      case 3:
        return { score: 3, text: 'Good', color: '#3b82f6' };
      case 4:
        return { score: 4, text: 'Strong', color: '#10b981' };
      default:
        return { score: 1, text: 'Weak', color: '#ef4444' };
    }
  }, [formData.student_password]);

  const passwordsMatch = formData.confirm_password.length > 0 && formData.student_password === formData.confirm_password;
  const passwordsMismatch = formData.confirm_password.length > 0 && formData.student_password !== formData.confirm_password;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.student_name.trim() || !formData.student_email.trim() || !formData.student_password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.student_password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.student_password !== formData.confirm_password) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms of Service to create your account.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/accounts/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: formData.student_name.trim(),
          student_email: formData.student_email.trim().toLowerCase(),
          student_password: formData.student_password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create student account. Please try again.');
      }

      setSuccess('Account created successfully! Preparing your student workspace...');
      setTimeout(() => {
        if (onSignupSuccess) {
          onSignupSuccess(data.user);
        } else {
          onSwitchToLogin();
        }
      }, 900);
    } catch (err) {
      setError(err.message || 'Connection error: Backend server is unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="intervue-form" onSubmit={handleSubmit} noValidate>
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

      {/* Full Name */}
      <div className="intervue-field">
        <label className="intervue-label" htmlFor="signup_name">
          Full Name
        </label>
        <div className="intervue-input-box">
          <span className="intervue-input-icon">
            <User size={17} />
          </span>
          <input
            id="signup_name"
            name="student_name"
            type="text"
            className="intervue-input"
            placeholder="Maya Lin"
            value={formData.student_name}
            onChange={handleChange}
            autoComplete="name"
            required
          />
        </div>
      </div>

      {/* Email Address */}
      <div className="intervue-field">
        <label className="intervue-label" htmlFor="signup_email">
          Email
        </label>
        <div className="intervue-input-box">
          <span className="intervue-input-icon">
            <Mail size={17} />
          </span>
          <input
            id="signup_email"
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

      {/* Password with Strength Meter */}
      <div className="intervue-field">
        <div className="intervue-label-row">
          <label className="intervue-label" htmlFor="signup_password">
            Password
          </label>
          {formData.student_password && (
            <span className="strength-label" style={{ color: passwordStrength.color }}>
              {passwordStrength.text}
            </span>
          )}
        </div>
        <div className="intervue-input-box">
          <span className="intervue-input-icon">
            <Lock size={17} />
          </span>
          <input
            id="signup_password"
            name="student_password"
            type={showPassword ? 'text' : 'password'}
            className="intervue-input"
            placeholder="Enter your password"
            value={formData.student_password}
            onChange={handleChange}
            autoComplete="new-password"
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

        {/* Dynamic 4-Segment Strength Bar */}
        {formData.student_password && (
          <div className="strength-meter-bar">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className="strength-step"
                style={{
                  backgroundColor: step <= passwordStrength.score ? passwordStrength.color : 'rgba(255,255,255,0.08)',
                }}
              ></div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="intervue-field">
        <div className="intervue-label-row">
          <label className="intervue-label" htmlFor="confirm_password">
            Confirm Password
          </label>
          {passwordsMatch && (
            <span className="match-tag text-emerald">
              <Check size={12} />
              <span>Match</span>
            </span>
          )}
          {passwordsMismatch && (
            <span className="match-tag text-rose">
              <X size={12} />
              <span>Mismatch</span>
            </span>
          )}
        </div>
        <div className="intervue-input-box">
          <span className="intervue-input-icon">
            <Lock size={17} />
          </span>
          <input
            id="confirm_password"
            name="confirm_password"
            type={showPassword ? 'text' : 'password'}
            className={`intervue-input ${passwordsMismatch ? 'border-error' : ''}`}
            placeholder="Confirm your password"
            value={formData.confirm_password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      {/* Terms & Privacy Agreement */}
      <label className="intervue-checkbox-row">
        <input
          type="checkbox"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
        />
        <span className="intervue-custom-checkbox"></span>
        <span className="intervue-checkbox-text">
          I agree to the Terms of Service & Privacy Policy
        </span>
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
            <span>Creating account...</span>
          </>
        ) : (
          'Sign up'
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
          onClick={async () => {
            try {
              const res = await fetch('http://127.0.0.1:8000/api/accounts/github/status/');
              const data = await res.json();
              if (!data.configured) {
                setError('GitHub Client ID or Secret is missing. Please save GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your backend/.env file.');
                return;
              }
            } catch (_) {}
            window.location.href = 'http://127.0.0.1:8000/accounts/github/login/';
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

      {/* Switch to Login */}
      <div className="intervue-switch-row">
        <span>Already have an account?</span>
        <button
          type="button"
          className="intervue-switch-btn"
          onClick={onSwitchToLogin}
        >
          Sign in
        </button>
      </div>
    </form>
  );
}
