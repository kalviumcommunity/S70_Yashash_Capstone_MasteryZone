import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://s70-yashash-capstone-masteryzone-2.onrender.com";

const Home = () => {
  const [selectedInterests, setSelectedInterests] = useState({
    CODING: false,
    LANGUAGE: false,
    GYM: false,
    VECHILES: false,
  });

  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState({ notifications: true, darkMode: false });
  const [isExiting, setIsExiting] = useState(false);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch current user details on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          if (data.user.preferences) {
            setPreferences(data.user.preferences);
          }
        } else {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };
    fetchUser();
  }, [navigate]);

  // Apply dark mode immediately when preferences change
  useEffect(() => {
    if (preferences.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [preferences.darkMode]);

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) => {
      // If it's already selected, clicking it unselects it.
      // Otherwise, turn everything off except the newly clicked one.
      return {
        CODING: false,
        LANGUAGE: false,
        GYM: false,
        VECHILES: false,
        [interest]: !prev[interest]
      };
    });
  };

  const handleStartTrial = () => {
    const selected = Object.keys(selectedInterests).filter((key) => selectedInterests[key]);
    if (selected.length === 0) {
      alert("Please select at least one interest to start your trial!");
    } else {
      // Trigger the exit animation
      setIsExiting(true);
      
      // Wait for the animation to finish before actually navigating
      setTimeout(() => {
        if (selectedInterests.GYM) navigate("/fitness");
        else if (selectedInterests.CODING) navigate("/coding");
        else if (selectedInterests.VECHILES) navigate("/driving");
        else if (selectedInterests.LANGUAGE) navigate("/language");
      }, 600); // 600ms matches the CSS transition duration
    }
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        alert("Account deleted successfully.");
        localStorage.removeItem("token");
        navigate("/signup");
      }
    } catch (error) {
      console.error("Error deleting account", error);
    }
  };

  const handlePhotoUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      
      // Optimistic UI Update
      const previousAvatar = user.avatarUrl;
      setUser({ ...user, avatarUrl: base64Image });
      setIsDropdownOpen(false);
      
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/auth/avatar`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatarUrl: base64Image })
        });
        
        if (!response.ok) {
          setUser({ ...user, avatarUrl: previousAvatar });
          alert("Failed to update profile photo. Image might be too large.");
        }
      } catch (error) {
        console.error("Error updating photo", error);
        setUser({ ...user, avatarUrl: previousAvatar });
      }
    };
  };

  const handleRemovePhoto = async () => {
    // Optimistic UI Update
    const previousAvatar = user.avatarUrl;
    setUser({ ...user, avatarUrl: null });
    setIsDropdownOpen(false);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/auth/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        setUser({ ...user, avatarUrl: previousAvatar });
        alert("Failed to remove profile photo.");
      }
    } catch (error) {
      console.error("Error removing photo", error);
      setUser({ ...user, avatarUrl: previousAvatar });
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/auth/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [key]: value })
      });
    } catch (err) {
      console.error("Failed to update preferences", err);
    }
  };

  return (
    <div className={`home-container ${preferences.darkMode ? 'dark-mode' : ''} ${isExiting ? 'page-exit' : 'page-enter'}`}>
      {/* White Header Bar */}
      <header className="home-header">
        <div className="home-logo">
          <span className="mastery">MASTERY</span>
          <span className="zone">ZONE</span>
          <span className="registered-wrapper">
            <svg className="registered-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#000000" strokeWidth="2" fill="none" />
              <polygon points="12,7 13.5,10.5 17,11 14.5,13.5 15,17 12,15 9,17 9.5,13.5 7,11 10.5,10.5" fill="#000000" />
            </svg>
          </span>
        </div>

        {/* Premium Profile Section */}
        {user && (
          <div className="profile-section">
            <div className="profile-avatar-wrapper" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {user.username ? user.username.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>

            {isDropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <strong>{user.username}</strong>
                  <span>{user.email}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => navigate("/profile")}>
                  View Profile
                </button>
                <button className="dropdown-item" onClick={handlePhotoUploadClick}>
                  Update Photo
                </button>
                {user.avatarUrl && (
                  <button className="dropdown-item text-danger" onClick={handleRemovePhoto}>
                    Remove Photo
                  </button>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: "none" }} 
                  onChange={handleFileChange}
                />
                <button className="dropdown-item" onClick={() => { setIsSettingsModalOpen(true); setIsDropdownOpen(false); }}>
                  App Settings
                </button>
                <button className="dropdown-item text-danger" onClick={() => { handleDeleteAccount(); setIsDropdownOpen(false); }}>
                  Delete Account
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => { setIsLogoutModalOpen(true); setIsDropdownOpen(false); }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Background Wet Glass Area */}
      <main className="home-body">
        <div className="home-content">
          <section className="home-quotes">
            <h1 className="home-quote-primary">
              "Empower your journey–code smarter, learn faster, drive safer, and stay stronger!"
            </h1>
            <p className="home-quote-secondary">
              "Master skills, break limits—code, learn, drive, and train with purpose!"
            </p>
          </section>

          <div className="interests-selection-block">
            <div className="interests-panel">
              <h2 className="interests-panel-text">Please Select Your Intrests</h2>
            </div>

            <div className="interests-row">
              <button className={`interest-pill ${selectedInterests.CODING ? "active" : ""}`} onClick={() => toggleInterest("CODING")}>CODING</button>
              <button className={`interest-pill ${selectedInterests.LANGUAGE ? "active" : ""}`} onClick={() => toggleInterest("LANGUAGE")}>LANGUAGE</button>
              <button className={`interest-pill ${selectedInterests.GYM ? "active" : ""}`} onClick={() => toggleInterest("GYM")}>GYM</button>
              <button className={`interest-pill ${selectedInterests.VECHILES ? "active" : ""}`} onClick={() => toggleInterest("VECHILES")}>VECHILES</button>
            </div>
            
            <div className="home-bottom-controls" style={{ justifyContent: "flex-end", marginTop: "40px", width: "100%" }}>
              <button className="start-trial-btn" onClick={handleStartTrial}>
                START FREE TRIAL
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-modal">
            <h2 className="modal-title">Log Out</h2>
            <p className="modal-text">Are you sure you want to log out of your account?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleLogoutConfirm}>Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}

      )}

      {/* App Settings Modal */}
      {isSettingsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-modal settings-modal">
            <h2 className="modal-title">App Settings</h2>
            
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">Email Notifications</span>
                <span className="setting-desc">Receive updates about your account</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications} 
                  onChange={(e) => handlePreferenceChange('notifications', e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-name">Dark Mode</span>
                <span className="setting-desc">Switch to a dark aesthetic</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.darkMode} 
                  onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="modal-actions" style={{ marginTop: '30px' }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => setIsSettingsModalOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
