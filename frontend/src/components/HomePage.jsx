import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileText,
  Briefcase,
  Terminal,
  Radio,
  BarChart3,
  Clock,
  Code2,
  Layers,
  Users,
  Award,
  GraduationCap,
  Compass,
  Zap,
  Play,
  Check,
  TrendingUp,
  Shield,
  HelpCircle,
  Menu,
  X,
  Volume2,
  Cpu,
  Target,
  UploadCloud
} from 'lucide-react';
import './HomePage.css';
import heroDashboardImg from '../assets/hero-dashboard.jpg';

// Personalization sample tracks
const PERSONALIZATION_TRACKS = [
  {
    id: 'backend',
    role: 'Senior Backend Engineer',
    candidate: 'Alex Rivera · 3 Yrs Experience',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Distributed Systems'],
    projectHighlight:
      'Engineered a distributed payment event pipeline handling 40,000 transactions/min with Kafka and PostgreSQL write-ahead logs.',
    parsedTags: ['High Concurrency', 'Event Streaming', 'Database Partitioning', 'Failover Recovery'],
    questions: [
      {
        question:
          'In your payment pipeline handling 40k txn/min, how did you handle Kafka consumer partition rebalancing without causing duplicate transaction writes?',
        focus: 'Distributed Idempotency & Message Ordering',
        depth: 'Senior Level · Calibrated against Stripe/Meta'
      },
      {
        question:
          'When PostgreSQL write-ahead logs experienced disk contention during peak bursts, what connection pooling and read-replica strategies did you deploy?',
        focus: 'Database Throughput & Replication Lag',
        depth: 'System Internals & Storage Tuning'
      }
    ]
  },
  {
    id: 'fullstack',
    role: 'Full-Stack Developer',
    candidate: 'Sarah Chen · 2 Yrs Experience',
    skills: ['React', 'TypeScript', 'Next.js', 'Python FastAPI', 'GraphQL', 'TailwindCSS'],
    projectHighlight:
      'Built an interactive collaborative analytics dashboard with WebSocket synchronization, sub-100ms UI re-renders, and role-based access control.',
    parsedTags: ['State Hydration', 'WebSocket Scalability', 'Optimistic UI', 'Auth & Security'],
    questions: [
      {
        question:
          'How did you maintain data consistency across multiple browser tabs using WebSockets without overloading the server with redundant state sync messages?',
        focus: 'Client-Server Synchronization & Memory Leaks',
        depth: 'Mid-Senior Level · Product Engineering'
      },
      {
        question:
          'Walk me through how your Next.js SSR architecture handles cache invalidation when real-time analytics updates occur in rapid bursts.',
        focus: 'Next.js Rendering Lifecycle & Edge Caching',
        depth: 'Frontend Architecture'
      }
    ]
  },
  {
    id: 'dsa',
    role: 'Algorithms & Problem Solving',
    candidate: 'Marcus Vance · CS Graduate Candidate',
    skills: ['Python', 'C++', 'Dynamic Programming', 'Graph Theory', 'Trees & Tries', 'System Design Basics'],
    projectHighlight:
      'Implemented an autonomous pathfinding simulator using Bidirectional A* Search and customized Min-Heap priority queues in C++.',
    parsedTags: ['Graph Traversal', 'Heuristic Tuning', 'Memory Optimization', 'Big-O Proofs'],
    questions: [
      {
        question:
          'Why did you choose Bidirectional A* instead of Dijkstra for sparse grid topologies, and what is the exact spatial complexity when memory is constrained?',
        focus: 'Algorithmic Complexity & Heuristic Admissibility',
        depth: 'Competitive DSA · Google/Microsoft Calibrated'
      },
      {
        question:
          'How would you handle priority queue updates in O(log N) if edge weights change dynamically in real time during graph traversal?',
        focus: 'Data Structure Internal Trade-offs',
        depth: 'Advanced Data Structures'
      }
    ]
  }
];

