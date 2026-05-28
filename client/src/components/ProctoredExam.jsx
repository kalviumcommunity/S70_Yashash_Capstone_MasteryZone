import React, { useState, useEffect, useRef } from 'react';
import './ProctoredExam.css';
import { toast } from 'react-toastify';

const MOCK_QUESTIONS = {
  Fitness: [
    { q: "What is the primary muscle group targeted by a bench press?", options: ["Pectorals", "Latissimus Dorsi", "Quadriceps", "Deltoids"], a: 0 },
    { q: "Which of these is a macronutrient?", options: ["Vitamin C", "Protein", "Calcium", "Iron"], a: 1 },
    { q: "What does HIIT stand for?", options: ["Heavy Intensity Interval Training", "High Intensity Interval Training", "Hard Intense Interval Training", "Hyper Intensity Internal Training"], a: 1 }
  ],
  Coding: [
    { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Text Machine Language", "Hyperlinks and Text Markup Language", "Home Tool Markup Language"], a: 0 },
    { q: "Which symbol is used for comments in JavaScript?", options: ["//", "<!--", "/*", "#"], a: 0 },
    { q: "What is React?", options: ["A database", "A CSS framework", "A JavaScript library for building user interfaces", "An operating system"], a: 2 }
  ],
  Driving: [
    { q: "What does a solid double yellow line mean?", options: ["Passing allowed", "No passing allowed", "One-way traffic", "Car-pool lane"], a: 1 },
    { q: "When should you use your turn signal?", options: ["Only when other cars are around", "100 feet before turning", "Right as you turn", "Turn signals are optional"], a: 1 },
    { q: "What is the standard speed limit in a residential area?", options: ["25 mph", "45 mph", "15 mph", "35 mph"], a: 0 }
  ],
  Language: [
    { q: "What is a 'verb'?", options: ["A person, place, or thing", "An action word", "A descriptive word", "A connecting word"], a: 1 },
    { q: "What is the past tense of 'run'?", options: ["Runned", "Running", "Ran", "Runs"], a: 2 },
    { q: "Which language has the most native speakers?", options: ["English", "Spanish", "Mandarin Chinese", "Hindi"], a: 2 }
  ]
};

const ProctoredExam = ({ zone, onClose, title }) => {
  const [examState, setExamState] = useState('PRE_FLIGHT'); // PRE_FLIGHT, IN_PROGRESS, COMPLETED, TERMINATED
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const examContainerRef = useRef(null);

  const questions = MOCK_QUESTIONS[zone] || MOCK_QUESTIONS.Coding; // Fallback
  const MAX_WARNINGS = 3;

  // Initialize Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (err) {
      toast.error("Camera access is required for the proctored exam.");
      return false;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Enter Fullscreen
  const enterFullscreen = async () => {
    try {
      if (examContainerRef.current && examContainerRef.current.requestFullscreen) {
        await examContainerRef.current.requestFullscreen();
      } else if (examContainerRef.current && examContainerRef.current.webkitRequestFullscreen) {
        await examContainerRef.current.webkitRequestFullscreen();
      }
      return true;
    } catch (err) {
      toast.error("Fullscreen mode is required.");
      return false;
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Handle Visibility Change (Anti-Cheat)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (examState === 'IN_PROGRESS' && document.hidden) {
        const newWarnings = warnings + 1;
        setWarnings(newWarnings);
        if (newWarnings >= MAX_WARNINGS) {
          setExamState('TERMINATED');
          toast.error("Exam Terminated due to multiple violations.");
        } else {
          toast.warning(`PROCTOR WARNING (${newWarnings}/${MAX_WARNINGS}): You left the exam window. Do not switch tabs!`, { autoClose: false });
        }
      }
    };

    const handleFullscreenChange = () => {
      if (examState === 'IN_PROGRESS' && !document.fullscreenElement && !document.webkitFullscreenElement) {
        const newWarnings = warnings + 1;
        setWarnings(newWarnings);
        if (newWarnings >= MAX_WARNINGS) {
          setExamState('TERMINATED');
        } else {
          toast.warning(`PROCTOR WARNING (${newWarnings}/${MAX_WARNINGS}): You exited fullscreen. Please return immediately.`, { autoClose: false });
          enterFullscreen(); // Attempt to force back
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [examState, warnings]);

  // Timer
  useEffect(() => {
    let timer;
    if (examState === 'IN_PROGRESS' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && examState === 'IN_PROGRESS') {
      setExamState('COMPLETED');
    }
    return () => clearInterval(timer);
  }, [examState, timeLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      exitFullscreen();
    };
  }, []);

  const handleStartExam = async () => {
    const camSuccess = await startCamera();
    if (camSuccess) {
      const fsSuccess = await enterFullscreen();
      if (fsSuccess) {
        setExamState('IN_PROGRESS');
      }
    }
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === questions[currentQuestionIdx].a) {
      setScore(score + 1);
    }
    setSelectedAnswer(null);

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      setExamState('COMPLETED');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleClose = () => {
    stopCamera();
    exitFullscreen();
    onClose();
  };

  return (
    <div className="proctored-exam-overlay" ref={examContainerRef}>
      
      {/* Video Feed (Always visible during exam to simulate proctoring) */}
      {(examState === 'IN_PROGRESS' || examState === 'PRE_FLIGHT') && (
        <div className="proctor-cam-container">
          <video ref={videoRef} autoPlay playsInline muted className="proctor-video"></video>
          <div className="proctor-label">REC | LIVE PROCTOR</div>
        </div>
      )}

      {/* 1. Pre-Flight Check */}
      {examState === 'PRE_FLIGHT' && (
        <div className="exam-panel pre-flight-panel">
          <h2 className="exam-title">{title} - Free Trial Test</h2>
          <div className="security-notice">
            <h3>🔒 Kalvium-Style Strict Proctoring Enabled</h3>
            <ul>
              <li>You must grant camera access to verify your identity.</li>
              <li>The exam will run in strictly enforced Full-Screen Mode.</li>
              <li>Switching tabs or exiting fullscreen will result in a warning.</li>
              <li>3 warnings will instantly terminate your exam and forfeit your attempt.</li>
            </ul>
          </div>
          <button className="exam-primary-btn start-exam-btn" onClick={handleStartExam}>
            I Agree & Start Exam
          </button>
          <button className="exam-secondary-btn" onClick={handleClose}>
            Cancel
          </button>
        </div>
      )}

      {/* 2. In Progress */}
      {examState === 'IN_PROGRESS' && (
        <div className="exam-panel in-progress-panel">
          <div className="exam-header">
            <div className="exam-progress">Question {currentQuestionIdx + 1} of {questions.length}</div>
            <div className={`exam-timer ${timeLeft < 60 ? 'danger-time' : ''}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="question-container">
            <h3 className="question-text">{questions[currentQuestionIdx].q}</h3>
            <div className="options-container">
              {questions[currentQuestionIdx].options.map((opt, idx) => (
                <button 
                  key={idx} 
                  className={`option-btn ${selectedAnswer === idx ? 'selected' : ''}`}
                  onClick={() => setSelectedAnswer(idx)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="exam-footer">
            <div className="warning-indicator">
              Warnings: {warnings} / {MAX_WARNINGS}
            </div>
            <button 
              className="exam-primary-btn next-btn" 
              disabled={selectedAnswer === null}
              onClick={handleNextQuestion}
            >
              {currentQuestionIdx === questions.length - 1 ? 'Submit Exam' : 'Next Question'}
            </button>
          </div>
        </div>
      )}

      {/* 3. Completed */}
      {examState === 'COMPLETED' && (
        <div className="exam-panel result-panel">
          <h2>Exam Completed</h2>
          <div className="score-circle">
            <span>{Math.round((score / questions.length) * 100)}%</span>
          </div>
          <p>You answered {score} out of {questions.length} correctly.</p>
          <div className="result-actions">
            <button className="exam-primary-btn" onClick={handleClose}>Back to Dashboard</button>
            <p className="upsell-text">Ready for the real deal? Purchase the full certification.</p>
          </div>
        </div>
      )}

      {/* 4. Terminated (Cheating) */}
      {examState === 'TERMINATED' && (
        <div className="exam-panel result-panel terminated">
          <h2>🚫 EXAM TERMINATED</h2>
          <p>Your session was closed due to a violation of the academic integrity policy.</p>
          <p className="violation-reason">Reason: Navigated away from the exam window multiple times.</p>
          <button className="exam-secondary-btn" onClick={handleClose}>Exit</button>
        </div>
      )}

    </div>
  );
};

export default ProctoredExam;
