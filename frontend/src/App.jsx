import React, { useState, useEffect } from 'react';
import { Mic, Shield, ArrowLeft } from 'lucide-react';
import Login from './components/Login';
import Signup from './components/Signup';
import StudentDashboard from './components/StudentDashboard';
import HomePage from './components/HomePage';
import ResumeUpload from './components/ResumeUpload';
import { apiFetch, saveAuthSession, clearAuthSession } from './services/api';

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

  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upload') || params.get('resume') || params.get('view') === 'upload') {
      return 'upload-resume';
    }
    if (params.get('auth') || params.get('login')) {
      return 'auth';
    }
    const savedUser = localStorage.getItem('ai_interviewer_user');
    return savedUser ? 'dashboard' : 'home';
  });

  // Handle direct navigation to /admin or /admin/
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = 'http://127.0.0.1:8000/admin/';
    }
  }, []);

  // Check if session exists (e.g. from Google or GitHub OAuth callback redirect or existing session)
  useEffect(() => {
    apiFetch('/accounts/me/')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
          saveAuthSession(data.user, data.session_key);
          if (view !== 'upload-resume') {
            setView('dashboard');
          }
          if (window.location.search.includes('login=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (window.location.search.includes('login=')) {
          // Clean up query param if login was cancelled or errored
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenAuth = (mode = 'login') => {
    setActiveTab(mode);
    setView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    saveAuthSession(user);
    setView('dashboard');
  };

  const handleLogout = () => {
    apiFetch('/accounts/logout/', {
      method: 'POST',
    }).catch(() => {});
    setCurrentUser(null);
    clearAuthSession();
    setActiveTab('login');
    setView('home');
  };

  if (window.location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="app-root">
      {view === 'home' && (
        <HomePage
          onOpenAuth={handleOpenAuth}
          currentUser={currentUser}
          onGoToDashboard={() => setView('dashboard')}
          onOpenUpload={() => setView('upload-resume')}
        />
      )}

      {view === 'dashboard' && currentUser && (
        <div className="dashboard-wrapper">
          <StudentDashboard
            user={currentUser}
            onLogout={handleLogout}
            onViewHome={() => setView('home')}
            onOpenUpload={() => setView('upload-resume')}
          />
        </div>
      )}

      {view === 'upload-resume' && (
        <ResumeUpload
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onBack={() => setView(currentUser ? 'dashboard' : 'home')}
          onUploadSuccess={(fileData) => {
            console.log('Resume uploaded successfully:', fileData);
          }}
        />
      )}

      {view === 'auth' && (
        <div className="intervue-auth-page">
          {/* Subtle Ambient Glows */}
          <div className="ambient-glow-top-left"></div>
          <div className="ambient-glow-center"></div>

          {/* Return to Home / Overview Navigation Bar */}
          <div className="auth-nav-bar">
            <button
              type="button"
              className="auth-back-btn"
              onClick={() => setView('home')}
            >
              <ArrowLeft size={15} />
              <span>Back to Overview</span>
            </button>
          </div>

          {/* Top Brand Logo & Header */}
          <div className="intervue-brand-header">
            <div className="intervue-logo-box">
              <Mic size={22} className="intervue-mic-icon" />
            </div>
            <h1 className="intervue-brand-title">AI Interviewer</h1>
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
