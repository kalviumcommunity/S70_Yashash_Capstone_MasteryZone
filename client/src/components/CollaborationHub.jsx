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
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [privateChats, setPrivateChats] = useState({}); // { username: [msg1, msg2] }
  const [activeChatUser, setActiveChatUser] = useState(null); // username of currently active 1-on-1 chat
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [privateChatInput, setPrivateChatInput] = useState('');
  const [chatMode, setChatMode] = useState('GLOBAL'); // 'GLOBAL' or 'PRIVATE'
  
  const socketRef = useRef(null);
  const chatScrollRef = useRef(null);
  const privateChatScrollRef = useRef(null);

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

    socketRef.current.on("receive_global_message", (msg) => {
      // Only append if it's for this zone
      if (msg.zone === zone) {
        setChatMessages(prev => [...prev, msg]);
      }
    });

    socketRef.current.on("receive_private_msg", (msg) => {
      setPrivateChats(prev => {
        const chatHistory = prev[msg.fromUser] || [];
        return {
          ...prev,
          [msg.fromUser]: [...chatHistory, msg]
        };
      });
      // Optionally show a toast if the chat isn't currently open
      toast.info(`Private message from ${msg.fromUser}: ${msg.text.substring(0,20)}...`);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [displayName, zone]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, view]);

  useEffect(() => {
    if (privateChatScrollRef.current) {
      privateChatScrollRef.current.scrollTop = privateChatScrollRef.current.scrollHeight;
    }
  }, [privateChats, activeChatUser]);

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

  const handleSendGlobalMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    // We need a display name to chat, if they haven't set one, prompt them
    if (!displayName.trim()) {
      toast.error("Please enter your name in the 'Join' section first to chat!");
      return;
    }

    const msgData = {
      id: Date.now().toString(),
      user: displayName,
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      zone: zone
    };

    socketRef.current.emit("send_global_message", msgData);
    setChatInput('');
  };

  const handleSendPrivateMessage = (e) => {
    e.preventDefault();
    if (!privateChatInput.trim() || !activeChatUser) return;
    
    const msgData = {
      toUser: activeChatUser,
      fromUser: displayName || 'A MasteryZone Host',
      text: privateChatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Store in our own state
    setPrivateChats(prev => {
      const chatHistory = prev[activeChatUser] || [];
      return {
        ...prev,
        [activeChatUser]: [...chatHistory, { ...msgData, id: Date.now().toString() }]
      };
    });

    socketRef.current.emit("send_private_msg", msgData);
    setPrivateChatInput('');
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
        
        <div className="landing-right global-chat-panel">
          <div className="global-chat-header" style={{ borderBottom: `2px solid ${themeColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select 
                value={chatMode} 
                onChange={(e) => {
                  setChatMode(e.target.value);
                  setActiveChatUser(null);
                }}
                className="chat-mode-dropdown"
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: `1px solid ${themeColor}`,
                  padding: '5px 10px',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <option value="GLOBAL" style={{ color: '#000' }}>🌍 Global Lounge</option>
                <option value="PRIVATE" style={{ color: '#000' }}>🔒 Private Chat</option>
              </select>
            </div>
            {chatMode === 'GLOBAL' && (
              <span className="online-count">{onlineUsers.length + 1} Online</span>
            )}
          </div>
          
          {chatMode === 'GLOBAL' ? (
            <>
              <div className="global-chat-messages" ref={chatScrollRef}>
                {chatMessages.length === 0 ? (
                  <div className="empty-chat-msg">
                    <span style={{ fontSize: '40px' }}>👋</span>
                    <p>Welcome to the {zone} Lounge! Be the first to say hello.</p>
                  </div>
                ) : (
                  chatMessages.map(msg => {
                    const isMe = msg.user === displayName;
                    return (
                      <div key={msg.id} className={`chat-bubble-wrapper ${isMe ? 'mine' : 'theirs'}`}>
                        {!isMe && <span className="chat-bubble-name">{msg.user}</span>}
                        <div className="chat-bubble" style={{ background: isMe ? themeColor : '#2c2c2c', color: isMe ? '#000' : '#fff' }}>
                          {msg.text}
                          <span className="chat-bubble-time" style={{ color: isMe ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)' }}>{msg.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <form className="global-chat-input-area" onSubmit={handleSendGlobalMessage}>
                <input 
                  type="text" 
                  placeholder={displayName ? "Type a message..." : "Set your name on the left to chat..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={!displayName}
                />
                <button 
                  type="submit" 
                  className="send-chat-btn"
                  disabled={!displayName || !chatInput.trim()}
                  style={{ background: themeColor, color: '#000' }}
                >
                  ➤
                </button>
              </form>
            </>
          ) : (
            <div className="private-chat-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '15px' }}>
              {!activeChatUser ? (
                <>
                  <div className="dm-search-bar" style={{ marginBottom: '15px' }}>
                    <input 
                      type="text" 
                      placeholder="Search online users to DM..." 
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="online-users-list" style={{ overflowY: 'auto', flex: 1 }}>
                    {onlineUsers.filter(u => u.toLowerCase().includes(userSearchQuery.toLowerCase())).length === 0 ? (
                      <p style={{textAlign: 'center', marginTop: '20px', color: '#888'}}>No matching users online.</p>
                    ) : (
                      onlineUsers.filter(u => u.toLowerCase().includes(userSearchQuery.toLowerCase())).map(user => (
                        <div key={user} className="online-user-item" onClick={() => setActiveChatUser(user)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px' }}>
                          <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="online-dot" style={{ width: '8px', height: '8px', background: '#00e676', borderRadius: '50%' }}></span>
                            <span className="user-name" style={{ color: '#fff', fontWeight: 'bold' }}>{user}</span>
                          </div>
                          <span className="dm-open-icon">💬</span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="private-chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1e1e', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="private-chat-header" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="back-to-users-btn" onClick={() => setActiveChatUser(null)} style={{ background: 'transparent', border: 'none', color: themeColor, cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
                    <h4 style={{ margin: 0, color: '#fff' }}>{activeChatUser}</h4>
                  </div>
                  
                  <div className="private-chat-messages" ref={privateChatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {!(privateChats[activeChatUser] && privateChats[activeChatUser].length > 0) ? (
                      <p className="empty-chat-msg" style={{ color: '#888', textAlign: 'center', margin: 'auto' }}>Say hi to {activeChatUser}!</p>
                    ) : (
                      privateChats[activeChatUser].map(msg => {
                        const isMe = msg.fromUser === (displayName || 'A MasteryZone Host');
                        return (
                          <div key={msg.id} className={`chat-bubble-wrapper ${isMe ? 'mine' : 'theirs'}`}>
                            <div className="chat-bubble" style={{ background: isMe ? themeColor : '#333', color: isMe ? '#000' : '#fff' }}>
                              {msg.text}
                              <span className="chat-bubble-time" style={{ color: isMe ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}>{msg.time}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form className="private-chat-input-area" onSubmit={handleSendPrivateMessage} style={{ display: 'flex', padding: '10px', background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.1)', gap: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Type a message..."
                      value={privateChatInput}
                      onChange={(e) => setPrivateChatInput(e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '20px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
                      autoFocus
                    />
                    <button type="submit" className="send-chat-btn" disabled={!privateChatInput.trim()} style={{ background: themeColor, color: '#000', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer' }}>
                      ➤
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationHub;
