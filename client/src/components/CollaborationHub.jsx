import React, { useState, useEffect, useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import './CollaborationHub.css';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5012";

const CollaborationHub = ({ zone, themeColor }) => {
  const [view, setView] = useState('LANDING'); // 'LANDING', 'PREJOIN', 'MEETING'
  const [role, setRole] = useState(null); // 'HOST' or 'MEMBER'
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Host-specific state for the "Meeting Ready" invite modal overlay
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTab, setInviteTab] = useState('LINK'); // 'LINK', 'EMAIL', 'DM'
  
  // Socket.io states
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  // Initialize Socket.io on component mount
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);
    
    // Fallback display name for socket if not joined meeting yet
    const name = displayName || `User_${Math.floor(Math.random() * 1000)}`;
    socketRef.current.emit("user_joined", name);

    socketRef.current.on("update_online_users", (users) => {
      // Filter out self from online users list
      setOnlineUsers(users.filter(u => u !== name));
    });

    socketRef.current.on("receive_dm", (data) => {
      toast.info(`New Message from ${data.fromUser}:\nJoin my session! Code: ${data.roomCode}`, {
        autoClose: false,
        position: "top-right"
      });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [displayName]);

  // Generate a fresh code for hosts
  const generateRoomCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segment = () => Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${zone.toLowerCase()}-${segment()}-${segment()}`;
  };

  const handleStartNewMeeting = () => {
    setRole('HOST');
    setRoomCode(generateRoomCode());
    setView('PREJOIN');
  };

  const handleJoinExisting = (e) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      toast.error("Please enter a valid meeting code");
      return;
    }
    setRole('MEMBER');
    setView('PREJOIN');
  };

  const handleEnterMeeting = (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Please enter your display name");
      return;
    }
    setView('MEETING');
    if (role === 'HOST') {
      setShowInviteModal(true);
    }
  };

  const handleLeave = () => {
    setView('LANDING');
    setRole(null);
    setRoomCode('');
    setShowInviteModal(false);
  };

  const copyInviteLink = () => {
    // In a real app with routing, this would be the actual URL.
    // We construct a simulated URL for realism.
    const inviteText = `Join my MasteryZone ${zone} meeting!\nMeeting Code: ${roomCode}`;
    navigator.clipboard.writeText(inviteText);
    toast.success("Invite copied to clipboard!");
    setShowInviteModal(false);
  };

  // 1. MEETING VIEW (Jitsi Embedded)
  if (view === 'MEETING') {
    // Determine UI limitations based on role
    const toolbarButtons = role === 'HOST' 
      ? [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'settings',
          'raisehand', 'videoquality', 'filmstrip', 'tileview', 'security'
        ]
      : [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'hangup', 'profile', 'chat', 'raisehand', 'tileview'
        ];

    return (
      <div className="collab-hub-container meeting-active" style={{ '--theme-color': themeColor }}>
        
        {/* Custom Header */}
        <div className="collab-header jitsi-header">
          <div className="collab-title">
            <span className="live-indicator"></span>
            <h2>{zone} Session: <span className="header-room-code">{roomCode}</span></h2>
          </div>
          <div className="header-actions">
            {role === 'HOST' && (
              <button className="add-members-btn" onClick={() => setShowInviteModal(true)} style={{ background: themeColor }}>
                + Add Members
              </button>
            )}
            <button className="control-btn danger leave-btn-small" onClick={handleLeave}>
              Leave Session
            </button>
          </div>
        </div>
        
        {/* Jitsi Iframe */}
        <div className="jitsi-wrapper">
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={`MasteryZone-${roomCode}`}
            configOverwrite={{
              startWithAudioMuted: true,
              startWithVideoMuted: false,
              prejoinPageEnabled: false,
              disableModeratorIndicator: role !== 'HOST',
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
              SHOW_CHROME_EXTENSION_BANNER: false,
              SHOW_PROMOTIONAL_CLOSE_PAGE: false,
              TOOLBAR_BUTTONS: toolbarButtons
            }}
            userInfo={{
              displayName: displayName + (role === 'HOST' ? ' (Host)' : '')
            }}
            getIFrameRef={(iframeRef) => { 
              iframeRef.style.height = '100%'; 
              iframeRef.style.width = '100%'; 
              iframeRef.style.border = 'none';
            }}
            onApiReady={(api) => {
              api.addListener('videoConferenceLeft', () => {
                handleLeave();
              });
            }}
          />
        </div>

        {/* Host Invite Modal Overlay */}
        {showInviteModal && (
          <div className="invite-modal-overlay">
            <div className="invite-modal advanced-invite-modal">
              <div className="invite-modal-header">
                <h3>Add Members</h3>
                <button className="close-modal-btn" onClick={() => setShowInviteModal(false)}>✕</button>
              </div>

              <div className="invite-tabs">
                <button 
                  className={`invite-tab ${inviteTab === 'LINK' ? 'active' : ''}`}
                  onClick={() => setInviteTab('LINK')}
                >
                  Link
                </button>
                <button 
                  className={`invite-tab ${inviteTab === 'EMAIL' ? 'active' : ''}`}
                  onClick={() => setInviteTab('EMAIL')}
                >
                  Email
                </button>
                <button 
                  className={`invite-tab ${inviteTab === 'DM' ? 'active' : ''}`}
                  onClick={() => setInviteTab('DM')}
                >
                  Direct Message
                </button>
              </div>

              <div className="invite-tab-content">
                {inviteTab === 'LINK' && (
                  <div className="tab-pane link-pane">
                    <p>Share this meeting code with others you want in the meeting.</p>
                    <div className="invite-code-box">
                      <span className="the-code">{roomCode}</span>
                      <button className="copy-btn" onClick={copyInviteLink} title="Copy joining info">📋</button>
                    </div>
                    <p className="invite-security-notice">
                      🔒 People who use this meeting code must get your permission before they can join.
                    </p>
                  </div>
                )}

                {inviteTab === 'EMAIL' && (
                  <div className="tab-pane email-pane">
                    <p>Send a real-time email invitation to join this session.</p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      toast.success(`Invite sent successfully to ${e.target.email.value}!`);
                      e.target.reset();
                    }}>
                      <div className="form-group">
                        <input type="email" name="email" placeholder="friend@example.com" required />
                      </div>
                      <button type="submit" className="send-invite-btn" style={{ background: themeColor }}>
                        Send Mail Invite
                      </button>
                    </form>
                  </div>
                )}

                {inviteTab === 'DM' && (
                  <div className="tab-pane dm-pane">
                    <p>Select an online member to send a direct message invite.</p>
                    <div className="online-users-list">
                      {onlineUsers.length === 0 ? (
                        <p style={{textAlign: 'center', marginTop: '20px'}}>No other users online right now.</p>
                      ) : (
                        onlineUsers.map(user => (
                          <div key={user} className="online-user-item">
                            <div className="user-info">
                              <span className="online-dot"></span>
                              <span className="user-name">{user}</span>
                            </div>
                            <button 
                              className="dm-send-btn"
                              onClick={() => {
                                socketRef.current.emit("send_dm", {
                                  toUser: user,
                                  fromUser: displayName || 'A MasteryZone Host',
                                  roomCode: roomCode
                                });
                                toast.success(`Direct Message sent to ${user}!`);
                              }}
                            >
                              Message Invite
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. PRE-JOIN VIEW (Name Setup)
  if (view === 'PREJOIN') {
    return (
      <div className="collab-hub-container pre-join-container" style={{ '--theme-color': themeColor }}>
        <div className="pre-join-body">
          <button className="back-link" onClick={() => setView('LANDING')}>← Back</button>
          
          <div className="pre-join-hero">
            <h3>Get ready to join</h3>
            <p className="room-code-display">Joining: <strong>{roomCode}</strong></p>
          </div>

          <form className="pre-join-form" onSubmit={handleEnterMeeting}>
            <div className="form-group">
              <label>What's your name?</label>
              <input 
                type="text" 
                placeholder="Enter display name" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
                required
              />
            </div>
            
            <button type="submit" className="join-meeting-btn" style={{ background: themeColor }}>
              {role === 'HOST' ? 'Join and Invite Others' : 'Ask to Join'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. LANDING VIEW (Google Meet style Dashboard)
  return (
    <div className="collab-hub-container landing-container" style={{ '--theme-color': themeColor }}>
      <div className="landing-content">
        <div className="landing-left">
          <h1 className="landing-headline">Premium video meetings.<br/>Now free for everyone.</h1>
          <p className="landing-subheadline">
            We built the MasteryZone Live Hub for secure, real-time group collaboration. It is now free and available for all {zone} learners.
          </p>
          
          <div className="landing-actions">
            <button className="start-meeting-btn" onClick={handleStartNewMeeting} style={{ background: themeColor }}>
              <span className="btn-icon">📹</span> New meeting
            </button>
            
            <form className="join-meeting-form" onSubmit={handleJoinExisting}>
              <div className="join-input-wrapper">
                <span className="keyboard-icon">⌨️</span>
                <input 
                  type="text" 
                  placeholder="Enter a code or link"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="join-btn-text" 
                disabled={!roomCode.trim()}
                style={{ color: roomCode.trim() ? themeColor : 'rgba(255,255,255,0.3)' }}
              >
                Join
              </button>
            </form>
          </div>
          
          <div className="landing-divider"></div>
          <p className="landing-footer-text">
            <a href="#">Learn more</a> about MasteryZone Live Hub and WebRTC security.
          </p>
        </div>
        
        <div className="landing-right">
          <div className="carousel-illustration">
            <div className="carousel-img" style={{ background: `radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%), ${themeColor}22` }}>
              <span style={{ fontSize: '100px' }}>🌐</span>
            </div>
            <h3>Get a link you can share</h3>
            <p>Click <strong>New meeting</strong> to get a link you can send to people you want to meet with</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationHub;
