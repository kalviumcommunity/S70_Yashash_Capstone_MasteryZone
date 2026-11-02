import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuCirclePlay,
  LuArrowRight,
  LuCode,
  LuLanguages,
  LuCar,
  LuDumbbell,
  LuRocket,
  LuX,
  LuBookOpen,
  LuCircleCheck
} from "react-icons/lu";

import logoIcon from "../assets/logo_icon_transparent.png";
import illustrationImg from "../assets/login_illustration.png";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(Boolean(token));
  }, []);

  const courses = [
    {
      id: "coding",
      title: "Coding",
      badgeClass: "badge-purple",
      icon: <LuCode size={22} />,
      categoryDesc: "Build real projects and sharpen your problem-solving skills.",
      courseSummary: "HTML, CSS, JavaScript, Python and more.",
      path: "/coding",
    },
    {
      id: "language",
      title: "Language",
      badgeClass: "badge-green",
      icon: <LuLanguages size={22} />,
      categoryDesc: "Learn new languages and connect with the world.",
      courseSummary: "English, Spanish, French, German and more.",
      path: "/language",
    },
    {
      id: "vehicles",
      title: "Vehicles",
      badgeClass: "badge-blue",
      icon: <LuCar size={22} />,
      categoryDesc: "Explore vehicle systems, maintenance and more.",
      courseSummary: "Car basics, maintenance, mechanics and more.",
      path: "/driving",
    },
    {
      id: "gym",
      title: "Gym",
      badgeClass: "badge-pink",
      icon: <LuDumbbell size={22} />,
      categoryDesc: "Build a healthier body and a stronger mindset.",
      courseSummary: "Fitness, workout plans, health and nutrition.",
      path: "/fitness",
    },
  ];

  const handleCourseClick = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate("/login", { state: { from: { pathname: path } } });
    }
  };

  const handleTrackClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate("/profile");
    } else {
      navigate("/login", { state: { from: { pathname: "/profile" } } });
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="mz-landing-page">
      {/* Ambient Radial Background Gradient Glows */}
      <div className="mz-lp-glow mz-lp-glow-tl" aria-hidden="true" />
      <div className="mz-lp-glow mz-lp-glow-tr" aria-hidden="true" />
      <div className="mz-lp-glow mz-lp-glow-br" aria-hidden="true" />

      {/* Top Navigation Bar */}
      <header className="mz-landing-nav lp-nav-anim">
        <div className="mz-nav-inner">
          {/* Logo */}
          <Link to="/" className="mz-nav-logo" aria-label="Mastery Zone Home">
            <img
              src={logoIcon}
              alt="Mastery Zone"
              className="mz-nav-logo-icon"
            />
            <span className="mz-nav-logo-text">Mastery Zone</span>
          </Link>

          {/* Navigation Links */}
          <nav className="mz-nav-center-links">
            <button
              type="button"
              className="mz-nav-link active"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Home
            </button>
            <button
              type="button"
              className="mz-nav-link"
              onClick={() => scrollToSection("courses")}
            >
              Courses
            </button>
            <button
              type="button"
              className="mz-nav-link"
              onClick={handleTrackClick}
            >
              Track
            </button>
            <button
              type="button"
              className="mz-nav-link"
              onClick={() => scrollToSection("about")}
            >
              About
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="mz-nav-actions">
            {isAuthenticated ? (
              <Link to="/home" className="mz-nav-btn-signup">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="mz-nav-btn-login">
                  Login
                </Link>
                <Link to="/signup" className="mz-nav-btn-signup">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="mz-landing-content">
        {/* =================================================================
            HERO SECTION
            ================================================================= */}
        <section className="mz-landing-hero">
          <div className="mz-hero-left">
            <h1 className="mz-hero-heading lp-hero-anim-1">
              Your Journey to <br />
              <span className="mz-hero-gradient-word">Mastery</span> Begins Here
            </h1>

            <p className="mz-hero-subtitle lp-hero-anim-2">
              Learn new skills, track your progress, and build the future you
              want — all in one place. Mastery Zone helps you turn your goals
              into real achievements.
            </p>

            <div className="mz-hero-cta-group lp-hero-anim-3">
              <Link
                to={isAuthenticated ? "/home" : "/signup"}
                className="mz-btn-hero-primary"
              >
                <span>Get Started</span>
                <LuArrowRight size={15} className="mz-btn-arrow-icon" />
              </Link>

              <button
                type="button"
                className="mz-btn-hero-secondary"
                onClick={() => setVideoModalOpen(true)}
              >
                <LuCirclePlay size={20} className="mz-watch-video-icon" />
                <span>Watch Video</span>
              </button>
            </div>
          </div>

          <div className="mz-hero-right lp-illus-anim" aria-hidden="true">
            <div className="mz-hero-illustration-wrap">
              <img
                src={illustrationImg}
                alt="Student learning with Mastery Zone platform"
                className="mz-hero-illustration-img"
              />
            </div>
          </div>
        </section>

        {/* =================================================================
            FOUR INTEREST CATEGORIES (HORIZONTAL FEATURE CARD)
            ================================================================= */}
        <section className="mz-categories-strip-section lp-cat-card-anim">
          <div className="mz-categories-card">
            {courses.map((category, idx) => (
              <div
                key={category.id}
                className={`mz-category-col lp-cat-item-${idx + 1}`}
                onClick={() => handleCourseClick(category.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleCourseClick(category.path);
                  }
                }}
              >
                <div className={`mz-cat-icon-box ${category.badgeClass}`}>
                  {category.icon}
                </div>
                <h3 className="mz-cat-title">{category.title}</h3>
                <p className="mz-cat-desc">{category.categoryDesc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* =================================================================
            EXPLORE OUR COURSES SECTION
            ================================================================= */}
        <section className="mz-courses-section" id="courses">
          <div className="mz-courses-header lp-courses-header-anim">
            <div className="mz-courses-header-left">
              <span className="mz-popular-tag">POPULAR COURSES</span>
              <h2 className="mz-courses-title">Explore Our Courses</h2>
              <p className="mz-courses-sub">
                Learn at your own pace with our carefully curated courses and
                hands-on projects.
              </p>
            </div>

            <Link
              to={isAuthenticated ? "/home" : "/login"}
              className="mz-view-all-link"
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  navigate("/login", { state: { from: { pathname: "/home" } } });
                }
              }}
            >
              <span>View All Courses</span>
              <LuArrowRight size={15} />
            </Link>
          </div>

          <div className="mz-courses-grid">
            {courses.map((course, idx) => (
              <div
                key={course.id}
                className={`mz-course-card lp-course-card-${idx + 1}`}
                onClick={() => handleCourseClick(course.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleCourseClick(course.path);
                  }
                }}
              >
                <div className="mz-course-card-top">
                  <div className={`mz-course-icon-box ${course.badgeClass}`}>
                    {course.icon}
                  </div>
                  <h3 className="mz-course-card-title">{course.title}</h3>
                  <p className="mz-course-card-desc">
                    {course.courseSummary}
                  </p>
                </div>

                <div className="mz-course-card-bottom">
                  <div
                    className="mz-card-arrow-circle"
                    aria-label={`View ${course.title} course`}
                  >
                    <LuArrowRight size={15} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =================================================================
            BOTTOM CTA BANNER
            ================================================================= */}
        <section className="mz-bottom-cta-section lp-banner-anim" id="about">
          <div className="mz-bottom-cta-banner">
            <div className="mz-cta-left">
              <div className="mz-cta-rocket-circle">
                <LuRocket size={24} />
              </div>
              <div className="mz-cta-text-group">
                <h3 className="mz-cta-title">Ready to Build Your Future?</h3>
                <p className="mz-cta-subtitle">
                  Join Mastery Zone today and take the first step towards your
                  goals.
                </p>
              </div>
            </div>

            <Link
              to={isAuthenticated ? "/home" : "/signup"}
              className="mz-cta-btn"
            >
              <span>Get Started</span>
              <LuArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>

      {/* =================================================================
          VIDEO MODAL OVERVIEW
          ================================================================= */}
      {videoModalOpen && (
        <div
          className="mz-video-modal-overlay"
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="mz-video-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mz-video-modal-header">
              <h3>Welcome to Mastery Zone</h3>
              <button
                type="button"
                className="mz-video-close-btn"
                onClick={() => setVideoModalOpen(false)}
              >
                <LuX size={18} />
              </button>
            </div>
            <div className="mz-video-modal-body">
              <div className="mz-video-player-placeholder">
                <div className="mz-video-player-inner">
                  <LuBookOpen size={48} className="mz-video-play-icon" />
                  <h4>Interactive Learning Platform</h4>
                  <p>
                    Explore Coding, Languages, Vehicle Mechanics, and Gym
                    Training with proctored assessments and skill
                    certifications.
                  </p>
                  <ul className="mz-video-features-list">
                    <li>
                      <LuCircleCheck size={16} color="#16a34a" /> Hands-on code editor with real-time feedback
                    </li>
                    <li>
                      <LuCircleCheck size={16} color="#16a34a" /> Guided workouts and nutrition tracking
                    </li>
                    <li>
                      <LuCircleCheck size={16} color="#16a34a" /> Multi-language interactive vocabulary drills
                    </li>
                    <li>
                      <LuCircleCheck size={16} color="#16a34a" /> Automotive maintenance guides & simulation
                    </li>
                  </ul>
                  <Link
                    to="/signup"
                    className="mz-btn-hero-primary"
                    onClick={() => setVideoModalOpen(false)}
                    style={{ marginTop: "18px" }}
                  >
                    <span>Get Started</span>
                    <LuArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
