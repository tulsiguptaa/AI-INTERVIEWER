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

export default function StudentDashboard({ user, onLogout, onViewHome, onOpenUpload }) {
  const [mockStarted, setMockStarted] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);
  const [showExtractedText, setShowExtractedText] = useState(false);

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
