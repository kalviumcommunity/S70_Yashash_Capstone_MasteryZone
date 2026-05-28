import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./language.css";
import fitnessIllustration from "../assets/fitness_illustration.png";

// Import real-life equipment photos generated for premium e-commerce look
import dumbbellEquip from "../assets/dumbbell_equip.png";
import proteinEquip from "../assets/protein_equip.png";
import shirtEquip from "../assets/shirt_equip.png";
import ropeEquip from "../assets/rope_equip.png";
import bottleEquip from "../assets/bottle_equip.png";
import beltEquip from "../assets/belt_equip.png";
import chalkEquip from "../assets/chalk_equip.png";
import glovesEquip from "../assets/gloves_equip.png";

const Language = () => {
  const navigate = useNavigate();
  const mainCanvasRef = useRef(null);
  const modalCanvasRef = useRef(null);

  // Core Application Tabs State
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "certification", "resources", "about", "advisor", "help", "cart"
  
  // Exercises Sidebar State
  const [activeCategory, setActiveCategory] = useState("KANNADA");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modal State for Video Tutorial
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSelectedExercise, setModalSelectedExercise] = useState("KANNADA");
  const [showVideo, setShowVideo] = useState(false);
  const [useYoutube, setUseYoutube] = useState(true);

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
  const [enrolledCerts, setEnrolledCerts] = useState({}); // { certId: progress }

  // Advisor Scheduling State
  const [bookings, setBookings] = useState([]);
  const [bookingAdvisor, setBookingAdvisor] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Help page Support ticket state
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    category: "Workouts",
    subject: "",
    message: ""
  });
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [activeFaqId, setActiveFaqId] = useState(null);

  // Calculators State
  const [bmiInput, setBmiInput] = useState({ height: "", weight: "" });
  const [bmiResult, setBmiResult] = useState(null);
  const [maxRepInput, setMaxRepInput] = useState({ weight: "", reps: "" });
  const [maxRepResult, setMaxRepResult] = useState(null);

  // Gym Membership Portal States
  const [membershipForm, setMembershipForm] = useState({
    primaryName: "",
    email: "",
    tier: "gold", // "silver", "gold", "platinum"
    cycle: "monthly", // "monthly", "annual"
    accentColor: "#ce77a6", // Neon Pink, Cyan (#00f0ff), Gold (#ffd700), Lavender (#b78bb1)
    avatarType: "athlete" // "athlete", "beast", "ninja", "guru"
  });
  const [rosterList, setRosterList] = useState([]); // Secondary roster members
  const [newRosterMember, setNewRosterMember] = useState({
    name: "",
    age: "",
    relationship: "Spouse", // "Spouse", "Child", "Friend"
    goal: "Strength" // "Strength", "Fat Loss", "Athletic Power", "General Wellness"
  });
  const [membershipSuccess, setMembershipSuccess] = useState(false);
  const [membershipPassId, setMembershipPassId] = useState("");
  const [isMembershipProcessing, setIsMembershipProcessing] = useState(false);

  // Live Stats simulator state (About Page)
  const [stats, setStats] = useState({
    activeMembers: 12482,
    workoutsLogged: 3842,
    tonsLifted: 4921.8
  });
  const [statsPulse, setStatsPulse] = useState(false);

  // Static Data
  const exercises = ["KANNADA", "ENGLISH", "TAMIL", "TELUGU", "MALAYALAM", "HINDI", "SPANISH"];

  const websiteMap = {
    KANNADA: "https://www.kannadakali.com/",
    ENGLISH: "https://learnenglish.britishcouncil.org/",
    TAMIL: "https://www.tamilcube.com/",
    TELUGU: "https://www.learningtelugu.org/",
    MALAYALAM: "https://learnmalayalam.in/",
    HINDI: "https://www.learninghindi.com/",
    SPANISH: "https://www.studyspanish.com/"
  };

  const youtubeVideoMap = {
    KANNADA: "5Y_6H0c1VnQ",
    ENGLISH: "juKd26qkNAw",
    TAMIL: "8uB7M_m8D7Y",
    TELUGU: "gH0Xj_2T-R0",
    MALAYALAM: "Q7m2aUv2x4A",
    HINDI: "qJ_hN_t78vM",
    SPANISH: "4Y2ZdHCO5sg"
  };

  // E-Commerce Premium Products Database with real-life generated photos
  const products = [
    { id: "prod-1", name: "Comprehensive Spanish Textbook", price: 49.99, rating: 5, category: "Books", desc: "Master Spanish grammar, vocabulary, and culture with this detailed guide.", image: "https://loremflickr.com/600/600/book,language?lock=111", icon: "book" },
    { id: "prod-2", name: "Premium Headset with Mic", price: 89.99, rating: 5, category: "Hardware", desc: "Crystal clear audio for speaking practice and listening comprehension.", image: "https://loremflickr.com/600/600/headset,mic?lock=112", icon: "headphones" },
    { id: "prod-3", name: "Bilingual Dictionary (English-Hindi)", price: 29.99, rating: 4, category: "Books", desc: "Over 100,000 words and phrases. Essential for intermediate learners.", image: "https://loremflickr.com/600/600/dictionary,book?lock=113", icon: "dictionary" },
    { id: "prod-4", name: "Pocket Electronic Translator", price: 129.99, rating: 5, category: "Hardware", desc: "Real-time voice translation across 40 different languages offline.", image: "https://loremflickr.com/600/600/translator,device?lock=114", icon: "device" },
    { id: "prod-5", name: "Flashcards Set: Essential Kanji", price: 19.99, rating: 4, category: "Accessories", desc: "500 most common Kanji characters for quick memorization.", image: "https://loremflickr.com/600/600/flashcards,paper?lock=115", icon: "cards" },
    { id: "prod-6", name: "Language Learning Software (1 Yr)", price: 119.99, rating: 5, category: "Software", desc: "Full access to our interactive software platform. Track your fluency.", image: "https://loremflickr.com/600/600/software,computer?lock=116", icon: "laptop" },
    { id: "prod-7", name: "Notebook & Polyglot Pen Set", price: 14.99, rating: 4, category: "Accessories", desc: "Jot down new vocabulary and grammar rules in style.", image: "https://loremflickr.com/600/600/notebook,pen?lock=117", icon: "notebook" },
    { id: "prod-8", name: "Polyglot T-Shirt", price: 24.99, rating: 4, category: "Apparel", desc: "'Hello' written in 20 languages. Wear your passion for languages.", image: "https://loremflickr.com/600/600/tshirt,language?lock=118", icon: "shirt" }
  ];

  const advisors = [
    { id: "adv-1", name: "Elena Rossi", specialty: "Romance Languages & Accent Reduction", rating: 4.99, reviews: 3410, status: "Online", bio: "Fluent in Italian, Spanish, and French. Specializes in conversational fluency and reducing thick accents for beginners.", color: "linear-gradient(135deg, #a18cd1, #fbc2eb)", image: "https://loremflickr.com/200/200/face,woman?lock=211" },
    { id: "adv-2", name: "Kenji Sato", specialty: "Japanese Kanji & Business Etiquette", rating: 4.96, reviews: 2980, status: "Online", bio: "Tokyo native. Master of JLPT prep, Kanji memorization hacks, and formal business communication (Keigo).", color: "linear-gradient(135deg, #ff9a9e, #fecfef)", image: "https://loremflickr.com/200/200/face,man?lock=212" },
    { id: "adv-3", name: "Dr. Ananya Sharma", specialty: "Dravidian & Indo-Aryan Roots", rating: 4.93, reviews: 1840, status: "Online", bio: "Linguistics professor. Expert in Kannada, Tamil, and Hindi grammar structures and cultural immersion.", color: "linear-gradient(135deg, #f6d365, #fda085)", image: "https://loremflickr.com/200/200/face,woman?lock=213" },
    { id: "adv-4", name: "Marcus Schmidt", specialty: "Germanic Languages & Syntax", rating: 4.89, reviews: 2150, status: "In Session", bio: "German native speaker. Makes complex grammar, compound words, and strict syntax rules easy to digest.", color: "linear-gradient(135deg, #84fab0, #8fd3f4)", image: "https://loremflickr.com/200/200/face,man?lock=214" },
    { id: "adv-5", name: "Li Wei", specialty: "Mandarin Tones & Calligraphy", rating: 4.97, reviews: 1420, status: "Busy", bio: "Beijing-based instructor focusing on the 4 tones of Mandarin, pinyin mastery, and cultural nuances.", color: "linear-gradient(135deg, #a1c4fd, #c2e9fb)", image: "https://loremflickr.com/200/200/face,woman?lock=215" },
    { id: "adv-6", name: "Sofia Martinez", specialty: "Spanish Conjugation & Slang", rating: 4.99, reviews: 6830, status: "Offline", bio: "Latin American Spanish expert. Learn practical conversational Spanish, regional slang, and rapid verb conjugations.", color: "linear-gradient(135deg, #cfd9df, #e2ebf0)", image: "https://loremflickr.com/200/200/face,woman?lock=216" },
    { id: "adv-7", name: "David Kim", specialty: "Korean Hangul & K-Pop Culture", rating: 4.95, reviews: 840, status: "Online", bio: "Seoul native. Teaches Hangul reading in one hour, followed by immersive learning through Korean media.", color: "linear-gradient(135deg, #fbc2eb, #a6c1ee)", image: "https://loremflickr.com/200/200/face,man?lock=217" },
    { id: "adv-8", name: "Fatima Al-Sayed", specialty: "Arabic Script & MSA", rating: 4.92, reviews: 1180, status: "Online", bio: "Modern Standard Arabic (MSA) specialist. Detailed guidance on right-to-left script writing and pronunciation.", color: "linear-gradient(135deg, #fdcbf1, #e6dee9)", image: "https://loremflickr.com/200/200/face,woman?lock=218" },
    { id: "adv-9", name: "Ivan Volkov", specialty: "Russian Cases & Cyrillic", rating: 4.87, reviews: 1540, status: "In Session", bio: "Russian linguist. Demystifies the 6 Russian cases, Cyrillic alphabet reading, and rolling your R's.", color: "linear-gradient(135deg, #a18cd1, #fbc2eb)", image: "https://loremflickr.com/200/200/face,man?lock=219" },
    { id: "adv-10", name: "Chloe Dupont", specialty: "French Pronunciation & Literature", rating: 4.88, reviews: 1390, status: "Online", bio: "Parisian tutor. Focuses on silent letters, nasal sounds, and reading classic French literature for vocabulary.", color: "linear-gradient(135deg, #fbc2eb, #a6c1ee)", image: "https://loremflickr.com/200/200/face,woman?lock=220" }
  ];

  const certifications = [
    { id: "cert-1", name: "Beginner Fluency (A1-A2)", body: "Mastery Language Academy", price: 199.99, modules: 5, difficulty: "Beginner", desc: "Gain essential knowledge for basic greetings, everyday survival phrases, and simple sentence construction.", icon: "cpt", image: "https://loremflickr.com/600/400/language,beginner?lock=321" },
    { id: "cert-2", name: "Intermediate Conversationalist (B1-B2)", body: "Global Linguistics Board", price: 299.99, modules: 6, difficulty: "Intermediate", desc: "Hold extended conversations. Highlights expressing opinions, past/future tenses, and consuming foreign media.", icon: "cscs", image: "https://loremflickr.com/600/400/language,conversation?lock=322" },
    { id: "cert-3", name: "Business Communication Specialist", body: "Mastery Corporate Division", price: 149.99, modules: 4, difficulty: "Intermediate-Advanced", desc: "Master formal email writing, polite phrasing, and presentation skills in your target language.", icon: "cfn", image: "https://loremflickr.com/600/400/business,language?lock=323" },
    { id: "cert-4", name: "Advanced Native Fluency (C1-C2)", body: "International Mastery Institute", price: 249.99, modules: 5, difficulty: "Advanced", desc: "Achieve near-native proficiency. Focus on idioms, complex grammar structures, and academic writing.", icon: "ces", image: "https://loremflickr.com/600/400/language,advanced?lock=324" }
  ];

  const faqData = [
    { id: "faq-1", category: "Workouts & Safety", question: "How do I safely prevent rotator cuff strains during heavy bench press?", answer: "Always warm up with light cable external rotations and face pulls. When bench pressing, retract and depress your scapula, maintain a slight arch in your back, and avoid flaring your elbows past a 75-degree angle from your torso." },
    { id: "faq-2", category: "Workouts & Safety", question: "What is the ideal warm-up sequence for structural compound lifts?", answer: "Start with 5-10 minutes of light dynamic cardio to raise core temperature, followed by active mobilization exercises (e.g. bodyweight squats, arm circles, leg swings), and finally perform 2-3 progressive warm-up sets of your main compound lift with escalating weight." },
    { id: "faq-3", category: "Supplements & Shop", question: "When is the optimal time to consume Whey Protein Isolate?", answer: "While the 'anabolic window' is wider than once believed, consuming 25-40g of whey protein within 1-2 hours pre- or post-workout provides rapid amino acid delivery to trigger Muscle Protein Synthesis (MPS) and accelerate tissue repair." },
    { id: "faq-4", category: "Certifications", question: "Are Mastery Zone certifications recognized in local commercial gyms?", answer: "Yes! Our certifications align directly with top accreditation standards (NASM, NSCA, and ISSA frameworks). All certified individuals receive a verifiable Digital Certificate ID upon completing the course study modules." },
    { id: "faq-5", category: "Advisor Bookings", question: "How do Advisor consultations work on the platform?", answer: "Once you submit a booking request for any of our top 10 advisors, an appointment is saved to your dashboard. You will receive an email connection link for a live interactive video session on your selected date and slot." }
  ];

  // 1. Canvas Heartrate/EKG Background Simulator
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

    let ekgOffset = 0;
    const plates = [];
    const platesCount = 20;

    for (let i = 0; i < platesCount; i++) {
      plates.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 8 + 4,
        speedX: Math.random() * 0.6 - 0.3,
        speedY: Math.random() * -1.4 - 0.3,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: Math.random() * 0.02 - 0.01,
        color: i % 2 === 0 ? "#ce77a6" : "#844e7c",
        opacity: Math.random() * 0.3 + 0.1
      });
    }

    const draw = () => {
      ctx.fillStyle = "rgba(12, 2, 13, 0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(209, 158, 207, 0.02)";
      ctx.lineWidth = 1;
      const gridSpacing = 50;
      const verticalShift = (ekgOffset * 1.8) % gridSpacing;
      
      for (let y = verticalShift; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.strokeStyle = "rgba(208, 119, 166, 0.28)";
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ce77a6";

      for (let x = 0; x < canvas.width; x += 3) {
        const cycle = (x + ekgOffset) % 400;
        let yOffset = 0;
        
        if (cycle > 120 && cycle < 138) {
          yOffset = Math.sin((cycle - 120) * Math.PI / 18) * -85;
        } else if (cycle >= 138 && cycle < 152) {
          yOffset = Math.sin((cycle - 138) * Math.PI / 14) * 40;
        } else if (cycle >= 152 && cycle < 165) {
          yOffset = Math.sin((cycle - 152) * Math.PI / 13) * -15;
        }
        
        const y = canvas.height * 0.5 + yOffset;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      plates.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.angle += p.rotationSpeed;

        if (p.y < -30) {
          p.y = canvas.height + 30;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -30 || p.x > canvas.width + 30) {
          p.speedX *= -1;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.strokeStyle = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      ekgOffset += 3.5;
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
        ctx.shadowColor = "#ce77a6";

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
          ctx.shadowColor = "#ce77a6";
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
        activeMembers: prev.activeMembers + (Math.random() > 0.6 ? 1 : 0),
        workoutsLogged: prev.workoutsLogged + Math.floor(Math.random() * 3),
        tonsLifted: parseFloat((prev.tonsLifted + Math.random() * 0.5).toFixed(1))
      }));
      setTimeout(() => setStatsPulse(false), 500);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleBack = () => {
    navigate("/home");
  };

  // Navigates directly back to the Language landing home view (Dashboard)
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
    setModalSelectedExercise(activeCategory);
    setShowVideo(false);
    setUseYoutube(true);
  };

  const handleModalExerciseSelect = (category) => {
    setModalSelectedExercise(category);
    setShowVideo(false);
    setUseYoutube(true);
  };

  const handlePlayVideo = () => {
    setShowVideo(true);
  };

  // E-Commerce Handlers
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
    const shipping = subtotal > 50 ? 0 : subtotal > 0 ? 9.99 : 0;
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
      setOrderId("MZ-" + Math.floor(100000 + Math.random() * 900000));
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
      setTicketNumber("TKT-" + Math.floor(50000 + Math.random() * 50000));
      setTicketForm({ name: "", email: "", category: "Workouts", subject: "", message: "" });
    }, 1500);
  };

  // Calculators logic
  const calculateBmi = (e) => {
    e.preventDefault();
    const h = parseFloat(bmiInput.height) / 100;
    const w = parseFloat(bmiInput.weight);
    if (!h || !w) return;
    const score = w / (h * h);
    setBmiResult(parseFloat(score.toFixed(1)));
  };

  const calculateOneRepMax = (e) => {
    e.preventDefault();
    const w = parseFloat(maxRepInput.weight);
    const r = parseFloat(maxRepInput.reps);
    if (!w || !r) return;
    // Epley Formula
    const result = w * (1 + 0.0333 * r);
    setMaxRepResult(Math.round(result));
  };

  // Live simulation adder (About Page)
  const addSimulatedWorkout = () => {
    setStatsPulse(true);
    setStats(prev => ({
      activeMembers: prev.activeMembers + 1,
      workoutsLogged: prev.workoutsLogged + 1,
      tonsLifted: parseFloat((prev.tonsLifted + 0.3).toFixed(1))
    }));
    setTimeout(() => setStatsPulse(false), 500);
  };

  // Cart quantity helper
  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Membership Price & Billing Totals Calculator
  const getMembershipTotals = () => {
    let baseRate = 29.99; // Silver
    if (membershipForm.tier === "gold") baseRate = 59.99;
    else if (membershipForm.tier === "platinum") baseRate = 99.99;

    // Annual Cycle 20% discount on base rates
    const cycleDiscount = membershipForm.cycle === "annual" ? baseRate * 0.2 : 0;
    const activeRate = baseRate - cycleDiscount;

    // Secondary family roster additions: flat $14.99 per additional member (which is heavily discounted!)
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

  // Roster Management Handlers
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
    setNewRosterMember({ name: "", age: "", relationship: "Spouse", goal: "Strength" });
  };

  const removeRosterMember = (id) => {
    setRosterList(prev => prev.filter(m => m.id !== id));
  };

  // Membership Authorization Gateway Submit
  const handleMembershipSubmit = (e) => {
    e.preventDefault();
    if (!membershipForm.primaryName || !membershipForm.email) {
      alert("Please fill in the primary member name and email address!");
      return;
    }
    setIsMembershipProcessing(true);
    setTimeout(() => {
      setIsMembershipProcessing(false);
      setMembershipSuccess(true);
      setMembershipPassId("MZ-PASS-" + Math.floor(10000 + Math.random() * 90000));
    }, 2000);
  };

  // High-Clarity Offline-Immune Vector Workout Guide Generator
  const renderExerciseAnimation = (category) => {
    switch (category) {
      case "BICEPS":
        return (
          <svg className="lang-workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(206, 119, 166, 0.15)" strokeWidth="4" />
            <path d="M40 180 L70 110 L60 60" stroke="#844e7c" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="60" cy="60" r="14" fill="#ce77a6" />
            <line x1="60" y1="60" x2="100" y2="120" stroke="#ce77a6" strokeWidth="8" strokeLinecap="round" />
            <g className="lang-bicep-forearm-group">
              <line x1="100" y1="120" x2="150" y2="120" stroke="#ce77a6" strokeWidth="7" strokeLinecap="round" />
              <g transform="translate(150, 120)">
                <line x1="0" y1="-25" x2="0" y2="25" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                <rect x="-8" y="-25" width="16" height="8" rx="2" fill="#ce77a6" />
                <rect x="-8" y="17" width="16" height="8" rx="2" fill="#ce77a6" />
              </g>
            </g>
            <circle cx="100" cy="120" r="6" fill="#ffffff" />
          </svg>
        );
      case "CHEST":
        return (
          <svg className="lang-workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(206, 119, 166, 0.15)" strokeWidth="4" />
            <line x1="30" y1="140" x2="170" y2="140" stroke="#844e7c" strokeWidth="8" strokeLinecap="round" />
            <line x1="60" y1="140" x2="60" y2="180" stroke="#844e7c" strokeWidth="6" />
            <line x1="140" y1="140" x2="140" y2="180" stroke="#844e7c" strokeWidth="6" />
            <rect x="70" y="125" width="60" height="15" rx="5" fill="#ce77a6" />
            <circle cx="60" cy="132" r="10" fill="#ce77a6" />
            <g className="lang-chest-barbell-group">
              <line x1="20" y1="90" x2="180" y2="90" stroke="#ffffff" strokeWidth="4" />
              <rect x="25" y="75" width="10" height="30" rx="2" fill="#ce77a6" />
              <rect x="37" y="80" width="8" height="20" rx="2" fill="#844e7c" />
              <rect x="165" y="75" width="10" height="30" rx="2" fill="#ce77a6" />
              <rect x="155" y="80" width="8" height="20" rx="2" fill="#844e7c" />
              <polyline points="75,125 75,90" stroke="rgba(206,119,166,0.8)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <polyline points="125,125 125,90" stroke="rgba(206,119,166,0.8)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          </svg>
        );
      case "LEGS":
        return (
          <svg className="lang-workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(206, 119, 166, 0.15)" strokeWidth="4" />
            <line x1="30" y1="180" x2="170" y2="180" stroke="#844e7c" strokeWidth="5" strokeLinecap="round" />
            <g className="lang-squat-body-group">
              <line x1="130" y1="170" x2="130" y2="120" stroke="#ce77a6" strokeWidth="7" strokeLinecap="round" />
              <line x1="130" y1="120" x2="95" y2="110" stroke="#ce77a6" strokeWidth="7" strokeLinecap="round" />
              <line x1="95" y1="110" x2="85" y2="60" stroke="#ce77a6" strokeWidth="8" strokeLinecap="round" />
              <circle cx="85" cy="42" r="10" fill="#ffffff" />
              <g transform="translate(85, 60)">
                <line x1="-45" y1="0" x2="45" y2="0" stroke="#ffffff" strokeWidth="4" />
                <rect x="-55" y="-15" width="10" height="30" rx="2" fill="#ce77a6" />
                <rect x="45" y="-15" width="10" height="30" rx="2" fill="#ce77a6" />
              </g>
            </g>
          </svg>
        );
      case "TRICEPS":
        return (
          <svg className="lang-workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(206, 119, 166, 0.15)" strokeWidth="4" />
            <line x1="60" y1="30" x2="140" y2="30" stroke="#844e7c" strokeWidth="6" strokeLinecap="round" />
            <line x1="60" y1="30" x2="60" y2="180" stroke="#844e7c" strokeWidth="4" />
            <path d="M75 180 L75 90 L85 70" stroke="#844e7c" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="85" cy="55" r="10" fill="#ce77a6" />
            <line x1="85" y1="70" x2="100" y2="120" stroke="#ce77a6" strokeWidth="8" strokeLinecap="round" />
            <g className="lang-tricep-forearm-group">
              <line x1="100" y1="120" x2="100" y2="165" stroke="#ce77a6" strokeWidth="7" strokeLinecap="round" />
              <line x1="90" y1="165" x2="110" y2="165" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
              <line x1="100" y1="165" x2="100" y2="30" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeDasharray="3,3" />
            </g>
            <circle cx="100" cy="120" r="5" fill="#ffffff" />
          </svg>
        );
      case "BACK":
        return (
          <svg className="lang-workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(206, 119, 166, 0.15)" strokeWidth="4" />
            <line x1="40" y1="130" x2="160" y2="130" stroke="#844e7c" strokeWidth="6" strokeLinecap="round" />
            <line x1="60" y1="130" x2="60" y2="170" stroke="#844e7c" strokeWidth="4" />
            <line x1="140" y1="130" x2="140" y2="170" stroke="#844e7c" strokeWidth="4" />
            <line x1="140" y1="125" x2="85" y2="95" stroke="#ce77a6" strokeWidth="8" strokeLinecap="round" />
            <circle cx="75" cy="85" r="10" fill="#ffffff" />
            <line x1="85" y1="95" x2="110" y2="112" stroke="#ce77a6" strokeWidth="6" strokeLinecap="round" />
            <g className="lang-back-row-group">
              <line x1="110" y1="112" x2="110" y2="155" stroke="#ce77a6" strokeWidth="6" strokeLinecap="round" />
              <g transform="translate(110, 155)">
                <line x1="-20" y1="0" x2="20" y2="0" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                <rect x="-20" y="-8" width="6" height="16" rx="1" fill="#ce77a6" />
                <rect x="14" y="-8" width="6" height="16" rx="1" fill="#ce77a6" />
              </g>
            </g>
            <circle cx="110" cy="112" r="4.5" fill="#ffffff" />
          </svg>
        );
      case "WARM UP":
        return (
          <svg className="lang-workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(206, 119, 166, 0.15)" strokeWidth="4" />
            <line x1="100" y1="180" x2="100" y2="85" stroke="#844e7c" strokeWidth="7" strokeLinecap="round" />
            <circle cx="100" cy="65" r="12" fill="#ce77a6" />
            <g className="lang-warmup-arms-group">
              <line x1="100" y1="85" x2="50" y2="85" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
              <line x1="100" y1="85" x2="150" y2="85" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
              <circle cx="50" cy="85" r="5" fill="#ce77a6" />
              <circle cx="150" cy="85" r="5" fill="#ce77a6" />
            </g>
            <circle cx="100" cy="85" r="6" fill="#ce77a6" />
          </svg>
        );
      case "SHOULDER":
        return (
          <svg className="lang-workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(206, 119, 166, 0.15)" strokeWidth="4" />
            <line x1="80" y1="180" x2="80" y2="95" stroke="#844e7c" strokeWidth="6" strokeLinecap="round" />
            <line x1="60" y1="180" x2="140" y2="180" stroke="#844e7c" strokeWidth="5" />
            <line x1="90" y1="150" x2="90" y2="95" stroke="#ce77a6" strokeWidth="7" strokeLinecap="round" />
            <circle cx="90" cy="78" r="10" fill="#ffffff" />
            <g className="lang-shoulder-press-group">
              <polyline points="90,95 60,95 60,50" stroke="#ce77a6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <g transform="translate(60, 50)">
                <line x1="-18" y1="0" x2="18" y2="0" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                <rect x="-18" y="-6" width="6" height="12" rx="1.5" fill="#ce77a6" />
                <rect x="12" y="-6" width="6" height="12" rx="1.5" fill="#ce77a6" />
              </g>
              <polyline points="90,95 120,95 120,50" stroke="#ce77a6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <g transform="translate(120, 50)">
                <line x1="-18" y1="0" x2="18" y2="0" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                <rect x="-18" y="-6" width="6" height="12" rx="1.5" fill="#ce77a6" />
                <rect x="12" y="-6" width="6" height="12" rx="1.5" fill="#ce77a6" />
              </g>
            </g>
          </svg>
        );
      default:
        return (
          <svg className="lang-workout-svg-anim" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(206, 119, 166, 0.15)" strokeWidth="4" />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#ce77a6" fontSize="16" fontWeight="bold">ACTIVE WORKOUT</text>
          </svg>
        );
    }
  };

  // Global Suggestions Index Generator
  const getSuggestions = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    // 1. Exercises
    exercises.forEach(ex => {
      if (ex.toLowerCase().includes(query)) {
        results.push({ type: "exercise", name: ex, label: `🏋️ Muscle Workout: ${ex}`, refId: ex });
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
        results.push({ type: "advisor", name: a.name, label: `🧠 Advisor: ${a.name} (${a.specialty})`, refId: a.id });
      }
    });

    // 4. Certifications
    certifications.forEach(c => {
      if (c.name.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query)) {
        results.push({ type: "certification", name: c.name, label: `🛡️ Certification: ${c.name}`, refId: c.id });
      }
    });

    // 5. Help FAQs & Calculators
    if ("bmi calculator".includes(query) || "weight height".includes(query)) {
      results.push({ type: "help-calc-bmi", name: "BMI Calculator", label: `📊 Calculator: BMI Body Mass Index`, refId: "bmi-calculator-box" });
    }
    if ("one rep max 1rm max lift calculator".includes(query)) {
      results.push({ type: "help-calc-1rm", name: "1-Rep Max Calculator", label: `💪 Calculator: One-Rep Max (1RM)`, refId: "max-calculator-box" });
    }
    if ("membership add member signup pricing gold silver platinum pass".includes(query)) {
      results.push({ type: "membership", name: "Gym Membership Portal", label: `🎫 Portal: Join Mastery Gym & Add Members`, refId: "membership-pricing" });
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
      setModalSelectedExercise(item.refId);
      setShowVideo(false);
      setUseYoutube(true);
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

  // Fullreal-time results compiler for direct on-screen search results view
  const getFullSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    // 1. Exercises
    exercises.forEach(ex => {
      if (ex.toLowerCase().includes(query)) {
        results.push({
          type: "exercise",
          category: "Exercise Tutorial",
          name: ex,
          subtitle: `Muscle Target: ${ex}`,
          desc: `Biomechanical guides and video tutorials for ${ex} exercises. Click Play below to trigger the 100% active, school network immune animated tutorials player.`,
          refId: ex
        });
      }
    });

    // 2. Products
    products.forEach(p => {
      if (p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query)) {
        results.push({
          type: "product",
          category: "Store Product",
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
          category: "Language Advisor",
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
          category: "Academy Certification",
          name: c.name,
          subtitle: `${c.body} | Price: $${c.price}`,
          desc: c.desc,
          item: c,
          refId: c.id
        });
      }
    });

    // 5. Calculators
    if ("bmi calculator weight height stat index".includes(query)) {
      results.push({
        type: "calculator-bmi",
        category: "Calculator Tool",
        name: "Body Mass Index (BMI) Ratio",
        subtitle: "Health Stat Tracker",
        desc: "Evaluate your biological weight category against standard body index measures.",
        refId: "bmi-calculator-box"
      });
    }
    if ("one-rep max 1rm lift load reps strength calculator".includes(query)) {
      results.push({
        type: "calculator-1rm",
        category: "Calculator Tool",
        name: "One-Rep Max (1RM) Estimator",
        subtitle: "Muscular Strength Tracker",
        desc: "Structure target training zones by estimating your absolute single compound lift capacity.",
        refId: "max-calculator-box"
      });
    }

    // 6. Gym Membership
    if ("membership add member signup pricing gold silver platinum pass".includes(query)) {
      results.push({
        type: "membership",
        category: "Membership Portal",
        name: "Mastery Zone Gym Membership & Family Roster",
        subtitle: "Pricing plans and Roster registration",
        desc: "Compare Silver, Gold, and Platinum pricing tiers, configure Monthly or Annual cycles, build your family fitness roster, and generate custom glassmorphic passes.",
        refId: "membership-pricing"
      });
    }

    // 7. Help FAQs
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

  // High-Clarity SVG icons for Search results category labels
  const renderResultBadgeIcon = (type) => {
    switch (type) {
      case "exercise": return "🏋️";
      case "product": return "🛒";
      case "advisor": return "🧠";
      case "certification": return "🛡️";
      case "faq": return "❓";
      case "membership": return "🎫";
      default: return "📊";
    }
  };

  // Action link to route to full tabs
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

  return (
    <div className="language-container page-enter">
      {/* Header Banner */}
      <header className="lang-fitness-header">
        {/* Logo Container - click returns to Language Page Landing View */}
        <div className="lang-fitness-logo-container" onClick={handleHomeClick} style={{ cursor: "pointer" }}>
          <div className="lang-fitness-logo-text">
            FITNESS<span>ZONE</span>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="lang-fitness-nav-bar">
          {/* Square Home Button - click returns to Language Page Landing View */}
          <button className="lang-fitness-home-btn" onClick={handleHomeClick} title="Home/Dashboard">
            <div className="lang-fitness-home-icon-box">
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
          <div className="lang-fitness-nav-links-left">
            <span className={`fitness-nav-link ${activeTab === "certification" ? "lang-active-nav" : ""}`} onClick={() => { setActiveTab("certification"); setSearchQuery(""); }}>Certification</span>
            <span className={`fitness-nav-link ${activeTab === "resources" ? "lang-active-nav" : ""}`} onClick={() => { setActiveTab("resources"); setSearchQuery(""); }}>Resources</span>
            <span className={`fitness-nav-link ${activeTab === "about" ? "lang-active-nav" : ""}`} onClick={() => { setActiveTab("about"); setSearchQuery(""); }}>About</span>
          </div>

          {/* Special Advisor lavender tab */}
          <div className={`fitness-advisor-tab ${activeTab === "advisor" ? "lang-active-nav-advisor" : ""}`} onClick={() => { setActiveTab("advisor"); setSearchQuery(""); }}>
            Talk to an Advisor
          </div>

          {/* Right links group */}
          <div className="lang-fitness-nav-links-right">
            <span className={`fitness-nav-link ${activeTab === "help" ? "lang-active-nav" : ""}`} onClick={() => { setActiveTab("help"); setSearchQuery(""); }}>Help</span>
            <span className={`fitness-nav-link cart-link ${activeTab === "cart" ? "lang-active-nav" : ""}`} onClick={() => { setActiveTab("cart"); setSearchQuery(""); }}>
              YOUR CART ({getCartCount()})
            </span>
            <span className={`fitness-nav-link add-members-link ${activeTab === "members" ? "lang-active-nav" : ""}`} onClick={() => { setActiveTab("members"); setSearchQuery(""); }}>Add Members</span>
          </div>

          {/* Red Learn More button */}
          <button className="lang-fitness-learn-more-btn" onClick={openLearnMoreModal}>
            Learn More <span>▶</span>
          </button>
        </nav>
      </header>

      {/* Main Layout */}
      <div className="lang-fitness-main-layout">
        {/* Left Exercises Sidebar */}
        <aside className="lang-fitness-sidebar">
          <div className="lang-fitness-sidebar-title">Exercises</div>
          
          <div className="lang-fitness-exercise-list">
            {exercises.map((category) => (
              <button
                key={category}
                className={`fitness-exercise-btn ${activeCategory === category && activeTab === "dashboard" ? "lang-active" : ""}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Capsule Back Button */}
          <div className="lang-fitness-back-container">
            <button className="lang-fitness-back-btn" onClick={handleBack}>
              <span>←</span> BACK
            </button>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="lang-fitness-content-area">
          <canvas ref={mainCanvasRef} className="lang-fitness-bg-video" />
          <div className="lang-fitness-video-overlay" />

          {/* Content wrapper */}
          <div className="lang-fitness-content-wrapper">
            
            {/* Global Search Bar (available in all tabs) */}
            <div className="lang-fitness-search-container">
              <div className="lang-fitness-search-bar">
                <span className="lang-fitness-search-icon">
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
                  className="lang-fitness-search-input"
                  placeholder="Search exercises, products, advisors, FAQs, certifications..."
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (val.trim().length > 0) {
                      setActiveTab("dashboard"); // Typing instantly pulls results directly on Language homepage!
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
              </div>

              {/* Suggestions dropdown overlay */}
              {showSuggestions && searchQuery.trim().length > 0 && (
                <div className="lang-fitness-search-suggestions">
                  {getSuggestions().length > 0 ? (
                    getSuggestions().map((item, idx) => (
                      <div
                        key={idx}
                        className="lang-fitness-suggestion-item"
                        onMouseDown={() => handleSuggestionClick(item)}
                      >
                        {item.label}
                      </div>
                    ))
                  ) : (
                    <div className="lang-fitness-suggestion-no-results">
                      No matching features found. Try "Dumbbells", "CPT", "Huberman" or "Bench".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CONDITIONAL TAB RENDERING */}

            {/* TAB 0: Main Dashboard (Fuses Landing View with Real-time Full-Screen Search Panel) */}
            {activeTab === "dashboard" && searchQuery.trim().length === 0 && (
              <>
                <div className="lang-fitness-header-group" style={{ textAlign: 'center', zIndex: 10, position: 'relative' }}>
                  <h1 className="lang-hero-title" style={{ color: 'white', marginTop: '20px', marginBottom: '10px' }}>
                    Your Language Learning Journey Starts Here
                  </h1>
                  <p className="lang-hero-subtitle" style={{ color: 'white' }}>
                    Join a community of language lovers, practice with native speakers, and achieve fluency faster
                  </p>
                </div>

                <div className="lang-quote-card">
                  <div className="lang-quote-card-content">
                    In today's globalized world, learning languages opens doors to new opportunities, connects people across cultures, and enhances cognitive skills.
                  </div>
                </div>
              </>
            )}

            {activeTab === "dashboard" && searchQuery.trim().length > 0 && (
              /* Dynamic Full-Screen Live Search results Console sitting on EKG Canvas */
              <div className="lang-fitness-search-results-section">
                <div className="lang-search-results-header">
                  <div className="lang-search-results-info">
                    <h2>SEARCH RESULTS FOR: "{searchQuery.toUpperCase()}"</h2>
                    <p>We found {getFullSearchResults().length} active features in the Language Zone matching your keywords</p>
                  </div>
                  <button className="lang-clear-search-btn" onClick={() => setSearchQuery("")}>
                    Clear Search &times;
                  </button>
                </div>

                {getFullSearchResults().length > 0 ? (
                  <div className="lang-search-results-grid">
                    {getFullSearchResults().map((result, idx) => (
                      <div key={idx} className="lang-search-result-card">
                        <span className="lang-result-badge">
                          {renderResultBadgeIcon(result.type)} {result.category}
                        </span>
                        
                        <div className="lang-result-content">
                          <h3 className="lang-result-title">{result.name}</h3>
                          <span className="lang-result-subtitle">{result.subtitle}</span>
                          <p className="lang-result-desc">{result.desc}</p>
                          
                          <div className="lang-result-actions">
                            {result.type === "exercise" && (
                              <button className="lang-cert-enroll-btn" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => { setIsModalOpen(true); setModalSelectedExercise(result.refId); setShowVideo(false); setUseYoutube(true); }}>
                                Play Workout Tutorial
                              </button>
                            )}
                            {result.type === "product" && (
                              <button className="lang-product-add-btn" onClick={() => addToCart(result.item)}>
                                Add to Cart (${result.item.price})
                              </button>
                            )}
                            {result.type === "advisor" && (
                              <button className="lang-advisor-book-btn" onClick={() => initiateBooking(result.item)}>
                                Book Consultation
                              </button>
                            )}
                             {result.type === "certification" && (
                              <button className="lang-cert-enroll-btn" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => routeToFeatureTab(result.type, result.refId)}>
                                View Cert Details
                              </button>
                            )}
                            {result.type === "membership" && (
                              <button className="lang-cert-enroll-btn" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => { setActiveTab("members"); setSearchQuery(""); }}>
                                Join & Add Members
                              </button>
                            )}
                            {result.type.startsWith("calculator") && (
                              <button className="lang-cert-enroll-btn" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => routeToFeatureTab(result.type, result.refId)}>
                                Use Calculator Widget
                              </button>
                            )}
                            {result.type === "faq" && (
                              <button className="lang-cert-enroll-btn" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => routeToFeatureTab(result.type, result.refId)}>
                                View on Help Desk
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="lang-empty-cart-view">
                    <div className="lang-empty-cart-icon">🔍</div>
                    <h3>No direct matches found in our directory</h3>
                    <p>Try searching for "CPT", "Huberman", "Whey Isolate", "Chest", or "BMI" to see matching fitness tools.</p>
                    <button className="lang-back-store-btn" onClick={() => setSearchQuery("")}>
                      Return to Homepage
                    </button>
                  </div>
                )}
              </div>
            )}


            {/* TAB 1: Certifications */}
            {activeTab === "certification" && (
              <div className="lang-fitness-section-container">
                <div className="lang-fitness-section-header">
                  <h1 className="lang-fitness-section-heading">PROFESSIONAL CERTIFICATIONS</h1>
                  <p className="lang-fitness-section-subheading">Accelerate your career with elite academy-recognized training degrees</p>
                </div>

                <div className="lang-cert-grid">
                  {certifications.map((cert) => {
                    const progress = enrolledCerts[cert.id];
                    const isEnrolled = progress !== undefined;
                    return (
                      <div key={cert.id} id={cert.id} className={`lang-cert-card ${isEnrolled ? "enrolledCerts" : ""}`}>
                        <div className="lang-cert-image-wrapper" style={{ width: '100%', height: '140px', overflow: 'hidden', borderRadius: '8px', marginBottom: '15px' }}>
                          <img src={cert.image} alt={cert.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span className="lang-cert-difficulty" style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)' }}>{cert.difficulty}</span>
                        </div>
                        <h3 className="lang-cert-name">{cert.name}</h3>
                        <span className="lang-cert-body">{cert.body}</span>
                        <p className="lang-cert-desc">{cert.desc}</p>
                        
                        <div className="lang-cert-meta">
                          <span>⏱️ {cert.modules} Modules</span>
                          <span className="lang-cert-price">${cert.price}</span>
                        </div>

                        {!isEnrolled ? (
                          <button className="lang-cert-enroll-btn" onClick={() => handleEnrollCert(cert.id)}>
                            Enroll Course
                          </button>
                        ) : (
                          <div className="lang-cert-progress-area">
                            <div className="lang-cert-progress-text">
                              <span>Module Progress</span>
                              <span className="lang-progress-pct">{progress}%</span>
                            </div>
                            <div className="lang-cert-progress-bar-bg">
                              <div className="lang-cert-progress-bar-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                            {progress < 100 ? (
                              <button className="lang-cert-study-btn" onClick={() => handleStudyModule(cert.id)}>
                                Study Next Module 📖
                              </button>
                            ) : (
                              <div className="lang-cert-completed-badge">
                                👑 CERTIFIED TRAINER
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Resources (E-Commerce Gym Power Store) */}
            {activeTab === "resources" && (
              <div className="lang-fitness-section-container">
                <div className="lang-fitness-section-header">
                  <h1 className="lang-fitness-section-heading">GYM POWER STORE</h1>
                  <p className="lang-fitness-section-subheading">Fuel your workouts and support joint safety with premium gym essentials</p>
                </div>

                <div className="lang-shop-grid">
                  {products.map((prod) => (
                    <div key={prod.id} id={prod.id} className="lang-product-card">
                      <div className="lang-product-image-container">
                        <img src={prod.image} alt={prod.name} className="lang-product-image" />
                        <span className="lang-product-category">{prod.category}</span>
                      </div>
                      <div className="lang-product-info">
                        <h3 className="lang-product-title">{prod.name}</h3>
                        <div className="lang-product-rating">
                          {"⭐".repeat(prod.rating)}
                          <span className="lang-product-rating-count">(4.9)</span>
                        </div>
                        <p className="lang-product-desc">{prod.desc}</p>
                        <div className="lang-product-bottom">
                          <span className="lang-product-price">${prod.price}</span>
                          <button className="lang-product-add-btn" onClick={() => addToCart(prod)}>
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
              <div className="lang-fitness-section-container">
                <div className="lang-fitness-section-header">
                  <h1 className="lang-fitness-section-heading">OUR PHILOSOPHY & VISION</h1>
                  <p className="lang-fitness-section-subheading">Merging biomechanical integrity with neural physical peak capacity</p>
                </div>

                <div className="lang-about-metrics-row">
                  <div className={`metric-box ${statsPulse ? "pulse" : ""}`}>
                    <span className="lang-metric-val">{stats.activeMembers.toLocaleString()}</span>
                    <span className="lang-metric-lbl">ACTIVE ATHLETES</span>
                  </div>
                  <div className={`metric-box ${statsPulse ? "pulse" : ""}`}>
                    <span className="lang-metric-val">{stats.workoutsLogged.toLocaleString()}</span>
                    <span className="lang-metric-lbl">WORKOUTS COMPLETED</span>
                  </div>
                  <div className={`metric-box ${statsPulse ? "pulse" : ""}`}>
                    <span className="lang-metric-val">{stats.tonsLifted.toLocaleString()}T</span>
                    <span className="lang-metric-lbl">TONS SHIFTED</span>
                  </div>
                </div>

                <div className="lang-about-interactive-box">
                  <p className="lang-about-intro-text">
                    At **Language Zone**, we don't believe in generic protocols. We develop programs that fuse neuromuscular alignment, hypertrophy principles, and cardiovascular efficiency.
                  </p>
                  <button className="lang-about-stimulate-btn" onClick={addSimulatedWorkout}>
                    🏋️ Log Simulated Gym Workout (+1 Rep)
                  </button>
                </div>

                <div className="lang-about-values-grid">
                  <div className="lang-value-card">
                    <h4>🔬 Clinical Integrity</h4>
                    <p>Every rep structure, rest period, and metabolic loading recommendation is built on vetted kinesiology literature.</p>
                  </div>
                  <div className="lang-value-card">
                    <h4>🦾 Joint Longevity</h4>
                    <p>We prioritize structural posture, range of motion (ROM) safety, and rotator cuff integrity above absolute heavy weight.</p>
                  </div>
                  <div className="lang-value-card">
                    <h4>📈 Linear Progression</h4>
                    <p>Sustainable results require structured incremental load scaling. We provide the tools to systematically track your mechanical stress.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Talk to Advisors */}
            {activeTab === "advisor" && (
              <div className="lang-fitness-section-container">
                <div className="lang-fitness-section-header">
                  <h1 className="lang-fitness-section-heading">WORLD CLASS ATHLETIC ADVISORS</h1>
                  <p className="lang-fitness-section-subheading">Consult with top science-based researchers, IFBB pros, and biomechanics gurus</p>
                </div>

                {bookings.length > 0 && (
                  <div className="lang-active-bookings-console">
                    <h3>📅 Your Scheduled Consultations</h3>
                    <div className="lang-bookings-list">
                      {bookings.map((b) => (
                        <div key={b.id} className="lang-booking-ticket">
                          <div>
                            <strong>{b.advisorName}</strong> - {b.specialty}
                            <div className="lang-booking-time-details">Slot: {b.date} at {b.time}</div>
                          </div>
                          <span className="lang-booking-ref-badge">REF: {b.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="lang-advisors-grid">
                  {advisors.map((adv) => (
                    <div key={adv.id} id={adv.id} className="lang-advisor-card">
                      <div className="lang-advisor-header">
                        <img src={adv.image} alt={adv.name} className="lang-advisor-avatar" style={{ objectFit: 'cover' }} />
                        <div className="lang-advisor-header-meta">
                          <h3 className="lang-advisor-name">{adv.name}</h3>
                          <span className="lang-advisor-specialty">{adv.specialty}</span>
                        </div>
                      </div>

                      <div className="lang-advisor-body">
                        <p className="lang-advisor-bio">{adv.bio}</p>
                        
                        <div className="lang-advisor-stats">
                          <span className="lang-advisor-rating">⭐ {adv.rating}</span>
                          <span className="lang-advisor-reviews">({adv.reviews} consults)</span>
                          <span className={`advisor-status ${adv.status.toLowerCase().replace(" ", "-")}`}>
                            ● {adv.status}
                          </span>
                        </div>

                        <button className="lang-advisor-book-btn" onClick={() => initiateBooking(adv)}>
                          Book Consultation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Booking Scheduler Modal Popup */}
                {bookingAdvisor && (
                  <div className="lang-booking-modal-overlay" onClick={() => setBookingAdvisor(null)}>
                    <div className="lang-booking-modal" onClick={(e) => e.stopPropagation()}>
                      <button className="lang-booking-modal-close" onClick={() => setBookingAdvisor(null)}>&times;</button>
                      {!bookingSuccess ? (
                        <form onSubmit={handleConfirmBooking} className="lang-booking-form">
                          <h2>Schedule Session</h2>
                          <p className="lang-booking-lead">Book an interactive video slot with <strong>{bookingAdvisor.name}</strong></p>
                          <div className="lang-booking-advisor-tagline">{bookingAdvisor.specialty}</div>

                          <div className="lang-form-group">
                            <label>Choose Date</label>
                            <input
                              type="date"
                              required
                              value={bookingDate}
                              onChange={(e) => setBookingDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="lang-booking-input"
                            />
                          </div>

                          <div className="lang-form-group">
                            <label>Choose Slot Time</label>
                            <select
                              value={bookingTime}
                              onChange={(e) => setBookingTime(e.target.value)}
                              className="lang-booking-input"
                            >
                              <option value="09:00">09:00 AM (EST)</option>
                              <option value="11:30">11:30 AM (EST)</option>
                              <option value="14:00">02:00 PM (EST)</option>
                              <option value="16:30">04:30 PM (EST)</option>
                              <option value="19:00">07:00 PM (EST)</option>
                            </select>
                          </div>

                          <button type="submit" className="lang-booking-submit-btn">
                            Confirm Appointment
                          </button>
                        </form>
                      ) : (
                        <div className="lang-booking-success-view">
                          <div className="lang-success-checkmark">✔</div>
                          <h2>Appointment Reserved!</h2>
                          <p>Your session with <strong>{bookingAdvisor.name}</strong> has been secured.</p>
                          <div className="lang-success-booking-card">
                            <div><strong>Slot Date:</strong> {bookingDate}</div>
                            <div><strong>Slot Time:</strong> {bookingTime}</div>
                            <div><strong>Reference ID:</strong> MZ-AD-{Math.floor(1000 + Math.random() * 9000)}</div>
                          </div>
                          <p className="lang-success-note">A confirmation email with the secure video invite link has been dispatched.</p>
                          <button className="lang-booking-done-btn" onClick={() => setBookingAdvisor(null)}>
                            Close Roster Window
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Help & Calculators */}
            {activeTab === "help" && (
              <div className="lang-fitness-section-container">
                <div className="lang-fitness-section-header">
                  <h1 className="lang-fitness-section-heading">ATHLETIC HELPDESK</h1>
                  <p className="lang-fitness-section-subheading">Expand your anatomical knowledge, test your lift metrics, and contact safety advisors</p>
                </div>

                <div className="lang-help-panels-grid">
                  {/* Left Column - FAQs & Help Tickets */}
                  <div className="lang-help-left-col">
                    <div className="lang-help-block">
                      <h3>❓ Frequently Asked Questions</h3>
                      <div className="lang-faq-list">
                        {faqData.map((faq) => {
                          const isOpen = activeFaqId === faq.id;
                          return (
                            <div key={faq.id} id={faq.id} className={`faq-item ${isOpen ? "open" : ""}`}>
                              <button className="lang-faq-trigger" onClick={() => setActiveFaqId(isOpen ? null : faq.id)}>
                                <span>{faq.question}</span>
                                <span className="lang-faq-arrow">{isOpen ? "▲" : "▼"}</span>
                              </button>
                              {isOpen && (
                                <div className="lang-faq-answer">
                                  <span className="lang-faq-cat-badge">{faq.category}</span>
                                  <p>{faq.answer}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="lang-help-block">
                      <h3>🛡️ Register Support Ticket</h3>
                      {!ticketSuccess ? (
                        <form onSubmit={handleSupportSubmit} className="lang-ticket-form">
                          <div className="lang-form-row-2">
                            <input
                              type="text"
                              placeholder="Your Name"
                              required
                              value={ticketForm.name}
                              onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                              className="lang-ticket-input"
                            />
                            <input
                              type="email"
                              placeholder="Your Email"
                              required
                              value={ticketForm.email}
                              onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                              className="lang-ticket-input"
                            />
                          </div>

                          <div className="lang-form-row-2">
                            <select
                              value={ticketForm.category}
                              onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                              className="lang-ticket-input"
                            >
                              <option value="Workouts">Workouts & Safety</option>
                              <option value="Shop">Shop & Apparel</option>
                              <option value="Certifications">Certifications</option>
                              <option value="Advisor Bookings">Advisor Sessions</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Subject Header"
                              required
                              value={ticketForm.subject}
                              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                              className="lang-ticket-input"
                            />
                          </div>

                          <textarea
                            placeholder="Detail your support issue here..."
                            rows="4"
                            required
                            value={ticketForm.message}
                            onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                            className="lang-ticket-input lang-textarea"
                          />

                          <button type="submit" className="lang-ticket-submit-btn" disabled={isSubmittingTicket}>
                            {isSubmittingTicket ? "Registering..." : "Submit Support Request"}
                          </button>
                        </form>
                      ) : (
                        <div className="lang-ticket-success-box">
                          <div className="lang-ticket-success-icon">🎫</div>
                          <h4>Support Ticket Registered!</h4>
                          <p>Ticket ID: <strong>{ticketNumber}</strong> has been logged to your user session.</p>
                          <p className="lang-ticket-success-note">An advisor will review your query and email you within 12 minutes.</p>
                          <button className="lang-ticket-reset-btn" onClick={() => setTicketSuccess(false)}>
                            Submit Another Query
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Athletic Calculators */}
                  <div className="lang-help-right-col">
                    {/* BMI Calculator */}
                    <div id="bmi-calculator-box" className="lang-calc-card">
                      <h3>📊 Body Mass Index (BMI)</h3>
                      <p className="lang-calc-desc">Analyze your biological mass categories compared to stature metrics</p>
                      
                      <form onSubmit={calculateBmi} className="lang-calc-form">
                        <div className="lang-form-row-2">
                          <input
                            type="number"
                            placeholder="Height (cm)"
                            required
                            value={bmiInput.height}
                            onChange={(e) => setBmiInput({ ...bmiInput, height: e.target.value })}
                            className="lang-calc-input"
                          />
                          <input
                            type="number"
                            placeholder="Weight (kg)"
                            required
                            value={bmiInput.weight}
                            onChange={(e) => setBmiInput({ ...bmiInput, weight: e.target.value })}
                            className="lang-calc-input"
                          />
                        </div>
                        <button type="submit" className="lang-calc-btn">
                          Evaluate BMI Ratio
                        </button>
                      </form>

                      {bmiResult !== null && (
                        <div className="lang-calc-result-box">
                          <div>Your Score: <strong className="lang-calc-score">{bmiResult}</strong></div>
                          <div className="lang-calc-status">
                            Category: {
                              bmiResult < 18.5 ? "🔴 Underweight" :
                              bmiResult < 25 ? "🟢 Normal Weight" :
                              bmiResult < 30 ? "🟡 Overweight" : "🔴 Obese"
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* One-Rep Max Calculator */}
                    <div id="max-calculator-box" className="lang-calc-card">
                      <h3>💪 One-Rep Max (1RM) Estimator</h3>
                      <p className="lang-calc-desc">Calculate your theoretical maximum lift based on muscular failure sets</p>
                      
                      <form onSubmit={calculateOneRepMax} className="lang-calc-form">
                        <div className="lang-form-row-2">
                          <input
                            type="number"
                            placeholder="Load Weight (kg/lbs)"
                            required
                            value={maxRepInput.weight}
                            onChange={(e) => setMaxRepInput({ ...maxRepInput, weight: e.target.value })}
                            className="lang-calc-input"
                          />
                          <input
                            type="number"
                            placeholder="Reps to Failure"
                            required
                            value={maxRepInput.reps}
                            onChange={(e) => setMaxRepInput({ ...maxRepInput, reps: e.target.value })}
                            className="lang-calc-input"
                          />
                        </div>
                        <button type="submit" className="lang-calc-btn">
                          Estimate One-Rep Max
                        </button>
                      </form>

                      {maxRepResult !== null && (
                        <div className="lang-calc-result-box">
                          <div>Estimated 1-RM: <strong className="lang-calc-score">{maxRepResult}</strong></div>
                          <p className="lang-calc-status-sub">
                            Use this metric to structure target zones (e.g. 75% load for hyperthropy reps).
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
              <div className="lang-fitness-section-container">
                <div className="lang-fitness-section-header">
                  <h1 className="lang-fitness-section-heading">YOUR POWER CART</h1>
                  <p className="lang-fitness-section-subheading">Review your products and proceed with MasteryPay secure checkout</p>
                </div>

                {!checkoutSuccess ? (
                  <div className="lang-cart-checkout-layout">
                    {/* Cart Items list */}
                    <div className="lang-cart-left-panel">
                      {cart.length === 0 ? (
                        <div className="lang-empty-cart-view">
                          <div className="lang-empty-cart-icon">🛒</div>
                          <h3>Your Cart is Empty</h3>
                          <p>Head to our Store resources to view premium exercise equipment, performance wear, and science-based supplements.</p>
                          <button className="lang-back-store-btn" onClick={() => setActiveTab("resources")}>
                            Visit Gym Store
                          </button>
                        </div>
                      ) : (
                        <div className="lang-cart-items-wrapper">
                          {cart.map((item) => (
                            <div key={item.id} className="lang-cart-item-card">
                              <div className="lang-cart-item-icon">
                                <img src={item.image} alt={item.name} className="lang-cart-item-image" />
                              </div>
                              <div className="lang-cart-item-info">
                                <h4>{item.name}</h4>
                                <span className="lang-cart-item-price-tag">${item.price} each</span>
                              </div>
                              
                              <div className="lang-cart-qty-controls">
                                <button className="lang-qty-btn" onClick={() => updateCartQuantity(item.id, -1)}>-</button>
                                <span className="lang-qty-val">{item.quantity}</span>
                                <button className="lang-qty-btn" onClick={() => updateCartQuantity(item.id, 1)}>+</button>
                              </div>

                              <div className="lang-cart-item-subtotal">
                                <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                              </div>

                              <button className="lang-cart-remove-btn" onClick={() => removeFromCart(item.id)}>
                                &times;
                              </button>
                            </div>
                          ))}

                          <div className="lang-cart-financial-summary">
                            <div className="lang-financial-row">
                              <span>Items Subtotal</span>
                              <span>${getCartTotals().subtotal}</span>
                            </div>
                            <div className="lang-financial-row">
                              <span>Estimated Tax (8%)</span>
                              <span>${getCartTotals().tax}</span>
                            </div>
                            <div className="lang-financial-row">
                              <span>Shipping</span>
                              <span>{getCartTotals().shipping === 0 ? "FREE" : `$${getCartTotals().shipping}`}</span>
                            </div>
                            <hr className="lang-financial-separator" />
                            <div className="lang-financial-row lang-total">
                              <span>Total Due</span>
                              <span className="lang-total-due-text">${getCartTotals().total}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Checkout Form */}
                    {cart.length > 0 && (
                      <div className="lang-cart-right-panel">
                        <div className="lang-checkout-block">
                          <h3>🔒 Secure Portal Checkout</h3>
                          <form onSubmit={handleCheckoutSubmit} className="lang-checkout-form">
                            <div className="lang-form-group">
                              <label>Full Name</label>
                              <input
                                type="text"
                                required
                                value={checkoutForm.name}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                                className="lang-checkout-input"
                                placeholder="John Doe"
                              />
                            </div>

                            <div className="lang-form-group">
                              <label>Email Address</label>
                              <input
                                type="email"
                                required
                                value={checkoutForm.email}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                                className="lang-checkout-input"
                                placeholder="john@example.com"
                              />
                            </div>

                            <div className="lang-form-group">
                              <label>Shipping Address</label>
                              <input
                                type="text"
                                required
                                value={checkoutForm.address}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                                className="lang-checkout-input"
                                placeholder="123 Athletic Way"
                              />
                            </div>

                            <div className="lang-form-row-2">
                              <div className="lang-form-group">
                                <label>Zip / Postal Code</label>
                                <input
                                  type="text"
                                  required
                                  value={checkoutForm.zip}
                                  onChange={(e) => setCheckoutForm({ ...checkoutForm, zip: e.target.value })}
                                  className="lang-checkout-input"
                                  placeholder="10001"
                                />
                              </div>
                              <div className="lang-form-group">
                                <label>MasteryPay Secure Code</label>
                                <input
                                  type="text"
                                  required
                                  value={checkoutForm.cvv}
                                  onChange={(e) => setCheckoutForm({ ...checkoutForm, cvv: e.target.value })}
                                  className="lang-checkout-input"
                                  placeholder="***"
                                  maxLength="4"
                                />
                              </div>
                            </div>

                            <div className="lang-form-group">
                              <label>Credit Card Number</label>
                              <input
                                type="text"
                                required
                                value={checkoutForm.card}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, card: e.target.value })}
                                className="lang-checkout-input"
                                placeholder="4111 2222 3333 4444"
                              />
                            </div>

                            <div className="lang-form-group">
                              <label>Card Expiry</label>
                              <input
                                type="text"
                                required
                                value={checkoutForm.expiry}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, expiry: e.target.value })}
                                className="lang-checkout-input"
                                placeholder="MM/YY"
                              />
                            </div>

                            <button type="submit" className="lang-place-order-btn" disabled={isCheckoutProcessing}>
                              {isCheckoutProcessing ? "Processing Secure payment..." : `Authorize Payment of $${getCartTotals().total}`}
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="lang-checkout-success-container">
                    <div className="lang-checkout-success-checkmark">✔</div>
                    <h2>Secure Payment Authorized!</h2>
                    <p className="lang-success-order-msg">Your transaction was cleared successfully. Order ID: <strong>{orderId}</strong></p>
                    <div className="lang-success-receipt-card">
                      <h4>📦 Shipment Details</h4>
                      <p>Your gear is being packed by our Athletic Logistics partners. Estimated delivery: 2-3 Business Days.</p>
                      <span className="lang-secure-badge">MasteryPay Secure Clearance: MZ-206-OK</span>
                    </div>
                    <button className="lang-continue-shopping-btn" onClick={() => { setCheckoutSuccess(false); setActiveTab("resources"); }}>
                      Continue Store Shopping
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: Gym Membership & Family Roster */}
            {activeTab === "members" && (
              <div className="lang-fitness-section-container">
                <div className="lang-fitness-section-header">
                  <h1 className="lang-fitness-section-heading">GYM MEMBER PORTAL</h1>
                  <p className="lang-fitness-section-subheading">Configure your premium plan, build your family fitness roster, and customize your glassmorphic pass</p>
                </div>

                {!membershipSuccess ? (
                  <div className="lang-membership-layout">
                    {/* Left Panel: Plan Setup & Family Roster builder */}
                    <div className="lang-membership-left-panel">
                      {/* Step 1: Base Tier & Cycle Selector */}
                      <div className="lang-roster-form-box" id="membership-pricing">
                        <h3>1. Choose Your Tier & Billing Cycle</h3>
                        <div className="lang-membership-cycle-toggle-container">
                          <span className={membershipForm.cycle === "monthly" ? "active-cycle" : ""} onClick={() => setMembershipForm({ ...membershipForm, cycle: "monthly" })}>Monthly Billing</span>
                          <div className={`cycle-switch-pill ${membershipForm.cycle === "annual" ? "annual" : ""}`} onClick={() => setMembershipForm(prev => ({ ...prev, cycle: prev.cycle === "monthly" ? "annual" : "monthly" }))}>
                            <div className="lang-cycle-switch-knob"></div>
                          </div>
                          <span className={membershipForm.cycle === "annual" ? "active-cycle" : ""} onClick={() => setMembershipForm({ ...membershipForm, cycle: "annual" })}>
                            Annual Billing <span className="lang-save-badge">SAVE 20%</span>
                          </span>
                        </div>

                        <div className="lang-pricing-grid">
                          {/* Silver Tier */}
                          <div className={`pricing-card ${membershipForm.tier === "silver" ? "selected" : ""}`} onClick={() => setMembershipForm({ ...membershipForm, tier: "silver" })}>
                            <div className="lang-tier-badge">Silver</div>
                            <div className="lang-tier-price">
                              ${membershipForm.cycle === "annual" ? "23.99" : "29.99"}<span>/mo</span>
                            </div>
                            <ul className="lang-tier-features">
                              <li>✔ Full gym floor access</li>
                              <li>✔ Standard weights & cardio zones</li>
                              <li>✔ Locker room & showers</li>
                              <li>✖ Group workouts & sauna</li>
                              <li>✖ VIP Lounge & advisors</li>
                            </ul>
                          </div>

                          {/* Gold Tier */}
                          <div className={`pricing-card ${membershipForm.tier === "gold" ? "selected" : ""}`} onClick={() => setMembershipForm({ ...membershipForm, tier: "gold" })}>
                            <div className="lang-tier-badge lang-gold">Gold Elite</div>
                            <div className="lang-tier-price">
                              ${membershipForm.cycle === "annual" ? "47.99" : "59.99"}<span>/mo</span>
                            </div>
                            <ul className="lang-tier-features">
                              <li>✔ Full gym floor access</li>
                              <li>✔ Standard weights & cardio zones</li>
                              <li>✔ Group fitness classes</li>
                              <li>✔ Full sauna & spa zones</li>
                              <li>✖ VIP Lounge & advisors</li>
                            </ul>
                          </div>

                          {/* Platinum Tier */}
                          <div className={`pricing-card platinum ${membershipForm.tier === "platinum" ? "selected" : ""}`} onClick={() => setMembershipForm({ ...membershipForm, tier: "platinum" })}>
                            <div className="lang-tier-badge lang-platinum">Platinum Legend</div>
                            <div className="lang-tier-price">
                              ${membershipForm.cycle === "annual" ? "79.99" : "99.99"}<span>/mo</span>
                            </div>
                            <ul className="lang-tier-features">
                              <li>✔ Unlimited standard gym access</li>
                              <li>✔ Access to all group classes & saunas</li>
                              <li>✔ 1-on-1 athletic advisor chats</li>
                              <li>✔ VIP Lounge & recovery suites</li>
                              <li>✔ Free Shaker Bottle on sign-up</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Primary Member Details */}
                      <form onSubmit={handleMembershipSubmit} className="lang-roster-form-box">
                        <h3>2. Primary Member Details</h3>
                        <div className="lang-form-row-2">
                          <div className="lang-form-group">
                            <label>Passholder Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Type pass name..."
                              value={membershipForm.primaryName}
                              onChange={(e) => setMembershipForm({ ...membershipForm, primaryName: e.target.value })}
                              className="lang-checkout-input"
                            />
                          </div>
                          <div className="lang-form-group">
                            <label>Email Address</label>
                            <input
                              type="email"
                              required
                              placeholder="john@example.com"
                              value={membershipForm.email}
                              onChange={(e) => setMembershipForm({ ...membershipForm, email: e.target.value })}
                              className="lang-checkout-input"
                            />
                          </div>
                        </div>

                        {/* Step 3: Family/Friends Roster Builder */}
                        <div className="lang-roster-builder-section">
                          <h3>3. Configure Family & Friends Roster</h3>
                          <p className="lang-roster-lead-info">Add additional members to work out as a group! Each added member receives heavy discount rates at just <strong>$14.99/mo</strong>.</p>
                          
                          <div className="lang-roster-adder-form">
                            <input
                              type="text"
                              placeholder="Roster Member Name..."
                              value={newRosterMember.name}
                              onChange={(e) => setNewRosterMember({ ...newRosterMember, name: e.target.value })}
                              className="lang-checkout-input"
                              style={{ flex: 1.5 }}
                            />
                            <input
                              type="number"
                              placeholder="Age"
                              value={newRosterMember.age}
                              onChange={(e) => setNewRosterMember({ ...newRosterMember, age: e.target.value })}
                              className="lang-checkout-input"
                              style={{ width: "70px" }}
                            />
                            <select
                              value={newRosterMember.relationship}
                              onChange={(e) => setNewRosterMember({ ...newRosterMember, relationship: e.target.value })}
                              className="lang-checkout-input"
                              style={{ width: "120px" }}
                            >
                              <option value="Spouse">Spouse</option>
                              <option value="Child">Child</option>
                              <option value="Friend">Friend</option>
                            </select>
                            <select
                              value={newRosterMember.goal}
                              onChange={(e) => setNewRosterMember({ ...newRosterMember, goal: e.target.value })}
                              className="lang-checkout-input"
                              style={{ width: "140px" }}
                            >
                              <option value="Strength">Strength</option>
                              <option value="Fat Loss">Fat Loss</option>
                              <option value="Powerlifting">Powerlifting</option>
                              <option value="General Health">General Health</option>
                            </select>
                            <button type="button" className="lang-roster-add-btn" onClick={addRosterMember}>
                              Add Member
                            </button>
                          </div>

                          {/* Secondary Roster Table */}
                          {rosterList.length > 0 && (
                            <table className="lang-roster-table">
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
                                  <tr key={m.id}>
                                    <td><strong>{m.name}</strong></td>
                                    <td>{m.age} yrs</td>
                                    <td><span className="lang-roster-role-badge">{m.relationship}</span></td>
                                    <td>{m.goal}</td>
                                    <td style={{ textAlign: "right" }}>
                                      <button type="button" className="lang-roster-remove-btn" onClick={() => removeRosterMember(m.id)}>&times;</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* Step 4: Membership Roster Checkout */}
                        <div className="lang-roster-checkout-summary">
                          <h3>4. Roster Registration & Billing</h3>
                          <div className="lang-roster-financials">
                            <div className="lang-financial-row">
                              <span>Primary {membershipForm.tier.toUpperCase()} Base Rate</span>
                              <span>${getMembershipTotals().baseRate}</span>
                            </div>
                            {membershipForm.cycle === "annual" && (
                              <div className="lang-financial-row lang-discount">
                                <span>20% Annual Contract Discount</span>
                                <span>-${getMembershipTotals().cycleDiscount}</span>
                              </div>
                            )}
                            <div className="lang-financial-row">
                              <span>Secondary Members Added ({rosterList.length})</span>
                              <span>+${getMembershipTotals().additionalFee}</span>
                            </div>
                            <div className="lang-financial-row">
                              <span>Estimated Roster Tax (8%)</span>
                              <span>+${getMembershipTotals().tax}</span>
                            </div>
                            <hr className="lang-financial-separator" />
                            <div className="lang-financial-row lang-total">
                              <span>Total Monthly Due</span>
                              <span className="lang-total-due-text">${getMembershipTotals().total}</span>
                            </div>
                          </div>

                          <button type="submit" className="lang-place-order-btn" style={{ marginTop: "20px" }} disabled={isMembershipProcessing}>
                            {isMembershipProcessing ? "Processing Roster Signups..." : `Authorize Roster Membership ($${getMembershipTotals().total}/mo)`}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Right Panel: Live Gym Pass Generator & Customizer */}
                    <div className="lang-membership-right-panel lang-pass-preview-container">
                      <div className="lang-pass-customizer-controls">
                        <h3>Pass Theme Customizer</h3>
                        <p className="lang-customizer-lead">Customize highlights, colors, and layout icons of your active digital pass in real-time!</p>
                        
                        <div className="lang-form-group">
                          <label>Choose Neon Theme Color</label>
                          <div className="lang-pass-color-pills">
                            <button type="button" className={`color-pill pink ${membershipForm.accentColor === "#ce77a6" ? "lang-active" : ""}`} onClick={() => setMembershipForm({ ...membershipForm, accentColor: "#ce77a6" })}></button>
                            <button type="button" className={`color-pill cyan ${membershipForm.accentColor === "#00f0ff" ? "lang-active" : ""}`} onClick={() => setMembershipForm({ ...membershipForm, accentColor: "#00f0ff" })}></button>
                            <button type="button" className={`color-pill gold-gold ${membershipForm.accentColor === "#ffd700" ? "lang-active" : ""}`} onClick={() => setMembershipForm({ ...membershipForm, accentColor: "#ffd700" })}></button>
                            <button type="button" className={`color-pill lavender ${membershipForm.accentColor === "#b78bb1" ? "lang-active" : ""}`} onClick={() => setMembershipForm({ ...membershipForm, accentColor: "#b78bb1" })}></button>
                          </div>
                        </div>

                        <div className="lang-form-group">
                          <label>Choose Profile Icon</label>
                          <select
                            value={membershipForm.avatarType}
                            onChange={(e) => setMembershipForm({ ...membershipForm, avatarType: e.target.value })}
                            className="lang-checkout-input"
                          >
                            <option value="athlete">🏋️ Elite Athlete</option>
                            <option value="beast">🦁 Beast Mode</option>
                            <option value="ninja">🥷 Gym Ninja</option>
                            <option value="guru">🧘 Language Guru</option>
                          </select>
                        </div>
                      </div>

                      {/* Live rendered glassmorphic pass */}
                      <div className="lang-digital-pass-card" style={{ borderColor: membershipForm.accentColor, boxShadow: `0 8px 30px rgba(0,0,0,0.7), 0 0 25px ${membershipForm.accentColor}33` }}>
                        <div className="lang-pass-accent-bar" style={{ background: membershipForm.accentColor }}></div>
                        
                        <div className="lang-pass-header">
                          <div className="lang-pass-title">MASTERY ZONE</div>
                          <div className="lang-pass-logo-ekg">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={membershipForm.accentColor} strokeWidth="2.5">
                              <path d="M2 12h3l2-6 3 12 2-10 2 6h8" />
                            </svg>
                          </div>
                        </div>

                        <div className="lang-pass-body">
                          <div className="lang-pass-avatar-box" style={{ background: `rgba(255,255,255,0.03)`, border: `1.5px solid ${membershipForm.accentColor}4D` }}>
                            <span className="lang-pass-avatar-icon">
                              {membershipForm.avatarType === "athlete" ? "🏋️" :
                               membershipForm.avatarType === "beast" ? "🦁" :
                               membershipForm.avatarType === "ninja" ? "🥷" : "🧘"}
                            </span>
                          </div>

                          <div className="lang-pass-details">
                            <div className="lang-pass-label">PASSHOLDER NAME</div>
                            <div className="lang-pass-value">{membershipForm.primaryName || "YOUR NAME HERE"}</div>

                            <div className="lang-pass-meta-row">
                              <div>
                                <div className="lang-pass-label">TIER PLAN</div>
                                <div className="lang-pass-value-badge" style={{ background: `${membershipForm.accentColor}26`, color: membershipForm.accentColor }}>
                                  {membershipForm.tier === "silver" ? "Silver" :
                                   membershipForm.tier === "gold" ? "Gold Elite" : "Platinum Legend"}
                                </div>
                              </div>
                              <div>
                                <div className="lang-pass-label">BILLING CYCLE</div>
                                <div className="lang-pass-value" style={{ fontSize: "12px" }}>
                                  {membershipForm.cycle === "annual" ? "Annual Contract" : "Monthly Recurring"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="lang-pass-footer">
                          <div className="lang-pass-pass-id">PASS REF: MZ-PASS-TEMP</div>
                          <div className="lang-pass-barcode-box">
                            <div className="lang-pass-barcode-bar lang-w-1"></div>
                            <div className="lang-pass-barcode-bar lang-w-2"></div>
                            <div className="lang-pass-barcode-bar lang-w-1"></div>
                            <div className="lang-pass-barcode-bar lang-w-3"></div>
                            <div className="lang-pass-barcode-bar lang-w-1"></div>
                            <div className="lang-pass-barcode-bar lang-w-2"></div>
                            <div className="lang-pass-barcode-bar lang-w-3"></div>
                            <div className="lang-pass-barcode-bar lang-w-1"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Membership Registration Success Screen */
                  <div className="lang-checkout-success-container" style={{ animation: "fadeIn 0.5s ease-out", maxWidth: "850px", margin: "0 auto" }}>
                    <div className="lang-checkout-success-checkmark">✔</div>
                    <h2>Roster Membership Authorized!</h2>
                    <p className="lang-success-order-msg">Welcome to the Elite Mastery Gym! Your group roster has been secured under Contract ID: <strong>MZ-CTR-{Math.floor(100000 + Math.random() * 900000)}</strong></p>

                    <div className="lang-roster-success-grid">
                      {/* Left: Active Roster Summary */}
                      <div className="lang-success-receipt-card" style={{ textAlign: "left" }}>
                        <h4>📋 Activated Workout Roster</h4>
                        <div className="lang-success-roster-list">
                          <div className="lang-success-roster-item lang-primary">
                            <strong>{membershipForm.primaryName}</strong> (Primary Passholder)
                            <div className="lang-success-roster-sub">Plan: {membershipForm.tier.toUpperCase()} | Cycle: {membershipForm.cycle.toUpperCase()}</div>
                          </div>
                          {rosterList.map((m) => (
                            <div key={m.id} className="lang-success-roster-item">
                              <strong>{m.name}</strong> ({m.relationship} - {m.age} yrs)
                              <div className="lang-success-roster-sub">Language Goal: {m.goal}</div>
                            </div>
                          ))}
                        </div>
                        <div className="lang-success-billing-footer">
                          <strong>Active Billing Total:</strong> ${getMembershipTotals().total}/month
                          <div className="lang-secure-badge" style={{ marginTop: "10px" }}>MasteryPay Contract Clearance: MZ-PASS-SECURE</div>
                        </div>
                      </div>

                      {/* Right: finalized digital pass */}
                      <div className="lang-success-pass-display">
                        <div className="lang-digital-pass-card" style={{ borderColor: membershipForm.accentColor, boxShadow: `0 8px 30px rgba(0,0,0,0.7), 0 0 25px ${membershipForm.accentColor}55`, margin: "0 auto" }}>
                          <div className="lang-pass-accent-bar" style={{ background: membershipForm.accentColor }}></div>
                          
                          <div className="lang-pass-header">
                            <div className="lang-pass-title">MASTERY ZONE</div>
                            <div className="lang-pass-logo-ekg">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={membershipForm.accentColor} strokeWidth="2.5">
                                <path d="M2 12h3l2-6 3 12 2-10 2 6h8" />
                              </svg>
                            </div>
                          </div>

                          <div className="lang-pass-body">
                            <div className="lang-pass-avatar-box" style={{ background: `rgba(255,255,255,0.03)`, border: `1.5px solid ${membershipForm.accentColor}4D` }}>
                              <span className="lang-pass-avatar-icon">
                                {membershipForm.avatarType === "athlete" ? "🏋️" :
                                 membershipForm.avatarType === "beast" ? "🦁" :
                                 membershipForm.avatarType === "ninja" ? "🥷" : "🧘"}
                              </span>
                            </div>

                            <div className="lang-pass-details">
                              <div className="lang-pass-label">PASSHOLDER NAME</div>
                              <div className="lang-pass-value">{membershipForm.primaryName}</div>

                              <div className="lang-pass-meta-row">
                                <div>
                                  <div className="lang-pass-label">TIER PLAN</div>
                                  <div className="lang-pass-value-badge" style={{ background: `${membershipForm.accentColor}26`, color: membershipForm.accentColor }}>
                                    {membershipForm.tier === "silver" ? "Silver" :
                                     membershipForm.tier === "gold" ? "Gold Elite" : "Platinum Legend"}
                                  </div>
                                </div>
                                <div>
                                  <div className="lang-pass-label">BILLING CYCLE</div>
                                  <div className="lang-pass-value" style={{ fontSize: "12px" }}>
                                    {membershipForm.cycle === "annual" ? "Annual Contract" : "Monthly Recurring"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="lang-pass-footer">
                            <div className="lang-pass-pass-id">PASS REF: {membershipPassId}</div>
                            <div className="lang-pass-barcode-box">
                              <div className="lang-pass-barcode-bar lang-w-1"></div>
                              <div className="lang-pass-barcode-bar lang-w-2"></div>
                              <div className="lang-pass-barcode-bar lang-w-1"></div>
                              <div className="lang-pass-barcode-bar lang-w-3"></div>
                              <div className="lang-pass-barcode-bar lang-w-1"></div>
                              <div className="lang-pass-barcode-bar lang-w-2"></div>
                              <div className="lang-pass-barcode-bar lang-w-3"></div>
                              <div className="lang-pass-barcode-bar lang-w-1"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button className="lang-continue-shopping-btn" style={{ marginTop: "30px" }} onClick={() => { setMembershipSuccess(false); setRosterList([]); setMembershipForm({ primaryName: "", email: "", tier: "gold", cycle: "monthly", accentColor: "#ce77a6", avatarType: "athlete" }); setActiveTab("dashboard"); }}>
                      Return to Language Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Learn More Interactive Popup Modal */}
      {isModalOpen && (
        <div className="lang-fitness-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="lang-fitness-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <canvas ref={modalCanvasRef} className="lang-fitness-modal-bg-video" />
            <div className="lang-fitness-modal-video-overlay" />

            <button
              className="lang-fitness-modal-close-btn"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>

            <h2 className="lang-fitness-modal-title">EXERCISE TUTORIAL ZONE</h2>
            <p className="lang-fitness-modal-subtitle">
              Select an exercise and play the best guide video in English
            </p>

            <div className="lang-fitness-modal-exercise-grid">
              {exercises.map((category) => (
                <button
                  key={category}
                  className={`fitness-modal-exercise-pill ${modalSelectedExercise === category ? "lang-active" : ""}`}
                  onClick={() => handleModalExerciseSelect(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {!showVideo ? (
              <div className="lang-fitness-modal-controls">
                <button
                  className="lang-fitness-modal-play-btn"
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
                <div className="lang-fitness-video-player-wrapper">
                  {useYoutube ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeVideoMap[modalSelectedExercise]}?autoplay=1`}
                      title={`${modalSelectedExercise} Tutorial Video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div style={{ background: "#0a010c", display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                      {renderExerciseAnimation(modalSelectedExercise)}
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
                    style={{ color: "#ce77a6", cursor: "pointer", textDecoration: "underline", fontSize: "14px", fontWeight: "bold" }}
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
    </div>
  );
};

export default Language;