export default function HomePage({ onOpenAuth, currentUser, onGoToDashboard, onOpenUpload }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPersonalization, setSelectedPersonalization] = useState(0);
  const [feedbackTab, setFeedbackTab] = useState('rubric'); // 'rubric' | 'strengths' | 'model'

  const activeTrack = PERSONALIZATION_TRACKS[selectedPersonalization];

  const handleStartInterview = () => {
    if (currentUser) {
      onGoToDashboard();
    } else {
      onOpenAuth('signup');
    }
  };

  const handleLogin = () => {
    onOpenAuth('login');
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-wrapper">
      {/* Subtle Ambient Background Gradients (No gaudy elements, professional slate/indigo/cyan) */}
      <div className="ambient-glow glow-top-left" aria-hidden="true"></div>
      <div className="ambient-glow glow-top-right" aria-hidden="true"></div>
      <div className="ambient-glow glow-mid-center" aria-hidden="true"></div>
      <div className="subtle-dot-grid" aria-hidden="true"></div>

      {/* ====================================================================
          1. NAVBAR (Sticky Navigation Bar)
          ==================================================================== */}
      <header className="home-nav" id="top">
        <div className="home-nav-container">
          {/* Logo & Brand Name */}
          <a href="#hero" className="home-brand" onClick={(e) => scrollToSection(e, 'hero')}>
            <div className="brand-logo-icon">
              <BrainCircuit size={20} className="brand-icon-svg" />
            </div>
            <div className="brand-text-block">
              <span className="brand-name">AI Interviewer</span>
              <span className="brand-badge">SaaS</span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="home-nav-links">
            <a href="#hero" className="nav-link" onClick={(e) => scrollToSection(e, 'hero')}>
              Home
            </a>
            <a href="#how-it-works" className="nav-link" onClick={(e) => scrollToSection(e, 'how-it-works')}>
              How It Works
            </a>
            <a href="#features" className="nav-link" onClick={(e) => scrollToSection(e, 'features')}>
              Features
            </a>
            <a href="#interview-modes" className="nav-link" onClick={(e) => scrollToSection(e, 'interview-modes')}>
              Interview Modes
            </a>
            <a href="#about" className="nav-link" onClick={(e) => scrollToSection(e, 'about')}>
              About
            </a>
          </nav>

          {/* Nav CTA Actions */}
          <div className="home-nav-actions">
            {currentUser ? (
              <button type="button" className="btn-nav-dashboard" onClick={onGoToDashboard}>
                <Sparkles size={16} />
                <span>Dashboard</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button type="button" className="btn-nav-login" onClick={handleLogin}>
                  Login
                </button>
                <button type="button" className="btn-nav-getstarted" onClick={handleStartInterview}>
                  <span>Get Started</span>
                  <ArrowRight size={15} />
                </button>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="mobile-menu-toggle"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <a href="#hero" className="mobile-nav-link" onClick={(e) => scrollToSection(e, 'hero')}>
              Home
            </a>
            <a href="#how-it-works" className="mobile-nav-link" onClick={(e) => scrollToSection(e, 'how-it-works')}>
              How It Works
            </a>
            <a href="#features" className="mobile-nav-link" onClick={(e) => scrollToSection(e, 'features')}>
              Features
            </a>
            <a href="#interview-modes" className="mobile-nav-link" onClick={(e) => scrollToSection(e, 'interview-modes')}>
              Interview Modes
            </a>
            <a href="#about" className="mobile-nav-link" onClick={(e) => scrollToSection(e, 'about')}>
              About
            </a>
            <div className="mobile-nav-divider"></div>
            {currentUser ? (
              <button type="button" className="btn-mobile-primary" onClick={onGoToDashboard}>
                Go to Dashboard
              </button>
            ) : (
              <div className="mobile-nav-buttons">
                <button type="button" className="btn-mobile-secondary" onClick={handleLogin}>
                  Login
                </button>
                <button type="button" className="btn-mobile-primary" onClick={handleStartInterview}>
                  Get Started
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main>
        {/* ====================================================================
            2. HERO SECTION
            ==================================================================== */}
        <section className="hero-section" id="hero">
          <div className="hero-container">
            {/* Trust Pill / Pre-heading */}
            <div className="hero-pill-badge">
              <span className="pill-pulse-dot"></span>
              <span className="pill-text">Autonomous Mock Interview Intelligence</span>
              <span className="pill-divider">•</span>
              <span className="pill-subtext">2026 Hiring Bar Calibrated</span>
            </div>

            {/* Hero Headline */}
            <h1 className="hero-headline">
              Practice Interviews. <br />
              <span className="hero-headline-gradient">Build Confidence. Get Hired.</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle">
              AI-powered mock interviews tailored to your resume, target role, and skills.
            </p>

            {/* Dual Call-to-Action Buttons */}
            <div className="hero-cta-group">
              <button type="button" className="btn-hero-primary" onClick={handleStartInterview}>
                <span>Start Your Interview</span>
                <ArrowRight size={17} className="btn-arrow" />
              </button>

              <a
                href="#how-it-works"
                className="btn-hero-secondary"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
              >
                <Play size={15} className="btn-play-icon" />
                <span>Explore How It Works</span>
              </a>
            </div>

            {/* Subtle Social Proof */}
            <div className="hero-social-proof">
              <span className="proof-label">Trusted by candidates preparing for:</span>
              <div className="proof-logos">
                <span className="proof-logo">Google</span>
                <span className="proof-dot">•</span>
                <span className="proof-logo">Microsoft</span>
                <span className="proof-dot">•</span>
                <span className="proof-logo">Amazon</span>
                <span className="proof-dot">•</span>
                <span className="proof-logo">Meta</span>
                <span className="proof-dot">•</span>
                <span className="proof-logo">Stripe</span>
              </div>
            </div>

            {/* Visually Impressive AI Interviewer Visual / Dashboard Frame */}
            <div className="hero-visual-wrapper">
              <div className="hero-visual-card">
                {/* Visual Window Header */}
                <div className="visual-card-topbar">
                  <div className="window-dots">
                    <span className="window-dot"></span>
                    <span className="window-dot"></span>
                    <span className="window-dot"></span>
                  </div>
                  <div className="window-title">
                    <span className="live-indicator-dot"></span>
                    <span>AI Interview Session · Active Audio & Telemetry</span>
                  </div>
                  <div className="window-latency-badge">
                    <Radio size={12} />
                    <span>165ms p99 Voice Pipeline</span>
                  </div>
                </div>

                {/* Dashboard Image Showcase */}
                <div className="visual-card-image-box">
                  <img
                    src={heroDashboardImg}
                    alt="AI Interviewer Platform Dashboard showing real-time candidate speech analysis, question prompt, and code editor"
                    className="hero-dashboard-img"
                    loading="eager"
                  />
                  
                  {/* Floating Holographic Micro-Cards */}
                  <div className="floating-metric-card float-left-bottom">
                    <div className="metric-icon-box">
                      <Volume2 size={16} className="text-cyan" />
                    </div>
                    <div className="metric-info">
                      <span className="metric-tag">Live Speech Analysis</span>
                      <span className="metric-value">Pacing: 138 wpm · Clear Tone</span>
                    </div>
                  </div>

                  <div className="floating-metric-card float-right-top">
                    <div className="metric-icon-box">
                      <CheckCircle2 size={16} className="text-emerald" />
                    </div>
                    <div className="metric-info">
                      <span className="metric-tag">System Design Verification</span>
                      <span className="metric-value">94% Architectural Score</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            3. HOW IT WORKS (4-Step Process)
            ==================================================================== */}
        <section className="section-wrapper how-it-works-section" id="how-it-works">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <Target size={14} />
                <span>4-Step Process</span>
              </div>
              <h2 className="section-title">How It Works</h2>
              <p className="section-subtitle">
                A seamless, intuitive progression designed to take you from your resume to confident, job-ready mastery.
              </p>
            </div>

            {/* 4 Connected Cards Timeline */}
            <div className="process-timeline-grid">
              {/* Step 1 */}
              <div
                className="process-step-card process-step-interactive"
                onClick={onOpenUpload}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onOpenUpload && onOpenUpload()}
                title="Click to Upload Your Resume"
              >
                <div className="step-card-header">
                  <span className="step-number">01</span>
                  <div className="step-icon-wrap">
                    <UploadCloud size={22} />
                  </div>
                </div>
                <h3 className="step-title">Upload Your Resume</h3>
                <p className="step-description">
                  Upload your PDF resume. Our neural extraction engine automatically parses your projects, tech stack, and seniority level in seconds.
                </p>
                <div className="step-pills">
                  <span className="step-pill">PDF Format</span>
                  <span className="step-pill">Skills Parsing</span>
                  <span className="step-pill step-pill-action">Upload Now →</span>
                </div>
                <div className="step-connector-line" aria-hidden="true"></div>
              </div>

              {/* Step 2 */}
              <div className="process-step-card">
                <div className="step-card-header">
                  <span className="step-number">02</span>
                  <div className="step-icon-wrap">
                    <Compass size={22} />
                  </div>
                </div>
                <h3 className="step-title">Choose Your Target Role</h3>
                <p className="step-description">
                  Select your exact target job profile and company tier—from Frontend, Backend, and Full Stack to System Design and Behavioral tracks.
                </p>
                <div className="step-pills">
                  <span className="step-pill">50+ Role Tracks</span>
                  <span className="step-pill">Level Calibrated</span>
                </div>
                <div className="step-connector-line" aria-hidden="true"></div>
              </div>

              {/* Step 3 */}
              <div className="process-step-card">
                <div className="step-card-header">
                  <span className="step-number">03</span>
                  <div className="step-icon-wrap">
                    <Radio size={22} />
                  </div>
                </div>
                <h3 className="step-title">Take Your AI Interview</h3>
                <p className="step-description">
                  Engage in a live, conversational interview with low-latency audio or text. Experience realistic follow-up pushbacks and code challenges.
                </p>
                <div className="step-pills">
                  <span className="step-pill">Voice & Text</span>
                  <span className="step-pill">Adaptive Pushback</span>
                </div>
                <div className="step-connector-line" aria-hidden="true"></div>
              </div>

              {/* Step 4 */}
              <div className="process-step-card">
                <div className="step-card-header">
                  <span className="step-number">04</span>
                  <div className="step-icon-wrap">
                    <Award size={22} />
                  </div>
                </div>
                <h3 className="step-title">Get Detailed Feedback</h3>
                <p className="step-description">
                  Instantly receive an objective scorecard breaking down technical depth, problem-solving, speech clarity, and concrete model answers.
                </p>
                <div className="step-pills">
                  <span className="step-pill">Rubric Scorecard</span>
                  <span className="step-pill">Model Answers</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            4. INTERVIEW MODES (4 Visually Distinct Cards)
            ==================================================================== */}
        <section className="section-wrapper interview-modes-section" id="interview-modes">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <Layers size={14} />
                <span>Preparation Tracks</span>
              </div>
              <h2 className="section-title">Interview Modes</h2>
              <p className="section-subtitle">
                Calibrated interview environments customized for every round of the tech recruitment funnel.
              </p>
            </div>

            <div className="modes-grid">
              {/* Card 1: HR Interview */}
              <div className="mode-card standard-mode-card">
                <div className="mode-card-badge">Behavioral & Fit</div>
                <div className="mode-card-icon-wrap">
                  <Users size={24} />
                </div>
                <h3 className="mode-card-title">HR Interview</h3>
                <p className="mode-card-description">
                  Master behavioral evaluations, culture fit discussions, and high-stakes situational questions with realistic follow-up probing.
                </p>
                <ul className="mode-card-bullets">
                  <li>
                    <Check size={16} className="bullet-check" />
                    <span>Behavioral questions & STAR framework scoring</span>
                  </li>
                  <li>
                    <Check size={16} className="bullet-check" />
                    <span>Communication pacing & executive presence</span>
                  </li>
                  <li>
                    <Check size={16} className="bullet-check" />
                    <span>Situational conflict resolution & leadership</span>
                  </li>
                </ul>
                <button type="button" className="btn-mode-card" onClick={handleStartInterview}>
                  <span>Start HR Round</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Card 2: Technical Interview */}
              <div className="mode-card standard-mode-card">
                <div className="mode-card-badge">Architecture & Domain</div>
                <div className="mode-card-icon-wrap">
                  <Layers size={24} />
                </div>
                <h3 className="mode-card-title">Technical Interview</h3>
                <p className="mode-card-description">
                  Deep-dive into computer science fundamentals, architectural trade-offs, database indexing, and role-specific engineering.
                </p>
                <ul className="mode-card-bullets">
                  <li>
                    <Check size={16} className="bullet-check" />
                    <span>CS fundamentals & operating system internals</span>
                  </li>
                  <li>
                    <Check size={16} className="bullet-check" />
                    <span>Technical questions & architectural trade-offs</span>
                  </li>
                  <li>
                    <Check size={16} className="bullet-check" />
                    <span>Role-specific questions (Cloud, APIs, Systems)</span>
                  </li>
                </ul>
                <button type="button" className="btn-mode-card" onClick={handleStartInterview}>
                  <span>Start Technical Round</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Card 3: DSA Interview */}
              <div className="mode-card standard-mode-card">
                <div className="mode-card-badge">Algorithms & Code</div>
                <div className="mode-card-icon-wrap">
                  <Code2 size={24} />
                </div>
                <h3 className="mode-card-title">DSA Interview</h3>
                <p className="mode-card-description">
                  Tackle algorithmic coding problems in a real-time browser sandbox with automated unit test suites and Big-O evaluation.
                </p>
                <ul className="mode-card-bullets">
                  <li>
                    <Check size={16} className="bullet-check" />
                    <span>Coding problems from Easy to FAANG Hard</span>
                  </li>
                  <li>
                    <Check size={16} className="bullet-check" />
                    <span>Built-in code editor with syntax highlighting</span>
                  </li>
                  <li>
                    <Check size={16} className="bullet-check" />
                    <span>Automated test cases & edge case evaluation</span>
                  </li>
                  <li>
                    <Check size={16} className="bullet-check" />
                    <span>AI evaluation on time & space complexity</span>
                  </li>
                </ul>
                <button type="button" className="btn-mode-card" onClick={handleStartInterview}>
                  <span>Start DSA Round</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Card 4: Complete Company Crack (Visually stands out as advanced interview journey) */}
              <div className="mode-card featured-journey-card">
                <div className="journey-top-pill">
                  <Zap size={14} className="journey-zap-icon" />
                  <span>Flagship Interview Journey</span>
                </div>
                <div className="mode-card-icon-wrap featured-icon-wrap">
                  <Award size={26} />
                </div>
                <h3 className="mode-card-title featured-title">Complete Company Crack</h3>
                <p className="mode-card-description">
                  An end-to-end recruitment journey that simulates a full hiring loop. Progress sequentially from coding to technical and behavioral rounds under realistic hiring conditions.
                </p>

                {/* Sequential Journey Tracker */}
                <div className="journey-pipeline-tracker">
                  <div className="journey-step-node">
                    <span className="step-circle">1</span>
                    <span className="step-name">DSA Coding</span>
                  </div>
                  <span className="journey-arrow">→</span>
                  <div className="journey-step-node">
                    <span className="step-circle">2</span>
                    <span className="step-name">Technical</span>
                  </div>
                  <span className="journey-arrow">→</span>
                  <div className="journey-step-node">
                    <span className="step-circle">3</span>
                    <span className="step-name">HR Fit</span>
                  </div>
                </div>

                <ul className="mode-card-bullets featured-bullets">
                  <li>
                    <Check size={16} className="bullet-check-featured" />
                    <span><strong>DSA → Technical → HR</strong> sequential rounds</span>
                  </li>
                  <li>
                    <Check size={16} className="bullet-check-featured" />
                    <span>Complete rounds sequentially with fatigue simulation</span>
                  </li>
                  <li>
                    <Check size={16} className="bullet-check-featured" />
                    <span>Composite hiring recommendation & progress tracking</span>
                  </li>
                </ul>

                <button type="button" className="btn-journey-primary" onClick={handleStartInterview}>
                  <span>Launch Full Interview Journey</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            5. AI-POWERED FEATURES (Feature Grid)
            ==================================================================== */}
        <section className="section-wrapper features-section" id="features">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <Cpu size={14} />
                <span>Cutting-Edge Architecture</span>
              </div>
              <h2 className="section-title">AI-Powered Features</h2>
              <p className="section-subtitle">
                State-of-the-art tools engineered specifically for authentic interview simulation, not generic chatbots.
              </p>
            </div>

            <div className="features-grid">
              {/* Feature 1 */}
              <div className="feature-card">
                <div className="feature-icon-box">
                  <FileText size={20} />
                </div>
                <h3 className="feature-card-title">Resume-based questions</h3>
                <p className="feature-card-desc">
                  Parses your actual project accomplishments, architecture decisions, and tech stack to ask deep, authentic follow-up questions.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="feature-card">
                <div className="feature-icon-box">
                  <Briefcase size={20} />
                </div>
                <h3 className="feature-card-title">Role-specific interviews</h3>
                <p className="feature-card-desc">
                  Curated interview paths tailored for Frontend, Backend, Full Stack, SRE, DevOps, and Machine Learning engineering roles.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="feature-card">
                <div className="feature-icon-box">
                  <BrainCircuit size={20} />
                </div>
                <h3 className="feature-card-title">AI-generated questions</h3>
                <p className="feature-card-desc">
                  Dynamic question generator that never repeats static prompts, adapting in real time to your answers and stated design decisions.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="feature-card">
                <div className="feature-icon-box">
                  <Terminal size={20} />
                </div>
                <h3 className="feature-card-title">Built-in coding editor</h3>
                <p className="feature-card-desc">
                  Clean, distraction-free browser IDE supporting multi-language syntax, real-time code execution, and test cases.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="feature-card">
                <div className="feature-icon-box">
                  <Radio size={20} />
                </div>
                <h3 className="feature-card-title">Real-time interview experience</h3>
                <p className="feature-card-desc">
                  Sub-180ms conversational voice pipelines with dynamic interruptions that simulate speaking to an actual staff engineer.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="feature-card">
                <div className="feature-icon-box">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="feature-card-title">Detailed AI feedback</h3>
                <p className="feature-card-desc">
                  Granular rubric scorecards identifying weak explanations, missed edge cases, and architectural oversights.
                </p>
              </div>

              {/* Feature 7 */}
              <div className="feature-card">
                <div className="feature-icon-box">
                  <BarChart3 size={20} />
                </div>
                <h3 className="feature-card-title">Performance analytics</h3>
                <p className="feature-card-desc">
                  Quantitative telemetry tracking your technical accuracy, communication clarity, problem-solving, and vocal confidence.
                </p>
              </div>

              {/* Feature 8 */}
              <div className="feature-card">
                <div className="feature-icon-box">
                  <Clock size={20} />
                </div>
                <h3 className="feature-card-title">Interview history</h3>
                <p className="feature-card-desc">
                  Revisit all past mock interview transcripts, recorded audio answers, code submissions, and score progression over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            6. RESUME-BASED PERSONALIZATION
            ==================================================================== */}
        <section className="section-wrapper personalization-section" id="personalization">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <Sparkles size={14} />
                <span>Hyper-Personalization</span>
              </div>
              <h2 className="section-title">Resume-Based Personalization</h2>
              <p className="section-subtitle">
                How our AI analyzes your actual skills and background to generate targeted, authentic interview scenarios.
              </p>
            </div>

            {/* Pipeline Flow Visualization:
                Resume ↓ AI analyzes skills and experience ↓ Target Role ↓ Personalized Questions ↓ AI Interview ↓ Performance Feedback */}
            <div className="flow-pipeline-container">
              <div className="flow-step-node">
                <span className="flow-node-icon"><FileText size={16} /></span>
                <span className="flow-node-label">Resume</span>
              </div>
              <span className="flow-arrow">→</span>

              <div className="flow-step-node">
                <span className="flow-node-icon"><BrainCircuit size={16} /></span>
                <span className="flow-node-label">AI Analyzes Skills & Exp</span>
              </div>
              <span className="flow-arrow">→</span>

              <div className="flow-step-node">
                <span className="flow-node-icon"><Target size={16} /></span>
                <span className="flow-node-label">Target Role</span>
              </div>
              <span className="flow-arrow">→</span>

              <div className="flow-step-node">
                <span className="flow-node-icon"><HelpCircle size={16} /></span>
                <span className="flow-node-label">Personalized Questions</span>
              </div>
              <span className="flow-arrow">→</span>

              <div className="flow-step-node">
                <span className="flow-node-icon"><Radio size={16} /></span>
                <span className="flow-node-label">AI Interview</span>
              </div>
              <span className="flow-arrow">→</span>

              <div className="flow-step-node">
                <span className="flow-node-icon"><Award size={16} /></span>
                <span className="flow-node-label">Performance Feedback</span>
              </div>
            </div>

            {/* Interactive Track Selector */}
            <div className="personalization-tabs">
              {PERSONALIZATION_TRACKS.map((track, idx) => (
                <button
                  key={track.id}
                  type="button"
                  className={`track-tab-btn ${selectedPersonalization === idx ? 'active' : ''}`}
                  onClick={() => setSelectedPersonalization(idx)}
                >
                  <span>{track.role}</span>
                </button>
              ))}
            </div>

            {/* Side-by-Side: Sample Resume Card vs AI-Generated Questions */}
            <div className="personalization-showcase-grid">
              {/* Left Side: Resume Card */}
              <div className="showcase-card resume-card">
                <div className="showcase-card-header">
                  <div className="card-header-meta">
                    <span className="card-chip">Uploaded Resume</span>
                    <h3 className="candidate-name">{activeTrack.candidate}</h3>
                    <span className="target-role-label">Target: {activeTrack.role}</span>
                  </div>
                  <div className="parsing-status-pill">
                    <span className="status-dot"></span>
                    <span>Parsed & Verified</span>
                  </div>
                </div>

                <div className="resume-section-block">
                  <span className="resume-label">Extracted Skills:</span>
                  <div className="resume-tags">
                    {activeTrack.skills.map((skill) => (
                      <span key={skill} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="resume-section-block">
                  <span className="resume-label">Project Accomplishment Excerpt:</span>
                  <div className="project-quote-box">
                    <p className="project-text">"{activeTrack.projectHighlight}"</p>
                  </div>
                </div>

                <div className="resume-section-block">
                  <span className="resume-label">AI Keyword Extractions:</span>
                  <div className="extracted-pills">
                    {activeTrack.parsedTags.map((tag) => (
                      <span key={tag} className="extracted-pill">
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: AI-Generated Questions */}
              <div className="showcase-card questions-card">
                <div className="showcase-card-header">
                  <div className="card-header-meta">
                    <span className="card-chip chip-ai">AI Generation Engine</span>
                    <h3 className="candidate-name">Tailored Interview Questions</h3>
                    <span className="target-role-label">Generated in 1.2s based on resume context</span>
                  </div>
                  <div className="ai-status-pill">
                    <Sparkles size={14} className="text-cyan" />
                    <span>Calibrated</span>
                  </div>
                </div>

                <div className="tailored-questions-list">
                  {activeTrack.questions.map((item, qIdx) => (
                    <div key={qIdx} className="tailored-question-item">
                      <div className="question-meta-row">
                        <span className="question-number-pill">Question 0{qIdx + 1}</span>
                        <span className="question-focus-tag">{item.focus}</span>
                      </div>
                      <p className="tailored-question-text">"{item.question}"</p>
                      <div className="question-footer-meta">
                        <span className="depth-indicator">{item.depth}</span>
                        <span className="ai-verification">Resume bullet verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            7. PERFORMANCE & FEEDBACK (Sample Analytics Dashboard)
            ==================================================================== */}
        <section className="section-wrapper performance-section" id="performance">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <BarChart3 size={14} />
                <span>Quantitative Evaluation</span>
              </div>
              <h2 className="section-title">Performance & Feedback</h2>
              <div className="feedback-highlight-banner">
                <h3 className="highlight-text">"Know exactly where you need to improve."</h3>
              </div>
              <p className="section-subtitle">
                Clear, actionable analytics that identify hidden blindspots, measure communication speed, and benchmark your answers against real company rubrics.
              </p>
              <div className="demo-data-disclaimer">
                <span className="demo-dot"></span>
                <span>DEMO / SAMPLE DATA PREVIEW • ILLUSTRATIVE CANDIDATE REPORT</span>
              </div>
            </div>

            {/* Dashboard Container */}
            <div className="analytics-dashboard-card">
              {/* Top Overview Cards */}
              <div className="analytics-metrics-grid">
                {/* Metric 1: Overall Score */}
                <div className="metric-box overall-metric-box">
                  <div className="metric-box-top">
                    <span className="metric-box-label">Overall Score</span>
                    <span className="score-hire-badge">Strong Hire Bar</span>
                  </div>
                  <div className="metric-big-score">
                    <span className="big-number">88</span>
                    <span className="score-total">/100</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill fill-overall" style={{ width: '88%' }}></div>
                  </div>
                  <span className="metric-foot-note">Top 9% of all candidate mock rounds</span>
                </div>

                {/* Metric 2: Technical Skills */}
                <div className="metric-box">
                  <div className="metric-box-top">
                    <span className="metric-box-label">Technical Skills</span>
                    <span className="metric-percent-tag">92%</span>
                  </div>
                  <div className="metric-big-score">
                    <span className="big-number">92</span>
                    <span className="score-total">%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill fill-tech" style={{ width: '92%' }}></div>
                  </div>
                  <span className="metric-foot-note">Deep domain accuracy & API idioms</span>
                </div>

                {/* Metric 3: Problem Solving */}
                <div className="metric-box">
                  <div className="metric-box-top">
                    <span className="metric-box-label">Problem Solving</span>
                    <span className="metric-percent-tag">90%</span>
                  </div>
                  <div className="metric-big-score">
                    <span className="big-number">90</span>
                    <span className="score-total">%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill fill-solving" style={{ width: '90%' }}></div>
                  </div>
                  <span className="metric-foot-note">Systematic constraint clarification</span>
                </div>

                {/* Metric 4: Communication */}
                <div className="metric-box">
                  <div className="metric-box-top">
                    <span className="metric-box-label">Communication</span>
                    <span className="metric-percent-tag">86%</span>
                  </div>
                  <div className="metric-big-score">
                    <span className="big-number">86</span>
                    <span className="score-total">%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill fill-comm" style={{ width: '86%' }}></div>
                  </div>
                  <span className="metric-foot-note">Concise STAR delivery, low filler words</span>
                </div>

                {/* Metric 5: Confidence */}
                <div className="metric-box">
                  <div className="metric-box-top">
                    <span className="metric-box-label">Confidence</span>
                    <span className="metric-percent-tag">84%</span>
                  </div>
                  <div className="metric-big-score">
                    <span className="big-number">84</span>
                    <span className="score-total">%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill fill-conf" style={{ width: '84%' }}></div>
                  </div>
                  <span className="metric-foot-note">Composed during follow-up pushback</span>
                </div>
              </div>

              {/* Diagnostic Feedback Breakdown Tab Bar */}
              <div className="dashboard-detail-block">
                <div className="dashboard-subnav">
                  <button
                    type="button"
                    className={`subnav-btn ${feedbackTab === 'rubric' ? 'active' : ''}`}
                    onClick={() => setFeedbackTab('rubric')}
                  >
                    Rubric Breakdown
                  </button>
                  <button
                    type="button"
                    className={`subnav-btn ${feedbackTab === 'strengths' ? 'active' : ''}`}
                    onClick={() => setFeedbackTab('strengths')}
                  >
                    Strengths & Growth Areas
                  </button>
                  <button
                    type="button"
                    className={`subnav-btn ${feedbackTab === 'model' ? 'active' : ''}`}
                    onClick={() => setFeedbackTab('model')}
                  >
                    Model Answer Insights
                  </button>
                </div>

                <div className="subnav-tab-content">
                  {feedbackTab === 'rubric' && (
                    <div className="rubric-bars-view">
                      <div className="rubric-row">
                        <div className="rubric-name-group">
                          <span className="rubric-category">System Architecture & Scalability</span>
                          <span className="rubric-desc">Demonstrated decoupling of write pipelines and caching layers.</span>
                        </div>
                        <div className="rubric-bar-container">
                          <div className="rubric-bar-track">
                            <div className="rubric-bar-value" style={{ width: '94%' }}></div>
                          </div>
                          <span className="rubric-score-label">94 / 100</span>
                        </div>
                      </div>

                      <div className="rubric-row">
                        <div className="rubric-name-group">
                          <span className="rubric-category">Algorithm Correctness & Edge Cases</span>
                          <span className="rubric-desc">Covered empty arrays and network partition latency edge cases.</span>
                        </div>
                        <div className="rubric-bar-container">
                          <div className="rubric-bar-track">
                            <div className="rubric-bar-value" style={{ width: '91%' }}></div>
                          </div>
                          <span className="rubric-score-label">91 / 100</span>
                        </div>
                      </div>

                      <div className="rubric-row">
                        <div className="rubric-name-group">
                          <span className="rubric-category">Spoken Communication & Structured Thoughts</span>
                          <span className="rubric-desc">132 words per minute; minimal filler words; concise summary.</span>
                        </div>
                        <div className="rubric-bar-container">
                          <div className="rubric-bar-track">
                            <div className="rubric-bar-value" style={{ width: '87%' }}></div>
                          </div>
                          <span className="rubric-score-label">87 / 100</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {feedbackTab === 'strengths' && (
                    <div className="strengths-weakness-grid">
                      <div className="feedback-col strengths-col">
                        <div className="feedback-col-header">
                          <CheckCircle2 size={18} className="text-emerald" />
                          <h4>Demonstrated Strengths</h4>
                        </div>
                        <ul className="feedback-list">
                          <li>Proactively clarified query SLAs before proposing Redis sliding window caching.</li>
                          <li>Accurately calculated memory footprint for 10M daily active users.</li>
                          <li>Articulated CAP theorem trade-offs between Redis clusters and Cassandra with composure.</li>
                        </ul>
                      </div>

                      <div className="feedback-col growth-col">
                        <div className="feedback-col-header">
                          <TrendingUp size={18} className="text-cyan" />
                          <h4>Targeted Areas for Improvement</h4>
                        </div>
                        <ul className="feedback-list">
                          <li>Initially forgot to handle fallback behavior when primary Redis master experiences split-brain.</li>
                          <li>Recommend stating Big-O space complexity upfront before typing code into the editor.</li>
                          <li>Use STAR method more strictly when summarizing cross-team architectural disagreements.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {feedbackTab === 'model' && (
                    <div className="model-answer-view">
                      <div className="model-header">
                        <span className="model-badge">AI Calibrated Benchmark Answer</span>
                        <h4>Distributed Rate Limiting Strategy</h4>
                      </div>
                      <p className="model-text">
                        "For a 10M req/sec budget across multi-region clusters, the optimal strategy decouples local sub-millisecond evaluation from eventual Redis cluster reconciliation. Using an in-process local ring buffer allows sub-0.05ms rate evaluation on hot paths, while an asynchronous sliding counter reconciles global quotas in 100ms batches, gracefully degrading during network partitions."
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            8. WHO IS IT FOR? (4 Cards)
            ==================================================================== */}
        <section className="section-wrapper audience-section" id="who-is-it-for">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <Users size={14} />
                <span>Target Audiences</span>
              </div>
              <h2 className="section-title">Who Is It For?</h2>
              <p className="section-subtitle">
                Tailored simulation experiences engineered to empower candidates at every milestone of their technical careers.
              </p>
            </div>

            <div className="audience-grid">
              {/* Card 1: Students */}
              <div className="audience-card">
                <div className="audience-icon-box">
                  <GraduationCap size={24} />
                </div>
                <span className="audience-tag">Campus & Placements</span>
                <h3 className="audience-title">Students</h3>
                <h4 className="audience-subtitle">Prepare for campus placements</h4>
                <p className="audience-desc">
                  Eliminate first-interview anxiety. Practice foundational CS subjects, core DSA patterns, and behavioral rounds in an unlimited, pressure-free sandbox before placement season.
                </p>
                <div className="audience-perks">
                  <span>✓ Core CS Fundamentals</span>
                  <span>✓ Placement Drive Rubrics</span>
                </div>
              </div>

              {/* Card 2: Job Seekers */}
              <div className="audience-card">
                <div className="audience-icon-box">
                  <Briefcase size={24} />
                </div>
                <span className="audience-tag">Active Candidates</span>
                <h3 className="audience-title">Job Seekers</h3>
                <h4 className="audience-subtitle">Practice before real interviews</h4>
                <p className="audience-desc">
                  Shake off interview rust and sharpen your communication. Rehearse with calibrated company questions so you step into your real panel fully warmed up and articulate.
                </p>
                <div className="audience-perks">
                  <span>✓ Spoken Practice</span>
                  <span>✓ Realistic Pushbacks</span>
                </div>
              </div>

              {/* Card 3: Career Switchers */}
              <div className="audience-card">
                <div className="audience-icon-box">
                  <Compass size={24} />
                </div>
                <span className="audience-tag">Transitions</span>
                <h3 className="audience-title">Career Switchers</h3>
                <h4 className="audience-subtitle">Prepare for a new role</h4>
                <p className="audience-desc">
                  Transitioning into software engineering, DevOps, or product? Bridge domain knowledge gaps, learn technical interview vocabulary, and gain the confidence to pivot seamlessly.
                </p>
                <div className="audience-perks">
                  <span>✓ Role-Targeted Scenarios</span>
                  <span>✓ Instant Gap Coaching</span>
                </div>
              </div>

              {/* Card 4: Developers */}
              <div className="audience-card">
                <div className="audience-icon-box">
                  <Code2 size={24} />
                </div>
                <span className="audience-tag">Engineers & Leads</span>
                <h3 className="audience-title">Developers</h3>
                <h4 className="audience-subtitle">Practice technical and DSA interviews</h4>
                <p className="audience-desc">
                  Target Senior (L5) and Staff (L6) roles at tier-1 tech companies. Pressure-test distributed systems, concurrency locks, and complex Big-O algorithmic trade-offs.
                </p>
                <div className="audience-perks">
                  <span>✓ Advanced System Design</span>
                  <span>✓ Hard DSA In Sandbox</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            9. WHY AI INTERVIEWER? (Clean Comparison Section)
            ==================================================================== */}
        <section className="section-wrapper comparison-section" id="why-us">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <CheckCircle2 size={14} />
                <span>The Modern Approach</span>
              </div>
              <h2 className="section-title">Why AI Interviewer?</h2>
              <p className="section-subtitle">
                A clean, objective comparison of how our autonomous platform compares with traditional interview practice methods.
              </p>
            </div>

            <div className="comparison-cards-container">
              {/* Traditional Practice Card */}
              <div className="comparison-card traditional-card">
                <div className="comparison-card-header">
                  <h3 className="comparison-type-title">Traditional Interview Practice</h3>
                  <span className="comparison-type-badge text-muted">Generic & Inconsistent</span>
                </div>
                <div className="comparison-items-list">
                  <div className="comparison-row">
                    <div className="comparison-icon-negative">
                      <XCircle size={18} />
                    </div>
                    <div className="comparison-text-block">
                      <h4 className="comparison-item-head">Generic questions</h4>
                      <p className="comparison-item-body">
                        Static question lists from forums that ignore your unique resume, career accomplishments, and specific tech stack.
                      </p>
                    </div>
                  </div>

                  <div className="comparison-row">
                    <div className="comparison-icon-negative">
                      <XCircle size={18} />
                    </div>
                    <div className="comparison-text-block">
                      <h4 className="comparison-item-head">Limited personalization</h4>
                      <p className="comparison-item-body">
                        One-size-fits-all prompts that fail to assess the specific libraries, architecture, and seniority of your role.
                      </p>
                    </div>
                  </div>

                  <div className="comparison-row">
                    <div className="comparison-icon-negative">
                      <XCircle size={18} />
                    </div>
                    <div className="comparison-text-block">
                      <h4 className="comparison-item-head">Limited feedback</h4>
                      <p className="comparison-item-body">
                        Vague, subjective comments like "you did fine" without precise technical breakdowns or actionable improvement plans.
                      </p>
                    </div>
                  </div>

                  <div className="comparison-row">
                    <div className="comparison-icon-negative">
                      <XCircle size={18} />
                    </div>
                    <div className="comparison-text-block">
                      <h4 className="comparison-item-head">No performance history</h4>
                      <p className="comparison-item-body">
                        No quantifiable tracking of your verbal clarity, edge case detection, or scoring progression over successive attempts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Interviewer Card */}
              <div className="comparison-card modern-ai-card">
                <div className="comparison-card-header">
                  <div className="modern-badge-row">
                    <span className="ai-highlight-pill">Engineered For Growth</span>
                  </div>
                  <h3 className="comparison-type-title ai-title">AI Interviewer</h3>
                  <span className="comparison-type-badge text-indigo">Autonomous & Calibrated</span>
                </div>
                <div className="comparison-items-list">
                  <div className="comparison-row">
                    <div className="comparison-icon-positive">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="comparison-text-block">
                      <h4 className="comparison-item-head">Resume-based questions</h4>
                      <p className="comparison-item-body">
                        Deep technical interrogations that directly analyze your past engineering projects and architectural choices.
                      </p>
                    </div>
                  </div>

                  <div className="comparison-row">
                    <div className="comparison-icon-positive">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="comparison-text-block">
                      <h4 className="comparison-item-head">Role-specific practice</h4>
                      <p className="comparison-item-body">
                        Tailored rubrics matching your exact target role (Frontend, Backend, SRE, ML, DevOps) and seniority level.
                      </p>
                    </div>
                  </div>

                  <div className="comparison-row">
                    <div className="comparison-icon-positive">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="comparison-text-block">
                      <h4 className="comparison-item-head">Detailed AI feedback</h4>
                      <p className="comparison-item-body">
                        Instant, objective rubric scorecards highlighting edge case omissions, speech metrics, and optimal model solutions.
                      </p>
                    </div>
                  </div>

                  <div className="comparison-row">
                    <div className="comparison-icon-positive">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="comparison-text-block">
                      <h4 className="comparison-item-head">Performance tracking</h4>
                      <p className="comparison-item-body">
                        Comprehensive analytics dashboards recording every session, time complexity trends, and mastery metrics.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            10. FINAL CTA SECTION
            ==================================================================== */}
        <section className="final-cta-section" id="cta">
          <div className="final-cta-container">
            <div className="final-cta-card">
              <div className="cta-ambient-glow" aria-hidden="true"></div>
              
              <div className="cta-badge">
                <Sparkles size={14} className="text-cyan" />
                <span>Begin Your Journey</span>
              </div>

              <h2 className="cta-headline">
                Your Next Interview Starts With Practice.
              </h2>

              <p className="cta-subtitle">
                Practice smarter, understand your weaknesses, and walk into your next interview with confidence.
              </p>

              <div className="cta-action-row">
                <button type="button" className="btn-cta-primary" onClick={handleStartInterview}>
                  <span>Create Free Account</span>
                  <ArrowRight size={17} />
                </button>
              </div>

              <div className="cta-trust-items">
                <span className="cta-trust-item">
                  <Check size={14} className="text-emerald" /> Free Starter Rounds
                </span>
                <span className="cta-trust-item">
                  <Check size={14} className="text-emerald" /> No Credit Card Required
                </span>
                <span className="cta-trust-item">
                  <Check size={14} className="text-emerald" /> 1-Minute Setup
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ====================================================================
          11. FOOTER
          ==================================================================== */}
      <footer className="home-footer" id="about">
        <div className="footer-container">
          <div className="footer-top-grid">
            {/* Brand Column */}
            <div className="footer-brand-col">
              <div className="footer-brand-logo">
                <div className="brand-logo-icon">
                  <BrainCircuit size={18} className="brand-icon-svg" />
                </div>
                <span className="footer-brand-name">AI Interviewer</span>
              </div>
              <p className="footer-brand-tagline">
                Autonomous AI mock interview platform empowering students, developers, and career switchers to master technical and behavioral interviews.
              </p>
              <div className="footer-security-pill">
                <Shield size={14} className="text-indigo" />
                <span>Bank-grade encryption · Private transcripts</span>
              </div>
            </div>

            {/* Product Column */}
            <div className="footer-nav-col">
              <h4 className="footer-col-title">Product</h4>
              <ul className="footer-links-list">
                <li>
                  <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>
                    Features
                  </a>
                </li>
                <li>
                  <a href="#interview-modes" onClick={(e) => scrollToSection(e, 'interview-modes')}>
                    Interview Modes
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#performance" onClick={(e) => scrollToSection(e, 'performance')}>
                    Performance Dashboard
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="footer-nav-col">
              <h4 className="footer-col-title">Company</h4>
              <ul className="footer-links-list">
                <li>
                  <a href="#about" onClick={(e) => scrollToSection(e, 'about')}>
                    About
                  </a>
                </li>
                <li>
                  <a href="#about" onClick={(e) => scrollToSection(e, 'about')}>
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#who-is-it-for" onClick={(e) => scrollToSection(e, 'who-is-it-for')}>
                    Who Is It For
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="footer-nav-col">
              <h4 className="footer-col-title">Legal</h4>
              <ul className="footer-links-list">
                <li>
                  <a href="#privacy" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" onClick={(e) => e.preventDefault()}>
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#security" onClick={(e) => e.preventDefault()}>
                    Data Protection
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom Bar */}
          <div className="footer-bottom-bar">
            <p className="copyright-text">
              © 2026 AI Interviewer. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <span>Privacy</span>
              <span>•</span>
              <span>Terms</span>
              <span>•</span>
              <span>Status: All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
