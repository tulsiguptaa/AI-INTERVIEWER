import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Briefcase,
  Layers,
  BarChart2,
  HelpCircle,
  Shield,
  Zap,
  Target,
  BookOpen,
  Code2,
  Terminal,
  RefreshCw,
  X,
  ThumbsUp,
  Sliders,
  Check
} from 'lucide-react';
import { apiFetch } from '../services/api';
import './InterviewModule.css';

const ROLES = [
  { id: 'Full-Stack Engineer', label: 'Full-Stack Engineer', icon: Code2, desc: 'React, Node, DB architecture, APIs & distributed state' },
  { id: 'Backend Python / Django', label: 'Backend Python / Django', icon: Terminal, desc: 'GIL, ORM optimization, PostgreSQL, concurrency & async' },
  { id: 'System Design & Architecture', label: 'System Design & Architecture', icon: Layers, desc: 'Distributed caching, sharding, event streaming & CAP' },
  { id: 'Behavioral & STAR Leadership', label: 'Behavioral & STAR Leadership', icon: Target, desc: 'Incidents, trade-offs, disagreements & cross-functional lead' },
];

const COMPANIES = [
  'FAANG / Tier-1 Tech',
  'High-Growth Unicorn',
  'Stripe / Fintech',
  'Enterprise Cloud'
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Junior / Entry', badge: 'L3 / Associate' },
  { id: 'medium', label: 'Mid-Level Specialist', badge: 'L4 / Core' },
  { id: 'hard', label: 'Senior / Lead', badge: 'L5 / Senior' },
  { id: 'expert', label: 'Staff / Architect', badge: 'L6+ / Principal' },
];

