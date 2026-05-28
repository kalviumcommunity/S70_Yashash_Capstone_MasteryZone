import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import './CollaborationHub.css';

const CollaborationHub = ({ zone, themeColor }) => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'participants'
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'System', text: `Welcome to the ${zone} Collaboration Hub!`, isSystem: true, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Mock participants for demonstration
  const [participants] = useState([
    { id: 'me', name: 'You', isMe: true, isSpeaking: false },
    { id: 'p1', name: 'Alex M.', role: 'Mentor', avatar: 'https://loremflickr.com/150/150/face,person?lock=1', isSpeaking: true },
    { id: 'p2', name: 'Sarah T.', role: 'Learner', avatar: 'https://loremflickr.com/150/150/face,person?lock=2', isSpeaking: false },
    { id: 'p3', name: 'David K.', role: 'Learner', avatar: 'https://loremflickr.com/150/150/face,person?lock=3', isSpeaking: false }
  ]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      stopLocalStream();
      stopScreenStream();
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const stopScreenStream = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
  };

  const toggleMic = async () => {
    if (!localStream) {
      await startMedia(true, isVideoOn);
    } else {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
      }
    }
    setIsMicOn(!isMicOn);
    if (!isMicOn) toast.success("Microphone enabled");
    else toast.info("Microphone muted");
  };

  const toggleVideo = async () => {
    if (!isVideoOn) {
      await startMedia(isMicOn, true);
    } else {
      stopLocalStream(); // Easiest way to turn off camera light
      if (isMicOn) {
        // Restart only audio if mic was on
        await startMedia(true, false);
      }
    }
    setIsVideoOn(!isVideoOn);
    if (!isVideoOn) toast.success("Camera enabled");
    else toast.info("Camera disabled");
  };

  const startMedia = async (audio, video) => {
    stopLocalStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing media devices", err);
      toast.error("Could not access camera/microphone. Please check permissions.");
      setIsVideoOn(false);
      setIsMicOn(false);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenStream();
      setIsScreenSharing(false);
      toast.info("Screen sharing stopped");
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        
        // Handle user stopping stream from browser UI
        stream.getVideoTracks()[0].onended = () => {
          stopScreenStream();
          setIsScreenSharing(false);
          toast.info("Screen sharing ended by browser");
        };
        
        toast.success("Screen sharing started");
      } catch (err) {
        console.error("Error sharing screen", err);
        setIsScreenSharing(false);
        // User likely cancelled
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setChatMessages([
      ...chatMessages,
      { 
        id: Date.now(), 
        sender: 'You', 
        text: chatInput.trim(), 
        isMe: true, 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
      }
    ]);
    setChatInput('');
  };

  const handleLeave = () => {
    stopLocalStream();
    stopScreenStream();
    setIsVideoOn(false);
    setIsMicOn(false);
    setIsScreenSharing(false);
    toast.error("Disconnected from session");
  };

  return (
    <div className="collab-hub-container" style={{ '--theme-color': themeColor }}>
      <div className="collab-header">
        <div className="collab-title">
          <span className="live-indicator"></span>
          <h2>{zone} Live Discussion</h2>
        </div>
        <div className="collab-meta">
          <span>{participants.length} Participants</span>
          <span>•</span>
          <span>02:45:10 Elapsed</span>
        </div>
      </div>

      <div className="collab-main-area">
        <div className="collab-video-grid">
          
          {/* Screen Share View (Dominant if active) */}
          {isScreenSharing && (
            <div className="video-card screen-share-card">
              <video 
                ref={screenVideoRef} 
                autoPlay 
                playsInline 
                muted // Don't echo local screen share audio
                className="stream-video"
              ></video>
              <div className="video-overlay">
                <span className="participant-name">Your Screen</span>
                <span className="badge-sharing">Presenting</span>
              </div>
            </div>
          )}

          {/* Local User View */}
          <div className={`video-card local-card ${isVideoOn ? '' : 'no-video'} ${isScreenSharing ? 'minimized' : ''}`}>
            {isVideoOn ? (
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="stream-video mirror"
              ></video>
            ) : (
              <div className="avatar-placeholder" style={{ background: themeColor }}>
                Y
              </div>
            )}
            <div className="video-overlay">
              <span className="participant-name">You (Local)</span>
              <div className="status-icons">
                {!isMicOn && <span className="icon-muted">🔇</span>}
              </div>
            </div>
          </div>

          {/* Simulated Remote Users */}
          {!isScreenSharing && participants.filter(p => !p.isMe).map(p => (
            <div key={p.id} className={`video-card remote-card ${p.isSpeaking ? 'speaking' : ''}`}>
              <img src={p.avatar} alt={p.name} className="stream-video simulated-stream" />
              <div className="video-overlay">
                <span className="participant-name">
                  {p.name} {p.role === 'Mentor' && <span className="badge-mentor">Mentor</span>}
                </span>
                <div className="status-icons">
                  {!p.isSpeaking && <span className="icon-muted">🔇</span>}
                </div>
              </div>
            </div>
          ))}
          
        </div>

        {/* Sidebar */}
        <div className="collab-sidebar">
          <div className="sidebar-tabs">
            <button 
              className={activeTab === 'chat' ? 'active' : ''} 
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button 
              className={activeTab === 'participants' ? 'active' : ''} 
              onClick={() => setActiveTab('participants')}
            >
              Members ({participants.length})
            </button>
          </div>

          <div className="sidebar-content">
            {activeTab === 'chat' ? (
              <div className="chat-container">
                <div className="chat-messages" ref={chatScrollRef}>
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`chat-message ${msg.isMe ? 'me' : ''} ${msg.isSystem ? 'system' : ''}`}>
                      {!msg.isSystem && <span className="msg-sender">{msg.sender} <small>{msg.time}</small></span>}
                      <div className="msg-bubble">{msg.text}</div>
                    </div>
                  ))}
                </div>
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    placeholder="Message the group..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="send-btn" style={{ background: themeColor }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </form>
              </div>
            ) : (
              <div className="participants-list">
                {participants.map(p => (
                  <div key={p.id} className="participant-row">
                    <div className="participant-info">
                      {p.isMe ? (
                        <div className="part-avatar" style={{ background: themeColor }}>Y</div>
                      ) : (
                        <img src={p.avatar} alt={p.name} className="part-avatar" />
                      )}
                      <div className="part-details">
                        <span className="part-name">{p.name}</span>
                        {p.role && <span className="part-role">{p.role}</span>}
                      </div>
                    </div>
                    <div className="part-actions">
                      {p.isMe ? (
                        <span className="part-status">{isMicOn ? '🎤' : '🔇'}</span>
                      ) : (
                        <span className="part-status">{p.isSpeaking ? '🎤' : '🔇'}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="add-member-action">
                  <button className="invite-btn" style={{ borderColor: themeColor, color: themeColor }}>
                    + Invite New Member
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="collab-controls">
        <button 
          className={`control-btn ${!isMicOn ? 'danger' : ''}`} 
          onClick={toggleMic}
          title={isMicOn ? 'Mute' : 'Unmute'}
        >
          {isMicOn ? '🎙️' : '🔇'}
        </button>
        
        <button 
          className={`control-btn ${!isVideoOn ? 'danger' : ''}`} 
          onClick={toggleVideo}
          title={isVideoOn ? 'Stop Video' : 'Start Video'}
        >
          {isVideoOn ? '📹' : '🚫'}
        </button>
        
        <button 
          className={`control-btn ${isScreenSharing ? 'active-share' : ''}`} 
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          style={isScreenSharing ? { background: themeColor, color: '#000' } : {}}
        >
          🖥️ {isScreenSharing ? 'Stop Share' : 'Share'}
        </button>
        
        <button 
          className="control-btn leave-btn" 
          onClick={handleLeave}
          title="Leave Session"
        >
          ☎️ Leave
        </button>
      </div>
    </div>
  );
};

export default CollaborationHub;
