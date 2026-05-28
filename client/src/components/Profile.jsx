import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaArrowLeft, FaCamera, FaMedal, FaTrophy, FaStar } from "react-icons/fa";
import "./profile.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://s70-yashash-capstone-masteryzone-2.onrender.com";

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // overview, certifications, settings, preferences
  const [user, setUser] = useState({
    username: "Guest User",
    email: "",
    bio: "",
    avatarUrl: "",
    joinDate: "May 2026",
    level: "Initiate"
  });
  
  const [profileForm, setProfileForm] = useState({ username: "", bio: "", email: "" });

  // Fetch user data on mount
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
        if (response.ok) {
          setUser({
            username: data.user.username,
            email: data.user.email || "",
            bio: data.user.bio || "",
            avatarUrl: data.user.avatarUrl || "",
            joinDate: "May 2026",
            level: "Mastery Seeker"
          });
          setProfileForm({
            username: data.user.username,
            bio: data.user.bio || "",
            email: data.user.email || ""
          });
        } else {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username: profileForm.username, bio: profileForm.bio })
      });
      const data = await response.json();
      if (response.ok) {
        setUser({ ...user, username: profileForm.username, bio: profileForm.bio });
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.message || "Failed to update profile.");
      }
    } catch (error) {
      toast.error("Error connecting to server.");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/auth/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setUser({ ...user, avatarUrl: data.avatarUrl });
        toast.success("Profile photo updated!");
      } else {
        toast.error("Failed to update profile photo. Image might be too large.");
      }
    } catch (error) {
      toast.error("Error uploading photo");
    }
  };

  // Generate simulated heatmap data
  const renderHeatmap = () => {
    const cells = [];
    for (let i = 0; i < 84; i++) { // 7 weeks * 12 days approx display
      const intensity = Math.random();
      let level = "";
      if (intensity > 0.8) level = "level-3";
      else if (intensity > 0.5) level = "level-2";
      else if (intensity > 0.2) level = "level-1";
      
      cells.push(<div key={i} className={`heat-cell ${level}`}></div>);
    }
    return cells;
  };

  return (
    <div className="profile-page-container">
      {/* Header */}
      <nav className="profile-header-nav">
        <div className="profile-brand" onClick={() => navigate("/home")}>MASTERY ZONE</div>
        <button className="back-to-home-btn" onClick={() => navigate("/home")}>
          <FaArrowLeft style={{ marginRight: '8px' }} /> Back to Dashboard
        </button>
      </nav>

      {/* Hero Section */}
      <div className="profile-hero">
        <div className="profile-avatar-container">
          <div className="profile-avatar-glow">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" />
            ) : (
              <div className="profile-avatar-fallback">{user.username.charAt(0).toUpperCase()}</div>
            )}
            
            <label className="profile-upload-overlay">
              <FaCamera size={24} color="white" />
              <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
            </label>
          </div>
          
          <div className="profile-user-info">
            <h1 className="profile-username">{user.username}</h1>
            <div className="profile-title-badge">{user.level} • Joined {user.joinDate}</div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="profile-content-wrapper">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <button className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`profile-tab ${activeTab === 'certifications' ? 'active' : ''}`} onClick={() => setActiveTab('certifications')}>Certifications</button>
          <button className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Profile Settings</button>
          <button className={`profile-tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>Preferences</button>
        </aside>

        {/* Content Panels */}
        <main className="profile-main-panel">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <h2 className="panel-title">Your Progress Dashboard</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">12,450</div>
                  <div className="stat-label">Total XP</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">14</div>
                  <div className="stat-label">Day Streak</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">3</div>
                  <div className="stat-label">Certifications</div>
                </div>
              </div>

              <h3 style={{ marginBottom: "15px", fontSize: "18px", color: "#ddd" }}>Activity Map (Last 12 Weeks)</h3>
              <div className="heatmap-container">
                <div className="heatmap-grid">
                  {renderHeatmap()}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="animate-fade-in">
              <h2 className="panel-title">Profile Settings</h2>
              
              <form className="settings-form" onSubmit={handleProfileSave}>
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    value={profileForm.username} 
                    onChange={(e) => setProfileForm({...profileForm, username: e.target.value})} 
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={profileForm.email} 
                    disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                    title="Email cannot be changed currently"
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    rows="4" 
                    value={profileForm.bio} 
                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                    placeholder="Tell the community about your goals..."
                  ></textarea>
                </div>

                <button type="submit" className="save-btn">Save Changes</button>
              </form>
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === 'certifications' && (
            <div className="animate-fade-in">
              <h2 className="panel-title">Your Achieved Certifications</h2>
              <div className="certs-gallery">
                
                <div className="cert-card">
                  <div className="cert-icon">🥇</div>
                  <div className="cert-name">Mastery Initiate</div>
                  <div className="cert-date">Awarded May 2026</div>
                </div>

                <div className="cert-card">
                  <div className="cert-icon">💻</div>
                  <div className="cert-name">React Native Basics</div>
                  <div className="cert-date">Awarded June 2026</div>
                </div>

                <div className="cert-card" style={{ opacity: 0.5, borderStyle: "dashed" }}>
                  <div className="cert-icon">🔒</div>
                  <div className="cert-name">Advanced CSS Layouts</div>
                  <div className="cert-date">In Progress (65%)</div>
                </div>

              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="animate-fade-in">
              <h2 className="panel-title">System Preferences</h2>
              <div className="settings-form">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <div>
                    <strong style={{ display: "block", marginBottom: "5px" }}>Dark Mode</strong>
                    <span style={{ fontSize: "14px", color: "#888" }}>Force dark mode across all zones</span>
                  </div>
                  <input type="checkbox" defaultChecked style={{ transform: "scale(1.5)", accentColor: "#00A859" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <div>
                    <strong style={{ display: "block", marginBottom: "5px" }}>Email Notifications</strong>
                    <span style={{ fontSize: "14px", color: "#888" }}>Receive weekly digest and alerts</span>
                  </div>
                  <input type="checkbox" defaultChecked style={{ transform: "scale(1.5)", accentColor: "#00A859" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ display: "block", marginBottom: "5px" }}>Public Profile</strong>
                    <span style={{ fontSize: "14px", color: "#888" }}>Allow other users to see your stats</span>
                  </div>
                  <input type="checkbox" style={{ transform: "scale(1.5)", accentColor: "#00A859" }} />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
      
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Profile;