export default function InterviewModule({ currentUser, onBackToDashboard, onOpenUpload }) {
  // Navigation & Session State
  const [stage, setStage] = useState('setup'); // 'setup' | 'active' | 'summary'
  const [selectedRole, setSelectedRole] = useState('Full-Stack Engineer');
  const [selectedCompany, setSelectedCompany] = useState('FAANG / Tier-1 Tech');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(3);
  const [useResume, setUseResume] = useState(true);
  const [activeResume, setActiveResume] = useState(null);
  const [loadingSetup, setLoadingSetup] = useState(false);

  // Active Session State
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCritique, setShowCritique] = useState(false);
  const [latestEval, setLatestEval] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  // Timer State
  const [questionTimeSeconds, setQuestionTimeSeconds] = useState(0);
  const timerRef = useRef(null);

  // Voice Synthesis & Recognition State
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef(null);

  // Summary State
  const [completedSession, setCompletedSession] = useState(null);
  const [expandedSummaryQ, setExpandedSummaryQ] = useState(null);

  // Fetch active resume on mount for calibration
  useEffect(() => {
    let isMounted = true;
    apiFetch('/accounts/resumes/latest/')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && data.success && data.resume) {
          setActiveResume(data.resume);
        }
      })
      .catch((err) => console.warn('[InterviewModule] Could not load resume:', err));

    // Check Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setMicSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCandidateAnswer((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
        }
      };

      recognition.onerror = (event) => {
        console.warn('[SpeechRec] Error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access denied. Please enable mic permissions or type your answer.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      isMounted = false;
      stopSpeechSynthesis();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Timer effect for active question
  useEffect(() => {
    if (stage === 'active' && !showCritique) {
      timerRef.current = setInterval(() => {
        setQuestionTimeSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [stage, showCritique]);

  // AI Voice Synthesis helper
  const speakQuestion = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select natural sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))
      );
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[TTS] Synthesis failed:', e);
      setIsAiSpeaking(false);
    }
  };

  const stopSpeechSynthesis = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (!micSupported || !recognitionRef.current) {
      setSpeechError('Microphone recognition not supported in this browser. Please use Chrome/Edge or type directly.');
      return;
    }
    setSpeechError('');

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      try {
        stopSpeechSynthesis();
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('[SpeechRec] Start error:', err);
        setIsListening(false);
      }
    }
  };

  // Start Interview Handler
  const handleStartInterview = async () => {
    setLoadingSetup(true);
    stopSpeechSynthesis();

    try {
      const response = await apiFetch('/interviews/sessions/', {
        method: 'POST',
        body: JSON.stringify({
          role: selectedRole,
          target_company: selectedCompany,
          difficulty: selectedDifficulty,
          total_questions: questionCount,
          use_resume: useResume && !!activeResume,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSession(data.session);
        setCurrentQuestion(data.current_question || data.session.questions[0]);
        setQuestionIndex(0);
        setCandidateAnswer('');
        setQuestionTimeSeconds(0);
        setShowCritique(false);
        setLatestEval(null);
        setStage('active');

        // Speak the first question if voice is enabled
        const firstText = data.current_question?.question_text || data.session.questions?.[0]?.question_text;
        if (firstText && voiceEnabled) {
          setTimeout(() => speakQuestion(firstText), 600);
        }
      } else {
        alert(data.error || 'Failed to initialize interview session.');
      }
    } catch (err) {
      console.error('[InterviewModule] Start error:', err);
      alert('Could not connect to backend interview engine.');
    } finally {
      setLoadingSetup(false);
    }
  };

  // Submit Answer Handler
  const handleSubmitAnswer = async () => {
    if (!candidateAnswer.trim() || isSubmitting) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    setIsSubmitting(true);
    stopSpeechSynthesis();

    try {
      const response = await apiFetch(`/interviews/sessions/${session.id}/submit-answer/`, {
        method: 'POST',
        body: JSON.stringify({
          question_id: currentQuestion.id,
          candidate_answer: candidateAnswer,
          time_taken_seconds: questionTimeSeconds,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setLatestEval(data.evaluation);
        setShowCritique(true);
        setSession(data.session);

        if (data.is_completed) {
          setCompletedSession(data.session);
        }
      } else {
        alert(data.error || 'Failed to evaluate answer.');
      }
    } catch (err) {
      console.error('[InterviewModule] Submit error:', err);
      alert('Network error while evaluating answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Proceed to Next Question or Summary
  const handleProceedNext = () => {
    setShowCritique(false);
    setShowModelAnswer(false);
    setShowHint(false);
    stopSpeechSynthesis();

    // Check if session has more questions
    const allQuestions = session?.questions || [];
    const nextQ = allQuestions.find((q) => !q.is_answered);

    if (nextQ) {
      setCurrentQuestion(nextQ);
      setCandidateAnswer('');
      setQuestionTimeSeconds(0);
      setQuestionIndex((prev) => prev + 1);

      if (voiceEnabled && nextQ.question_text) {
        setTimeout(() => speakQuestion(nextQ.question_text), 400);
      }
    } else {
      // Conclude session and show summary
      handleFinishSession();
    }
  };

  // Finish session early or concluding
  const handleFinishSession = async () => {
    stopSpeechSynthesis();
    if (!session) {
      setStage('setup');
      return;
    }

    try {
      const response = await apiFetch(`/interviews/sessions/${session.id}/finish/`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCompletedSession(data.session);
        setStage('summary');
      } else {
        setCompletedSession(session);
        setStage('summary');
      }
    } catch (err) {
      console.warn('[InterviewModule] Finish session error:', err);
      setCompletedSession(session);
      setStage('summary');
    }
  };

  // Helper formatting for seconds to MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Template insert helpers for candidate
  const handleInsertTemplate = (type) => {
    if (type === 'star') {
      const template = "\n\nSituation: [Describe context and challenge]\nTask: [Describe your specific role & goal]\nAction: [Step-by-step engineering actions you took]\nResult: [Quantifiable metrics and business outcome]";
      setCandidateAnswer((prev) => (prev ? prev + template : template.trim()));
    } else if (type === 'architecture') {
      const template = "\n\n1. Functional Requirements: [Key user flows & APIs]\n2. Non-Functional Requirements: [p99 latency, throughput, consistency]\n3. High-Level Architecture: [Gateway, Load Balancers, Services, Caching, DB]\n4. Trade-offs & Bottlenecks: [Partitioning, Cache invalidation, Failover]";
      setCandidateAnswer((prev) => (prev ? prev + template : template.trim()));
    } else if (type === 'tradeoff') {
      const template = "\n\nTrade-off Analysis:\n- Option A vs Option B: [Compare latency vs consistency]\n- Why we chose this approach: [Explain reasoning & SLA bounds]";
      setCandidateAnswer((prev) => (prev ? prev + template : template.trim()));
    }
  };

  // =========================================================================
  // VIEW 1: INTERVIEW SETUP & CALIBRATION STAGE
  // =========================================================================
  if (stage === 'setup') {
    return (
      <div className="interview-module-root">
        {/* Subtle Ambient Background Gradients */}
        <div className="ambient-mesh-glow"></div>

        <div className="interview-setup-container">
          {/* Header Bar */}
          <div className="setup-top-bar">
            <button
              type="button"
              className="btn-back-link"
              onClick={onBackToDashboard}
            >
              <ArrowLeft size={16} />
              <span>Back to Student Dashboard</span>
            </button>
            <div className="setup-platform-pill">
              <Sparkles size={14} className="text-indigo" />
              <span>AI Technical Interview Studio</span>
            </div>
          </div>

          {/* Main Setup Card */}
          <div className="setup-card">
            <div className="setup-card-header">
              <div className="setup-badge-row">
                <span className="live-simulation-tag">
                  <span className="pulse-dot"></span>
                  Live AI Evaluator
                </span>
                <span className="session-encryption-tag">
                  <Shield size={12} />
                  <span>Real-time Voice & Text</span>
                </span>
              </div>
              <h1 className="setup-title">
                Calibrate Your <span className="gradient-text">Mock Interview</span>
              </h1>
              <p className="setup-subtitle">
                Configure your target domain, enterprise caliber, and difficulty. Our AI interviewer dynamically adapts questions,
                analyzes your reasoning in real time, and scores against Tier-1 rubrics.
              </p>
            </div>

            {/* Resume Integration Banner */}
            <div className="resume-calibration-banner">
              <div className="resume-banner-left">
                <div className="resume-banner-icon">
                  <FileText size={20} className="text-emerald" />
                </div>
                <div className="resume-banner-text">
                  <div className="resume-banner-title-row">
                    <span className="banner-title">
                      {activeResume ? `Active Resume: ${activeResume.file_name}` : 'No Active Resume Found'}
                    </span>
                    {activeResume && (
                      <span className="banner-status-badge">
                        <Check size={11} />
                        <span>PostgreSQL Synced</span>
                      </span>
                    )}
                  </div>
                  <p className="banner-sub">
                    {activeResume
                      ? `Detected ${activeResume.analysis?.skills?.length || 0} skills & projects. The AI will weave personalized questions targeting your real experience.`
                      : 'Upload your resume to enable personalized project deep-dives tailored to your actual experience.'}
                  </p>
                </div>
              </div>

              <div className="resume-banner-right">
                {activeResume ? (
                  <label className="resume-toggle-label">
                    <input
                      type="checkbox"
                      checked={useResume}
                      onChange={(e) => setUseResume(e.target.checked)}
                      className="custom-toggle-input"
                    />
                    <span className="custom-toggle-switch"></span>
                    <span className="toggle-text">Personalize with Resume</span>
                  </label>
                ) : (
                  onOpenUpload && (
                    <button
                      type="button"
                      className="btn-banner-upload"
                      onClick={onOpenUpload}
                    >
                      <span>Upload Resume</span>
                      <ArrowRight size={14} />
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Option 1: Track Selection */}
            <div className="setup-section">
              <label className="setup-section-label">
                <Briefcase size={16} />
                <span>1. Select Technical Track</span>
              </label>
              <div className="tracks-grid">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <div
                      key={role.id}
                      className={`track-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <div className="track-icon-wrapper">
                        <Icon size={20} />
                      </div>
                      <div className="track-info">
                        <h4 className="track-name">{role.label}</h4>
                        <p className="track-desc">{role.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="track-check-badge">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Option 2 & 3: Company Track & Difficulty */}
            <div className="setup-row-two-col">
              <div className="setup-col">
                <label className="setup-section-label">
                  <Target size={16} />
                  <span>2. Target Company Caliber</span>
                </label>
                <div className="select-options-list">
                  {COMPANIES.map((company) => (
                    <button
                      key={company}
                      type="button"
                      className={`select-option-pill ${selectedCompany === company ? 'active' : ''}`}
                      onClick={() => setSelectedCompany(company)}
                    >
                      <span>{company}</span>
                      {selectedCompany === company && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup-col">
                <label className="setup-section-label">
                  <Sliders size={16} />
                  <span>3. Seniority / Difficulty Bar</span>
                </label>
                <div className="difficulty-grid">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff.id}
                      type="button"
                      className={`difficulty-pill ${selectedDifficulty === diff.id ? 'active' : ''}`}
                      onClick={() => setSelectedDifficulty(diff.id)}
                    >
                      <span className="diff-label">{diff.label}</span>
                      <span className="diff-badge">{diff.badge}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Option 4: Session Length & Audio Preferences */}
            <div className="setup-row-two-col secondary-row">
              <div className="setup-col">
                <label className="setup-section-label">
                  <Clock size={16} />
                  <span>4. Number of Questions</span>
                </label>
                <div className="question-count-selector">
                  {[3, 5, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`count-btn ${questionCount === num ? 'active' : ''}`}
                      onClick={() => setQuestionCount(num)}
                    >
                      {num} Questions
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup-col">
                <label className="setup-section-label">
                  <Volume2 size={16} />
                  <span>5. AI Voice Synthesis</span>
                </label>
                <div className="voice-toggle-box">
                  <label className="voice-toggle-label">
                    <input
                      type="checkbox"
                      checked={voiceEnabled}
                      onChange={(e) => setVoiceEnabled(e.target.checked)}
                      className="custom-toggle-input"
                    />
                    <span className="custom-toggle-switch"></span>
                    <span className="voice-toggle-text">
                      {voiceEnabled ? 'AI Voice Enabled (Interviewer will speak questions)' : 'Silent Mode (Text only)'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="setup-launch-footer">
              <div className="launch-summary-preview">
                <span>Preparing: <strong>{selectedRole}</strong></span>
                <span>•</span>
                <span>Tier: <strong>{selectedCompany}</strong></span>
                <span>•</span>
                <span><strong>{questionCount} Questions</strong></span>
              </div>

              <button
                type="button"
                className="btn-launch-interview"
                disabled={loadingSetup}
                onClick={handleStartInterview}
              >
                {loadingSetup ? (
                  <>
                    <RefreshCw size={18} className="spin-icon" />
                    <span>Calibrating AI Interview Engine...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    <span>Enter Live Interview Room</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LIVE INTERVIEW ROOM STAGE
  // =========================================================================
  if (stage === 'active' && currentQuestion) {
    const totalQ = session?.total_questions || 5;
    const progressPercent = Math.round(((questionIndex + 1) / totalQ) * 100);

    return (
      <div className="interview-room-root">
        {/* Top Floating Telemetry Bar */}
        <header className="room-nav-bar">
          <div className="room-nav-left">
            <button
              type="button"
              className="room-exit-btn"
              onClick={handleFinishSession}
              title="Conclude interview early and generate current scorecard"
            >
              <ArrowLeft size={15} />
              <span>Conclude Early</span>
            </button>

            <div className="room-track-badge">
              <span className="track-role">{session?.role || selectedRole}</span>
              <span className="track-company">• {session?.target_company}</span>
            </div>
          </div>

          <div className="room-nav-center">
            <div className="room-progress-meta">
              <span className="question-counter">Question {questionIndex + 1} of {totalQ}</span>
              <div className="mini-progress-bar">
                <div className="mini-progress-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>

          <div className="room-nav-right">
            {/* Live Question Clock */}
            <div className="room-timer-pill" title="Time on current question">
              <Clock size={15} className="text-amber" />
              <span>{formatTimer(questionTimeSeconds)}</span>
            </div>

            {/* Audio Voice Control */}
            <button
              type="button"
              className={`room-voice-btn ${voiceEnabled ? 'active' : 'muted'}`}
              onClick={() => {
                if (isAiSpeaking) stopSpeechSynthesis();
                setVoiceEnabled(!voiceEnabled);
              }}
              title={voiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
            </button>
          </div>
        </header>

        {/* Main Stage Grid: Split-screen Studio */}
        <div className="room-studio-grid">
          {/* LEFT COLUMN: AI Interviewer Persona & Prompt */}
          <div className="interviewer-column">
            <div className="interviewer-persona-card">
              {/* Persona Avatar & Audio Visualizer */}
              <div className="avatar-equalizer-row">
                <div className={`interviewer-avatar ${isAiSpeaking ? 'speaking' : ''}`}>
                  <Sparkles size={24} className="avatar-sparkle-icon" />
                  <span className={`interviewer-status-pulse ${isAiSpeaking ? 'active' : ''}`}></span>
                </div>
                <div className="interviewer-meta">
                  <div className="interviewer-name-row">
                    <h3 className="interviewer-title">Alex • Staff Interviewer</h3>
                    <span className="interviewer-firm-tag">{session?.target_company || 'Tier-1 Tech'}</span>
                  </div>
                  <div className="interviewer-state">
                    {isAiSpeaking ? (
                      <span className="state-speaking">
                        <span className="sound-bar bar1"></span>
                        <span className="sound-bar bar2"></span>
                        <span className="sound-bar bar3"></span>
                        <span className="sound-bar bar4"></span>
                        Speaking question out loud...
                      </span>
                    ) : isListening ? (
                      <span className="state-listening">
                        <span className="pulse-recording-dot"></span>
                        Actively listening to candidate...
                      </span>
                    ) : (
                      <span className="state-idle">Awaiting candidate response</span>
                    )}
                  </div>
                </div>

                {/* Replay Voice Button */}
                <button
                  type="button"
                  className="btn-replay-audio"
                  onClick={() => speakQuestion(currentQuestion.question_text)}
                  title="Replay question audio"
                >
                  <RotateCcw size={15} />
                  <span>Replay</span>
                </button>
              </div>

              {/* Question Badge & Body */}
              <div className="question-content-box">
                <div className="question-category-pill">
                  <BookOpen size={13} />
                  <span>{currentQuestion.category}</span>
                </div>

                <h2 className="question-prompt-text">{currentQuestion.question_text}</h2>

                {/* Optional Expandable Context Hint */}
                {currentQuestion.context_hint && (
                  <div className="question-hint-drawer">
                    <button
                      type="button"
                      className="btn-toggle-hint"
                      onClick={() => setShowHint(!showHint)}
                    >
                      <HelpCircle size={14} className="text-amber" />
                      <span>{showHint ? 'Hide Guidance & Key Concepts' : 'Show Architectural Concepts / Hints'}</span>
                      {showHint ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showHint && (
                      <div className="hint-body-text">
                        <p>{currentQuestion.context_hint}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Expected Criteria Preview */}
                {currentQuestion.key_criteria?.length > 0 && (
                  <div className="criteria-preview-box">
                    <span className="criteria-heading">Key Rubric Signals Evaluated:</span>
                    <ul className="criteria-pills-list">
                      {currentQuestion.key_criteria.slice(0, 3).map((crit, idx) => (
                        <li key={idx} className="criteria-mini-item">
                          <CheckCircle2 size={12} className="text-indigo" />
                          <span>{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Candidate Studio Input & Feedback */}
          <div className="candidate-studio-column">
            {/* If Critique is active, show evaluation card */}
            {showCritique && latestEval ? (
              <div className="critique-card">
                <div className="critique-header">
                  <div className="critique-score-badge">
                    <div className="score-circle">
                      <span className="score-num">{Math.round(latestEval.score)}</span>
                      <span className="score-max">/100</span>
                    </div>
                    <div className="score-label-meta">
                      <span className="verdict-highlight">
                        {latestEval.score >= 85
                          ? 'Exceptional Answer (Staff Bar)'
                          : latestEval.score >= 70
                          ? 'Strong Answer (Competitive)'
                          : 'Baseline Answer (Room to Expand)'}
                      </span>
                      <span className="score-subtext">Evaluated against {session?.target_company} rubric</span>
                    </div>
                  </div>

                  <div className="critique-subscores">
                    <div className="subscore-item">
                      <span className="subscore-name">Technical Accuracy</span>
                      <div className="subscore-bar">
                        <div
                          className="subscore-fill green"
                          style={{ width: `${latestEval.accuracy_score}%` }}
                        ></div>
                      </div>
                      <span className="subscore-val">{Math.round(latestEval.accuracy_score)}%</span>
                    </div>

                    <div className="subscore-item">
                      <span className="subscore-name">Communication Clarity</span>
                      <div className="subscore-bar">
                        <div
                          className="subscore-fill indigo"
                          style={{ width: `${latestEval.clarity_score}%` }}
                        ></div>
                      </div>
                      <span className="subscore-val">{Math.round(latestEval.clarity_score)}%</span>
                    </div>

                    <div className="subscore-item">
                      <span className="subscore-name">Depth & Trade-offs</span>
                      <div className="subscore-bar">
                        <div
                          className="subscore-fill violet"
                          style={{ width: `${latestEval.depth_score}%` }}
                        ></div>
                      </div>
                      <span className="subscore-val">{Math.round(latestEval.depth_score)}%</span>
                    </div>
                  </div>
                </div>

                {/* Rubric Feedback Text */}
                <div className="critique-feedback-body">
                  <h4 className="critique-section-title">
                    <Sparkles size={15} className="text-indigo" />
                    <span>AI Interviewer Evaluation</span>
                  </h4>
                  <p className="critique-paragraph">{latestEval.rubric_feedback}</p>
                </div>

                {/* Strengths & Gaps Columns */}
                <div className="critique-two-cols">
                  <div className="critique-col strengths">
                    <h5 className="col-heading text-emerald">
                      <CheckCircle2 size={14} />
                      <span>What You Articulated Well</span>
                    </h5>
                    <ul className="bullet-list">
                      {latestEval.strengths?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="critique-col gaps">
                    <h5 className="col-heading text-amber">
                      <AlertTriangle size={14} />
                      <span>Missing Elements & Trade-offs</span>
                    </h5>
                    <ul className="bullet-list">
                      {latestEval.gaps?.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Benchmark Model Answer Drawer */}
                {latestEval.model_answer && (
                  <div className="model-answer-section">
                    <button
                      type="button"
                      className="btn-toggle-model"
                      onClick={() => setShowModelAnswer(!showModelAnswer)}
                    >
                      <BookOpen size={14} />
                      <span>{showModelAnswer ? 'Hide Exemplary Model Answer' : 'View L5/L6 Senior Benchmark Model Answer'}</span>
                      {showModelAnswer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showModelAnswer && (
                      <div className="model-answer-box">
                        <p>{latestEval.model_answer}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Follow-Up Drill Prompt */}
                {latestEval.follow_up_drill && (
                  <div className="followup-drill-box">
                    <div className="followup-tag">
                      <Target size={13} />
                      <span>Interviewer Follow-up Drill:</span>
                    </div>
                    <p className="followup-text">"{latestEval.follow_up_drill}"</p>
                  </div>
                )}

                {/* Next Question Navigation */}
                <div className="critique-footer-actions">
                  <button
                    type="button"
                    className="btn-proceed-next"
                    onClick={handleProceedNext}
                  >
                    <span>{questionIndex + 1 >= totalQ ? 'Complete Interview & View Grand Scorecard' : 'Proceed to Next Question'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* Input Studio Card */
              <div className="studio-card">
                <div className="studio-card-header">
                  <div className="studio-mode-pill">
                    <span>Candidate Workspace</span>
                  </div>

                  {/* Speech-to-Text Button */}
                  {micSupported && (
                    <button
                      type="button"
                      className={`btn-mic-toggle ${isListening ? 'recording' : ''}`}
                      onClick={toggleListening}
                      title={isListening ? 'Stop microphone' : 'Start speaking your answer'}
                    >
                      {isListening ? (
                        <>
                          <span className="mic-pulse-ring"></span>
                          <MicOff size={15} />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <Mic size={15} />
                          <span>Speak Answer (Voice-to-Text)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {speechError && (
                  <div className="speech-error-alert">
                    <AlertTriangle size={14} />
                    <span>{speechError}</span>
                  </div>
                )}

                {isListening && (
                  <div className="speech-live-bar">
                    <span className="live-rec-badge">REC</span>
                    <div className="sound-wave-anim">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="live-transcribing-text">Transcribing speech in real-time...</span>
                  </div>
                )}

                {/* Textarea Workspace */}
                <div className="editor-wrapper">
                  <textarea
                    className="answer-textarea"
                    placeholder="Structure your answer clearly. Explain your architectural thought process, trade-offs, edge cases, and quantifiable results... (You can also click 'Speak Answer' above to dictate using your microphone)"
                    value={candidateAnswer}
                    onChange={(e) => setCandidateAnswer(e.target.value)}
                    rows={12}
                  ></textarea>

                  {/* Template Shortcuts */}
                  <div className="template-shortcuts-row">
                    <span className="template-label">Insert Structure:</span>
                    <button
                      type="button"
                      className="btn-template"
                      onClick={() => handleInsertTemplate('star')}
                    >
                      STAR Method
                    </button>
                    <button
                      type="button"
                      className="btn-template"
                      onClick={() => handleInsertTemplate('architecture')}
                    >
                      Architecture Layers
                    </button>
                    <button
                      type="button"
                      className="btn-template"
                      onClick={() => handleInsertTemplate('tradeoff')}
                    >
                      Trade-offs
                    </button>
                    {candidateAnswer && (
                      <button
                        type="button"
                        className="btn-clear-answer"
                        onClick={() => setCandidateAnswer('')}
                        title="Clear answer field"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Studio Footer */}
                <div className="studio-card-footer">
                  <div className="word-count-meta">
                    <span>{candidateAnswer.trim() ? candidateAnswer.trim().split(/\s+/).length : 0} words</span>
                    <span>•</span>
                    <span>{candidateAnswer.length} characters</span>
                  </div>

                  <button
                    type="button"
                    className="btn-submit-answer"
                    disabled={!candidateAnswer.trim() || isSubmitting}
                    onClick={handleSubmitAnswer}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="spin-icon" />
                        <span>AI Analyzing Reasoning & Metrics...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Response to Interviewer</span>
                        <Send size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: HOLISTIC SUMMARY & SCORECARD STAGE
  // =========================================================================
  if (stage === 'summary' && completedSession) {
    const questions = completedSession.questions || [];
    const avgScore = completedSession.overall_score || 0;
    const isPassing = avgScore >= 70;

    return (
      <div className="interview-summary-root">
        <div className="ambient-mesh-glow"></div>

        <div className="summary-container">
          {/* Header Action Bar */}
          <div className="summary-nav-bar">
            <button
              type="button"
              className="btn-back-link"
              onClick={onBackToDashboard}
            >
              <ArrowLeft size={16} />
              <span>Return to Dashboard</span>
            </button>

            <button
              type="button"
              className="btn-new-interview"
              onClick={() => {
                setStage('setup');
                setSession(null);
                setCompletedSession(null);
              }}
            >
              <RotateCcw size={16} />
              <span>Start Another Mock Session</span>
            </button>
          </div>

          {/* Grand Scorecard Banner */}
          <div className="summary-grand-banner">
            <div className="grand-banner-left">
              <div className="verdict-pill-large">
                <Award size={18} className={isPassing ? 'text-emerald' : 'text-amber'} />
                <span>{completedSession.hiring_verdict || 'Evaluation Complete'}</span>
              </div>
              <h1 className="grand-banner-title">
                {completedSession.role} Performance Report
              </h1>
              <p className="grand-banner-sub">
                Target: <strong>{completedSession.target_company}</strong> • Caliber: <strong>{completedSession.difficulty.toUpperCase()}</strong> • Evaluated across <strong>{questions.length} Questions</strong>
              </p>

              {completedSession.overall_feedback && (
                <div className="summary-feedback-quote">
                  <p>"{completedSession.overall_feedback}"</p>
                </div>
              )}
            </div>

            <div className="grand-banner-right">
              <div className="grand-score-circle">
                <svg className="radial-grand" viewBox="0 0 100 100">
                  <circle className="radial-grand-bg" cx="50" cy="50" r="42" />
                  <circle
                    className="radial-grand-fill"
                    cx="50"
                    cy="50"
                    r="42"
                    strokeDasharray="263.9"
                    strokeDashoffset={263.9 - (263.9 * avgScore) / 100}
                  />
                </svg>
                <div className="grand-score-text">
                  <span className="grand-number">{Math.round(avgScore)}%</span>
                  <span className="grand-label">Composite Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Pillars Grid */}
          <div className="summary-metrics-grid">
            <div className="metric-box">
              <div className="metric-box-header">
                <Code2 size={18} className="text-emerald" />
                <span className="metric-box-title">Technical Acumen</span>
              </div>
              <span className="metric-box-val">{Math.round(completedSession.technical_score || avgScore)}%</span>
              <p className="metric-box-sub">Domain correctness & algorithm complexity</p>
            </div>

            <div className="metric-box">
              <div className="metric-box-header">
                <Target size={18} className="text-indigo" />
                <span className="metric-box-title">Communication & STAR</span>
              </div>
              <span className="metric-box-val">{Math.round(completedSession.communication_score || avgScore)}%</span>
              <p className="metric-box-sub">Structured explanation & conciseness</p>
            </div>

            <div className="metric-box">
              <div className="metric-box-header">
                <Layers size={18} className="text-violet" />
                <span className="metric-box-title">Architectural Depth</span>
              </div>
              <span className="metric-box-val">{Math.round(completedSession.depth_score || avgScore)}%</span>
              <p className="metric-box-sub">Trade-offs, scaling limits & edge cases</p>
            </div>

            <div className="metric-box">
              <div className="metric-box-header">
                <Zap size={18} className="text-amber" />
                <span className="metric-box-title">Readiness Index</span>
              </div>
              <span className="metric-box-val">{completedSession.readiness_index || 80}%</span>
              <p className="metric-box-sub">Tier-1 FAANG interview probability</p>
            </div>
          </div>

          {/* Holistic Strengths & Growth Areas */}
          <div className="summary-two-col-cards">
            <div className="summary-list-card strengths">
              <h3 className="card-title-row text-emerald">
                <CheckCircle2 size={18} />
                <span>Primary Demonstrated Strengths</span>
              </h3>
              <ul className="summary-bullets">
                {completedSession.key_strengths?.length > 0 ? (
                  completedSession.key_strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))
                ) : (
                  <li>Demonstrated solid fundamental understanding across the technical domain.</li>
                )}
              </ul>
            </div>

            <div className="summary-list-card areas">
              <h3 className="card-title-row text-amber">
                <AlertTriangle size={18} />
                <span>Targeted Growth Opportunities</span>
              </h3>
              <ul className="summary-bullets">
                {completedSession.improvement_areas?.length > 0 ? (
                  completedSession.improvement_areas.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))
                ) : (
                  <li>Incorporate more specific system telemetry (p99 latency bounds, replication lag).</li>
                )}
              </ul>
            </div>
          </div>

          {/* Question-by-Question Deep Dive Accordion */}
          <div className="summary-questions-accordion">
            <h3 className="accordion-main-title">
              <BookOpen size={18} className="text-indigo" />
              <span>Question-by-Question Transcript & AI Rubrics</span>
            </h3>

            <div className="accordion-list">
              {questions.map((q, idx) => {
                const isExpanded = expandedSummaryQ === q.id;
                return (
                  <div key={q.id} className="accordion-item">
                    <button
                      type="button"
                      className="accordion-item-header"
                      onClick={() => setExpandedSummaryQ(isExpanded ? null : q.id)}
                    >
                      <div className="item-header-left">
                        <span className="item-number-badge">Q{q.order}</span>
                        <div className="item-title-meta">
                          <span className="item-category-tag">{q.category}</span>
                          <h4 className="item-question-heading">{q.question_text}</h4>
                        </div>
                      </div>

                      <div className="item-header-right">
                        <span className={`item-score-pill ${q.score >= 70 ? 'high' : 'medium'}`}>
                          Score: {Math.round(q.score)}/100
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="accordion-item-body">
                        {/* Candidate Answer */}
                        <div className="transcript-block candidate">
                          <h5 className="transcript-block-title">Your Submitted Response:</h5>
                          <p className="transcript-text">{q.candidate_answer || 'No response recorded'}</p>
                        </div>

                        {/* AI Feedback */}
                        {q.rubric_feedback && (
                          <div className="transcript-block critique">
                            <h5 className="transcript-block-title text-indigo">Interviewer Assessment:</h5>
                            <p className="transcript-text">{q.rubric_feedback}</p>
                          </div>
                        )}

                        {/* Model Answer */}
                        {q.model_answer && (
                          <div className="transcript-block model">
                            <h5 className="transcript-block-title text-emerald">Staff Benchmark Model Answer:</h5>
                            <p className="transcript-text">{q.model_answer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback loading / null
  return null;
}
