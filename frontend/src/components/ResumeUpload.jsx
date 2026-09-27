import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  GraduationCap,
  Code2,
  Layers,
  Briefcase,
  Award,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Loader2,
  RotateCcw
} from 'lucide-react';
import './ResumeUpload.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function ResumeUpload({ onBack, onUploadSuccess, _currentUser }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'ready' | 'uploading' | 'success'
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);

  const validateAndSelectFile = (file) => {
    setError(null);

    if (!file) return;

    // Check PDF format
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setError('Please upload a valid PDF document (.pdf format only).');
      return;
    }

    // Check size limit
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds the 10 MB maximum limit.');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('ready');
    setUploadProgress(0);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadResume = () => {
    if (!selectedFile || uploadStatus === 'uploading') return;

    setUploadStatus('uploading');
    setUploadProgress(15);
    setError(null);

    // Realistic upload & analysis progression
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(100);
            setUploadStatus('success');
            if (onUploadSuccess) {
              onUploadSuccess({
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                uploadedAt: new Date().toISOString()
              });
            }
          }, 350);
          return 90;
        }
        return prev + 25;
      });
    }, 200);
  };

  return (
    <div className="resume-upload-page">
      {/* Ambient Radial Background Glows (Consistent with Platform Palette) */}
      <div className="upload-ambient-glow glow-top" aria-hidden="true"></div>
      <div className="upload-ambient-glow glow-bottom" aria-hidden="true"></div>
      <div className="upload-subtle-grid" aria-hidden="true"></div>

      {/* Navigation Top Bar */}
      <header className="upload-header">
        <div className="upload-header-container">
          {onBack && (
            <button
              type="button"
              className="btn-upload-back"
              onClick={onBack}
              title="Return to previous screen"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}

          <div className="upload-brand">
            <div className="upload-brand-icon">
              <BrainCircuit size={18} />
            </div>
            <span className="upload-brand-title">AI Interviewer</span>
          </div>

          <div className="upload-header-status">
            <span className="secure-badge">
              <ShieldCheck size={14} className="text-emerald" />
              <span>Secure Session</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Upload Container */}
      <main className="upload-main-content">
        <div className="upload-card">
          {/* Heading & Short Description */}
          <div className="upload-heading-group">
            <div className="upload-pill-tag">
              <BrainCircuit size={13} />
              <span>Interview Personalization</span>
            </div>
            <h1 className="upload-main-title">Upload Your Resume</h1>
            <p className="upload-main-description">
              AI analyzes your background to extract relevant technical skills, past projects, and experience to generate personalized, realistic interview questions.
            </p>
          </div>

          {/* Error Alert Display */}
          {error && (
            <div className="upload-error-alert" role="alert">
              <AlertCircle size={17} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Upload Dropzone Area */}
          <div
            className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!selectedFile ? handleBrowseClick : undefined}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf,.pdf"
              className="hidden-file-input"
              onChange={handleFileChange}
              aria-label="Upload resume file"
            />

            {!selectedFile ? (
              <div className="dropzone-empty-state">
                <div className="dropzone-icon-circle">
                  <UploadCloud size={30} className="upload-cloud-icon" />
                </div>
                <div className="dropzone-text-group">
                  <p className="dropzone-primary-text">
                    Drag and drop your resume PDF here, or{' '}
                    <button
                      type="button"
                      className="btn-browse-inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBrowseClick();
                      }}
                    >
                      Browse Files
                    </button>
                  </p>
                  <p className="dropzone-secondary-text">
                    Supported format: <strong className="highlight-format">PDF</strong> (Max file size: <strong>10 MB</strong>)
                  </p>
                </div>
              </div>
            ) : (
              /* Selected File Details View */
              <div className="selected-file-display" onClick={(e) => e.stopPropagation()}>
                <div className="file-info-row">
                  <div className="file-icon-box">
                    <FileText size={24} className="file-pdf-icon" />
                  </div>

                  <div className="file-meta-col">
                    <div className="file-title-row">
                      <span className="file-name" title={selectedFile.name}>
                        {selectedFile.name}
                      </span>
                    </div>

                    <div className="file-specs-row">
                      <span className="file-size-badge">{formatFileSize(selectedFile.size)}</span>
                      <span className="spec-bullet">•</span>
                      
                      {/* Status indicator */}
                      {uploadStatus === 'ready' && (
                        <span className="status-badge status-ready">
                          <span className="status-dot-ready"></span>
                          Ready to upload
                        </span>
                      )}
                      {uploadStatus === 'uploading' && (
                        <span className="status-badge status-uploading">
                          <Loader2 size={12} className="spinner-icon" />
                          Uploading {uploadProgress}%
                        </span>
                      )}
                      {uploadStatus === 'success' && (
                        <span className="status-badge status-success">
                          <CheckCircle2 size={13} className="text-emerald" />
                          Uploaded successfully
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remove Option */}
                  {uploadStatus !== 'uploading' && (
                    <button
                      type="button"
                      className="btn-remove-file"
                      onClick={handleRemoveFile}
                      title="Remove selected resume"
                      aria-label="Remove selected resume"
                    >
                      <X size={16} />
                      <span className="remove-text">Remove</span>
                    </button>
                  )}
                </div>

                {/* Progress bar when uploading */}
                {uploadStatus === 'uploading' && (
                  <div className="upload-progress-wrapper">
                    <div className="upload-progress-track">
                      <div
                        className="upload-progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {uploadStatus === 'success' && (
                  <div className="upload-success-pill">
                    <CheckCircle2 size={15} className="text-emerald" />
                    <span>Resume parsed & mapped to your AI interview profile.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* "What AI will analyze" Section */}
          <div className="analysis-scope-section">
            <h2 className="analysis-scope-title">What AI will analyze</h2>
            <div className="analysis-items-grid">
              <div className="analysis-item-card">
                <div className="analysis-item-icon">
                  <GraduationCap size={16} />
                </div>
                <div className="analysis-item-text">
                  <span className="item-title">Education</span>
                  <span className="item-desc">Degrees, institutions, and core CS coursework</span>
                </div>
              </div>

              <div className="analysis-item-card">
                <div className="analysis-item-icon">
                  <Code2 size={16} />
                </div>
                <div className="analysis-item-text">
                  <span className="item-title">Skills</span>
                  <span className="item-desc">Programming languages, frameworks, and libraries</span>
                </div>
              </div>

              <div className="analysis-item-card">
                <div className="analysis-item-icon">
                  <Layers size={16} />
                </div>
                <div className="analysis-item-text">
                  <span className="item-title">Projects</span>
                  <span className="item-desc">Architecture, engineering decisions, and impact</span>
                </div>
              </div>

              <div className="analysis-item-card">
                <div className="analysis-item-icon">
                  <Briefcase size={16} />
                </div>
                <div className="analysis-item-text">
                  <span className="item-title">Experience</span>
                  <span className="item-desc">Past roles, responsibilities, and leadership</span>
                </div>
              </div>

              <div className="analysis-item-card">
                <div className="analysis-item-icon">
                  <Award size={16} />
                </div>
                <div className="analysis-item-text">
                  <span className="item-title">Certifications</span>
                  <span className="item-desc">Industry credentials and specialized badges</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Security Note */}
          <div className="upload-privacy-note">
            <ShieldCheck size={16} className="privacy-shield-icon" />
            <p className="privacy-note-text">
              <strong>Your privacy is protected.</strong> Resume data is encrypted with bank-grade standards and used solely to personalize your mock interview simulation. It is never shared with third parties or potential employers.
            </p>
          </div>

          {/* Prominent Action Button */}
          <div className="upload-action-row">
            {uploadStatus === 'success' ? (
              <div className="success-action-group">
                <button
                  type="button"
                  className="btn-upload-primary btn-success-action"
                  onClick={onBack}
                >
                  <span>Proceed to Interview</span>
                  <ArrowRight size={17} />
                </button>
                <button
                  type="button"
                  className="btn-upload-secondary"
                  onClick={handleRemoveFile}
                >
                  <RotateCcw size={15} />
                  <span>Upload Different Resume</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-upload-primary"
                disabled={!selectedFile || uploadStatus === 'uploading'}
                onClick={handleUploadResume}
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 size={18} className="spinner-icon" />
                    <span>Analyzing Resume...</span>
                  </>
                ) : (
                  <>
                    <span>Upload Resume</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
