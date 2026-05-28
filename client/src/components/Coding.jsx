import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CertificationCard from "./CertificationCard";
import CollaborationHub from "./CollaborationHub";
import "./coding.css";
import codingIllustration from "../assets/coding_illustration.png";

const API_BASE = import.meta.env.VITE_API_URL || "https://s70-yashash-capstone-masteryzone-2.onrender.com";
import keyboardProd from "../assets/keyboard_prod.png";
import mouseProd from "../assets/mouse_prod.png";
import monitorProd from "../assets/monitor_prod.png";
import mugProd from "../assets/mug_prod.png";
import glassesProd from "../assets/glasses_prod.png";
import headphonesProd from "../assets/headphones_prod.png";
import wristrestProd from "../assets/wristrest_prod.png";
import hoodieProd from "../assets/hoodie_prod.png";

/* ══════════════════════════════════════════════════════════════
   GOD BANNER — Cosmic Multi-Layer Animated Canvas Component
   Deep space nebula + neon code streams + pulsing orbs
   ══════════════════════════════════════════════════════════════ */
const GodBanner = () => {
  const godCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = godCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let frame = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth || 780;
      canvas.height = 390;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Layer 1: Stars ──
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.2,
      speed: Math.random() * 0.0003 + 0.0001,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      color: Math.random() > 0.75
        ? `hsl(${280 + Math.random() * 60},80%,80%)`   // purple-pink
        : `hsl(${200 + Math.random() * 40},60%,90%)`   // cool white-blue
    }));

    // ── Layer 2: Nebula blobs (static positions, animate opacity) ──
    const nebulas = [
      { cx: 0.18, cy: 0.40, rx: 0.22, ry: 0.35, hue: 280, phase: 0 },
      { cx: 0.55, cy: 0.55, rx: 0.30, ry: 0.28, hue: 320, phase: 1.2 },
      { cx: 0.82, cy: 0.30, rx: 0.20, ry: 0.32, hue: 260, phase: 2.4 },
      { cx: 0.40, cy: 0.75, rx: 0.18, ry: 0.20, hue: 300, phase: 3.6 },
    ];

    // ── Layer 3: Neon code streams ──
    const codeSnippets = [
      "const fn = () => {};",
      "for(let i=0;i<N;i++)",
      "SELECT * FROM users",
      "import React from 'react'",
      "def solve(n, k):",
      "#include <iostream>",
      "git commit -m 'fix'",
      "npm run build",
      "docker compose up",
      "console.log('Hello')",
    ];
    const streams = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random(),
      y: Math.random() * 0.8 + 0.1,
      text: codeSnippets[i % codeSnippets.length],
      speed: Math.random() * 0.0006 + 0.0002,
      alpha: Math.random() * 0.35 + 0.1,
      size: Math.random() * 3 + 9,
      dir: Math.random() > 0.5 ? 1 : -1,
    }));

    // ── Layer 4: Glowing orbs ──
    const orbs = Array.from({ length: 8 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 50 + 25,
      hue: 270 + Math.random() * 80,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.003,
      driftX: (Math.random() - 0.5) * 0.0004,
      driftY: (Math.random() - 0.5) * 0.0004,
    }));

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      frame++;

      // ── Translucent cosmic overlay on top of the photo background ──
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "rgba(3,0,16,0.55)");
      bg.addColorStop(0.4, "rgba(10,2,32,0.50)");
      bg.addColorStop(0.7, "rgba(6,1,26,0.52)");
      bg.addColorStop(1, "rgba(1,0,8,0.55)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── Nebula clouds ──
      nebulas.forEach((n) => {
        const pulse = Math.sin(frame * 0.008 + n.phase) * 0.12 + 0.88;
        const grd = ctx.createRadialGradient(
          n.cx * W, n.cy * H, 0,
          n.cx * W, n.cy * H, Math.max(n.rx * W, n.ry * H)
        );
        grd.addColorStop(0, `hsla(${n.hue},75%,55%,${0.13 * pulse})`);
        grd.addColorStop(0.45, `hsla(${n.hue + 20},65%,45%,${0.07 * pulse})`);
        grd.addColorStop(1, `hsla(${n.hue},50%,30%,0)`);

        ctx.save();
        ctx.scale(1, n.ry / n.rx);
        ctx.beginPath();
        ctx.arc(n.cx * W, (n.cy * H) / (n.ry / n.rx), n.rx * W, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.restore();
      });

      // ── Orbs ──
      orbs.forEach((orb) => {
        orb.x += orb.driftX;
        orb.y += orb.driftY;
        if (orb.x < 0 || orb.x > 1) orb.driftX *= -1;
        if (orb.y < 0 || orb.y > 1) orb.driftY *= -1;

        const pulse = Math.sin(frame * orb.speed + orb.phase) * 0.3 + 0.7;
        const grd = ctx.createRadialGradient(
          orb.x * W, orb.y * H, 0,
          orb.x * W, orb.y * H, orb.r * pulse
        );
        grd.addColorStop(0, `hsla(${orb.hue},90%,70%,0.22)`);
        grd.addColorStop(0.5, `hsla(${orb.hue},80%,55%,0.09)`);
        grd.addColorStop(1, `hsla(${orb.hue},70%,40%,0)`);

        ctx.beginPath();
        ctx.arc(orb.x * W, orb.y * H, orb.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      // ── Stars ──
      stars.forEach((s) => {
        s.twinkle += s.twinkleSpeed;
        s.x += s.speed;
        if (s.x > 1) s.x = 0;
        const alpha = Math.abs(Math.sin(s.twinkle)) * 0.75 + 0.25;
        const grd = ctx.createRadialGradient(s.x * W, s.y * H, 0, s.x * W, s.y * H, s.r * 2.5);
        grd.addColorStop(0, s.color.replace(")", `,${alpha})`).replace("hsl", "hsla"));
        grd.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      // ── Code Streams ──
      ctx.font = `bold 11px 'Courier New', monospace`;
      streams.forEach((s) => {
        s.x += s.speed * s.dir;
        if (s.x > 1.2) s.x = -0.2;
        if (s.x < -0.2) s.x = 1.2;

        const flicker = Math.sin(frame * 0.04 + s.x * 10) * 0.15 + 0.85;
        ctx.globalAlpha = s.alpha * flicker;
        ctx.fillStyle = `hsl(${300 + Math.sin(frame * 0.02 + s.x) * 40},80%,70%)`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00A859";
        ctx.fillText(s.text, s.x * W, s.y * H);
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;

      // ── Horizontal neon scan line ──
      const scanY = ((frame * 0.8) % (H + 20)) - 10;
      const scanGrd = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
      scanGrd.addColorStop(0, "rgba(0, 168, 89,0)");
      scanGrd.addColorStop(0.5, "rgba(0, 168, 89,0.18)");
      scanGrd.addColorStop(1, "rgba(0, 168, 89,0)");
      ctx.fillStyle = scanGrd;
      ctx.fillRect(0, scanY - 2, W, 4);

      // ── Corner hex grid deco (top-right) ──
      ctx.strokeStyle = "rgba(168,85,200,0.12)";
      ctx.lineWidth = 1;
      const hexSize = 28;
      for (let hx = W - 180; hx < W + 10; hx += hexSize * 1.5) {
        for (let hy = -10; hy < 120; hy += hexSize * Math.sqrt(3)) {
          ctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const ang = (Math.PI / 3) * a;
            const px = hx + hexSize * Math.cos(ang);
            const py = hy + hexSize * Math.sin(ang);
            a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className="god-banner-wrapper"
      style={{
        backgroundImage: `url('https://www.shutterstock.com/image-photo/ultrarealistic-closeup-hands-typing-on-600nw-2682243519.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center 40%",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Dark photo tint layer — sits between photo bg and canvas */}
      <div className="god-banner-photo-tint" />
      <canvas ref={godCanvasRef} className="god-banner-canvas" />

      {/* Glassmorphic overlay text */}
      <div className="god-banner-overlay">
        {/* Left: Main tagline block */}
        <div className="god-banner-left">
          <div className="god-banner-badge">⚡ CODING ZONE</div>
          <h2 className="god-banner-heading">
            Coding is essential<br />
            <span className="god-banner-highlight">in today's digital world</span>
          </h2>
          <p className="god-banner-sub">
            Enabling automation, problem-solving, and innovation across every industry.
          </p>
          <div className="god-banner-tags">
            <span className="god-tag">React</span>
            <span className="god-tag">Python</span>
            <span className="god-tag">SQL</span>
            <span className="god-tag">Node.js</span>
            <span className="god-tag">Git</span>
          </div>
        </div>

        {/* Right: Live stats cards */}
        <div className="god-banner-right">
          <div className="god-stat-card">
            <span className="god-stat-num">8+</span>
            <span className="god-stat-label">Languages</span>
          </div>
          <div className="god-stat-card">
            <span className="god-stat-num">4</span>
            <span className="god-stat-label">Certifications</span>
          </div>
          <div className="god-stat-card">
            <span className="god-stat-num">10</span>
            <span className="god-stat-label">Expert Advisors</span>
          </div>
          <div className="god-stat-card">
            <span className="god-stat-num">∞</span>
            <span className="god-stat-label">Possibilities</span>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="god-banner-bottom-fade" />
    </div>
  );
};


const Coding = () => {
  const navigate = useNavigate();
  const mainCanvasRef = useRef(null);
  const modalCanvasRef = useRef(null);

  // Core Application Tabs State
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "certification", "resources", "about", "advisor", "help", "cart", "members"
  
  // Sidebar Languages State
  const [activeCategory, setActiveCategory] = useState("JAVASCRIPT");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modal State for Video Tutorial
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSelectedLanguage, setModalSelectedLanguage] = useState("JAVASCRIPT");
  const [showVideo, setShowVideo] = useState(false);
  const [useYoutube, setUseYoutube] = useState(true); // Default to true to play actual videos
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // E-Commerce Central Cart State
  const [cart, setCart] = useState([]);
  
  // Checkout & Ordering State
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    address: "",
    zip: "",
    card: "",
    expiry: "",
    cvv: ""
  });
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Certifications Progress State
  const [enrolledCerts, setEnrolledCerts] = useState({}); // Stores backend cert data
  const [fetchingCerts, setFetchingCerts] = useState(false);

  const fetchCertifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/certifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const certMap = {};
        data.forEach(c => {
          if (c.zone === 'CODING') {
            certMap[c.certId] = c;
          }
        });
        setEnrolledCerts(certMap);
      }
    } catch (err) {
      console.error("Failed to fetch certifications", err);
    }
  };

  useEffect(() => {
    if (activeTab === "certification") {
      fetchCertifications();
    }
  }, [activeTab]);
  const [bookings, setBookings] = useState([]);
  const [bookingAdvisor, setBookingAdvisor] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Help page Support ticket state
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    category: "Languages",
    subject: "",
    message: ""
  });
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [activeFaqId, setActiveFaqId] = useState(null);

  // Regex & Complexity Widgets State
  const [regexInput, setRegexInput] = useState({ regex: "", text: "" });
  const [regexResult, setRegexResult] = useState(null);
  const [complexityInput, setComplexityInput] = useState({ N: "", loops: "1" });
  const [complexityResult, setComplexityResult] = useState(null);

  // Gym/Team Membership Portal States
  const [membershipForm, setMembershipForm] = useState({
    primaryName: "",
    email: "",
    tier: "gold", // "silver", "gold", "platinum"
    cycle: "monthly", // "monthly", "annual"
    accentColor: "#00A859", // Neon Pink, Cyan (#00f0ff), Gold (#ffd700), Lavender (#b78bb1)
    avatarType: "athlete" // "athlete" (Elite Coder), "beast" (Cyber Beast), "ninja" (Git Ninja), "guru" (Code Guru)
  });
  const [rosterList, setRosterList] = useState([]); // Additional team developers
  const [newRosterMember, setNewRosterMember] = useState({
    name: "",
    age: "",
    relationship: "Frontend", // Frontend, Backend, Devops
    goal: "Learn React" // Goal
  });
  const [membershipSuccess, setMembershipSuccess] = useState(false);
  const [membershipPassId, setMembershipPassId] = useState("");
  const [isMembershipProcessing, setIsMembershipProcessing] = useState(false);

  // Live Stats simulator state (About Page)
  const [stats, setStats] = useState({
    commitsPushed: 1248204,
    projectsDeployed: 38421,
    linesWritten: 4921800.5
  });
  const [statsPulse, setStatsPulse] = useState(false);

  // Static Data
  const languages = ["HTML", "CSS", "JAVASCRIPT", "SQL", "PYTHON", "JAVA", "C++", "REACT"];

  const websiteMap = {
    HTML: "https://www.w3schools.com/html/",
    CSS: "https://www.w3schools.com/css/",
    JAVASCRIPT: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    SQL: "https://www.w3schools.com/sql/",
    PYTHON: "https://www.python.org/doc/",
    JAVA: "https://docs.oracle.com/en/java/",
    "C++": "https://en.cppreference.com/w/",
    REACT: "https://react.dev/"
  };

  const youtubeVideoMap = {
    HTML: "kUMe1FH4WHY",       // Mosh HTML Crash Course
    CSS: "1Rs2ND1ryYc",        // Mosh CSS Crash Course
    JAVASCRIPT: "W6NZfCO5SIk", // Mosh JS Crash Course
    SQL: "HXV3zeQKqGY",        // Mosh SQL Crash Course
    PYTHON: "_uQrJ0TkZlc",     // Mosh Python tutorial
    JAVA: "eIrMblyDKVw",       // Mosh Java tutorial
    "C++": "vLnPwxZdW4Y",      // FreeCodeCamp C++ course
    REACT: "Ke90Tje7VS0"       // Mosh React 18 Course
  };

  // E-Commerce Premium Products Database (Developers/Coding Gear)
  const products = [
    { id: "prod-1", name: "Mastery RGB Mechanical Keyboard", price: 129.99, rating: 5, category: "Hardware", desc: "Hot-swappable tactile linear switches with premium glowing cyber-purple backlit keycaps.", image: keyboardProd },
    { id: "prod-2", name: "Alpha Comfort Vertical Mouse", price: 49.99, rating: 5, category: "Hardware", desc: "Ergonomic vertical shape engineered to reduce forearm wrist tension during intense coding sessions.", image: mouseProd },
    { id: "prod-3", name: "Curved 34-Inch Coding Monitor", price: 449.99, rating: 5, category: "Hardware", desc: "Ultra-wide QHD panoramic 144Hz monitor for managing multiple split-screen editor panes cleanly.", image: monitorProd },
    { id: "prod-4", name: "Insulated Smart Temp Coffee Mug", price: 34.99, rating: 4, category: "Accessories", desc: "Temperature-controlled leakproof smart cup that keeps developer drinks hot for up to 8 hours.", image: mugProd },
    { id: "prod-5", name: "Premium Blue-Light Blocking Glasses", price: 19.99, rating: 4, category: "Apparel", desc: "Antiglare lenses designed to shield developer eyes from blue screens and decrease eye strain.", image: glassesProd },
    { id: "prod-6", name: "Active Noise-Canceling Headphones", price: 179.99, rating: 5, category: "Hardware", desc: "Over-ear noise isolation headphones to block surrounding ambient noise and lock in focus.", image: headphonesProd },
    { id: "prod-7", name: "Mastery Memory-Foam Wrist Rest", price: 14.99, rating: 4, category: "Accessories", desc: "Premium memory foam keyboard padding to support wrist bones during rapid coding streaks.", image: wristrestProd },
    { id: "prod-8", name: "Mastery Zone Code Hoodie (Purple)", price: 39.99, rating: 5, category: "Apparel", desc: "Ultra-soft cotton programming hoodie styled with custom neon compiler print logos.", image: hoodieProd }
  ];

  const advisors = [
    { id: "adv-1", name: "Linus Torvalds", specialty: "OS Kernels & Git Systems", rating: 4.99, reviews: 9410, status: "Online", bio: "Creator of Linux and Git. Consult on low-level memory allocation, core architecture, and decentralization systems.", color: "linear-gradient(135deg, #a18cd1, #fbc2eb)", image: "https://ui-avatars.com/api/?name=Linus+Torvalds&background=a18cd1&color=fff&size=200" },
    { id: "adv-2", name: "Dan Abramov", specialty: "React Core & State Engines", rating: 4.97, reviews: 4980, status: "Online", bio: "Co-creator of Redux and React core alumni. Expert in virtual DOM reconciliations, custom hooks, and concurrent render loops.", color: "linear-gradient(135deg, #ff9a9e, #fecfef)", image: "https://ui-avatars.com/api/?name=Dan+Abramov&background=ff9a9e&color=fff&size=200" },
    { id: "adv-3", name: "Brendan Eich", specialty: "JavaScript Engines & Browsers", rating: 4.96, reviews: 3840, status: "Online", bio: "Creator of JavaScript and co-founder of Mozilla. Consult on compilation strategies, V8 optimization, and WebAssembly.", color: "linear-gradient(135deg, #f6d365, #fda085)", image: "https://ui-avatars.com/api/?name=Brendan+Eich&background=f6d365&color=fff&size=200" },
    { id: "adv-4", name: "Guido van Rossum", specialty: "Python Algorithms & Clean Code", rating: 4.92, reviews: 3150, status: "In Session", bio: "Creator of Python. Expert in scripting automation, language design paradigms, list comprehensions, and PEP-8 clean code.", color: "linear-gradient(135deg, #84fab0, #8fd3f4)", image: "https://ui-avatars.com/api/?name=Guido+van+Rossum&background=84fab0&color=000&size=200" },
    { id: "adv-5", name: "Bjarne Stroustrup", specialty: "C++ Compilation & Memory management", rating: 4.95, reviews: 2420, status: "Busy", bio: "Creator of C++. Specialized in manual pointer handling, dynamic memory allocations, structures, and low-latency threading.", color: "linear-gradient(135deg, #a1c4fd, #c2e9fb)", image: "https://ui-avatars.com/api/?name=Bjarne+Stroustrup&background=a1c4fd&color=000&size=200" },
    { id: "adv-6", name: "Lex Fridman", specialty: "Artificial Intelligence & Neural Networks", rating: 4.91, reviews: 6830, status: "Offline", bio: "MIT AI researcher. Consult on PyTorch modeling, deep reinforcement learning, neural node weights, and autonomous systems.", color: "linear-gradient(135deg, #cfd9df, #e2ebf0)", image: "https://ui-avatars.com/api/?name=Lex+Fridman&background=cfd9df&color=000&size=200" },
    { id: "adv-7", name: "Sir Tim Berners-Lee", specialty: "HTTP Protocols & Web Architectures", rating: 4.99, reviews: 1840, status: "Online", bio: "Inventor of the World Wide Web. Specialized in semantic web data models, protocol handshakes, and global decentralized networks.", color: "linear-gradient(135deg, #fbc2eb, #a6c1ee)", image: "https://ui-avatars.com/api/?name=Tim+Berners+Lee&background=fbc2eb&color=000&size=200" },
    { id: "adv-8", name: "James Gosling", specialty: "Java JVM & Multithreading", rating: 4.88, reviews: 2180, status: "Online", bio: "Creator of Java. Expert in JVM byte-code compilations, garbage collectors, cross-platform stability, and robust OOP abstractions.", color: "linear-gradient(135deg, #fdcbf1, #e6dee9)", image: "https://ui-avatars.com/api/?name=James+Gosling&background=fdcbf1&color=000&size=200" },
    { id: "adv-9", name: "Dr. Andrew Ng", specialty: "Machine Learning & Models Training", rating: 4.98, reviews: 5540, status: "In Session", bio: "Google Brain co-founder. Specialized in custom gradient descent algorithms, neural layers tuning, and commercial scale AI models.", color: "linear-gradient(135deg, #a18cd1, #fbc2eb)", image: "https://ui-avatars.com/api/?name=Andrew+Ng&background=a18cd1&color=fff&size=200" },
    { id: "adv-10", name: "Dr. Grace Hopper (Legacy Profile)", specialty: "Compilers & Flow-Matic Logic", rating: 4.99, reviews: 8840, status: "Online", bio: "Compiler design pioneer. Specialized in translating structural syntax trees, static analysis, machine codes, and early bug tracking.", color: "linear-gradient(135deg, #fbc2eb, #a6c1ee)", image: "https://ui-avatars.com/api/?name=Grace+Hopper&background=fbc2eb&color=000&size=200" }
  ];

  const certifications = [
    { id: "cert-1", name: "Full-Stack Developer (FSD)", body: "Mastery Zone Academy / W3C aligned", price: 199.99, modules: 5, difficulty: "Intermediate", desc: "Master full stack paradigms: front-end styling structures, interactive Javascript layers, SQL databases, and API gateways.", icon: "fsd", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80" },
    { id: "cert-2", name: "Cloud Architect Specialist (CAS)", body: "Elite Cloud Solutions Board", price: 299.99, modules: 6, difficulty: "Advanced", desc: "Design high-availability cloud setups. Highlight serverless operations, database load scaling, and secure network layers.", icon: "cas", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80" },
    { id: "cert-3", name: "AI & Machine Learning Engineer (AIML)", body: "Mastery Advanced AI Division", price: 249.99, modules: 5, difficulty: "Advanced", desc: "Build predictive algorithmic weights. Master linear regression gradients, deep neural layers, and custom CNN classification.", icon: "aiml", image: "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=600&q=80" },
    { id: "cert-4", name: "Cybersecurity Professional (CSP)", body: "Mastery Defensive Sec Board", price: 149.99, modules: 4, difficulty: "Beginner-Intermediate", desc: "Identify architectural vulnerabilities, remediate injection injection risks, analyze port packages, and build solid cyber defenses.", icon: "csp", image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80" }
  ];

  const faqData = [
    { id: "faq-1", category: "Languages & Core", question: "What is the difference between closures and lexical scope in JavaScript?", answer: "Lexical scope is the physical environment where a function is declared, which defines what variables are accessible. A closure is the combination of a function and its lexical environment, allowing it to remember and access variables from its outer scope even after the outer function has executed." },
    { id: "faq-2", category: "Languages & Core", question: "How do I safely optimize database query index execution in SQL?", answer: "Always target columns frequently checked in WHERE clauses or JOIN keys for index builds. Avoid over-indexing tables with heavy insert operations, and audit slow execution logs using the EXPLAIN ANALYZE protocol to isolate bottlenecks." },
    { id: "faq-3", category: "Hardware & Shop", question: "Why do custom mechanical keycaps tactile switches benefit developers?", answer: "Custom switches offer physical resistance feedback directly upon key registration, promoting precise touch typing, reducing finger fatigue over long code logs, and preventing accidental double-key presses." },
    { id: "faq-4", category: "Certifications", question: "Are these programming certifications recognized in local commercial tech firms?", answer: "Absolutely! Our courses align directly with top industry certifications (AWS, AWS Cloud Practitioner, CompTIA Security+, and JavaScript Coder frameworks). Certified students receive a digital verification certificate ID upon completing the modules." },
    { id: "faq-5", category: "Advisor Bookings", question: "How do Advisor video consultations work on the platform?", answer: "Once you secure an appointment date/time slot on an advisor's booking form, a calendar slot is reserved. You receive an automated connection invite link to join a live video chat session with your coding guru." }
  ];

  // 1. Matrix Digital Rain / Binary falling canvas animation
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;

    const handleResize = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Matrix characters: Binary mixed with basic operators and bracket tokens
    const chars = "01010101011010101ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/{}[]+=*%-";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize) + 1;
    const drops = Array(columns).fill(1);

    const draw = () => {
      // Soft black overlay to create glowing trails
      ctx.fillStyle = "rgba(10, 2, 13, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(208, 119, 166, 0.3)"; // Glowing pink-purple digital matrix rain
      ctx.font = `${fontSize}px 'Courier New', Courier, monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 2. Modal EKG Canvas Target Zone Animation
  useEffect(() => {
    if (!isModalOpen) return;
    
    const timer = setTimeout(() => {
      const canvas = modalCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      let animationId;

      const handleResize = () => {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
      };
      handleResize();
      window.addEventListener("resize", handleResize);

      let pulseOffset = 0;
      const rings = [];
      const ringCount = 3;
      for (let i = 0; i < ringCount; i++) {
        rings.push({
          radius: i * 40 + 10,
          opacity: 1 - i * 0.3,
          speed: 1.2
        });
      }

      const draw = () => {
        ctx.fillStyle = "rgba(10, 1, 12, 0.18)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(209, 158, 207, 0.035)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.strokeStyle = "rgba(208, 119, 166, 0.38)";
        ctx.lineWidth = 3.2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00A859";

        for (let x = 0; x < canvas.width; x += 3) {
          const cycle = (x + pulseOffset) % 280;
          let yOffset = 0;
          if (cycle > 80 && cycle < 98) {
            yOffset = Math.sin((cycle - 80) * Math.PI / 18) * -60;
          } else if (cycle >= 98 && cycle < 112) {
            yOffset = Math.sin((cycle - 98) * Math.PI / 14) * 30;
          } else if (cycle >= 112 && cycle < 122) {
            yOffset = Math.sin((cycle - 112) * Math.PI / 10) * -10;
          }

          const y = canvas.height * 0.45 + yOffset;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        const centerX = canvas.width * 0.85;
        const centerY = canvas.height * 0.22;
        
        rings.forEach((r) => {
          r.radius += r.speed;
          r.opacity = 1 - (r.radius / 130);

          if (r.radius > 130) {
            r.radius = 10;
            r.opacity = 1;
          }

          ctx.strokeStyle = "rgba(208, 119, 166, " + r.opacity + ")";
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 6;
          ctx.shadowColor = "#00A859";
          ctx.beginPath();
          ctx.arc(centerX, centerY, r.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        pulseOffset += 3;
        animationId = requestAnimationFrame(draw);
      };

      draw();

      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener("resize", handleResize);
      };
    }, 50);

    return () => clearTimeout(timer);
  }, [isModalOpen]);

  // Live Stats simulator (About Page)
  useEffect(() => {
    if (activeTab !== "about") return;
    const interval = setInterval(() => {
      setStatsPulse(true);
      setStats(prev => ({
        commitsPushed: prev.commitsPushed + (Math.random() > 0.6 ? 1 : 0),
        projectsDeployed: prev.projectsDeployed + Math.floor(Math.random() * 2),
        linesWritten: parseFloat((prev.linesWritten + Math.random() * 12.5).toFixed(1))
      }));
      setTimeout(() => setStatsPulse(false), 500);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleBack = () => {
    setShowBackConfirm(true);
  };

  // Navigates directly back to the Coding landing home view (Dashboard)
  const handleHomeClick = () => {
    setActiveTab("dashboard");
    setSearchQuery("");
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setActiveTab("dashboard"); // Always snap back to exercise dashboard
    
    const url = websiteMap[category];
    if (url) {
      window.open(url, "_blank");
    }
  };

  const openLearnMoreModal = () => {
    setIsModalOpen(true);
    setModalSelectedLanguage(activeCategory);
    setShowVideo(false);
    setUseYoutube(true);
  };

  const handleModalLanguageSelect = (category) => {
    setModalSelectedLanguage(category);
    setShowVideo(false);
    setUseYoutube(true);
  };

  const handlePlayVideo = () => {
    setShowVideo(true);
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const exists = prevCart.find((item) => item.id === product.id);
      if (exists) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart!`, {
      position: "top-right",
      autoClose: 2000,
      theme: "dark",
    });
  };

  const updateCartQuantity = (productId, change) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + change;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const getCartTotals = () => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal > 150 ? 0 : subtotal > 0 ? 14.99 : 0; // Free shipping above $150
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shipping,
      total: parseFloat((subtotal + tax + shipping).toFixed(2))
    };
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsCheckoutProcessing(true);
    
    // Simulate MasteryPay Secure Checkout payment gateway loading
    setTimeout(() => {
      setIsCheckoutProcessing(false);
      setCheckoutSuccess(true);
      setOrderId("MZ-CD-" + Math.floor(100000 + Math.random() * 900000));
      setCart([]); // Reset Cart
    }, 2000);
  };

  // Certifications Progress Handlers
  const handleEnrollCert = (certId) => {
    setEnrolledCerts(prev => ({
      ...prev,
      [certId]: prev[certId] !== undefined ? prev[certId] : 0
    }));
  };

  const handleStudyModule = (certId) => {
    setEnrolledCerts(prev => {
      const currentVal = prev[certId] || 0;
      const nextVal = Math.min(currentVal + 20, 100);
      return {
        ...prev,
        [certId]: nextVal
      };
    });
  };

  // Advisor Scheduling Handlers
  const initiateBooking = (advisor) => {
    setBookingAdvisor(advisor);
    setBookingDate("");
    setBookingTime("09:00");
    setBookingSuccess(false);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!bookingDate) {
      alert("Please choose a valid scheduling date!");
      return;
    }
    const newAppointment = {
      id: "MZ-AD-" + Math.floor(1000 + Math.random() * 9000),
      advisorName: bookingAdvisor.name,
      specialty: bookingAdvisor.specialty,
      date: bookingDate,
      time: bookingTime
    };
    setBookings(prev => [newAppointment, ...prev]);
    setBookingSuccess(true);
  };

  // Support Ticket Form Submit
  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!ticketForm.name || !ticketForm.email || !ticketForm.subject || !ticketForm.message) {
      alert("Please fill all core fields!");
      return;
    }
    setIsSubmittingTicket(true);
    setTimeout(() => {
      setIsSubmittingTicket(false);
      setTicketSuccess(true);
      setTicketNumber("TKT-DEV-" + Math.floor(50000 + Math.random() * 50000));
      setTicketForm({ name: "", email: "", category: "Languages", subject: "", message: "" });
    }, 1500);
  };

  // Widget Tools logic
  const testRegex = (e) => {
    e.preventDefault();
    if (!regexInput.regex || !regexInput.text) return;
    try {
      const re = new RegExp(regexInput.regex, "g");
      const match = regexInput.text.match(re);
      if (match) {
        setRegexResult(`Found ${match.length} match(es): "${match.join('", "')}"`);
      } else {
        setRegexResult("No matches found!");
      }
    } catch (err) {
      setRegexResult(`Invalid RegExp syntax: ${err.message}`);
    }
  };

  const evaluateComplexity = (e) => {
    e.preventDefault();
    const n = parseInt(complexityInput.N);
    const l = parseInt(complexityInput.loops);
    if (isNaN(n) || isNaN(l)) return;

    let complexity = "O(1) Constant Time";
    let totalOps = 1;

    if (l === 1) {
      complexity = "O(N) Linear Time";
      totalOps = n;
    } else if (l === 2) {
      complexity = "O(N²) Quadratic Time";
      totalOps = n * n;
    } else if (l === 3) {
      complexity = "O(N³) Cubic Time";
      totalOps = n * n * n;
    } else if (l === 0) {
      complexity = "O(log N) Logarithmic Time";
      totalOps = Math.round(Math.log2(n));
    }

    setComplexityResult({ complexity, totalOps });
  };

  // Live simulation adder (About Page)
  const addSimulatedCommit = () => {
    setStatsPulse(true);
    setStats(prev => ({
      commitsPushed: prev.commitsPushed + 1,
      projectsDeployed: prev.projectsDeployed + (Math.random() > 0.75 ? 1 : 0),
      linesWritten: parseFloat((prev.linesWritten + 15.5).toFixed(1))
    }));
    setTimeout(() => setStatsPulse(false), 500);
  };

  // Global Suggestions Index Generator
  const getSuggestions = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    // 1. Exercises / Languages
    languages.forEach(lang => {
      if (lang.toLowerCase().includes(query)) {
        results.push({ type: "exercise", name: lang, label: `💻 Coding Lang: ${lang}`, refId: lang });
      }
    });

    // 2. Products
    products.forEach(p => {
      if (p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query)) {
        results.push({ type: "product", name: p.name, label: `🛒 Store: ${p.name}`, refId: p.id });
      }
    });

    // 3. Advisors
    advisors.forEach(a => {
      if (a.name.toLowerCase().includes(query) || a.specialty.toLowerCase().includes(query)) {
        results.push({ type: "advisor", name: a.name, label: `🧠 Expert: ${a.name} (${a.specialty})`, refId: a.id });
      }
    });

    // 4. Certifications
    certifications.forEach(c => {
      if (c.name.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query)) {
        results.push({ type: "certification", name: c.name, label: `🛡️ Academy Cert: ${c.name}`, refId: c.id });
      }
    });

    // 5. Help FAQs & Widget Tools
    if ("regex tester match test string expression".includes(query)) {
      results.push({ type: "help-calc-bmi", name: "Regex Match Tester", label: `📊 Tool: Dynamic RegExp Match Tester`, refId: "regex-tester-box" });
    }
    if ("complexity execution evaluator big-o loops runtime".includes(query)) {
      results.push({ type: "help-calc-1rm", name: "Big-O Runtime Evaluator", label: `💪 Tool: Big-O Loop Complexity Evaluator`, refId: "complexity-eval-box" });
    }
    if ("membership add developers signups dev pass team roster".includes(query)) {
      results.push({ type: "membership", name: "Team Roster Portal", label: `🎫 Portal: Configure Team Developer Roster & Passes`, refId: "membership-pricing" });
    }
    faqData.forEach(f => {
      if (f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query)) {
        results.push({ type: "faq", name: f.question, label: `❓ FAQ: ${f.question}`, refId: f.id });
      }
    });

    return results.slice(0, 8); // Max 8 suggestions
  };

  const handleSuggestionClick = (item) => {
    setSearchQuery("");
    setShowSuggestions(false);

    if (item.type === "exercise") {
      setIsModalOpen(true);
      setModalSelectedLanguage(item.refId);
      setShowVideo(false);
      setUseYoutube(false);
    } else if (item.type === "membership") {
      setActiveTab("members");
    } else if (item.type === "product") {
      setActiveTab("resources");
      setTimeout(() => {
        const el = document.getElementById(item.refId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else if (item.type === "advisor") {
      setActiveTab("advisor");
      setTimeout(() => {
        const el = document.getElementById(item.refId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else if (item.type === "certification") {
      setActiveTab("certification");
      setTimeout(() => {
        const el = document.getElementById(item.refId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else if (item.type === "faq") {
      setActiveTab("help");
      setActiveFaqId(item.refId);
      setTimeout(() => {
        const el = document.getElementById(item.refId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else if (item.type === "help-calc-bmi") {
      setActiveTab("help");
      setTimeout(() => {
        const el = document.getElementById(item.refId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else if (item.type === "help-calc-1rm") {
      setActiveTab("help");
      setTimeout(() => {
        const el = document.getElementById(item.refId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  // Full real-time search grid compiler
  const getFullSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    // 1. Languages
    languages.forEach(lang => {
      if (lang.toLowerCase().includes(query)) {
        results.push({
          type: "exercise",
          category: "Language Tutorial",
          name: lang,
          subtitle: `Programming Language: ${lang}`,
          desc: `Complete development templates and code compiler demos for ${lang}. Click Play below to run the 100% firewall proof neon character loop guide.`,
          refId: lang
        });
      }
    });

    // 2. Products
    products.forEach(p => {
      if (p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query)) {
        results.push({
          type: "product",
          category: "Shop Hardware",
          name: p.name,
          subtitle: `${p.category} | Price: $${p.price}`,
          desc: p.desc,
          item: p,
          refId: p.id
        });
      }
    });

    // 3. Advisors
    advisors.forEach(a => {
      if (a.name.toLowerCase().includes(query) || a.specialty.toLowerCase().includes(query)) {
        results.push({
          type: "advisor",
          category: "Software Advisor",
          name: a.name,
          subtitle: a.specialty,
          desc: a.bio,
          item: a,
          refId: a.id
        });
      }
    });

    // 4. Certifications
    certifications.forEach(c => {
      if (c.name.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query)) {
        results.push({
          type: "certification",
          category: "Academy Degree",
          name: c.name,
          subtitle: `${c.body} | Price: $${c.price}`,
          desc: c.desc,
          item: c,
          refId: c.id
        });
      }
    });

    // 5. Team Membership
    if ("membership add member signup pricing gold silver platinum pass team roster".includes(query)) {
      results.push({
        type: "membership",
        category: "Membership Portal",
        name: "Mastery Zone Dev Membership & Roster Team",
        subtitle: "Registration & Custom Developer Passes",
        desc: "Compare Silver, Gold, and Platinum pricing tiers, configure monthly or annual cycle contract switchers, and customize dynamic passes.",
        refId: "membership-pricing"
      });
    }

    // 6. Widget tools
    if ("regex tester Match Test String expression".includes(query)) {
      results.push({
        type: "calculator-bmi",
        category: "Developer Tool",
        name: "RegEx Syntax Pattern Matcher",
        subtitle: "RegExp String Evaluator",
        desc: "Validate syntax patterns and extract groupings from strings locally.",
        refId: "regex-tester-box"
      });
    }
    if ("complexity Loops runtime Big-O compiler evaluator".includes(query)) {
      results.push({
        type: "calculator-1rm",
        category: "Developer Tool",
        name: "Execution Big-O Runtime Evaluator",
        subtitle: "Algorithm Performance Stat",
        desc: "Calculate theoretical time complexity tiers across N input scopes.",
        refId: "complexity-eval-box"
      });
    }

    // 7. FAQs
    faqData.forEach(f => {
      if (f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query)) {
        results.push({
          type: "faq",
          category: "FAQ Support",
          name: f.question,
          subtitle: `Help Desk FAQ: ${f.category}`,
          desc: f.answer,
          refId: f.id
        });
      }
    });

    return results;
  };

  const renderResultBadgeIcon = (type) => {
    switch (type) {
      case "exercise": return "💻";
      case "product": return "🛒";
      case "advisor": return "🧠";
      case "certification": return "🛡️";
      case "faq": return "❓";
      case "membership": return "🎫";
      default: return "📊";
    }
  };

  const routeToFeatureTab = (type, refId) => {
    if (type === "product") {
      setActiveTab("resources");
      setTimeout(() => document.getElementById(refId)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    } else if (type === "advisor") {
      setActiveTab("advisor");
      setTimeout(() => document.getElementById(refId)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    } else if (type === "certification") {
      setActiveTab("certification");
      setTimeout(() => document.getElementById(refId)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    } else if (type === "faq") {
      setActiveTab("help");
      setActiveFaqId(refId);
      setTimeout(() => document.getElementById(refId)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    } else if (type.startsWith("calculator")) {
      setActiveTab("help");
      setTimeout(() => document.getElementById(refId)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
    setSearchQuery("");
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Membership Billing
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

  const addRosterMember = (e) => {
    e.preventDefault();
    if (!newRosterMember.name || !newRosterMember.age) {
      alert("Please provide the new member's name and age!");
      return;
    }
    const member = {
      id: "MZ-MEM-" + Math.floor(1000 + Math.random() * 9000),
      name: newRosterMember.name,
      age: parseInt(newRosterMember.age),
      relationship: newRosterMember.relationship,
      goal: newRosterMember.goal
    };
    setRosterList(prev => [...prev, member]);
    setNewRosterMember({ name: "", age: "", relationship: "Frontend", goal: "Learn React" });
  };

  const removeRosterMember = (id) => {
    setRosterList(prev => prev.filter(m => m.id !== id));
  };

  const handleMembershipSubmit = (e) => {
    e.preventDefault();
    if (!membershipForm.primaryName || !membershipForm.email) {
      alert("Please enter primary developer name and email address!");
      return;
    }
    setIsMembershipProcessing(true);
    setTimeout(() => {
      setIsMembershipProcessing(false);
      setMembershipSuccess(true);
      setMembershipPassId("MZ-PASS-DEV-" + Math.floor(10000 + Math.random() * 90000));
    }, 2000);
  };

  // High-Clarity Offline-Immune Vector Programming Code Animators
  const renderCodingAnimation = (category) => {
    switch (category) {
      case "HTML":
        return (
          <svg className="workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(0, 168, 89, 0.15)" strokeWidth="4" />
            <g className="bicep-forearm-group">
              <text x="50%" y="45%" textAnchor="middle" fill="#00A859" fontSize="32" fontWeight="900" fontFamily="Courier New">&lt;HTML&gt;</text>
              <text x="50%" y="75%" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="Courier New">&lt;div&gt; Hello &lt;/div&gt;</text>
            </g>
            <line x1="40" y1="140" x2="160" y2="140" stroke="#844e7c" strokeWidth="6" strokeLinecap="round" />
            {/* Blinking Cursor */}
            <rect x="145" y="60" width="3" height="20" fill="#00A859" className="chest-barbell-group" />
          </svg>
        );
      case "CSS":
        return (
          <svg className="workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(0, 168, 89, 0.15)" strokeWidth="4" />
            {/* Visual Margin / Border / Padding expander */}
            <rect x="50" y="50" width="100" height="100" rx="10" fill="none" stroke="#844e7c" strokeWidth="3" />
            <g className="squat-body-group">
              <rect x="65" y="65" width="70" height="70" rx="6" fill="rgba(0, 168, 89, 0.15)" stroke="#00A859" strokeWidth="4" />
              <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="11" fontWeight="bold">BOX-MODEL</text>
            </g>
            <text x="50%" y="82%" textAnchor="middle" fill="#00A859" fontSize="11" fontWeight="800" fontFamily="Courier">border-radius: 50%</text>
          </svg>
        );
      case "JAVASCRIPT":
        return (
          <svg className="workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(0, 168, 89, 0.15)" strokeWidth="4" />
            {/* Rotating Gear 1 */}
            <g className="warmup-arms-group" transform="translate(100, 85)">
              <circle cx="0" cy="0" r="28" fill="none" stroke="#00A859" strokeWidth="6" strokeDasharray="10, 5" />
              <circle cx="0" cy="0" r="10" fill="#00A859" />
            </g>
            <text x="50%" y="78%" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="monospace">const fn = () =&gt; &#123;&#125;</text>
            <text x="50%" y="90%" textAnchor="middle" fill="#00A859" fontSize="12" fontWeight="700" fontFamily="monospace">async / await</text>
          </svg>
        );
      case "SQL":
        return (
          <svg className="workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(0, 168, 89, 0.15)" strokeWidth="4" />
            {/* Database cylinders */}
            <g className="shoulder-press-group">
              <ellipse cx="100" cy="50" rx="35" ry="12" fill="#844e7c" stroke="#ffffff" strokeWidth="2.5" />
              <path d="M65 50 v25 a35 12 0 0 0 70 0 v-25" fill="#00A859" stroke="#ffffff" strokeWidth="2.5" />
              <path d="M65 75 v25 a35 12 0 0 0 70 0 v-25" fill="#844e7c" stroke="#ffffff" strokeWidth="2.5" />
              <path d="M65 100 v25 a35 12 0 0 0 70 0 v-25" fill="#00A859" stroke="#ffffff" strokeWidth="2.5" />
            </g>
            <text x="50%" y="82%" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="950" fontFamily="monospace">SELECT * FROM users</text>
          </svg>
        );
      case "PYTHON":
        return (
          <svg className="workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(0, 168, 89, 0.15)" strokeWidth="4" />
            {/* Winding neon loop path representing snake/loop */}
            <g className="tricep-forearm-group">
              <path d="M 60,60 C 80,40 120,40 140,60 C 160,80 160,120 140,140 C 120,160 80,160 60,140 C 40,120 40,80 60,60 Z" fill="none" stroke="#00A859" strokeWidth="6" strokeLinecap="round" strokeDasharray="30, 15" />
            </g>
            <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="15" fontWeight="bold" fontFamily="monospace">def print_loop():</text>
            <text x="50%" y="64%" textAnchor="middle" dominantBaseline="middle" fill="#00A859" fontSize="12" fontWeight="bold" fontFamily="monospace">for i in range(N):</text>
          </svg>
        );
      case "JAVA":
        return (
          <svg className="workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(0, 168, 89, 0.15)" strokeWidth="4" />
            {/* Steaming Coffee Cup in Neon */}
            <path d="M60 90 h80 v40 a40 40 0 0 1 -80 0 Z" fill="#844e7c" stroke="#ffffff" strokeWidth="3" />
            <path d="M140 100 h12 a10 10 0 0 1 10 10 v0 a10 10 0 0 1 -10 10 h-12" fill="none" stroke="#ffffff" strokeWidth="3" />
            <line x1="50" y1="140" x2="150" y2="140" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
            {/* Rising Steam */}
            <g className="back-row-group">
              <path d="M 80,75 Q 85,60 80,45" fill="none" stroke="#00A859" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 100,75 Q 105,60 100,45" fill="none" stroke="#00A859" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 120,75 Q 125,60 120,45" fill="none" stroke="#00A859" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </svg>
        );
      case "C++":
        return (
          <svg className="workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(0, 168, 89, 0.15)" strokeWidth="4" />
            {/* Brackets compiling block */}
            <g className="chest-barbell-group">
              <text x="25%" y="50%" dominantBaseline="middle" fill="#00A859" fontSize="48" fontWeight="800" fontFamily="Courier">[</text>
              <rect x="70" y="60" width="60" height="60" rx="4" fill="rgba(0, 168, 89,0.15)" stroke="#ffffff" strokeWidth="2.5" />
              <text x="75%" y="50%" dominantBaseline="middle" fill="#00A859" fontSize="48" fontWeight="800" fontFamily="Courier">]</text>
            </g>
            <text x="50%" y="84%" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="950" fontFamily="monospace">#include &lt;iostream&gt;</text>
          </svg>
        );
      case "REACT":
        return (
          <svg className="workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(0, 168, 89, 0.15)" strokeWidth="4" />
            {/* Rotating atom orbits */}
            <g className="warmup-arms-group" transform="translate(100, 100)">
              <ellipse cx="0" cy="0" rx="72" ry="24" fill="none" stroke="#00A859" strokeWidth="3" transform="rotate(30)" />
              <ellipse cx="0" cy="0" rx="72" ry="24" fill="none" stroke="#00A859" strokeWidth="3" transform="rotate(90)" />
              <ellipse cx="0" cy="0" rx="72" ry="24" fill="none" stroke="#00A859" strokeWidth="3" transform="rotate(150)" />
              <circle cx="0" cy="0" r="10" fill="#ffffff" />
            </g>
          </svg>
        );
      default:
        return (
          <svg className="workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(0, 168, 89, 0.15)" strokeWidth="4" />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#00A859" fontSize="16" fontWeight="bold">ACTIVE CODE</text>
          </svg>
        );
    }
  };

  return (
    <div className="coding-container page-enter">
      {/* Header Banner */}
      <header className="fitness-header">
        {/* Logo Container - click returns to Coding Page Landing View */}
        <div className="fitness-logo-container" onClick={handleHomeClick} style={{ cursor: "pointer" }}>
          <div className="fitness-logo-text">
            CODING<span>ZONE</span>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="fitness-nav-bar">
          {/* Square Home Button */}
          <button className="fitness-home-btn" onClick={handleHomeClick} title="Home/Dashboard">
            <div className="fitness-home-icon-box">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#000000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </button>

          {/* Left links group */}
          <div className="fitness-nav-links-left">
            <span className={`fitness-nav-link ${activeTab === "certification" ? "active-nav" : ""}`} onClick={() => { setActiveTab("certification"); setSearchQuery(""); }}>Certification</span>
            <span className={`fitness-nav-link ${activeTab === "resources" ? "active-nav" : ""}`} onClick={() => { setActiveTab("resources"); setSearchQuery(""); }}>Resources</span>
            <span className={`fitness-nav-link ${activeTab === "about" ? "active-nav" : ""}`} onClick={() => { setActiveTab("about"); setSearchQuery(""); }}>About</span>
          </div>

          {/* Special Advisor lavender tab */}
          <div className={`fitness-advisor-tab ${activeTab === "advisor" ? "active-nav-advisor" : ""}`} onClick={() => { setActiveTab("advisor"); setSearchQuery(""); }}>
            Talk to an Advisor
          </div>

          {/* Right links group */}
          <div className="fitness-nav-links-right">
            <span className={`fitness-nav-link ${activeTab === "help" ? "active-nav" : ""}`} onClick={() => { setActiveTab("help"); setSearchQuery(""); }}>Help</span>
            <span className={`fitness-nav-link cart-link ${activeTab === "cart" ? "active-nav" : ""}`} onClick={() => { setActiveTab("cart"); setSearchQuery(""); }}>
              YOUR CART ({getCartCount()})
            </span>
            <span className={`fitness-nav-link add-members-link ${activeTab === "members" ? "active-nav" : ""}`} onClick={() => { setActiveTab("members"); setSearchQuery(""); }}>Add Members</span>
          </div>

          {/* Red Learn More button */}
          <button className="fitness-learn-more-btn" onClick={openLearnMoreModal}>
            Learn More <span>▶</span>
          </button>
        </nav>
      </header>

      {/* Main Layout */}
      <div className="fitness-main-layout">
        {/* Left Sidebar */}
        <aside className="fitness-sidebar">
          <div className="fitness-sidebar-title">Languages</div>
          
          <div className="fitness-exercise-list">
            {languages.map((category) => (
              <button
                key={category}
                className={`fitness-exercise-btn ${activeCategory === category && activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Capsule Back Button */}
          <div className="fitness-back-container">
            <button className="fitness-back-btn" onClick={handleBack}>
              <span>←</span> BACK
            </button>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="fitness-content-area">
          <canvas ref={mainCanvasRef} className="fitness-bg-video" />
          <div className="fitness-video-overlay" />

          {/* Content wrapper */}
          <div className="fitness-content-wrapper">
            
            {/* Global Search Bar */}
            <div className="fitness-search-container">
              <div className="fitness-search-bar">
                <span className="fitness-search-icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="fitness-search-input"
                  placeholder="Search code loops, setup gears, advisers, FAQs, certifications..."
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (val.trim().length > 0) {
                      setActiveTab("dashboard"); // Typing instantly pulls results directly on homepage!
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
              </div>

              {/* Suggestions dropdown overlay */}
              {showSuggestions && searchQuery.trim().length > 0 && (
                <div className="fitness-search-suggestions">
                  {getSuggestions().length > 0 ? (
                    getSuggestions().map((item, idx) => (
                      <div
                        key={idx}
                        className="fitness-suggestion-item"
                        onMouseDown={() => handleSuggestionClick(item)}
                      >
                        {item.label}
                      </div>
                    ))
                  ) : (
                    <div className="fitness-suggestion-no-results">
                      No matching assets found. Try "Keyboard", "FSD", "Torvalds" or "JavaScript".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CONDITIONAL TAB RENDERING */}

            {/* TAB 0: Main Dashboard */}
            {activeTab === "dashboard" && searchQuery.trim().length === 0 && (
              <>
                <div className="fitness-header-group">
                  <h1 className="fitness-main-heading">
                    Code. Collaborate. Create.
                  </h1>
                  <p className="fitness-sub-heading">
                    Master programming, contribute to projects, and stay ahead in the tech world.
                  </p>
                </div>

                {/* ═══ GOD BACKGROUND BANNER ═══ */}
                <GodBanner />
              </>
            )}

            {activeTab === "dashboard" && searchQuery.trim().length > 0 && (
              /* Dynamic Search Grid Panel */
              <div className="fitness-search-results-section">
                <div className="search-results-header">
                  <div className="search-results-info">
                    <h2>SEARCH RESULTS FOR: "{searchQuery.toUpperCase()}"</h2>
                    <p>We found {getFullSearchResults().length} active resources in the Coding Zone matching your keywords</p>
                  </div>
                  <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
                    Clear Search &times;
                  </button>
                </div>

                {getFullSearchResults().length > 0 ? (
                  <div className="search-results-grid">
                    {getFullSearchResults().map((result, idx) => (
                      <div key={idx} className="search-result-card">
                        <span className="result-badge">
                          {renderResultBadgeIcon(result.type)} {result.category}
                        </span>
                        
                        <div className="result-content">
                          <h3 className="result-title">{result.name}</h3>
                          <span className="result-subtitle">{result.subtitle}</span>
                          <p className="result-desc">{result.desc}</p>
                          
                          <div className="result-actions">
                            {result.type === "exercise" && (
                              <button className="cert-enroll-btn" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => { setIsModalOpen(true); setModalSelectedLanguage(result.refId); setShowVideo(false); setUseYoutube(false); }}>
                                Play Code Animation
                              </button>
                            )}
                            {result.type === "product" && (
                              <button className="product-add-btn" onClick={() => addToCart(result.item)}>
                                Add to Cart (${result.item.price})
                              </button>
                            )}
                            {result.type === "advisor" && (
                              <button className="advisor-book-btn" onClick={() => initiateBooking(result.item)}>
                                Book Advisory
                              </button>
                            )}
                            {result.type === "certification" && (
                              <button className="cert-enroll-btn" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => routeToFeatureTab(result.type, result.refId)}>
                                View Degree details
                              </button>
                            )}
                            {result.type === "membership" && (
                              <button className="cert-enroll-btn" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => { setActiveTab("members"); setSearchQuery(""); }}>
                                Configure Team Roster
                              </button>
                            )}
                            {result.type.startsWith("calculator") && (
                              <button className="cert-enroll-btn" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => routeToFeatureTab(result.type, result.refId)}>
                                Use Tool Widget
                              </button>
                            )}
                            {result.type === "faq" && (
                              <button className="cert-enroll-btn" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => routeToFeatureTab(result.type, result.refId)}>
                                View on Help Desk
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-cart-view">
                    <div className="empty-cart-icon">🔍</div>
                    <h3>No direct code references found</h3>
                    <p>Try searching for "Keyboard", "FSD", "Dan Abramov", "CSS", or "Regex" to see matching tools.</p>
                    <button className="back-store-btn" onClick={() => setSearchQuery("")}>
                      Return to Homepage
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: Certifications */}
            {activeTab === "certification" && (
              <div className="fitness-section-container">
                <div className="fitness-section-header">
                  <h1 className="fitness-section-heading" style={{ color: "#00A859" }}>PROFESSIONAL CERTIFICATIONS</h1>
                  <p className="fitness-section-subheading">Accelerate your career with elite academy-recognized training degrees</p>
                </div>

                <div className="cert-grid">
                  {certifications.map((cert) => {
                    const backendData = enrolledCerts[cert.id] || {};
                    const mergedData = { ...cert, ...backendData, id: cert.id };
                    
                    return (
                      <CertificationCard 
                        key={cert.id} 
                        certData={mergedData} 
                        zone="CODING" 
                        onUpdate={fetchCertifications} 
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Resources Store */}
            {activeTab === "resources" && (
              <div className="fitness-section-container">
                <div className="fitness-section-header">
                  <h1 className="fitness-section-heading">DEVELOPER GEAR STORE</h1>
                  <p className="fitness-section-subheading">Upgrade your workstation performance and ergonomics with premium programmer tools</p>
                </div>

                <div className="shop-grid">
                  {products.map((prod) => (
                    <div key={prod.id} id={prod.id} className="product-card">
                      <div className="product-image-container">
                        <img src={prod.image} alt={prod.name} className="product-image" />
                        <span className="product-category">{prod.category}</span>
                      </div>
                      <div className="product-info">
                        <h3 className="product-title">{prod.name}</h3>
                        <div className="product-rating">
                          {"⭐".repeat(prod.rating)}
                          <span className="product-rating-count">(4.9)</span>
                        </div>
                        <p className="product-desc">{prod.desc}</p>
                        <div className="product-bottom">
                          <span className="product-price">${prod.price}</span>
                          <button className="product-add-btn" onClick={() => addToCart(prod)}>
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: About */}
            {activeTab === "about" && (
              <div className="fitness-section-container">
                <div className="fitness-section-header">
                  <h1 className="fitness-section-heading">ENGINEERING VISION</h1>
                  <p className="fitness-section-subheading">Merging algorithmic scalability with optimized functional logic</p>
                </div>

                <div className="about-metrics-row">
                  <div className={`metric-box ${statsPulse ? "pulse" : ""}`}>
                    <span className="metric-val">{stats.commitsPushed.toLocaleString()}</span>
                    <span className="metric-lbl">COMMITS PUSHED</span>
                  </div>
                  <div className={`metric-box ${statsPulse ? "pulse" : ""}`}>
                    <span className="metric-val">{stats.projectsDeployed.toLocaleString()}</span>
                    <span className="metric-lbl">PROJECTS DEPLOYED</span>
                  </div>
                  <div className={`metric-box ${statsPulse ? "pulse" : ""}`}>
                    <span className="metric-val">{stats.linesWritten.toLocaleString()}L</span>
                    <span className="metric-lbl">LINES COMMITTED</span>
                  </div>
                </div>

                <div className="about-interactive-box">
                  <p className="about-intro-text">
                    At **Coding Zone**, we build architectures prepared for massive scale. We engineer solutions that combine low latency, responsive UX, and optimized database indices.
                  </p>
                  <button className="about-stimulate-btn" onClick={addSimulatedCommit}>
                    💻 Log Simulated Repo Commit (+1 Commit)
                  </button>
                </div>

                <div className="about-values-grid">
                  <div className="value-card">
                    <h4>🔬 Algorithmic Integrity</h4>
                    <p>Every function stack, sorting loop, and array mutation is structured to run at maximum performance scopes.</p>
                  </div>
                  <div className="value-card">
                    <h4>🦾 Memory Longevity</h4>
                    <p>We prioritize zero garbage collection spikes and lean stack allocation scopes above rushed features.</p>
                  </div>
                  <div className="value-card">
                    <h4>📈 Continuous Delivery</h4>
                    <p>Sustainable development requires seamless CI/CD. We implement systems that compile and scale automatically.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Talk to Advisors */}
            {activeTab === "advisor" && (
              <div className="fitness-section-container">
                <div className="fitness-section-header">
                  <h1 className="fitness-section-heading">WORLD CLASS CODING ADVISORS</h1>
                  <p className="fitness-section-subheading">Consult with core compiler builders, OS kernel architects, and AI researchers</p>
                </div>

                {bookings.length > 0 && (
                  <div className="active-bookings-console">
                    <h3>📅 Your Scheduled Code Consultations</h3>
                    <div className="bookings-list">
                      {bookings.map((b) => (
                        <div key={b.id} className="booking-ticket">
                          <div>
                            <strong>{b.advisorName}</strong> - {b.specialty}
                            <div className="booking-time-details">Slot: {b.date} at {b.time}</div>
                          </div>
                          <span className="booking-ref-badge">REF: {b.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="advisors-grid">
                  {advisors.map((adv) => (
                    <div key={adv.id} id={adv.id} className="advisor-card">
                      <div className="advisor-header">
                        <img src={adv.image} alt={adv.name} className="advisor-avatar" style={{ objectFit: 'cover' }} />
                        <div className="advisor-header-meta">
                          <h3 className="advisor-name">{adv.name}</h3>
                          <span className="advisor-specialty">{adv.specialty}</span>
                        </div>
                      </div>

                      <div className="advisor-body">
                        <p className="advisor-bio">{adv.bio}</p>
                        
                        <div className="advisor-stats">
                          <span className="advisor-rating">⭐ {adv.rating}</span>
                          <span className="advisor-reviews">({adv.reviews} reviews)</span>
                          <span className={`advisor-status ${adv.status.toLowerCase().replace(" ", "-")}`}>
                            ● {adv.status}
                          </span>
                        </div>

                        <button className="advisor-book-btn" onClick={() => initiateBooking(adv)}>
                          Book Advisor Session
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Booking Modal */}
                {bookingAdvisor && (
                  <div className="booking-modal-overlay" onClick={() => setBookingAdvisor(null)}>
                    <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                      <button className="booking-modal-close" onClick={() => setBookingAdvisor(null)}>&times;</button>
                      {!bookingSuccess ? (
                        <form onSubmit={handleConfirmBooking} className="booking-form">
                          <h2>Schedule Coding Session</h2>
                          <p className="booking-lead">Secure an interactive code review slot with <strong>{bookingAdvisor.name}</strong></p>
                          <div className="booking-advisor-tagline">{bookingAdvisor.specialty}</div>

                          <div className="form-group">
                            <label>Choose Date</label>
                            <input
                              type="date"
                              required
                              value={bookingDate}
                              onChange={(e) => setBookingDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="booking-input"
                            />
                          </div>

                          <div className="form-group">
                            <label>Choose Slot Time</label>
                            <select
                              value={bookingTime}
                              onChange={(e) => setBookingTime(e.target.value)}
                              className="booking-input"
                            >
                              <option value="09:00">09:00 AM (EST)</option>
                              <option value="11:30">11:30 AM (EST)</option>
                              <option value="14:00">02:00 PM (EST)</option>
                              <option value="16:30">04:30 PM (EST)</option>
                              <option value="19:00">07:00 PM (EST)</option>
                            </select>
                          </div>

                          <button type="submit" className="booking-submit-btn">
                            Confirm Appointment
                          </button>
                        </form>
                      ) : (
                        <div className="booking-success-view">
                          <div className="success-checkmark">✔</div>
                          <h2>Session Reserved!</h2>
                          <p>Your reviews session with <strong>{bookingAdvisor.name}</strong> has been secured.</p>
                          <div className="success-booking-card">
                            <div><strong>Slot Date:</strong> {bookingDate}</div>
                            <div><strong>Slot Time:</strong> {bookingTime}</div>
                            <div><strong>Reference ID:</strong> MZ-AD-{Math.floor(1000 + Math.random() * 9000)}</div>
                          </div>
                          <p className="success-note">A calendar invite link has been dispatched to your email address.</p>
                          <button className="booking-done-btn" onClick={() => setBookingAdvisor(null)}>
                            Close Window
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Help & Tools */}
            {activeTab === "help" && (
              <div className="fitness-section-container">
                <div className="fitness-section-header">
                  <h1 className="fitness-section-heading">DEVELOPER HELP DESK</h1>
                  <p className="fitness-section-subheading">Test regular expressions, evaluate compiler complexity, and submit tickets</p>
                </div>

                <div className="help-panels-grid">
                  {/* Left FAQs & Tickets */}
                  <div className="help-left-col">
                    <div className="help-block">
                      <h3>❓ Frequently Asked Questions</h3>
                      <div className="faq-list">
                        {faqData.map((faq) => {
                          const isOpen = activeFaqId === faq.id;
                          return (
                            <div key={faq.id} id={faq.id} className={`faq-item ${isOpen ? "open" : ""}`}>
                              <button className="faq-trigger" onClick={() => setActiveFaqId(isOpen ? null : faq.id)}>
                                <span>{faq.question}</span>
                                <span className="faq-arrow">{isOpen ? "▲" : "▼"}</span>
                              </button>
                              {isOpen && (
                                <div className="faq-answer">
                                  <span className="faq-cat-badge">{faq.category}</span>
                                  <p>{faq.answer}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="help-block">
                      <h3>🛡️ Register Developer Support Ticket</h3>
                      {!ticketSuccess ? (
                        <form onSubmit={handleSupportSubmit} className="ticket-form">
                          <div className="form-row-2">
                            <input
                              type="text"
                              placeholder="Developer Name"
                              required
                              value={ticketForm.name}
                              onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                              className="ticket-input"
                            />
                            <input
                              type="email"
                              placeholder="Developer Email"
                              required
                              value={ticketForm.email}
                              onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                              className="ticket-input"
                            />
                          </div>

                          <div className="form-row-2">
                            <select
                              value={ticketForm.category}
                              onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                              className="ticket-input"
                            >
                              <option value="Languages">Languages & Syntax</option>
                              <option value="Hardware">Hardware & Mug Shop</option>
                              <option value="Certifications">Certifications Academy</option>
                              <option value="Advisor Bookings">Advisor Review Sessions</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Subject Header"
                              required
                              value={ticketForm.subject}
                              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                              className="ticket-input"
                            />
                          </div>

                          <textarea
                            placeholder="Detail your compilation or account issue here..."
                            rows="4"
                            required
                            value={ticketForm.message}
                            onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                            className="ticket-input textarea"
                          />

                          <button type="submit" className="ticket-submit-btn" disabled={isSubmittingTicket}>
                            {isSubmittingTicket ? "Registering..." : "Submit Support Request"}
                          </button>
                        </form>
                      ) : (
                        <div className="ticket-success-box">
                          <div className="ticket-success-icon">🎫</div>
                          <h4>Support Ticket Logged!</h4>
                          <p>Ticket ID: <strong>{ticketNumber}</strong> has been logged to your developer session.</p>
                          <p className="ticket-success-note">An advisor will review your stacktrace and email you within 12 minutes.</p>
                          <button className="ticket-reset-btn" onClick={() => setTicketSuccess(false)}>
                            Submit Another Stacktrace
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Tools widgets */}
                  <div className="help-right-col">
                    {/* RegEx Pattern Tester */}
                    <div id="regex-tester-box" className="calc-card">
                      <h3>📊 RegExp Match Pattern Tester</h3>
                      <p className="calc-desc">Test custom JavaScript regular expressions against input strings</p>
                      
                      <form onSubmit={testRegex} className="calc-form">
                        <div className="form-row-2">
                          <input
                            type="text"
                            placeholder="RegEx (e.g. [A-Z]+)"
                            required
                            value={regexInput.regex}
                            onChange={(e) => setRegexInput({ ...regexInput, regex: e.target.value })}
                            className="calc-input"
                          />
                          <input
                            type="text"
                            placeholder="Input Test String"
                            required
                            value={regexInput.text}
                            onChange={(e) => setRegexInput({ ...regexInput, text: e.target.value })}
                            className="calc-input"
                          />
                        </div>
                        <button type="submit" className="calc-btn">
                          Evaluate Regular Expression
                        </button>
                      </form>

                      {regexResult !== null && (
                        <div className="calc-result-box">
                          <div style={{ wordBreak: "break-all" }}>Result: <strong className="calc-score">{regexResult}</strong></div>
                        </div>
                      )}
                    </div>

                    {/* Complexity Evaluator */}
                    <div id="complexity-eval-box" className="calc-card">
                      <h3>💪 Loop Execution Complexity Evaluator</h3>
                      <p className="calc-desc">Analyze theoretical Big-O runtime operations against input sizes (N)</p>
                      
                      <form onSubmit={evaluateComplexity} className="calc-form">
                        <div className="form-row-2">
                          <input
                            type="number"
                            placeholder="Input Size N (e.g. 100)"
                            required
                            value={complexityInput.N}
                            onChange={(e) => setComplexityInput({ ...complexityInput, N: e.target.value })}
                            className="calc-input"
                          />
                          <select
                            value={complexityInput.loops}
                            onChange={(e) => setComplexityInput({ ...complexityInput, loops: e.target.value })}
                            className="calc-input"
                          >
                            <option value="1">1 Nested Loop (O(N))</option>
                            <option value="2">2 Nested Loops (O(N²))</option>
                            <option value="3">3 Nested Loops (O(N³))</option>
                            <option value="0">Divide & Conquer (O(log N))</option>
                          </select>
                        </div>
                        <button type="submit" className="calc-btn">
                          Evaluate Big-O Complexity
                        </button>
                      </form>

                      {complexityResult !== null && (
                        <div className="calc-result-box">
                          <div>Complexity: <strong className="calc-score">{complexityResult.complexity}</strong></div>
                          <p className="calc-status-sub" style={{ marginTop: "6px" }}>
                            Theoretical loops operations: <strong>{complexityResult.totalOps.toLocaleString()} operations</strong>. Keep computational bounds tight.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Cart & Secure Checkout */}
            {activeTab === "cart" && (
              <div className="fitness-section-container">
                <div className="fitness-section-header">
                  <h1 className="fitness-section-heading">YOUR HARDWARE CART</h1>
                  <p className="fitness-section-subheading">Review your coding essentials and proceed with secure MasteryPay checkout</p>
                </div>

                {!checkoutSuccess ? (
                  <div className="cart-checkout-layout">
                    {/* Cart Items list */}
                    <div className="cart-left-panel">
                      {cart.length === 0 ? (
                        <div className="empty-cart-view">
                          <div className="empty-cart-icon">🛒</div>
                          <h3>Your Cart is Empty</h3>
                          <p>Head to our Store resources to view tactile keyboards, ergonomic vertical mice, or panoramic curved monitors.</p>
                          <button className="back-store-btn" onClick={() => setActiveTab("resources")}>
                            Visit Hardware Store
                          </button>
                        </div>
                      ) : (
                        <div className="cart-items-wrapper">
                          {cart.map((item) => (
                            <div key={item.id} className="cart-item-card">
                              <div className="cart-item-icon" style={{ fontSize: "28px" }}>
                                {item.icon === "keyboard" ? "⌨️" :
                                 item.icon === "mouse" ? "鼠标🖱️" :
                                 item.icon === "monitor" ? "🖥️" :
                                 item.icon === "mug" ? "☕" :
                                 item.icon === "glasses" ? "👓" :
                                 item.icon === "headphones" ? "🎧" :
                                 item.icon === "wristrest" ? "🪵" : "🧥"}
                              </div>
                              <div className="cart-item-info">
                                <h4>{item.name}</h4>
                                <span className="cart-item-price-tag">${item.price} each</span>
                              </div>
                              
                              <div className="cart-qty-controls">
                                <button className="qty-btn" onClick={() => updateCartQuantity(item.id, -1)}>-</button>
                                <span className="qty-val">{item.quantity}</span>
                                <button className="qty-btn" onClick={() => updateCartQuantity(item.id, 1)}>+</button>
                              </div>

                              <div className="cart-item-subtotal">
                                <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                              </div>

                              <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>
                                &times;
                              </button>
                            </div>
                          ))}

                          <div className="cart-financial-summary">
                            <div className="financial-row">
                              <span>Items Subtotal</span>
                              <span>${getCartTotals().subtotal}</span>
                            </div>
                            <div className="financial-row">
                              <span>Estimated Tax (8%)</span>
                              <span>${getCartTotals().tax}</span>
                            </div>
                            <div className="financial-row">
                              <span>Shipping</span>
                              <span>{getCartTotals().shipping === 0 ? "FREE" : `$${getCartTotals().shipping}`}</span>
                            </div>
                            <hr className="financial-separator" />
                            <div className="financial-row total">
                              <span>Total Due</span>
                              <span className="total-due-text">${getCartTotals().total}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Checkout Form */}
                    {cart.length > 0 && (
                      <div className="cart-right-panel">
                        <div className="checkout-block">
                          <h3>🔒 Secure Developer Checkout</h3>
                          <form onSubmit={handleCheckoutSubmit} className="checkout-form">
                            <div className="form-group">
                              <label>Full Name</label>
                              <input
                                type="text"
                                required
                                value={checkoutForm.name}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                                className="checkout-input"
                                placeholder="Alan Turing"
                              />
                            </div>

                            <div className="form-group">
                              <label>Email Address</label>
                              <input
                                type="email"
                                required
                                value={checkoutForm.email}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                                className="checkout-input"
                                placeholder="turing@mastery.com"
                              />
                            </div>

                            <div className="form-group">
                              <label>Shipping Address</label>
                              <input
                                type="text"
                                required
                                value={checkoutForm.address}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                                className="checkout-input"
                                placeholder="101 Binary Boulevard"
                              />
                            </div>

                            <div className="form-row-2">
                              <div className="form-group">
                                <label>Zip / Postal Code</label>
                                <input
                                  type="text"
                                  required
                                  value={checkoutForm.zip}
                                  onChange={(e) => setCheckoutForm({ ...checkoutForm, zip: e.target.value })}
                                  className="checkout-input"
                                  placeholder="94025"
                                />
                              </div>
                              <div className="form-group">
                                <label>MasteryPay Secure Code</label>
                                <input
                                  type="text"
                                  required
                                  value={checkoutForm.cvv}
                                  onChange={(e) => setCheckoutForm({ ...checkoutForm, cvv: e.target.value })}
                                  className="checkout-input"
                                  placeholder="***"
                                  maxLength="4"
                                />
                              </div>
                            </div>

                            <div className="form-group">
                              <label>Credit Card Number</label>
                              <input
                                type="text"
                                required
                                value={checkoutForm.card}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, card: e.target.value })}
                                className="checkout-input"
                                placeholder="4111 2222 3333 4444"
                              />
                            </div>

                            <div className="form-group">
                              <label>Card Expiry</label>
                              <input
                                type="text"
                                required
                                value={checkoutForm.expiry}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, expiry: e.target.value })}
                                className="checkout-input"
                                placeholder="MM/YY"
                              />
                            </div>

                            <button type="submit" className="place-order-btn" disabled={isCheckoutProcessing}>
                              {isCheckoutProcessing ? "Processing Secure payment..." : `Authorize Payment of $${getCartTotals().total}`}
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="checkout-success-container">
                    <div className="checkout-success-checkmark">✔</div>
                    <h2>Secure Payment Authorized!</h2>
                    <p className="success-order-msg">Your transaction was cleared successfully. Order ID: <strong>{orderId}</strong></p>
                    <div className="success-receipt-card">
                      <h4>📦 Shipment Details</h4>
                      <p>Your hardware gear is being packed by our Developer Logistics partners. Estimated delivery: 2-3 Business Days.</p>
                      <span className="secure-badge">MasteryPay Secure Clearance: MZ-404-OK</span>
                    </div>
                    <button className="continue-shopping-btn" onClick={() => { setCheckoutSuccess(false); setActiveTab("resources"); }}>
                      Continue Store Shopping
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: Gym/Team Membership & Family Roster */}
            {activeTab === "members" && (
              <CollaborationHub zone="CODING" themeColor="#00f0ff" />
            )}

          </div>
        </main>
      </div>

      {/* Learn More Interactive Popup Modal */}
      {isModalOpen && (
        <div className="fitness-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="fitness-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <canvas ref={modalCanvasRef} className="fitness-modal-bg-video" />
            <div className="fitness-modal-video-overlay" />

            <button
              className="fitness-modal-close-btn"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>

            <h2 className="fitness-modal-title">LANGUAGE TUTORIAL ZONE</h2>
            <p className="fitness-modal-subtitle">
              Select a programming language and play the best guide tutorial in English
            </p>

            <div className="fitness-modal-exercise-grid">
              {languages.map((category) => (
                <button
                  key={category}
                  className={`fitness-modal-exercise-pill ${modalSelectedLanguage === category ? "active" : ""}`}
                  onClick={() => handleModalLanguageSelect(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {!showVideo ? (
              <div className="fitness-modal-controls">
                <button
                  className="fitness-modal-play-btn"
                  onClick={handlePlayVideo}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginRight: "4px" }}
                  >
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  PLAY TUTORIAL
                </button>
              </div>
            ) : (
              <div>
                <div className="fitness-video-player-wrapper">
                  {useYoutube ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeVideoMap[modalSelectedLanguage]}?autoplay=1`}
                      title={`${modalSelectedLanguage} Tutorial Video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div style={{ background: "#0a010c", display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                      {renderCodingAnimation(modalSelectedLanguage)}
                    </div>
                  )}
                </div>
                
                <div style={{ textAlign: "center", marginTop: "12px", position: "relative", zIndex: 3, display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                  {useYoutube && (
                    <div style={{ color: "#ff4a5a", fontSize: "13px", fontWeight: "bold", padding: "6px 12px", background: "rgba(255, 74, 90, 0.15)", border: "1px solid rgba(255, 74, 90, 0.3)", borderRadius: "8px", maxWidth: "85%", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                      ⚠️ School Network Notice: YouTube is blocked on your network firewall. Please click the link below to switch to the working local Animated Vector Guide!
                    </div>
                  )}
                  <span
                    style={{ color: "#00A859", cursor: "pointer", textDecoration: "underline", fontSize: "14px", fontWeight: "bold" }}
                    onClick={() => setUseYoutube(!useYoutube)}
                  >
                    {useYoutube ? "Switch to High-Clarity Vector Guide" : "Switch to YouTube Stream Player"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Back Confirmation Modal */}
      {showBackConfirm && (
        <div className="fitness-modal-overlay" style={{ zIndex: 2000 }}>
          <div className="fitness-modal-container" style={{ width: "420px", textAlign: "center", padding: "40px" }}>
            <h2 className="fitness-modal-title" style={{ fontSize: "28px", color: "#00A859" }}>LEAVE ZONE?</h2>
            <p className="fitness-modal-subtitle" style={{ color: "#ffffff", marginBottom: "35px", fontSize: "16px", textTransform: "none" }}>Are you sure you want to return to the Dashboard?</p>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
              <button 
                onClick={() => setShowBackConfirm(false)}
                style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.05)", color: "white", border: "2px solid rgba(255,255,255,0.2)", borderRadius: "30px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" }}
                onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
                onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.05)"}
              >
                STAY
              </button>
              <button 
                onClick={() => navigate("/home")}
                style={{ flex: 1, padding: "14px", background: "#00A859", color: "black", border: "2px solid #00A859", borderRadius: "30px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 15px rgba(0, 168, 89, 0.4)", transition: "all 0.2s" }}
                onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseOut={(e) => e.target.style.transform = "scale(1)"}
              >
                LEAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coding;
