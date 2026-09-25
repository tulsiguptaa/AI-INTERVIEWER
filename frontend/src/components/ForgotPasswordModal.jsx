import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, X, Sparkles, AlertCircle } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);

    // Simulate sending recovery link
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  const handleReset = () => {
    setSubmitted(false);
    setEmail('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {!submitted ? (
          <div className="modal-body">
            <div className="modal-icon-badge">
              <Sparkles size={20} />
            </div>
            <h3 className="modal-title">Reset Your Password</h3>
            <p className="modal-desc">
              Enter your student account email address below. We'll send you an encrypted link to reset your credentials.
            </p>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '14px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Student Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    className="form-input"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-sm"></div>
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Instructions</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="modal-body text-center">
            <div className="modal-icon-badge success">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="modal-title">Check Your Inbox</h3>
            <p className="modal-desc">
              If an account exists for <strong style={{ color: 'var(--text-main)' }}>{email}</strong>, you will receive password reset instructions shortly.
            </p>
            <div className="modal-notice-box">
              <span>💡 Please check your spam folder if it doesn't arrive within 2 minutes.</span>
            </div>
            <button
              type="button"
              className="btn-primary full-width"
              onClick={handleReset}
              style={{ marginTop: '16px' }}
            >
              Return to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
