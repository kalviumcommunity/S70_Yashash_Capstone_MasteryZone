import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaArrowLeft, FaCamera, FaMedal, FaImage, FaCrosshairs, FaRegClock, FaPalette, FaTrophy } from "react-icons/fa";
import "./profile.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://s70-yashash-capstone-masteryzone-2.onrender.com";

const THEME_COLORS = [
  { id: 'green', hex: '#00A859' },
  { id: 'cyan', hex: '#00f0ff' },
  { id: 'pink', hex: '#ff007f' },
  { id: 'purple', hex: '#8a2be2' },
  { id: 'gold', hex: '#ffd700' }
];

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: "Guest User",
    email: "",
    bio: "Setting up my Mastery Zone...",
    avatarUrl: "",
    joinDate: "May 2026",
    level: "Mastery Seeker",
    xp: 0
  });
  
  const [themeColor, setThemeColor] = useState('#00A859');
  const [focusMode, setFocusMode] = useState(false);
  const [currentGoal, setCurrentGoal] = useState("Complete React Native Certification");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [certs, setCerts] = useState([]);

  // Fetch user data and certifications
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/auth/home`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        
        const certResponse = await fetch(`${API_BASE}/api/certifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const certData = certResponse.ok ? await certResponse.json() : [];
        
        // Calculate XP based on modules completed across all certs
        const calculatedXp = certData.reduce((acc, curr) => acc + (curr.currentModule * 5), 0);
        
        if (response.ok) {
          setUser({
            username: data.user.username,
            email: data.user.email || "",
            bio: data.user.bio || "Setting up my Mastery Zone...",
            avatarUrl: data.user.avatarUrl || "",
            joinDate: "May 2026",
            level: `Level ${Math.floor(calculatedXp / 100) + 1} - Mastery Seeker`,
            xp: calculatedXp % 100 // Percentage for the bar
          });
          setCerts(certData);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [navigate]);

  // Apply theme color to root CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', themeColor);
    document.documentElement.style.setProperty('--theme-color-glow', themeColor + '66');
  }, [themeColor]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      const previousAvatar = user.avatarUrl;
      setUser({ ...user, avatarUrl: base64Image }); // Optimistic UI
      
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`${API_BASE}/auth/avatar`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatarUrl: base64Image })
        });
        
        if (response.ok) toast.success("Profile photo updated!");
        else {
          setUser({ ...user, avatarUrl: previousAvatar });
          toast.error("Failed to update photo.");
        }
      } catch (error) {
        setUser({ ...user, avatarUrl: previousAvatar });
        toast.error("Error connecting to server.");
      }
    };
  };

  const handleInlineSave = async (field, value) => {
    setUser({ ...user, [field]: value }); // Optimistic update
    
    // Gain XP for interacting
    setUser(prev => ({ ...prev, xp: Math.min(prev.xp + 5, 100) }));

    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username: field === 'username' ? value : user.username, bio: field === 'bio' ? value : user.bio })
      });
      toast.success("Profile saved!");
    } catch (err) {
      toast.error("Failed to save changes.");
    }
  };

  return (
    <div className="profile-page-container" style={focusMode ? { filter: 'brightness(0.6)' } : {}}>
      
      {/* Dynamic Wide Banner */}
      <div className="profile-banner">
        <div className="profile-banner-overlay"></div>
        <div className="banner-controls">
          <button className="icon-btn" onClick={() => navigate("/home")} title="Back to Dashboard">
            <FaArrowLeft />
          </button>
          <button className="icon-btn" title="Change Banner Image">
            <FaImage />
          </button>
        </div>
      </div>

      {/* Floating Header Area */}
      <div className="profile-user-header">
        <div className="avatar-wrapper">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="avatar-img" />
          ) : (
            <div className="avatar-fallback">{user.username.charAt(0).toUpperCase()}</div>
          )}
          <label className="avatar-upload-overlay">
            <FaCamera size={28} color="white" />
            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
          </label>
        </div>
        
        <div className="user-info-text">
          <div className="username-container">
            <input 
              type="text" 
              className="editable-username" 
              value={user.username} 
              onChange={(e) => setUser({...user, username: e.target.value})}
              onBlur={(e) => handleInlineSave('username', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              title="Click to edit"
            />
          </div>
          <textarea 
            className="editable-bio" 
            value={user.bio} 
            onChange={(e) => setUser({...user, bio: e.target.value})}
            onBlur={(e) => handleInlineSave('bio', e.target.value)}
            rows="2"
            title="Click to edit"
          />
        </div>
      </div>

      {/* Real-time XP Progress Bar */}
      <div className="xp-container">
        <div className="xp-header">
          <span className="level-text"><FaMedal /> {user.level}</span>
          <span className="xp-text">{user.xp * 125} / 12,500 XP to next level</span>
        </div>
        <div className="xp-track">
          <div className="xp-fill" style={{ width: `${user.xp}%` }}></div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="profile-grid">
        
        {/* Left Column - Main Content */}
        <div className="main-feed">
          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title"><FaTrophy /> Certifications Earned</h3>
            </div>
            <div className="certs-gallery">
              {certs.length > 0 ? certs.map(c => (
                <div key={c._id} className="cert-card" style={{ opacity: c.status === 'completed' ? 1 : 0.5 }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                    {c.status === 'completed' ? '🥇' : '💻'}
                  </div>
                  <h4>{c.name}</h4>
                  <p style={{ color: '#888', fontSize: '12px' }}>
                    {c.status === 'completed' ? 'Certified' : `${Math.round(c.progress)}% In Progress...`}
                  </p>
                </div>
              )) : (
                <div style={{ color: '#888', gridColumn: '1 / -1' }}>No active certifications yet. Visit a Zone to start a Free Trial!</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Interactive Widgets */}
        <div className="sidebar-widgets">
          
          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title"><FaCrosshairs /> Current Goal</h3>
            </div>
            <input 
              type="text" 
              className="goal-input" 
              value={currentGoal} 
              onChange={(e) => setCurrentGoal(e.target.value)}
              onBlur={() => toast.success("Goal saved! Stay focused.")}
            />
          </div>

          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title"><FaPalette /> Profile Theme</h3>
            </div>
            <div className="color-picker-grid">
              {THEME_COLORS.map(c => (
                <div 
                  key={c.id} 
                  className={`color-dot ${themeColor === c.hex ? 'active' : ''}`}
                  style={{ backgroundColor: c.hex, color: c.hex }}
                  onClick={() => setThemeColor(c.hex)}
                />
              ))}
            </div>
          </div>

          <div className="widget">
            <div className="stats-mini-grid">
              <div className="stat-mini-card">
                <div className="stat-mini-val">14</div>
                <div className="stat-mini-label">Day Streak</div>
              </div>
              <div className="stat-mini-card">
                <div className="stat-mini-val">8</div>
                <div className="stat-mini-label">Courses</div>
              </div>
            </div>
          </div>

          <div className="widget" style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '24px', fontFamily: 'monospace', color: 'var(--theme-color)' }}>
              <FaRegClock style={{ verticalAlign: 'middle', marginRight: '8px' }}/> 
              {currentTime}
            </h3>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>Local Timezone</p>
            
            <button 
              className="focus-btn" 
              onClick={() => {
                setFocusMode(!focusMode);
                if(!focusMode) toast.info("Focus Mode Activated: Distractions dimmed.");
              }}
            >
              {focusMode ? "End Focus Mode" : "Enter Focus Mode"}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Profile;
