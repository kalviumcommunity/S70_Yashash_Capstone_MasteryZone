import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_URL || "https://s70-yashash-capstone-masteryzone-2.onrender.com";

const MembershipPortal = ({ zone, themeColor, onPassIdCreated }) => {
  const [membershipForm, setMembershipForm] = useState({
    primaryName: "",
    email: "",
    tier: "gold", // "silver", "gold", "platinum"
    cycle: "monthly", // "monthly", "annual"
    accentColor: themeColor || "#00A859",
  });
  
  const [rosterList, setRosterList] = useState([]);
  const [newRosterMember, setNewRosterMember] = useState({
    name: "",
    age: "",
    relationship: "Frontend",
    goal: "Learn React"
  });
  
  const [membershipSuccess, setMembershipSuccess] = useState(false);
  const [membershipPassId, setMembershipPassId] = useState("");
  const [isMembershipProcessing, setIsMembershipProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing membership from the backend
  useEffect(() => {
    const fetchMembership = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/api/members/${zone}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setMembershipForm({
            primaryName: data.primaryName,
            email: data.email,
            tier: data.tier,
            cycle: data.cycle,
            accentColor: data.accentColor || themeColor,
          });
          setRosterList(data.roster || []);
          setMembershipPassId(data.passId);
          setMembershipSuccess(true);
          if (onPassIdCreated) onPassIdCreated(data.passId);
        }
      } catch (err) {
        console.error("Error fetching membership:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembership();
  }, [zone, themeColor, onPassIdCreated]);

  const getMembershipTotals = () => {
    let baseRate = 29.99; // Silver
    if (membershipForm.tier === "gold") baseRate = 59.99;
    else if (membershipForm.tier === "platinum") baseRate = 99.99;

    const cycleDiscount = membershipForm.cycle === "annual" ? baseRate * 0.2 : 0;
    const activeRate = baseRate - cycleDiscount;

    const additionalFee = rosterList.length * 14.99;
    const subtotal = activeRate + additionalFee;
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    return {
      baseRate,
      cycleDiscount: parseFloat(cycleDiscount.toFixed(2)),
      activeRate: parseFloat(activeRate.toFixed(2)),
      additionalFee: parseFloat(additionalFee.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };

  const handleMembershipSubmit = async (e) => {
    e.preventDefault();
    if (!membershipForm.primaryName || !membershipForm.email) {
      toast.error("Please enter primary name and email address!");
      return;
    }
    
    setIsMembershipProcessing(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE}/api/members/${zone}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(membershipForm)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMembershipSuccess(true);
        setMembershipPassId(data.membership.passId);
        toast.success(`Successfully activated your ${membershipForm.tier.toUpperCase()} pass!`);
        if (onPassIdCreated) onPassIdCreated(data.membership.passId);
      } else {
        toast.error(data.error || "Failed to process pass.");
      }
    } catch (err) {
      toast.error("Network error during transaction.");
    } finally {
      setIsMembershipProcessing(false);
    }
  };

  const addRosterMember = async (e) => {
    e.preventDefault();
    if (!newRosterMember.name || !newRosterMember.age) {
      toast.error("Please provide the new member's name and age!");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/members/${zone}/roster`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newRosterMember)
      });
      
      const data = await res.json();
      if (res.ok) {
        setRosterList(data.roster);
        setNewRosterMember({ name: "", age: "", relationship: "Frontend", goal: "Learn React" });
        toast.success("Teammate added to roster!");
      } else {
        toast.error(data.error || "Failed to add teammate.");
      }
    } catch (err) {
      toast.error("Network error adding teammate.");
    }
  };

  const removeRosterMember = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/members/${zone}/roster/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        setRosterList(data.roster);
        toast.success("Teammate removed.");
      }
    } catch (err) {
      toast.error("Network error removing teammate.");
    }
  };

  const updateThemeColor = async (color) => {
    setMembershipForm({ ...membershipForm, accentColor: color });
    
    // Only save to backend if already purchased
    if (membershipSuccess) {
      const token = localStorage.getItem("token");
      try {
        await fetch(`${API_BASE}/api/members/${zone}/theme`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ accentColor: color })
        });
      } catch (err) {
        console.error("Failed to update theme", err);
      }
    }
  };

  if (loading) {
    return <div style={{ color: '#fff', padding: '50px', textAlign: 'center' }}>Loading Membership Data...</div>;
  }

  return (
    <div className="fitness-section-container">
      <div className="fitness-section-header">
        <h1 className="fitness-section-heading">TEAM ROSTER PORTAL</h1>
        <p className="fitness-section-subheading">Configure your {zone.toLowerCase()} team plan, build your roster, and customize your glassmorphic pass</p>
      </div>

      {!membershipSuccess ? (
        <div className="membership-layout">
          {/* Left Panel: Plan Setup & Family Roster builder */}
          <div className="membership-left-panel">
            {/* Step 1: Base Tier & Cycle Selector */}
            <div className="roster-form-box" id="membership-pricing">
              <h3>1. Choose Your Tier & Billing Cycle</h3>
              <div className="membership-cycle-toggle-container">
                <span className={membershipForm.cycle === "monthly" ? "active-cycle" : ""} onClick={() => setMembershipForm({ ...membershipForm, cycle: "monthly" })}>Monthly Billing</span>
                <div className={`cycle-switch-pill ${membershipForm.cycle === "annual" ? "annual" : ""}`} onClick={() => setMembershipForm(prev => ({ ...prev, cycle: prev.cycle === "monthly" ? "annual" : "monthly" }))}>
                  <div className="cycle-switch-knob"></div>
                </div>
                <span className={membershipForm.cycle === "annual" ? "active-cycle" : ""} onClick={() => setMembershipForm({ ...membershipForm, cycle: "annual" })}>
                  Annual Billing <span className="save-badge">SAVE 20%</span>
                </span>
              </div>

              <div className="pricing-grid">
                {/* Silver Tier */}
                <div className={`pricing-card ${membershipForm.tier === "silver" ? "selected" : ""}`} onClick={() => setMembershipForm({ ...membershipForm, tier: "silver" })}>
                  <div className="tier-badge">Silver</div>
                  <div className="tier-price">
                    ${membershipForm.cycle === "annual" ? "23.99" : "29.99"}<span>/mo</span>
                  </div>
                  <ul className="tier-features">
                    <li>✔ Standard Features</li>
                    <li>✔ Core Access</li>
                    <li>✔ Community forums</li>
                    <li>✖ Advanced Team pipelines</li>
                    <li>✖ VIP consultations</li>
                  </ul>
                </div>

                {/* Gold Tier */}
                <div className={`pricing-card ${membershipForm.tier === "gold" ? "selected" : ""}`} onClick={() => setMembershipForm({ ...membershipForm, tier: "gold" })}>
                  <div className="tier-badge gold">Gold Elite</div>
                  <div className="tier-price">
                    ${membershipForm.cycle === "annual" ? "47.99" : "59.99"}<span>/mo</span>
                  </div>
                  <ul className="tier-features">
                    <li>✔ 10 Active slots</li>
                    <li>✔ Core Access</li>
                    <li>✔ Team pipelines</li>
                    <li>✔ Extended cloud features</li>
                    <li>✖ VIP consultations</li>
                  </ul>
                </div>

                {/* Platinum Tier */}
                <div className={`pricing-card platinum ${membershipForm.tier === "platinum" ? "selected" : ""}`} onClick={() => setMembershipForm({ ...membershipForm, tier: "platinum" })}>
                  <div className="tier-badge platinum">Platinum Legend</div>
                  <div className="tier-price">
                    ${membershipForm.cycle === "annual" ? "79.99" : "99.99"}<span>/mo</span>
                  </div>
                  <ul className="tier-features">
                    <li>✔ Unlimited slots</li>
                    <li>✔ Unlimited advanced features</li>
                    <li>✔ 1-on-1 VIP consultations</li>
                    <li>✔ Dedicated enterprise server</li>
                    <li>✔ Welcome merchandise pack</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2: Primary Member Details */}
            <form onSubmit={handleMembershipSubmit} className="roster-form-box">
              <h3>2. Primary Account Details</h3>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Passholder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Type pass name..."
                    value={membershipForm.primaryName}
                    onChange={(e) => setMembershipForm({ ...membershipForm, primaryName: e.target.value })}
                    className="checkout-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={membershipForm.email}
                    onChange={(e) => setMembershipForm({ ...membershipForm, email: e.target.value })}
                    className="checkout-input"
                  />
                </div>
              </div>

              {/* Step 3: Registration Summary */}
              <div className="roster-checkout-summary" style={{ marginTop: '30px' }}>
                <h3>3. Registration & Billing</h3>
                <div className="roster-financials">
                  <div className="financial-row">
                    <span>Primary {membershipForm.tier.toUpperCase()} Base Rate</span>
                    <span>${getMembershipTotals().baseRate}</span>
                  </div>
                  {membershipForm.cycle === "annual" && (
                    <div className="financial-row discount">
                      <span>20% Annual Contract Discount</span>
                      <span>-${getMembershipTotals().cycleDiscount}</span>
                    </div>
                  )}
                  <hr className="financial-separator" />
                  <div className="financial-row total">
                    <span>Total Monthly Base</span>
                    <span className="total-due-text">${getMembershipTotals().total}</span>
                  </div>
                </div>

                <button type="submit" className="place-order-btn" style={{ marginTop: "20px" }} disabled={isMembershipProcessing}>
                  {isMembershipProcessing ? "Processing Team Signups..." : `Purchase ${zone} Pass ($${getMembershipTotals().total}/mo)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* PURCHASED VIEW: Roster Management and Pass Display */
        <div className="membership-layout">
          {/* Left Panel: Family/Friends Roster Builder */}
          <div className="membership-left-panel">
            <div className="roster-builder-section" style={{ backgroundColor: 'rgba(10, 2, 13, 0.4)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3>Active Pass Granted! Configure Team Roster</h3>
              <p className="roster-lead-info">Add additional members to your team! Each added seat is billed separately on your monthly invoice.</p>
              
              <div className="roster-adder-form">
                <input
                  type="text"
                  placeholder="Name..."
                  value={newRosterMember.name}
                  onChange={(e) => setNewRosterMember({ ...newRosterMember, name: e.target.value })}
                  className="checkout-input"
                  style={{ flex: 1.5 }}
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={newRosterMember.age}
                  onChange={(e) => setNewRosterMember({ ...newRosterMember, age: e.target.value })}
                  className="checkout-input"
                  style={{ width: "70px" }}
                />
                <select
                  value={newRosterMember.relationship}
                  onChange={(e) => setNewRosterMember({ ...newRosterMember, relationship: e.target.value })}
                  className="checkout-input"
                  style={{ width: "120px" }}
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Devops">Devops</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Student">Student</option>
                </select>
                <select
                  value={newRosterMember.goal}
                  onChange={(e) => setNewRosterMember({ ...newRosterMember, goal: e.target.value })}
                  className="checkout-input"
                  style={{ width: "140px" }}
                >
                  <option value="Learn Skills">Learn Skills</option>
                  <option value="Build Projects">Build Projects</option>
                  <option value="Certifications">Certifications</option>
                  <option value="Full Mastery">Full Mastery</option>
                </select>
                <button type="button" className="roster-add-btn" onClick={addRosterMember}>
                  Add Seat
                </button>
              </div>

              {/* Roster Table */}
              {rosterList.length > 0 ? (
                <table className="roster-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Role</th>
                      <th>Goal</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterList.map((m) => (
                      <tr key={m._id || m.id}>
                        <td><strong>{m.name}</strong></td>
                        <td>{m.age} yrs</td>
                        <td><span className="roster-role-badge">{m.relationship}</span></td>
                        <td>{m.goal}</td>
                        <td style={{ textAlign: "right" }}>
                          <button type="button" className="roster-remove-btn" onClick={() => removeRosterMember(m._id || m.id)}>&times;</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  No extra members added to this pass yet.
                </div>
              )}
            </div>
            
            {/* Invoice Summary Box */}
            <div className="roster-checkout-summary" style={{ marginTop: '20px' }}>
              <h3>Current Billing Overview</h3>
              <div className="roster-financials">
                <div className="financial-row">
                  <span>Base Rate</span>
                  <span>${getMembershipTotals().baseRate}</span>
                </div>
                <div className="financial-row">
                  <span>Active Roster Seats ({rosterList.length})</span>
                  <span>+${getMembershipTotals().additionalFee}</span>
                </div>
                <hr className="financial-separator" />
                <div className="financial-row total">
                  <span>Total Next Cycle Due</span>
                  <span className="total-due-text" style={{ color: membershipForm.accentColor }}>${getMembershipTotals().total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Live Gym Pass Generator & Customizer */}
          <div className="membership-right-panel pass-preview-container">
            <div className="pass-customizer-controls">
              <h3>Pass Theme Customizer</h3>
              <p className="customizer-lead">Customize highlights and colors of your active {zone} pass in real-time!</p>
              
              <div className="form-group">
                <label>Choose Neon Theme Color</label>
                <div className="pass-color-pills">
                  <button type="button" className={`color-pill pink ${membershipForm.accentColor === "#00A859" ? "active" : ""}`} onClick={() => updateThemeColor("#00A859")} style={{ backgroundColor: "#00A859" }}></button>
                  <button type="button" className={`color-pill cyan ${membershipForm.accentColor === "#00f0ff" ? "active" : ""}`} onClick={() => updateThemeColor("#00f0ff")} style={{ backgroundColor: "#00f0ff" }}></button>
                  <button type="button" className={`color-pill gold-gold ${membershipForm.accentColor === "#ffd700" ? "active" : ""}`} onClick={() => updateThemeColor("#ffd700")} style={{ backgroundColor: "#ffd700" }}></button>
                  <button type="button" className={`color-pill lavender ${membershipForm.accentColor === "#b78bb1" ? "active" : ""}`} onClick={() => updateThemeColor("#b78bb1")} style={{ backgroundColor: "#b78bb1" }}></button>
                  <button type="button" className={`color-pill red ${membershipForm.accentColor === "#ff0044" ? "active" : ""}`} onClick={() => updateThemeColor("#ff0044")} style={{ backgroundColor: "#ff0044" }}></button>
                </div>
              </div>
            </div>

            {/* LIVE DIGITAL PASS CARD */}
            <div className="digital-wallet-pass" style={{ "--pass-accent": membershipForm.accentColor }}>
              <div className="pass-header">
                <div className="pass-brand">
                  <span className="pass-icon">⚡</span>
                  MASTERY <span>{zone}</span>
                </div>
                <div className="pass-tier">{membershipForm.tier.toUpperCase()}</div>
              </div>

              <div className="pass-body">
                <div className="pass-avatar-placeholder">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="48" fill="var(--pass-accent)" fillOpacity="0.1" stroke="var(--pass-accent)" strokeWidth="4"/>
                    <path d="M50 45C58 45 65 38 65 30C65 22 58 15 50 15C42 15 35 22 35 30C35 38 42 45 50 45Z" fill="var(--pass-accent)"/>
                    <path d="M80 80C80 65 65 55 50 55C35 55 20 65 20 80C20 82 22 85 25 85H75C78 85 80 82 80 80Z" fill="var(--pass-accent)"/>
                  </svg>
                </div>

                <div className="pass-details">
                  <h4 className="pass-member-name">{membershipForm.primaryName || "AWAITING NAME"}</h4>
                  <div className="pass-stat-row">
                    <span>Active Roster</span>
                    <strong>{rosterList.length + 1} Seats</strong>
                  </div>
                  <div className="pass-stat-row">
                    <span>Billing Cycle</span>
                    <strong>{membershipForm.cycle.toUpperCase()}</strong>
                  </div>
                  <div className="pass-stat-row">
                    <span>Member ID</span>
                    <strong style={{ fontFamily: 'monospace' }}>{membershipPassId || "PENDING..."}</strong>
                  </div>
                </div>
              </div>

              <div className="pass-footer">
                <svg className="pass-barcode" viewBox="0 0 200 40">
                  <rect x="0" y="0" width="4" height="40" fill="#fff" />
                  <rect x="8" y="0" width="2" height="40" fill="#fff" />
                  <rect x="14" y="0" width="6" height="40" fill="#fff" />
                  <rect x="24" y="0" width="2" height="40" fill="#fff" />
                  <rect x="30" y="0" width="8" height="40" fill="#fff" />
                  <rect x="42" y="0" width="4" height="40" fill="#fff" />
                  <rect x="50" y="0" width="10" height="40" fill="#fff" />
                  <rect x="64" y="0" width="2" height="40" fill="#fff" />
                  <rect x="70" y="0" width="6" height="40" fill="#fff" />
                  <rect x="80" y="0" width="2" height="40" fill="#fff" />
                  <rect x="86" y="0" width="8" height="40" fill="#fff" />
                  <rect x="98" y="0" width="2" height="40" fill="#fff" />
                  <rect x="104" y="0" width="4" height="40" fill="#fff" />
                  <rect x="112" y="0" width="8" height="40" fill="#fff" />
                  <rect x="124" y="0" width="4" height="40" fill="#fff" />
                  <rect x="132" y="0" width="6" height="40" fill="#fff" />
                  <rect x="142" y="0" width="2" height="40" fill="#fff" />
                  <rect x="148" y="0" width="10" height="40" fill="#fff" />
                  <rect x="162" y="0" width="2" height="40" fill="#fff" />
                  <rect x="168" y="0" width="8" height="40" fill="#fff" />
                  <rect x="180" y="0" width="4" height="40" fill="#fff" />
                  <rect x="188" y="0" width="2" height="40" fill="#fff" />
                  <rect x="194" y="0" width="6" height="40" fill="#fff" />
                </svg>
                <div className="pass-footer-text">SCAN FOR ENTRY</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipPortal;
