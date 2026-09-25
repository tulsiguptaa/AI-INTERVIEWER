import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  LogOut,
  Play,
  BarChart3,
  BookOpen,
  Clock,
  ArrowUpRight,
  Flame,
  ChevronRight
} from 'lucide-react';

export default function StudentDashboard({ user, onLogout }) {
  const [mockStarted, setMockStarted] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="dashboard-container">
      {/* Top Profile Bar */}
      <div className="dashboard-profile-header">
        <div className="profile-identity">
          <div className="profile-avatar-large">
            {getInitials(user?.student_name)}
            <span className="avatar-online-dot"></span>
          </div>
          <div className="profile-text">
            <div className="profile-name-row">
              <h2 className="profile-name">{user?.student_name || 'Student Candidate'}</h2>
              <span className="pro-badge">
                <Sparkles size={12} />
                <span>Pro Student</span>
              </span>
            </div>
            <p className="profile-email">{user?.student_email}</p>
          </div>
        </div>

        <button
          type="button"
          className="btn-signout"
          onClick={onLogout}
          title="Sign out of student portal"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Readiness Index & Streak Card */}
      <div className="readiness-card">
        <div className="readiness-left">
          <div className="readiness-badge">
            <Flame size={14} className="flame-icon" />
            <span>4-Day Practice Streak</span>
          </div>
          <h3 className="readiness-title">Interview Readiness: 86%</h3>
          <p className="readiness-sub">
            You're performing in the <strong>Top 8%</strong> of candidates targeting Tier-1 tech companies.
          </p>

          <div className="readiness-mini-tags">
            <span className="readiness-tag">System Design: 92%</span>
            <span className="readiness-tag">Data Structures: 84%</span>
            <span className="readiness-tag">Behavioral STAR: 88%</span>
          </div>
        </div>

        <div className="readiness-circular-visual">
          <svg className="radial-progress" viewBox="0 0 100 100">
            <circle
              className="radial-bg"
              cx="50"
              cy="50"
              r="40"
            />
            <circle
              className="radial-fill"
              cx="50"
              cy="50"
              r="40"
              strokeDasharray="251.2"
              strokeDashoffset="35.1"
            />
          </svg>
          <div className="radial-text">
            <span className="radial-number">86%</span>
            <span className="radial-label">Readiness</span>
          </div>
        </div>
      </div>

      {/* Primary Action Section */}
      <div className="launchpad-grid">
        <div className="launch-card primary-card">
          <div className="launch-card-header">
            <div className="card-icon-pill">
              <Play size={18} />
            </div>
            <span className="card-status-badge">Ready to Start</span>
          </div>
          <h4 className="card-heading">Launch AI Mock Session</h4>
          <p className="card-body-text">
            Engage in a live voice or text mock interview with adaptive follow-up questions and instant rubric scorecards.
          </p>

          {mockStarted ? (
            <div className="mock-session-active">
              <span className="pulse-indicator"></span>
              <span>Connecting to AI Interview Engine...</span>
            </div>
          ) : (
            <button
              type="button"
              className="btn-launch-primary"
              onClick={() => setMockStarted(true)}
            >
              <span>Begin Session Now</span>
              <ArrowUpRight size={16} />
            </button>
          )}
        </div>

        <div className="launch-card secondary-card">
          <div className="launch-card-header">
            <div className="card-icon-pill secondary">
              <BarChart3 size={18} />
            </div>
            <span className="card-metric">+6.4% this week</span>
          </div>
          <h4 className="card-heading">Diagnostics & Transcripts</h4>
          <p className="card-body-text">
            Review your past mock sessions, AI-generated critique notes, speech pacing metrics, and architectural weaknesses.
          </p>
          <div className="card-link-action">
            <span>View 7 past reports</span>
            <ChevronRight size={15} />
          </div>
        </div>

        <div className="launch-card secondary-card">
          <div className="launch-card-header">
            <div className="card-icon-pill secondary">
              <BookOpen size={18} />
            </div>
            <span className="card-metric">320+ problems</span>
          </div>
          <h4 className="card-heading">FAANG Question Bank</h4>
          <p className="card-body-text">
            Curated question archives verified by staff interviewers at Google, Meta, Apple, Amazon, and Stripe.
          </p>
          <div className="card-link-action">
            <span>Explore question pool</span>
            <ChevronRight size={15} />
          </div>
        </div>
      </div>

      {/* Account Info Pill Footer */}
      <div className="dashboard-account-meta">
        <div className="meta-item">
          <ShieldCheck size={16} className="text-emerald" />
          <span>Encrypted Session Active</span>
        </div>
        <div className="meta-item">
          <Clock size={16} />
          <span>Last active: Just now</span>
        </div>
        <div className="meta-item">
          <span>Student ID: #{user?.id || 1042}</span>
        </div>
      </div>
    </div>
  );
}
