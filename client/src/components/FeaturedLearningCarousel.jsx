import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuArrowRight,
  LuCircleCheck,
  LuLayers,
  LuShieldCheck,
  LuPlay,
  LuCheck,
} from "react-icons/lu";
import "./FeaturedLearningCarousel.css";
import coverProgramming from "../assets/slide_cover_programming_workspace.jpg";
import coverDsa from "../assets/slide_cover_dsa_workspace.jpg";
import coverFullstack from "../assets/slide_cover_fullstack_workspace.jpg";
import coverVideo from "../assets/slide_cover_video_masterclass.jpg";
import coverCert from "../assets/slide_cover_certification.jpg";

export default function FeaturedLearningCarousel({
  onNavigateTab,
  onStartLearning,
  activeTrack = "Python Track",
  challenges = [],
  projects = [],
  solvedCount = 0,
  passedProjectsCount = 0,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeDsaTab, setActiveDsaTab] = useState(0);
  const [activeProjectTab, setActiveProjectTab] = useState(0);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const autoplayTimerRef = useRef(null);
  const carouselRef = useRef(null);

  // Compute live solved challenges count
  const computedSolvedChallenges = useMemo(() => {
    let count = 0;
    (challenges || []).forEach((ch) => {
      if (
        ch.isCompleted ||
        ch.solved ||
        (typeof window !== "undefined" && window.localStorage?.getItem(`mz_ch_solved_${ch.id}`) === "true")
      ) {
        count++;
      }
    });
    return Math.max(count, solvedCount);
  }, [challenges, solvedCount]);

  // Compute live passed projects count
  const computedPassedProjects = useMemo(() => {
    let count = 0;
    (projects || []).forEach((p) => {
      if (
        p.userState?.passed ||
        p.userState?.status === "PASSED" ||
        p.userState?.status === "passed" ||
        (typeof window !== "undefined" && window.localStorage?.getItem(`mz_proj_passed_${p.id}`) === "true")
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
      tag: "⭐ Learn • Practice • Master",
      title: "Master Your Skills with Mastery Zone",
      subtitle:
        "Accelerate your engineering journey with structured curricula, real-world algorithmic challenges, and industry-grade cloud projects.",
      category: activeTrack || "Python Track",
      primaryCtaText: "Start Learning",
      primaryAction: () => onStartLearning?.(),
      theme: "theme-blue-mastery",
      coverImage: coverProgramming,
      isCompleted: false,
    },
    {
      id: "slide_dsa_challenges",
      tag: "🏆 100+ Algorithmic Challenges",
      title: "Data Structures & Algorithms Mastery",
      subtitle:
        "Tackle curated challenges from Arrays to Dynamic Programming with instant 10-test-case validation and execution metrics.",
      category: "Data Structures & Algorithms",
      primaryCtaText: "Explore Challenges",
      primaryAction: () => onNavigateTab?.("challenges"),
      theme: "theme-blue-mastery",
      coverImage: coverDsa,
      isCompleted: computedSolvedChallenges > 0,
      solvedMetric: `${computedSolvedChallenges} / ${challenges?.length || 135} Solved`,
    },
    {
      id: "slide_fullstack_projects",
      tag: "💻 Practical Cloud Engineering",
      title: "Build Real-World Industry Projects",
      subtitle:
        "Architect production-ready full-stack applications with guided milestone tracking in our integrated Cloud IDE workspace.",
      category: "Practical Engineering",
      primaryCtaText: "View Projects",
      primaryAction: () => onNavigateTab?.("projects"),
      theme: "theme-blue-mastery",
      coverImage: coverFullstack,
      isCompleted: computedPassedProjects > 0,
      passedMetric: `${computedPassedProjects} / ${projects?.length || 14} Completed`,
    },
    {
      id: "slide_video_library",
      tag: "📹 1080p Verified Masterclasses",
      title: "Curated Video Course Library",
      subtitle:
        "Learn directly from world-class instructors with embedded interactive notes, chapter markers, and integrated code runners.",
      category: "Video Masterclasses",
      primaryCtaText: "Browse Video Courses",
      primaryAction: () => onNavigateTab?.("videos"),
      theme: "theme-blue-mastery",
      coverImage: coverVideo,
      isCompleted: false,
    },
    {
      id: "slide_certification_credential",
      tag: "🎓 Verified Academic Credentials",
      title: "Earn Official Mastery Certifications",
      subtitle:
        "Pass strict proctoring assessments (20 MCQs + 2 Coding Problems) to earn verifiable credentials recognized across tech teams.",
      category: "Proctored Certification",
      primaryCtaText: "Get Certified",
      primaryAction: () => onNavigateTab?.("certification"),
      theme: "theme-blue-mastery",
      coverImage: coverCert,
      isCompleted: false,
    },
  ], [activeTrack, challenges?.length, computedPassedProjects, computedSolvedChallenges, onNavigateTab, onStartLearning, projects?.length]);

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
    }, 3800);

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

              <div className="mzc-cta-row">
                <button
                  type="button"
                  className="mzc-primary-cta"
                  onClick={slide.primaryAction}
                >
                  <span>{slide.primaryCtaText}</span>
                  <LuArrowRight size={15} />
                </button>

                <div className="mzc-category-badge">
                  <span>{slide.category}</span>
                </div>

                {slide.solvedMetric && (
                  <div className="mzc-category-badge mzc-badge-metric">
                    <LuCircleCheck size={12} color="#10b981" />
                    <span>{slide.solvedMetric}</span>
                  </div>
                )}

                {slide.passedMetric && (
                  <div className="mzc-category-badge mzc-badge-metric">
                    <LuCircleCheck size={12} color="#10b981" />
                    <span>{slide.passedMetric}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Interactive Stage for Algorithmic Challenges */}
            {slide.id === "slide_dsa_challenges" && (
              <div className="mzc-slide-interactive-stage" onClick={(e) => e.stopPropagation()}>
                <div className="mzc-interactive-dsa-card">
                  <div className="mzc-dsa-header">
                    <div className="mzc-dsa-tabs">
                      {["Two Sum #1", "LRU Cache #146", "Graph BFS #200"].map((tName, tIdx) => (
                        <button
                          key={tIdx}
                          type="button"
                          className={`mzc-dsa-tab-btn ${activeDsaTab === tIdx ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDsaTab(tIdx);
                          }}
                        >
                          {tName}
                        </button>
                      ))}
                    </div>
                    <span className="mzc-dsa-status-live">
                      <span className="mzc-dsa-dot" /> Sandboxed Engine
                    </span>
                  </div>

                  <div className="mzc-dsa-code-body">
                    <pre className="mzc-dsa-code-snippet">
                      {activeDsaTab === 0 && `def two_sum(nums, target):\n    lookup = {}\n    for i, n in enumerate(nums):\n        if target - n in lookup:\n            return [lookup[target - n], i]\n        lookup[n] = i`}
                      {activeDsaTab === 1 && `class LRUCache:\n    def __init__(self, cap):\n        self.cap = cap\n        self.cache = OrderedDict()\n    def get(self, k):\n        if k not in self.cache: return -1\n        self.cache.move_to_end(k)\n        return self.cache[k]`}
                      {activeDsaTab === 2 && `def numIslands(grid):\n    visited = set()\n    def bfs(r, c):\n        q = collections.deque([(r, c)])\n        while q:\n            row, col = q.popleft()\n            # explore 4 neighbors`}
                    </pre>
                  </div>

                  <div className="mzc-dsa-footer">
                    <span className="mzc-dsa-metric-pass">
                      <LuCircleCheck size={13} color="#10b981" /> 10/10 Test Cases Passed (100%)
                    </span>
                    <span className="mzc-dsa-runtime">⚡ 14ms (Beats 98.4%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Right Interactive Stage for Full-Stack Projects */}
            {slide.id === "slide_fullstack_projects" && (
              <div className="mzc-slide-interactive-stage" onClick={(e) => e.stopPropagation()}>
                <div className="mzc-interactive-proj-card">
                  <div className="mzc-proj-header">
                    <span className="mzc-proj-title-tag">
                      <LuLayers size={13} /> Cloud IDE Architecture
                    </span>
                    <span className="mzc-proj-docker-badge">
                      <span className="mzc-dsa-dot" /> Container Ready
                    </span>
                  </div>

                  <div className="mzc-proj-milestones">
                    {[
                      { title: "M1: Worker Daemon & Event Loop", done: true },
                      { title: "M2: Redis Priority Job Queue", done: true },
                      { title: "M3: Concurrency & Telemetry", done: activeProjectTab === 1 },
                    ].map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className={`mzc-proj-ms-row ${m.done ? "ms-done" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveProjectTab(mIdx);
                        }}
                      >
                        <span className="mzc-ms-check">
                          <LuCheck size={11} />
                        </span>
                        <span className="mzc-ms-label">{m.title}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mzc-proj-tech-row">
                    <span className="mzc-tech-chip">React 19</span>
                    <span className="mzc-tech-chip">Node.js</span>
                    <span className="mzc-tech-chip">Redis</span>
                    <span className="mzc-tech-chip">Docker</span>
                  </div>
                </div>
              </div>
            )}

            {/* Right Interactive Stage for Video Masterclasses */}
            {slide.id === "slide_video_library" && (
              <div className="mzc-slide-interactive-stage" onClick={(e) => e.stopPropagation()}>
                <div className="mzc-interactive-video-card">
                  <div className="mzc-video-card-top">
                    <span className="mzc-video-live-tag">
                      <span className="mzc-video-rec-dot" /> 1080p Masterclass
                    </span>
                    <span className="mzc-video-modules-tag">42 Modules</span>
                  </div>

                  <div className="mzc-video-card-center">
                    <div className="mzc-video-play-orb">
                      <LuPlay size={16} fill="#ffffff" color="#ffffff" style={{ marginLeft: "2px" }} />
                    </div>
                    <div className="mzc-video-info-snippet">
                      <div className="mzc-video-snippet-title">Full-Stack System Architecture</div>
                      <div className="mzc-video-snippet-sub">Interactive Sandboxed Code Runner</div>
                    </div>
                  </div>

                  <div className="mzc-video-footer-row">
                    <span className="mzc-video-res-chip">4K UHD</span>
                    <span className="mzc-video-res-chip">Chapter Bookmarks</span>
                    <span className="mzc-video-res-chip">Embedded Notes</span>
                  </div>
                </div>
              </div>
            )}

            {/* Right Interactive Stage for Proctored Certification */}
            {slide.id === "slide_certification_credential" && (
              <div className="mzc-slide-interactive-stage" onClick={(e) => e.stopPropagation()}>
                <div className="mzc-interactive-cert-card">
                  <div className="mzc-cert-card-header">
                    <span className="mzc-cert-badge-tag">
                      <LuShieldCheck size={14} color="#38bdf8" /> Official Credential
                    </span>
                    <span className="mzc-cert-iso-badge">Verifiable ID</span>
                  </div>

                  <div className="mzc-cert-details">
                    <div className="mzc-cert-specs-grid">
                      <div className="mzc-cert-spec-item">
                        <span className="mzc-cert-spec-num">20</span>
                        <span className="mzc-cert-spec-desc">Proctored MCQs</span>
                      </div>
                      <div className="mzc-cert-spec-item">
                        <span className="mzc-cert-spec-num">2</span>
                        <span className="mzc-cert-spec-desc">Live Algorithms</span>
                      </div>
                      <div className="mzc-cert-spec-item">
                        <span className="mzc-cert-spec-num">80%+</span>
                        <span className="mzc-cert-spec-desc">Pass Mark</span>
                      </div>
                    </div>
                    <div className="mzc-cert-verify-footer">
                      <LuCircleCheck size={13} color="#10b981" /> Cryptographically signed certificate with QR
                    </div>
                  </div>
                </div>
              </div>
            )}
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
