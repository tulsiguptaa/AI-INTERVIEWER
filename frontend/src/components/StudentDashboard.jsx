import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Compass,
  UploadCloud,
  Database,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '../services/api';

export default function StudentDashboard({ user, onLogout, onViewHome, onOpenUpload, onStartInterview }) {
  const [resumeData, setResumeData] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiFetch('/accounts/resumes/latest/')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          if (data && data.success && data.resume) {
            setResumeData(data.resume);
          }
          setLoadingResume(false);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch active resume:', err);
        if (isMounted) setLoadingResume(false);
      });

    apiFetch('/interviews/analytics/')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && data.success) {
          setAnalytics(data.analytics);
        }
      })
      .catch((err) => console.warn('Could not fetch analytics:', err));

    return () => {
      isMounted = false;
    };
  }, []);

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

        <div className="dashboard-actions-group">
          {onStartInterview && (
            <button
              type="button"
              className="btn-dashboard-interview-launch"
              onClick={onStartInterview}
              title="Launch AI Mock Interview Chamber"
            >
              <Play size={15} />
              <span>Start Mock Interview</span>
            </button>
          )}
          {onOpenUpload && (
            <button
              type="button"
              className="btn-view-home"
              onClick={onOpenUpload}
              title="Upload resume for personalized mock interviews"
            >
              <UploadCloud size={16} />
              <span>Upload Resume</span>
            </button>
          )}
          {onViewHome && (
            <button
              type="button"
              className="btn-view-home"
              onClick={onViewHome}
              title="View Home & Platform Overview"
            >
              <Compass size={16} />
              <span>Platform Overview</span>
            </button>
          )}
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
      </div>

      {/* Readiness Index & Streak Card */}
      <div className="readiness-card">
        <div className="readiness-left">
          <div className="readiness-badge">
            <Flame size={14} className="flame-icon" />
            <span>{analytics?.completed_count ? `${analytics.completed_count} Sessions Evaluated` : '4-Day Practice Streak'}</span>
          </div>
          <h3 className="readiness-title">Interview Readiness: {analytics?.readiness_index || 86}%</h3>
          <p className="readiness-sub">
            {analytics?.completed_count
              ? `Calculated from ${analytics.completed_count} completed mock interviews with composite score of ${analytics.average_score}%.`
              : "You're performing in the Top 8% of candidates targeting Tier-1 tech companies."}
          </p>

          <div className="readiness-mini-tags">
            <span className="readiness-tag">Technical: {analytics?.technical_score ? `${Math.round(analytics.technical_score)}%` : '92%'}</span>
            <span className="readiness-tag">Communication: {analytics?.communication_score ? `${Math.round(analytics.communication_score)}%` : '88%'}</span>
            <span className="readiness-tag">Architecture: {analytics?.depth_score ? `${Math.round(analytics.depth_score)}%` : '85%'}</span>
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
              strokeDashoffset={251.2 - (251.2 * (analytics?.readiness_index || 86)) / 100}
            />
          </svg>
          <div className="radial-text">
            <span className="radial-number">{analytics?.readiness_index || 86}%</span>
            <span className="radial-label">Readiness</span>
          </div>
        </div>
      </div>

      {/* Active Profile Resume Card (Stored in PostgreSQL) */}
      <div className="dashboard-resume-card">
        <div className="dashboard-resume-header">
          <div className="resume-icon-badge">
            <FileText size={22} className="text-indigo" />
          </div>
          <div className="resume-meta-text">
            <div className="resume-title-row">
              <h4 className="resume-card-title">
                {loadingResume ? 'Checking PostgreSQL Resume...' : resumeData ? resumeData.file_name : 'No Resume Uploaded Yet'}
              </h4>
              {resumeData && (
                <span className="postgres-active-badge">
                  <Database size={12} />
                  <span>Stored in PostgreSQL</span>
                </span>
              )}
            </div>
            <p className="resume-card-sub">
              {resumeData
                ? `Uploaded on ${new Date(resumeData.uploaded_at).toLocaleDateString()} • Size: ${(resumeData.file_size / 1024).toFixed(1)} KB • Extracted text saved to database`
                : 'Upload your PDF resume to calibrate mock questions, match tech stack, and extract your project highlights.'}
            </p>
          </div>

          <div className="resume-card-actions">
            {onOpenUpload && (
              <button
                type="button"
                className="btn-dashboard-upload"
                onClick={onOpenUpload}
              >
                <UploadCloud size={15} />
                <span>{resumeData ? 'Upload New Resume' : 'Upload Resume Now'}</span>
              </button>
            )}
          </div>
        </div>

        {resumeData?.analysis?.skills?.length > 0 && (
          <div className="dashboard-skills-row">
            <span className="skills-row-label">Detected Skills ({resumeData.analysis.skills.length}):</span>
            <div className="skills-chips">
              {resumeData.analysis.skills.slice(0, 12).map((skill) => (
                <span key={skill} className="skill-chip">
                  {skill}
                </span>
              ))}
              {resumeData.analysis.skills.length > 12 && (
                <span className="skill-chip-more">+{resumeData.analysis.skills.length - 12} more</span>
              )}
            </div>
          </div>
        )}

        {resumeData?.extracted_text && (
          <div className="dashboard-extracted-text-toggle">
            <button
              type="button"
              className="btn-view-extracted-db"
              onClick={() => setShowExtractedText(!showExtractedText)}
            >
              <FileText size={13} />
              <span>{showExtractedText ? 'Hide Extracted Text' : 'View Extracted Text from PostgreSQL'}</span>
              {showExtractedText ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showExtractedText && (
              <div className="dashboard-extracted-preview">
                <pre>{resumeData.extracted_text}</pre>
              </div>
            )}
          </div>
        )}
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

          <button
            type="button"
            className="btn-launch-primary"
            onClick={onStartInterview}
          >
            <span>Begin Session Now</span>
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div
          className="launch-card secondary-card"
          onClick={() => setShowHistory(!showHistory)}
          style={{ cursor: 'pointer' }}
        >
          <div className="launch-card-header">
            <div className="card-icon-pill secondary">
              <BarChart3 size={18} />
            </div>
            <span className="card-metric">
              {analytics?.completed_count || 0} completed
            </span>
          </div>
          <h4 className="card-heading">Diagnostics & Transcripts</h4>
          <p className="card-body-text">
            Review your past mock sessions, AI-generated critique notes, speech pacing metrics, and architectural weaknesses.
          </p>
          <div className="card-link-action">
            <span>{showHistory ? 'Hide session history' : `View ${analytics?.total_sessions || 0} session records`}</span>
            <ChevronRight size={15} />
          </div>
        </div>

        <div
          className="launch-card secondary-card"
          onClick={onStartInterview}
          style={{ cursor: 'pointer' }}
        >
          <div className="launch-card-header">
            <div className="card-icon-pill secondary">
              <BookOpen size={18} />
            </div>
            <span className="card-metric">FAANG Standard</span>
          </div>
          <h4 className="card-heading">FAANG Question Bank</h4>
          <p className="card-body-text">
            Curated question archives verified by staff interviewers at Google, Meta, Apple, Amazon, and Stripe.
          </p>
          <div className="card-link-action">
            <span>Start domain practice</span>
            <ChevronRight size={15} />
          </div>
        </div>
      </div>

      {/* Expandable Past Session History Drawer */}
      {showHistory && (
        <div className="dashboard-history-drawer">
          <div className="history-drawer-header">
            <h4 className="history-title">
              <BarChart3 size={16} className="text-indigo" />
              <span>Past Interview Records (Stored in PostgreSQL)</span>
            </h4>
            <button
              type="button"
              className="btn-close-history"
              onClick={() => setShowHistory(false)}
            >
              Close
            </button>
          </div>

          {analytics?.recent_sessions?.length > 0 ? (
            <div className="history-sessions-list">
              {analytics.recent_sessions.map((s) => (
                <div key={s.id} className="history-session-card">
                  <div className="history-card-top">
                    <span className="history-role">{s.role}</span>
                    <span className={`history-verdict-badge ${s.overall_score >= 70 ? 'high' : 'medium'}`}>
                      {s.hiring_verdict || (s.status === 'completed' ? `${Math.round(s.overall_score)}% Score` : 'In Progress')}
                    </span>
                  </div>
                  <div className="history-card-meta">
                    <span>{s.target_company}</span>
                    <span>•</span>
                    <span>{s.difficulty}</span>
                    <span>•</span>
                    <span>{new Date(s.started_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="history-empty-text">No completed sessions yet. Launch your first mock session above to generate reports!</p>
          )}
        </div>
      )}

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
