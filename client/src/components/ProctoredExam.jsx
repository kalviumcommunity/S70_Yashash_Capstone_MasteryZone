import React, { useState, useEffect, useRef } from 'react';
import './ProctoredExam.css';
import { toast } from 'react-toastify';

const MOCK_QUESTIONS = {
  Fitness: [
    { q: "What is the primary muscle group targeted by a bench press?", options: ["Pectorals", "Latissimus Dorsi", "Quadriceps", "Deltoids"], a: 0 },
    { q: "Which of these is a macronutrient?", options: ["Vitamin C", "Protein", "Calcium", "Iron"], a: 1 },
    { q: "What does HIIT stand for?", options: ["Heavy Intensity Interval Training", "High Intensity Interval Training", "Hard Intense Interval Training", "Hyper Intensity Internal Training"], a: 1 },
    { q: "How many calories are in one gram of fat?", options: ["4", "7", "9", "12"], a: 2 },
    { q: "Which exercise is considered the 'king' of lower body exercises?", options: ["Leg Extension", "Squat", "Calf Raise", "Hamstring Curl"], a: 1 },
    { q: "What is hypertrophy?", options: ["Muscle shrinkage", "Muscle growth", "Fat loss", "Bone density increase"], a: 1 },
    { q: "Which energy system provides the quickest burst of energy?", options: ["Oxidative", "Glycolytic", "ATP-PC", "Aerobic"], a: 2 },
    { q: "What does BMI stand for?", options: ["Body Mass Indicator", "Basic Muscle Index", "Body Mass Index", "Base Metabolic Index"], a: 2 },
    { q: "Which vitamin is synthesized by the skin when exposed to sunlight?", options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], a: 3 },
    { q: "What is the recommended minimum duration for moderate aerobic exercise per week?", options: ["60 mins", "150 mins", "300 mins", "500 mins"], a: 1 }
  ],
  Coding: [
    { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Text Machine Language", "Hyperlinks and Text Markup Language", "Home Tool Markup Language"], a: 0 },
    { q: "Which symbol is used for comments in JavaScript?", options: ["//", "<!--", "/*", "#"], a: 0 },
    { q: "What is React?", options: ["A database", "A CSS framework", "A JavaScript library for building user interfaces", "An operating system"], a: 2 },
    { q: "Which of the following is not a primitive data type in JS?", options: ["String", "Number", "Object", "Boolean"], a: 2 },
    { q: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Colorful Style Sheets", "Creative Style Sheets"], a: 1 },
    { q: "Which command is used to push code to GitHub?", options: ["git pull", "git push", "git commit", "git clone"], a: 1 },
    { q: "What is a closure in JavaScript?", options: ["A function inside another function that has access to the outer function's variables", "A way to close the browser window", "A method to end a loop", "A syntax error"], a: 0 },
    { q: "Which HTTP method is typically used to create a new resource?", options: ["GET", "POST", "PUT", "DELETE"], a: 1 },
    { q: "What is the virtual DOM?", options: ["A direct copy of the real DOM", "A lightweight Javascript representation of the DOM", "A browser extension", "A 3D rendering engine"], a: 1 },
    { q: "Which keyword is used to declare a block-scoped variable in JS?", options: ["var", "let", "const", "Both let and const"], a: 3 }
  ],
  Driving: [
    { q: "What does a solid double yellow line mean?", options: ["Passing allowed", "No passing allowed", "One-way traffic", "Car-pool lane"], a: 1 },
    { q: "When should you use your turn signal?", options: ["Only when other cars are around", "100 feet before turning", "Right as you turn", "Turn signals are optional"], a: 1 },
    { q: "What is the standard speed limit in a residential area?", options: ["25 mph", "45 mph", "15 mph", "35 mph"], a: 0 },
    { q: "What shape is a stop sign?", options: ["Hexagon", "Octagon", "Triangle", "Circle"], a: 1 },
    { q: "What does a flashing red traffic light mean?", options: ["Yield", "Stop, then proceed when safe", "Caution", "Speed up"], a: 1 },
    { q: "When parking uphill on a street with a curb, which way should you turn your wheels?", options: ["Towards the curb", "Away from the curb", "Straight", "It doesn't matter"], a: 1 },
    { q: "What does a yellow diamond-shaped sign indicate?", options: ["Speed limit", "Warning", "Stop", "Hospital ahead"], a: 1 },
    { q: "When driving in fog, you should use your:", options: ["High beams", "Low beams", "Parking lights", "Hazard lights"], a: 1 },
    { q: "Who has the right-of-way at a 4-way stop?", options: ["The biggest car", "The car that arrived first", "The car to the left", "The car to the right"], a: 1 },
    { q: "What is the legal blood alcohol limit for drivers over 21 in most US states?", options: ["0.08%", "0.05%", "0.10%", "0.00%"], a: 0 }
  ],
  Language: [
    { q: "What is a 'verb'?", options: ["A person, place, or thing", "An action word", "A descriptive word", "A connecting word"], a: 1 },
    { q: "What is the past tense of 'run'?", options: ["Runned", "Running", "Ran", "Runs"], a: 2 },
    { q: "Which language has the most native speakers?", options: ["English", "Spanish", "Mandarin Chinese", "Hindi"], a: 2 },
    { q: "What is a synonym for 'happy'?", options: ["Sad", "Angry", "Joyful", "Tired"], a: 2 },
    { q: "What is an adjective?", options: ["An action", "A naming word", "A word that describes a noun", "A punctuation mark"], a: 2 },
    { q: "Which language is known as the 'language of love'?", options: ["German", "French", "Russian", "Arabic"], a: 1 },
    { q: "What does 'polyglot' mean?", options: ["Someone who loves geometry", "Someone who speaks multiple languages", "A type of ancient script", "A language learning app"], a: 1 },
    { q: "What is the longest word in the English language?", options: ["Supercalifragilisticexpialidocious", "Pneumonoultramicroscopicsilicovolcanoconiosis", "Antidisestablishmentarianism", "Hippopotomonstrosesquippedaliophobia"], a: 1 },
    { q: "Which script is used to write Russian?", options: ["Latin", "Cyrillic", "Arabic", "Devanagari"], a: 1 },
    { q: "What is the study of the history of words called?", options: ["Etymology", "Entomology", "Phonetics", "Syntax"], a: 0 }
  ]
};

const ProctoredExam = ({ zone, onClose, title, onPurchase }) => {
  const [examState, setExamState] = useState('PRE_FLIGHT'); // PRE_FLIGHT, IN_PROGRESS, COMPLETED, TERMINATED
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  
  // Hardware Verification States
  const [isCamMicEnabled, setIsCamMicEnabled] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const examContainerRef = useRef(null);

  const MAX_WARNINGS = 3;

  // 1. Initialize and Shuffle Questions specific to zone
  useEffect(() => {
    // Case-insensitive mapping to guarantee correct question zone
    const matchedZone = Object.keys(MOCK_QUESTIONS).find(k => k.toLowerCase() === zone.toLowerCase());
    const allQuestions = MOCK_QUESTIONS[matchedZone] || MOCK_QUESTIONS.Coding;
    
    // Shuffle the array and pick the first 5 questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 5));
  }, [zone]);

  // 2. Hardware Checks
  const enableCamMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCamMicEnabled(true);
      toast.success("Camera and Microphone enabled successfully.");
    } catch (err) {
      toast.error("You must allow Camera & Microphone access to proceed.");
    }
  };

  const enableScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      setIsScreenShared(true);
      toast.success("Screen sharing active.");

      // If user stops sharing manually via browser UI
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenShared(false);
        if (examState === 'IN_PROGRESS') {
          handleViolation("Screen share was stopped.");
        }
      };
    } catch (err) {
      toast.error("You must share your entire screen to proceed.");
    }
  };

  const enableFullscreen = async () => {
    try {
      if (examContainerRef.current) {
        if (examContainerRef.current.requestFullscreen) {
          await examContainerRef.current.requestFullscreen();
        } else if (examContainerRef.current.webkitRequestFullscreen) {
          await examContainerRef.current.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      }
    } catch (err) {
      toast.error("Fullscreen mode is required.");
    }
  };

  const stopAllStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
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

  // 3. Violation Handler
  const handleViolation = (reason) => {
    const newWarnings = warnings + 1;
    setWarnings(newWarnings);
    if (newWarnings >= MAX_WARNINGS) {
      setExamState('TERMINATED');
      toast.error("Exam Terminated due to multiple violations.");
    } else {
      toast.warning(`PROCTOR WARNING (${newWarnings}/${MAX_WARNINGS}): ${reason}`, { autoClose: false });
    }
  };

  // Listen for Visibility and Fullscreen changes globally
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (examState === 'IN_PROGRESS' && document.hidden) {
        handleViolation("You left the exam window. Do not switch tabs!");
      }
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(!!isCurrentlyFullscreen);
      
      if (examState === 'IN_PROGRESS' && !isCurrentlyFullscreen) {
        handleViolation("You exited fullscreen. Please return immediately.");
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
      stopAllStreams();
      exitFullscreen();
    };
  }, []);

  const handleStartExam = () => {
    if (isCamMicEnabled && isScreenShared && isFullscreen) {
      setExamState('IN_PROGRESS');
    } else {
      toast.error("Please complete all verification steps first.");
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
    stopAllStreams();
    exitFullscreen();
    onClose();
  };

  const handlePurchase = () => {
    stopAllStreams();
    exitFullscreen();
    onClose();
    if (onPurchase) {
      onPurchase();
    }
  };

  return (
    <div className="proctored-exam-overlay" ref={examContainerRef}>
      
      {/* Video Feed (Always visible to simulate proctoring if cam enabled) */}
      {isCamMicEnabled && (examState === 'IN_PROGRESS' || examState === 'PRE_FLIGHT') && (
        <div className="proctor-cam-container">
          <video ref={videoRef} autoPlay playsInline muted className="proctor-video"></video>
          <div className="proctor-label">REC | LIVE PROCTOR</div>
        </div>
      )}

      {/* 1. Pre-Flight Check */}
      {examState === 'PRE_FLIGHT' && questions.length > 0 && (
        <div className="exam-panel pre-flight-panel">
          <h2 className="exam-title">{title} - Security Verification</h2>
          <div className="security-notice">
            <h3>🔒 MasteryZone Secure Proctoring</h3>
            <p style={{marginBottom: '20px', color: '#ccc'}}>You must complete all hardware checks manually before the exam can begin.</p>
            
            <div className="hardware-checklist">
              <div className={`checklist-item ${isCamMicEnabled ? 'success' : ''}`}>
                <div className="check-info">
                  <span className="icon">📷</span> 
                  Enable Camera & Microphone
                </div>
                {!isCamMicEnabled ? (
                  <button className="check-btn" onClick={enableCamMic}>Allow</button>
                ) : (
                  <span className="check-done">✅ Ready</span>
                )}
              </div>

              <div className={`checklist-item ${isScreenShared ? 'success' : ''}`}>
                <div className="check-info">
                  <span className="icon">🖥️</span> 
                  Share Entire Screen
                </div>
                {!isScreenShared ? (
                  <button className="check-btn" onClick={enableScreenShare}>Share</button>
                ) : (
                  <span className="check-done">✅ Ready</span>
                )}
              </div>

              <div className={`checklist-item ${isFullscreen ? 'success' : ''}`}>
                <div className="check-info">
                  <span className="icon">⛶</span> 
                  Enter Full Screen Mode
                </div>
                {!isFullscreen ? (
                  <button className="check-btn" onClick={enableFullscreen}>Enter</button>
                ) : (
                  <span className="check-done">✅ Ready</span>
                )}
              </div>
            </div>
            
            <ul style={{marginTop: '20px', fontSize: '12px', color: '#888'}}>
              <li>This test contains {questions.length} randomly selected zone-specific questions.</li>
              <li>Switching tabs or exiting fullscreen will result in a warning.</li>
              <li>3 warnings will instantly terminate your exam.</li>
            </ul>
          </div>

          <div className="pre-flight-actions">
            <button 
              className="exam-primary-btn start-exam-btn" 
              onClick={handleStartExam}
              disabled={!(isCamMicEnabled && isScreenShared && isFullscreen)}
              style={{ opacity: (isCamMicEnabled && isScreenShared && isFullscreen) ? 1 : 0.5 }}
            >
              Start Exam
            </button>
            <button className="exam-secondary-btn" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 2. In Progress */}
      {examState === 'IN_PROGRESS' && questions.length > 0 && (
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
          <div className="result-actions" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', alignItems: 'center' }}>
            <button className="exam-primary-btn" onClick={handlePurchase} style={{ background: '#ffcc00', color: '#000', padding: '16px 40px', fontSize: '20px' }}>
              Purchase Certification
            </button>
            <button className="exam-secondary-btn" onClick={handleClose}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* 4. Terminated (Cheating) */}
      {examState === 'TERMINATED' && (
        <div className="exam-panel result-panel terminated">
          <h2>🚫 EXAM TERMINATED</h2>
          <p>Your session was closed due to a violation of the academic integrity policy.</p>
          <p className="violation-reason">Reason: Strict proctoring rules were violated multiple times.</p>
          <button className="exam-secondary-btn" onClick={handleClose}>Exit</button>
        </div>
      )}

    </div>
  );
};

export default ProctoredExam;
