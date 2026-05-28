import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaLock, FaMedal, FaShieldAlt, FaCreditCard } from 'react-icons/fa';
import ProctoredExam from './ProctoredExam';

const API_BASE = import.meta.env.VITE_API_URL || "https://s70-yashash-capstone-masteryzone-2.onrender.com";

const CertificationCard = ({ certData, zone, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(certData.status || 'locked'); // locked, completed, expired
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    setStatus(certData.status || 'locked');
  }, [certData]);

  const handleLaunchTrial = () => {
    setIsExamOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to unlock the full certification.");
      setLoading(false);
      setShowPaymentModal(false);
      return;
    }

    // Simulate payment processing delay
    toast.info("Processing secure payment...", { autoClose: 1500 });
    
    setTimeout(async () => {
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
          toast.success(`Payment Successful! You are now certified in ${certData.name}!`);
          setStatus('completed');
          setShowPaymentModal(false);
          if (onUpdate) onUpdate();
        } else {
          const data = await response.json();
          toast.error(data.message || "Failed to process certification");
        }
      } catch (err) {
        toast.error("Network error during checkout");
      }
      setLoading(false);
    }, 1500);
  };

  const handleCloseExam = () => {
    setIsExamOpen(false);
    if (status !== 'completed') {
      toast.info("Exam session closed. You can purchase the full certification below.");
    }
  };

  return (
    <>
      {/* Premium Horizontal Glassmorphism Card */}
      <div 
        className={`premium-cert-card ${status}`} 
        style={{ 
          background: status === 'completed' ? 'linear-gradient(135deg, rgba(0,168,89,0.1), rgba(0,0,0,0.6))' : 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(16px)', 
          border: status === 'completed' ? '1px solid rgba(0,168,89,0.3)' : '1px solid rgba(255,255,255,0.08)', 
          padding: '24px', 
          borderRadius: '24px', 
          display: 'flex', 
          flexDirection: 'row',
          gap: '30px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          flexWrap: 'wrap' // Support smaller screens
        }}
      >
        {status === 'completed' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--theme-color, #00A859)' }}></div>
        )}

        <img 
          src={certData.image} 
          alt={certData.name} 
          style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} 
        />
        
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '26px', fontWeight: '900', margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>{certData.name}</h3>
          <p style={{ fontSize: '15px', color: '#aaa', lineHeight: '1.6', margin: 0 }}>{certData.desc}</p>
          <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', color: '#ddd' }}>
              ID: {certData.id}
            </span>
            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', color: '#ddd' }}>
              Level: {certData.modules > 5 ? 'Advanced' : 'Professional'}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px', flexShrink: 0 }}>
          {status === 'completed' ? (
            <div style={{ padding: '16px', background: 'var(--theme-color, #00A859)', color: '#000', borderRadius: '12px', textAlign: 'center', fontWeight: '900', fontSize: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0, 168, 89, 0.4)' }}>
              <FaMedal size={24} /> Certification Earned!
            </div>
          ) : (
            <>
              <div style={{ fontSize: '32px', fontWeight: '900', textAlign: 'center', color: 'var(--theme-color, #00A859)', textShadow: '0 2px 10px rgba(0,168,89,0.3)' }}>
                ${certData.price}
              </div>

              <button 
                onClick={() => setShowPaymentModal(true)} 
                disabled={loading}
                style={{ width: '100%', padding: '14px', background: 'var(--theme-color, #00A859)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                <FaLock /> Secure Purchase
              </button>

              <button 
                onClick={handleLaunchTrial} 
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                Start Free Trial Exam
              </button>
            </>
          )}

          {status === 'expired' && (
            <div style={{ fontSize: '12px', color: '#ff4444', textAlign: 'center', fontWeight: 'bold' }}>
              Trial Expired. Purchase required.
            </div>
          )}
        </div>
      </div>

      {/* Payment Checkout Modal Overlay */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#1e1e1e', padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ background: 'var(--theme-color, #00A859)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px' }}>
                <FaShieldAlt size={30} color="#000" />
              </div>
              <h2 style={{ color: '#fff', margin: '0 0 10px', fontSize: '24px' }}>Secure Checkout</h2>
              <p style={{ color: '#aaa', margin: 0, fontSize: '15px' }}>You are purchasing <strong>{certData.name}</strong></p>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#aaa', fontSize: '13px', fontWeight: 'bold' }}>CARDHOLDER NAME</label>
                <input type="text" placeholder="John Doe" required style={{ padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#aaa', fontSize: '13px', fontWeight: 'bold' }}>CARD NUMBER</label>
                <div style={{ position: 'relative' }}>
                  <FaCreditCard style={{ position: 'absolute', left: '15px', top: '15px', color: '#888' }} />
                  <input type="text" placeholder="0000 0000 0000 0000" required pattern="\d{16}" title="16 digit card number" style={{ width: '100%', padding: '14px 14px 14px 45px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#aaa', fontSize: '13px', fontWeight: 'bold' }}>EXPIRY</label>
                  <input type="text" placeholder="MM/YY" required pattern="\d\d/\d\d" title="Format MM/YY" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#aaa', fontSize: '13px', fontWeight: 'bold' }}>CVC</label>
                  <input type="password" placeholder="123" required pattern="\d{3,4}" title="3 or 4 digit CVC" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} disabled={loading} style={{ flex: 1, padding: '14px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', background: 'var(--theme-color, #00A859)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {loading ? 'Processing...' : `Pay $${certData.price}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isExamOpen && (
        <ProctoredExam 
          zone={zone}
          title={certData.name}
          onClose={handleCloseExam}
          onPurchase={() => {
            setIsExamOpen(false);
            setShowPaymentModal(true);
          }}
        />
      )}
    </>
  );
};

export default CertificationCard;


