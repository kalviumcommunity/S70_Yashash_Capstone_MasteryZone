import React from "react";

// 1. Global / Auth Loader (Sleek Glassmorphism Pulsing with Official Logo)
export const GlobalLoader = () => (
  <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#060d24", color: "#ffffff", fontFamily: "'Inter', sans-serif" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <img
        src="/logo_icon.png"
        alt="Mastery Zone Logo"
        style={{
          width: "90px",
          height: "90px",
          objectFit: "contain",
          animation: "pulseLogo 2s infinite ease-in-out"
        }}
      />
      <style>{`
        @keyframes pulseLogo {
          0% { transform: scale(0.95); filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.4)); opacity: 0.85; }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(168, 85, 247, 0.8)); opacity: 1; }
          100% { transform: scale(0.95); filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.4)); opacity: 0.85; }
        }
      `}</style>
      <h2 style={{ marginTop: "20px", letterSpacing: "3px", fontWeight: "800", fontSize: "16px", color: "#ffffff" }}>MASTERY ZONE</h2>
    </div>
  </div>
);

// 2. Fitness Loader (EKG Heartbeat / Neon Red)
export const FitnessLoader = () => (
  <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#0a010c", color: "#d1121d", fontFamily: "'Outfit', sans-serif" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="120" height="60" viewBox="0 0 120 60" fill="none" style={{ animation: "heartbeat 1.5s infinite" }}>
        <path d="M0 30H25L35 10L50 55L65 5L75 30H120" stroke="#d1121d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px #d1121d)" }} />
      </svg>
      <style>{`
        @keyframes heartbeat { 
          0% { stroke-dasharray: 0, 200; stroke-dashoffset: 0; opacity: 0.3; } 
          50% { stroke-dasharray: 200, 0; stroke-dashoffset: 0; opacity: 1; } 
          100% { stroke-dasharray: 0, 200; stroke-dashoffset: -200; opacity: 0.3; } 
        }
      `}</style>
      <h2 style={{ marginTop: "20px", letterSpacing: "2px", fontWeight: "900", color: "#ffffff", textShadow: "0 0 10px #d1121d" }}>WARMING UP...</h2>
    </div>
  </div>
);

// 3. Coding Loader (Retro Terminal typing & brackets)
export const CodingLoader = () => (
  <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#0c020d", color: "#00A859", fontFamily: "monospace" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: "50px", fontWeight: "bold", animation: "bracketBlink 1s infinite alternate", textShadow: "0 0 15px #00A859" }}>{`< / >`}</div>
      <style>{`
        @keyframes bracketBlink { 0% { transform: scale(0.9); opacity: 0.7; } 100% { transform: scale(1.1); opacity: 1; } }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
      <h2 style={{ marginTop: "20px", letterSpacing: "2px", fontSize: "16px" }}>
        LOADING_MODULE<span style={{ animation: "cursorBlink 1s infinite" }}>_</span>
      </h2>
    </div>
  </div>
);

// 4. Driving Loader (Spinning Steering Wheel / Neon Road)
export const DrivingLoader = () => (
  <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#080b15", color: "#8a2be2", fontFamily: "'Inter', sans-serif" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="80" height="80" viewBox="0 0 100 100" style={{ animation: "steer 2s ease-in-out infinite alternate" }}>
        <circle cx="50" cy="50" r="45" fill="none" stroke="#8a2be2" strokeWidth="6" style={{ filter: "drop-shadow(0 0 10px #8a2be2)" }} />
        <circle cx="50" cy="50" r="15" fill="#8a2be2" />
        <path d="M50 35 L50 5 M35 50 L5 50 M65 50 L95 50" stroke="#8a2be2" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <style>{`
        @keyframes steer { 0% { transform: rotate(-30deg); } 100% { transform: rotate(30deg); } }
      `}</style>
      <h2 style={{ marginTop: "25px", letterSpacing: "2px", fontWeight: "900", color: "#ffffff", textShadow: "0 0 10px #8a2be2" }}>STARTING ENGINE...</h2>
    </div>
  </div>
);

// 5. Language Loader (Morphing Speech Bubble / Globe)
export const LanguageLoader = () => (
  <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#0a0d14", color: "#4facfe", fontFamily: "'Inter', sans-serif" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#4facfe", animation: "bounce 1.5s infinite", boxShadow: "0 0 15px #4facfe" }}></div>
        <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#4facfe", animation: "bounce 1.5s infinite 0.2s", boxShadow: "0 0 15px #4facfe" }}></div>
        <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#4facfe", animation: "bounce 1.5s infinite 0.4s", boxShadow: "0 0 15px #4facfe" }}></div>
      </div>
      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      `}</style>
      <h2 style={{ marginTop: "30px", letterSpacing: "2px", fontWeight: "900", color: "#ffffff", textShadow: "0 0 10px #4facfe" }}>TRANSLATING...</h2>
    </div>
  </div>
);
