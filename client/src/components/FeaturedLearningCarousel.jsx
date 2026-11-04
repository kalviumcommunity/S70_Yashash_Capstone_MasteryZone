import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuArrowRight,
  LuCircleCheck,
} from "react-icons/lu";
import "./FeaturedLearningCarousel.css";
import coverLearningClean from "../assets/slide_cover_learning_clean.jpg";
import coverChallengesPro from "../assets/slide_cover_challenges_pro.jpg";
import coverProjectsPro from "../assets/slide_cover_projects_pro.jpg";
import coverCertClean from "../assets/slide_cover_certification.jpg";

export default function FeaturedLearningCarousel({
  onNavigateTab,
  onStartLearning,
  activeTrack = "Python Track",
  activeTab = "",
  challenges = [],
  projects = [],
  earnedCertificates = [],
  solvedCount = 0,
  passedProjectsCount = 0,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const autoplayTimerRef = useRef(null);
  const carouselRef = useRef(null);

  // Sync slide with active tab when user switches tabs on the Coding page
  useEffect(() => {
    if (activeTab === "challenges") {
      setCurrentIndex(1);
    } else if (activeTab === "projects") {
      setCurrentIndex(2);
    } else if (activeTab === "certification") {
      setCurrentIndex(3);
    } else if (activeTab === "learning_path") {
      setCurrentIndex(0);
    }
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }
  }, [activeTab]);

  // Compute live solved challenges count strictly scoped to current user
  const computedSolvedChallenges = useMemo(() => {
    let uId = "";
    try {
      const rawUser = typeof window !== "undefined" ? window.localStorage?.getItem("user") : null;
      if (rawUser) {
        const u = JSON.parse(rawUser);
        uId = u._id || u.id || u.userId || "";
      }
    } catch {}

    let count = 0;
    (challenges || []).forEach((ch) => {
      const userSolved = uId && typeof window !== "undefined" && window.localStorage?.getItem(`mz_${uId}_ch_solved_${ch.id}`) === "true";
      if (
        ch.isCompleted ||
        ch.solved ||
        userSolved
      ) {
        count++;
      }
    });
    return Math.max(count, solvedCount);
  }, [challenges, solvedCount]);

  // Compute live passed projects count strictly scoped to current user
  const computedPassedProjects = useMemo(() => {
    let uId = "";
    try {
      const rawUser = typeof window !== "undefined" ? window.localStorage?.getItem("user") : null;
      if (rawUser) {
        const u = JSON.parse(rawUser);
        uId = u._id || u.id || u.userId || "";
      }
    } catch {}

    let count = 0;
    (projects || []).forEach((p) => {
      const userPassed = uId && typeof window !== "undefined" && window.localStorage?.getItem(`mz_${uId}_proj_passed_${p.id}`) === "true";
      if (
        p.userState?.passed ||
        p.userState?.status === "PASSED" ||
        p.userState?.status === "passed" ||
        userPassed
      ) {
        count++;
      }
    });
    return Math.max(count, passedProjectsCount);
  }, [projects, passedProjectsCount]);

  // Real platform slides with dedicated high-definition cover photos and curated copy
  const slides = useMemo(() => [
    {
      id: "slide_core_mastery",
      tag: "Core Engineering Tracks",
      title: "Master Your Skills with Mastery Zone",
      subtitle:
        "Accelerate your engineering journey with structured curricula, real-world algorithmic challenges, and industry-grade cloud projects.",
      category: activeTrack || "Python Track",
      primaryCtaText: "Start Learning",
      primaryAction: () => onStartLearning?.(),
      theme: "theme-blue-mastery",
      coverImage: coverLearningClean,
      isCompleted: false,
    },
    {
      id: "slide_dsa_challenges",
      tag: "Algorithmic Challenges",
      title: "Data Structures & Algorithms Mastery",
      subtitle:
        "Tackle curated challenges from Arrays to Dynamic Programming with instant validation and execution metrics.",
      category: "Data Structures & Algorithms",
      primaryCtaText: "Explore Challenges",
      primaryAction: () => onNavigateTab?.("challenges"),
      theme: "theme-blue-mastery",
      coverImage: coverChallengesPro,
      isCompleted: computedSolvedChallenges > 0,
      stats: [
        `${challenges?.length || 135} Challenges`,
        "Automated Test Execution",
        "Python, C++, Java, JS",
      ],
    },
    {
      id: "slide_fullstack_projects",
      tag: "Industry Projects",
      title: "Build Real-World Industry Projects",
      subtitle:
        "Architect production-ready full-stack applications with guided milestone tracking in our integrated cloud workspace.",
      category: "Practical Engineering",
      primaryCtaText: "View Projects",
      primaryAction: () => onNavigateTab?.("projects"),
      theme: "theme-blue-mastery",
      coverImage: coverProjectsPro,
      isCompleted: computedPassedProjects > 0,
      stats: [
        `${projects?.length || 9} Industry Projects`,
        "5 Guided Milestones",
        "Full-Stack Architecture",
      ],
    },
    {
      id: "slide_certification_credential",
      tag: "Verified Industry Certification",
      title: "Earn Official Mastery Certifications",
      subtitle:
        "Pass strict proctoring assessments (20 MCQs + 2 Coding Problems) to earn verifiable credentials recognized across tech teams.",
      category: "Proctored Certification",
      primaryCtaText: earnedCertificates.length > 0 ? "View Credentials" : "Get Certified",
      primaryAction: () => onNavigateTab?.("certification"),
      theme: "theme-blue-mastery",
      coverImage: coverCertClean,
      isCompleted: earnedCertificates.length > 0,
      stats: [
        `${earnedCertificates.length > 0 ? `${earnedCertificates.length} Verified Credentials` : "5 Professional Tracks"}`,
        "20 MCQs + 2 Coding Problems",
        "Strict 5-Life Proctoring",
      ],
    },
  ], [activeTrack, challenges?.length, computedPassedProjects, computedSolvedChallenges, earnedCertificates, onNavigateTab, onStartLearning, projects?.length]);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
  };

  // 3.8-Second Autoplay with pause on hover & pause on touch
  useEffect(() => {
    if (isPaused) return;

    if (typeof window !== "undefined" && window.matchMedia) {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;
    }

    autoplayTimerRef.current = setInterval(() => {
      nextSlide();
    }, 6500);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isPaused, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      }
    };

    const node = carouselRef.current;
    if (node) {
      node.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (node) {
        node.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [nextSlide, prevSlide]);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  return (
    <div
      ref={carouselRef}
      className="mzc-carousel-wrapper"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Learning Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container Track with dynamic smooth parallax physics */}
      <div
        className="mzc-slides-track"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`mzc-slide-card ${slide.theme} ${idx === currentIndex ? "active" : ""}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${idx + 1} of ${totalSlides}: ${slide.title}`}
            onClick={slide.primaryAction}
            style={{ cursor: "pointer" }}
          >
            {/* Professional Photographic Cover Photo with High-Definition Vignette Overlay */}
            {slide.coverImage && (
              <div className="mzc-cover-photo-wrap" aria-hidden="true">
                <img
                  src={slide.coverImage}
                  alt=""
                  className="mzc-cover-photo-img"
                  loading="lazy"
                />
                <div className="mzc-cover-photo-overlay" />
              </div>
            )}

            {/* Top-Right Completed Badge on Slide Cover Page */}
            {slide.isCompleted && (
              <div className="mzc-cover-completed-badge" aria-label="Completed">
                <LuCircleCheck size={14} /> Completed
              </div>
            )}

            {/* Slide Content: Left Information Column */}
            <div className="mzc-slide-info">
              {slide.tag && (
                <div className="mzc-tag-pill">{slide.tag}</div>
              )}
              <h2 className="mzc-slide-title">{slide.title}</h2>

              <p className="mzc-slide-desc">{slide.subtitle}</p>

              {slide.stats && (
                <div className="mzc-slide-stats-row">
                  {slide.stats.map((st, sIdx) => (
                    <span key={sIdx} className="mzc-slide-stat-chip">
                      {st}
                    </span>
                  ))}
                </div>
              )}

              <div className="mzc-cta-row">
                <button
                  type="button"
                  className="mzc-primary-cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    slide.primaryAction?.();
                  }}
                >
                  <span>{slide.primaryCtaText}</span>
                  <LuArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Navigation Controls (Left & Right Arrow Buttons) */}
      <button
        type="button"
        className="mzc-nav-btn mzc-nav-prev"
        onClick={prevSlide}
        aria-label="Previous Slide"
      >
        <LuChevronLeft size={20} />
      </button>

      <button
        type="button"
        className="mzc-nav-btn mzc-nav-next"
        onClick={nextSlide}
        aria-label="Next Slide"
      >
        <LuChevronRight size={20} />
      </button>

      {/* Slide Indicators / Dots */}
      <div className="mzc-indicators" role="tablist">
        {slides.map((_, dotIdx) => (
          <button
            key={dotIdx}
            type="button"
            className={`mzc-dot ${dotIdx === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(dotIdx)}
            aria-label={`Go to slide ${dotIdx + 1}`}
            role="tab"
            aria-selected={dotIdx === currentIndex}
          />
        ))}
      </div>
    </div>
  );
}
