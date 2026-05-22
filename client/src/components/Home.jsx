import React, { useState } from "react";
import "./home.css"; // Import the styling

const Home = () => {
  // State to track selected interests
  const [selectedInterests, setSelectedInterests] = useState({
    CODING: false,
    LANGUAGE: false,
    GYM: false,
    VECHILES: false,
  });

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) => ({
      ...prev,
      [interest]: !prev[interest],
    }));
  };

  const handleStartTrial = () => {
    const selected = Object.keys(selectedInterests).filter(
      (key) => selectedInterests[key]
    );
    if (selected.length === 0) {
      alert("Please select at least one interest to start your trial!");
    } else {
      alert(`Starting free trial for: ${selected.join(", ")}!`);
    }
  };

  const handleBackToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="home-container">
      {/* White Header Bar */}
      <header className="home-header">
        <div className="home-logo">
          <span className="mastery">MASTERY</span>
          <span className="zone">ZONE</span>
          {/* Registered icon match */}
          <span className="registered-wrapper">
            <svg
              className="registered-icon"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#000000"
                strokeWidth="2"
                fill="none"
              />
              <polygon
                points="12,7 13.5,10.5 17,11 14.5,13.5 15,17 12,15 9,17 9.5,13.5 7,11 10.5,10.5"
                fill="#000000"
              />
            </svg>
          </span>
        </div>
      </header>

      {/* Background Wet Glass Area */}
      <main className="home-body">
        <div className="home-content">
          {/* Quotes Section */}
          <section className="home-quotes">
            <h1 className="home-quote-primary">
              "Empower your journey–code smarter, learn faster, drive safer, and stay stronger!"
            </h1>
            <p className="home-quote-secondary">
              "Master skills, break limits—code, learn, drive, and train with purpose!"
            </p>
          </section>

          {/* Interests Selection Block */}
          <div className="interests-selection-block">
            {/* Translucent Panel - matching exact typo "Intrests" */}
            <div className="interests-panel">
              <h2 className="interests-panel-text">Please Select Your Intrests</h2>
            </div>

            {/* Scoped Pill Buttons - matching exact typo "VECHILES" */}
            <div className="interests-row">
              <button
                className={`interest-pill ${selectedInterests.CODING ? "active" : ""}`}
                onClick={() => toggleInterest("CODING")}
              >
                CODING
              </button>
              <button
                className={`interest-pill ${selectedInterests.LANGUAGE ? "active" : ""}`}
                onClick={() => toggleInterest("LANGUAGE")}
              >
                LANGUAGE
              </button>
              <button
                className={`interest-pill ${selectedInterests.GYM ? "active" : ""}`}
                onClick={() => toggleInterest("GYM")}
              >
                GYM
              </button>
              <button
                className={`interest-pill ${selectedInterests.VECHILES ? "active" : ""}`}
                onClick={() => toggleInterest("VECHILES")}
              >
                VECHILES
              </button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="home-bottom-controls">
            {/* Back Button matching the exact circular icon style */}
            <button className="back-circle-btn" onClick={handleBackToLogin} title="Back to Login">
              <svg
                className="back-circle-icon"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#ffffff"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M14 8L10 12L14 16"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Start Trial Button */}
            <button className="start-trial-btn" onClick={handleStartTrial}>
              START FREE TRIAL
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
