import React, { useState } from 'react';
import { Sparkles, Bot, BrainCircuit, Radio } from 'lucide-react';

const SAMPLE_QUESTIONS = {
  system: {
    label: 'System Design',
    role: 'Staff Engineer (Meta / Google)',
    question: 'How would you architect a global low-latency rate limiter handling 10M req/sec with Redis & Token Bucket?',
    scores: {
      technical: 95,
      architecture: 92,
      communication: 90,
    },
    insight: 'Identified single point of failure in Redis cluster and proposed distributed sliding window hashing.'
  },
  dsa: {
    label: 'DSA & Algorithms',
    role: 'Senior SWE (Stripe / Apple)',
    question: 'Implement an LRU Cache with O(1) get and put operations handling concurrent worker evictions.',
    scores: {
      technical: 96,
      architecture: 89,
      communication: 93,
    },
    insight: 'Optimal doubly-linked list + hash map choice with reentrant mutex locking strategy.'
  },
  behavioral: {
    label: 'Behavioral & Leadership',
    role: 'Engineering Lead (Amazon / Uber)',
    question: 'Describe a high-stakes cross-team architectural dispute you resolved while hitting a tight deadline.',
    scores: {
      technical: 91,
      architecture: 94,
      communication: 97,
    },
    insight: 'Exemplary STAR framework delivery with data-driven compromise and documented retro.'
  }
};

const TARGET_COMPANIES = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Stripe', 'Netflix'];

export default function ShowcasePanel() {
  const [activeCategory, setActiveCategory] = useState('system');
  const currentScenario = SAMPLE_QUESTIONS[activeCategory];

  return (
    <div className="showcase-pane">
      {/* Brand & Status Pill */}
      <div className="showcase-top">
        <div className="status-pill">
          <span className="live-dot"></span>
          <span className="status-pill-text">AI Mock Engine v2.4 Active</span>
          <span className="status-pill-badge">Zero Latency</span>
        </div>

        <h1 className="showcase-headline">
          Master Your Tech Interviews with <span className="gradient-text">Adaptive AI</span>.
        </h1>
        <p className="showcase-description">
          Practice realistic System Design, Live Coding, and Behavioral rounds with instant rubric evaluation and personalized coaching.
        </p>
      </div>

      {/* Interactive Live AI Mock Interview Preview Widget */}
      <div className="sim-widget">
        <div className="sim-header">
          <div className="sim-header-left">
            <div className="sim-header-icon">
              <Bot size={18} />
            </div>
            <div>
              <div className="sim-header-title">Live AI Simulation</div>
              <div className="sim-header-sub">{currentScenario.role}</div>
            </div>
          </div>
          <div className="sim-live-indicator">
            <Radio size={14} className="pulse-icon" />
            <span>Interactive</span>
          </div>
        </div>

        {/* Category Pill Switcher */}
        <div className="sim-tabs">
          {Object.entries(SAMPLE_QUESTIONS).map(([key, data]) => (
            <button
              key={key}
              type="button"
              className={`sim-tab-btn ${activeCategory === key ? 'active' : ''}`}
              onClick={() => setActiveCategory(key)}
            >
              {data.label}
            </button>
          ))}
        </div>

        {/* AI Question Box */}
        <div className="sim-question-box">
          <div className="sim-ai-bar">
            <div className="sim-interviewer-avatar">
              <BrainCircuit size={16} />
            </div>
            <span className="sim-interviewer-name">Alex · Staff Interviewer AI</span>
            <div className="sim-audio-wave">
              <span className="bar bar-1"></span>
              <span className="bar bar-2"></span>
              <span className="bar bar-3"></span>
              <span className="bar bar-4"></span>
              <span className="bar bar-5"></span>
            </div>
          </div>
          <p className="sim-question-text">
            "{currentScenario.question}"
          </p>
        </div>

        {/* Dynamic Rubric Score Breakdown */}
        <div className="sim-scores-card">
          <div className="sim-scores-header">
            <span>Real-time Candidate Rubric</span>
            <span className="sim-score-badge">Top 3% Candidate</span>
          </div>

          <div className="rubric-bars">
            <div className="rubric-item">
              <div className="rubric-label">
                <span>Technical Precision</span>
                <span className="rubric-val">{currentScenario.scores.technical}%</span>
              </div>
              <div className="rubric-progress-track">
                <div
                  className="rubric-progress-fill fill-cyan"
                  style={{ width: `${currentScenario.scores.technical}%` }}
                ></div>
              </div>
            </div>

            <div className="rubric-item">
              <div className="rubric-label">
                <span>System Architecture</span>
                <span className="rubric-val">{currentScenario.scores.architecture}%</span>
              </div>
              <div className="rubric-progress-track">
                <div
                  className="rubric-progress-fill fill-purple"
                  style={{ width: `${currentScenario.scores.architecture}%` }}
                ></div>
              </div>
            </div>

            <div className="rubric-item">
              <div className="rubric-label">
                <span>Articulation & Structure</span>
                <span className="rubric-val">{currentScenario.scores.communication}%</span>
              </div>
              <div className="rubric-progress-track">
                <div
                  className="rubric-progress-fill fill-green"
                  style={{ width: `${currentScenario.scores.communication}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="sim-insight-note">
            <Sparkles size={14} className="sim-sparkle-icon" />
            <span>{currentScenario.insight}</span>
          </div>
        </div>
      </div>

      {/* Target Companies & Proof Stats */}
      <div className="showcase-bottom">
        <div className="companies-label">Candidates placed at top tech teams</div>
        <div className="companies-pills">
          {TARGET_COMPANIES.map((company) => (
            <span key={company} className="company-tag">{company}</span>
          ))}
        </div>

        <div className="proof-metrics">
          <div className="metric-col">
            <span className="metric-number">12,500+</span>
            <span className="metric-caption">Mock Sessions Run</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-col">
            <span className="metric-number">94.2%</span>
            <span className="metric-caption">Offer Placement Rate</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-col">
            <span className="metric-number">4.9/5</span>
            <span className="metric-caption">Student Satisfaction</span>
          </div>
        </div>
      </div>
    </div>
  );
}
