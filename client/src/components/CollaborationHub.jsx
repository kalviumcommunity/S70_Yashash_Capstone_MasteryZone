import React, { useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import './CollaborationHub.css';

const CollaborationHub = ({ zone, themeColor }) => {
  const [isJoined, setIsJoined] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [roomName, setRoomName] = useState(`MasteryZone-${zone}-${Math.floor(1000 + Math.random() * 9000)}`);
  
  const handleJoin = (e) => {
    e.preventDefault();
    if (!displayName.trim() || !roomName.trim()) return;
    setIsJoined(true);
  };

  const handleLeave = () => {
    setIsJoined(false);
  };

  if (isJoined) {
    return (
      <div className="collab-hub-container" style={{ '--theme-color': themeColor, height: '85vh' }}>
        <div className="collab-header jitsi-header">
          <div className="collab-title">
            <span className="live-indicator"></span>
            <h2>{zone} Live Discussion Room</h2>
          </div>
          <button className="control-btn danger leave-btn-small" onClick={handleLeave}>
            Leave Session
          </button>
        </div>
        
        <div className="jitsi-wrapper">
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomName}
            configOverwrite={{
              startWithAudioMuted: true,
              startWithVideoMuted: false,
              prejoinPageEnabled: false, // We built our own pre-join
              disableModeratorIndicator: true,
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
              SHOW_CHROME_EXTENSION_BANNER: false,
              SHOW_PROMOTIONAL_CLOSE_PAGE: false,
              TOOLBAR_BUTTONS: [
                  'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                  'fodeviceselection', 'hangup', 'profile', 'chat', 'settings',
                  'raisehand', 'videoquality', 'filmstrip', 'tileview'
              ]
            }}
            userInfo={{
              displayName: displayName
            }}
            getIFrameRef={(iframeRef) => { 
              iframeRef.style.height = '100%'; 
              iframeRef.style.width = '100%'; 
              iframeRef.style.border = 'none';
            }}
            onApiReady={(api) => {
              // Automatically handle when user clicks "hangup" inside Jitsi
              api.addListener('videoConferenceLeft', () => {
                setIsJoined(false);
              });
            }}
          />
        </div>
      </div>
    );
  }

  // Pre-Join Interface
  return (
    <div className="collab-hub-container pre-join-container" style={{ '--theme-color': themeColor }}>
      <div className="collab-header">
        <div className="collab-title">
          <h2>Join {zone} Collaboration</h2>
        </div>
      </div>
      
      <div className="pre-join-body">
        <div className="pre-join-hero">
          <div className="hero-icon" style={{ background: themeColor, color: '#000' }}>
            📹
          </div>
          <h3>Global Real-Time Meetings</h3>
          <p>
            Connect instantly with other learners in the {zone} community. 
            Enjoy seamless HD video, audio, screen sharing, and group chat.
          </p>
        </div>

        <form className="pre-join-form" onSubmit={handleJoin}>
          <div className="form-group">
            <label>Your Display Name</label>
            <input 
              type="text" 
              placeholder="e.g. Alex (Mentor)" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Room Code</label>
            <div className="room-input-group">
              <input 
                type="text" 
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="randomize-btn"
                onClick={() => setRoomName(`MasteryZone-${zone}-${Math.floor(1000 + Math.random() * 9000)}`)}
                title="Generate New Room"
              >
                🔄
              </button>
            </div>
            <small>Share this code with others so they can join the exact same room.</small>
          </div>

          <button type="submit" className="join-meeting-btn" style={{ background: themeColor }}>
            Join Meeting Now
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollaborationHub;
