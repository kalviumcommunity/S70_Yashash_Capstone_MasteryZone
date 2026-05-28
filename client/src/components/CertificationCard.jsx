import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaLock, FaMedal, FaPlay } from 'react-icons/fa';
import ProctoredExam from './ProctoredExam';

const API_BASE = import.meta.env.VITE_API_URL || "https://s70-yashash-capstone-masteryzone-2.onrender.com";

const CertificationCard = ({ certData, zone, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(certData.status || 'locked'); // locked, active, completed, expired
  const [progress, setProgress] = useState(certData.progress || 0);
  const [currentModule, setCurrentModule] = useState(certData.currentModule || 1);
  const [isExamOpen, setIsExamOpen] = useState(false);

  useEffect(() => {
    setStatus(certData.status || 'locked');
    setProgress(certData.progress || 0);
    setCurrentModule(certData.currentModule || 1);
  }, [certData]);

  const handleLaunchTrial = () => {
    setIsExamOpen(true);
  };

  const handleEnrollAPI = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to unlock the full certification.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/certifications/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          zone,
          certId: certData.id,
          name: certData.name,
          totalModules: certData.modules,
          isTrial: false
        })
      });

      if (response.ok) {
        toast.success(`Successfully enrolled in ${certData.name}!`);
        setStatus('active');
        if (onUpdate) onUpdate();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to enroll");
      }
    } catch (err) {
      toast.error("Network error");
    }
    setLoading(false);
  };

  const handleCloseExam = () => {
    setIsExamOpen(false);
    if (status !== 'active' && status !== 'completed') {
      toast.info("Exam session closed. You can purchase the full certification to save your progress!");
    }
  };

  const handleCompleteModule = async () => {
    if (status !== 'active') return;
    setLoading(true);
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${API_BASE}/api/certifications/progress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ certId: certData.id })
      });

      const data = await response.json();
      if (response.ok) {
        setProgress(data.certification.progress);
        setCurrentModule(data.certification.currentModule);
        setStatus(data.certification.status);
        if (data.certification.status === 'completed') {
          toast.success(`🎉 Achievement Unlocked: ${certData.name}!`);
        } else {
          toast.info(`Module completed! Progress: ${Math.round(data.certification.progress)}%`);
        }
        if (onUpdate) onUpdate();
      } else {
        toast.error(data.message);
        if (data.message === "Free Trial has expired") {
          setStatus('expired');
        }
      }
    } catch (err) {
      toast.error("Network error");
    }
    setLoading(false);
  };

  return (
    <>
      <div className={`cert-card ${status}`} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {status === 'completed' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '5px', background: '#00A859' }}></div>
        )}

        <img src={certData.image} alt={certData.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#fff' }}>{certData.name}</h3>
          {status === 'completed' ? <FaMedal color="#ffd700" size={24} /> : <span style={{ color: '#00A859', fontWeight: '800' }}>${certData.price}</span>}
        </div>
        
        <p style={{ fontSize: '14px', color: '#888', marginBottom: '15px', flex: 1 }}>{certData.desc}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
          {status === 'locked' && (
            <button 
              onClick={handleEnrollAPI} 
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: 'var(--theme-color, #00A859)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
            >
              {loading ? 'Processing...' : 'Purchase Certification'}
            </button>
          )}

          {status === 'active' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ccc', marginBottom: '5px' }}>
                <span>Module {currentModule} of {certData.modules}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '15px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--theme-color, #00A859)', width: `${progress}%`, transition: 'width 0.5s ease-out' }}></div>
              </div>
              <button 
                onClick={handleCompleteModule} 
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: 'var(--theme-color, #00A859)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
              >
                <FaPlay /> {loading ? 'Saving...' : 'Study & Complete Module'}
              </button>
            </div>
          )}

          {status === 'completed' && (
            <div style={{ padding: '12px', background: 'rgba(0, 168, 89, 0.2)', color: '#00A859', borderRadius: '8px', textAlign: 'center', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <FaCheckCircle /> Certification Earned!
            </div>
          )}

          {status === 'expired' && (
            <div style={{ padding: '12px', background: 'rgba(255, 0, 0, 0.2)', color: '#ff4444', borderRadius: '8px', textAlign: 'center', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <FaLock /> Trial Expired. Upgrade Now.
            </div>
          )}

          {/* Always available Free Trial Exam (Guest Retake feature) */}
          {status !== 'completed' && (
            <button 
              onClick={handleLaunchTrial} 
              disabled={loading}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
            >
              Start Free Trial Exam
            </button>
          )}
        </div>
      </div>

      {isExamOpen && (
        <ProctoredExam 
          zone={zone}
          title={certData.name}
          onClose={handleCloseExam}
          onPurchase={handleEnrollAPI}
        />
      )}
    </>
  );
};

export default CertificationCard;

