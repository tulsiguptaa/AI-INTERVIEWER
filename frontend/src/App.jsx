import React, { useState, useEffect } from 'react';
import { Mic, Shield } from 'lucide-react';
import Login from './components/Login';
import Signup from './components/Signup';
import StudentDashboard from './components/StudentDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ai_interviewer_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('ai_interviewer_user');
      return null;
    }
  });

  // Handle direct navigation to /admin or /admin/
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = 'http://127.0.0.1:8000/admin/';
    }
  }, []);

  // Check if session exists (e.g. from Google OAuth callback redirect)
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/accounts/me/', {
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('ai_interviewer_user', JSON.stringify(data.user));
          if (window.location.search.includes('login=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('ai_interviewer_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ai_interviewer_user');
    setActiveTab('login');
  };

  if (window.location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="app-root">
      {currentUser ? (
        /* Authenticated Student Dashboard */
        <div className="dashboard-wrapper">
          <StudentDashboard user={currentUser} onLogout={handleLogout} />
        </div>
      ) : (
        /* Intervue Centered Authentication Portal */
        <div className="intervue-auth-page">
          {/* Subtle Ambient Glows */}
          <div className="ambient-glow-top-left"></div>
          <div className="ambient-glow-center"></div>

          {/* Top Brand Logo & Header */}
          <div className="intervue-brand-header">
            <div className="intervue-logo-box">
              <Mic size={22} className="intervue-mic-icon" />
            </div>
            <h1 className="intervue-brand-title">Intervue</h1>
          </div>

          {/* Centered Auth Card */}
          <div className="intervue-card">
            {/* Header / Greeting */}
            <div className="intervue-card-header">
              <h2 className="intervue-card-title">
                {activeTab === 'login' ? (
                  <>
                    Welcome <span className="cursive-script">back</span>
                  </>
                ) : (
                  <>
                    Create an <span className="cursive-script">account</span>
                  </>
                )}
              </h2>
              <p className="intervue-card-subtitle">
                {activeTab === 'login'
                  ? 'Sign in to continue your practice'
                  : 'Sign up to continue your practice'}
              </p>
            </div>

            {/* Segmented Dual Tab Switcher */}
            <div className="intervue-tabs-container" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'login'}
                className={`intervue-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'signup'}
                className={`intervue-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => setActiveTab('signup')}
              >
                Sign up
              </button>
            </div>

            {/* Form Component */}
            <div className="intervue-form-wrapper">
              {activeTab === 'login' ? (
                <Login
                  onSwitchToSignup={() => setActiveTab('signup')}
                  onLoginSuccess={handleLoginSuccess}
                />
              ) : (
                <Signup
                  onSwitchToLogin={() => setActiveTab('login')}
                  onSignupSuccess={handleLoginSuccess}
                />
              )}
            </div>

            {/* Bottom Security Trust Badge */}
            <div className="intervue-trust-badge">
              <Shield size={14} className="intervue-trust-icon" />
              <span>Bank-grade encryption. Your data stays private.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
