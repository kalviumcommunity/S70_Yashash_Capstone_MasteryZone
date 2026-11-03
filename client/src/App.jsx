import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css'
import { GlobalLoader, FitnessLoader, CodingLoader, DrivingLoader, LanguageLoader } from "./components/Loaders.jsx";

import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LandingPage from "./components/LandingPage.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { LoadingProvider } from "./context/LoadingContext.jsx";

// Lazy load secondary/authenticated components
const Signup = lazy(() => import("./components/signup.jsx"));
const Login = lazy(() => import("./components/Login.jsx"));
const ForgotPassword = lazy(() => import("./components/FogotPassward.jsx")); 
const ResetPassword = lazy(() => import("./components/ResetPassword.jsx")); 
const Home = lazy(() => import("./components/Home.jsx"));
const Profile = lazy(() => import("./components/Profile.jsx"));
const Progress = lazy(() => import("./components/Progress.jsx"));
const Fitness = lazy(() => import("./components/Fitness.jsx"));
const Coding = lazy(() => import("./components/Coding.jsx"));
const Driving = lazy(() => import("./components/Driving.jsx"));
const Language = lazy(() => import("./components/Language.jsx"));
const MasteryZoneCompilerWorkspace = lazy(() => import("./components/MasteryZoneCompilerWorkspace.jsx"));
const AssessmentReportPage = lazy(() => import("./components/AssessmentReportPage.jsx"));
const MasteryZoneLivePlatform = lazy(() => import("./components/MasteryZoneLive/MasteryZoneLivePlatform.jsx"));
const CertificateVerificationPage = lazy(() => import("./components/CertificateVerificationPage.jsx"));
const ProjectWorkspaceModal = lazy(() => import("./components/ProjectWorkspaceModal.jsx"));
const ChallengeWorkspaceModal = lazy(() => import("./components/ChallengeWorkspaceModal.jsx"));
const FullScreenConceptLearning = lazy(() => import("./components/FullScreenConceptLearning.jsx"));
const PracticalAssignmentModal = lazy(() => import("./components/PracticalAssignmentModal.jsx"));
const ProctoredAssessmentWorkspace = lazy(() => import("./components/ProctoredAssessmentWorkspace.jsx"));
const CertificationExamWorkspace = lazy(() => import("./components/CertificationExamWorkspace.jsx"));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <LoadingProvider>
          <NotificationProvider>
            <Routes>
          {/* Public Landing & Authentication Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Suspense fallback={<GlobalLoader />}><Login /></Suspense>} /> 
          <Route path="/signup" element={<Suspense fallback={<GlobalLoader />}><Signup /></Suspense>} /> 
          <Route path="/forgot-password" element={<Suspense fallback={<GlobalLoader />}><ForgotPassword /></Suspense>} />
          <Route path="/reset-password" element={<Suspense fallback={<GlobalLoader />}><ResetPassword /></Suspense>} />
          <Route path="/reset-password/:token" element={<Suspense fallback={<GlobalLoader />}><ResetPassword /></Suspense>} />

          {/* Protected Routes (Require Valid Session) */}
          {/* 1. Home Route */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <Home />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* 2. Select Interests Route */}
          <Route
            path="/select-interests"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <Home />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* 3. Reports Route */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <Home />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* 4. Recordings Route */}
          <Route
            path="/recordings"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <Home />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* 5. Certificates Route */}
          <Route
            path="/certificates"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <Home />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/certifications"
            element={<Navigate to="/certificates" replace />}
          />
          <Route
            path="/courses"
            element={<Navigate to="/home" replace />}
          />

          {/* 8. Settings Route */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <Home />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/certification-exam/:certId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <CertificationExamWorkspace isStandalone={true} />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify/:certificateId"
            element={
              <Suspense fallback={<GlobalLoader />}>
                <CertificateVerificationPage />
              </Suspense>
            }
          />
          <Route
            path="/certification/verify/:certificateId"
            element={
              <Suspense fallback={<GlobalLoader />}>
                <CertificateVerificationPage />
              </Suspense>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <Progress />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/track"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <Progress />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <Profile />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fitness"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FitnessLoader />}>
                  <Fitness />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coding"
            element={
              <ProtectedRoute>
                <Suspense fallback={<CodingLoader />}>
                  <Coding />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driving"
            element={
              <ProtectedRoute>
                <Suspense fallback={<DrivingLoader />}>
                  <Driving />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/language"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LanguageLoader />}>
                  <Language />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/:sessionId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<CodingLoader />}>
                  <MasteryZoneCompilerWorkspace isProctored={true} />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment-report/:sessionId"
            element={
              <Suspense fallback={<CodingLoader />}>
                <AssessmentReportPage />
              </Suspense>
            }
          />
          <Route
            path="/live"
            element={
              <ProtectedRoute>
                <Suspense fallback={<CodingLoader />}>
                  <MasteryZoneLivePlatform />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting/:meetingId"
            element={
              <Suspense fallback={<CodingLoader />}>
                <MasteryZoneLivePlatform />
              </Suspense>
            }
          />
          <Route
            path="/project-workspace/:projectId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<CodingLoader />}>
                  <ProjectWorkspaceModal isStandalone={true} />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<CodingLoader />}>
                  <ProjectWorkspaceModal isStandalone={true} />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenge-workspace/:challengeId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<CodingLoader />}>
                  <ChallengeWorkspaceModal isStandalone={true} />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/concept-learning/:trackId/:moduleId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<CodingLoader />}>
                  <FullScreenConceptLearning isStandalone={true} />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coding-test/:trackId/:moduleId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<CodingLoader />}>
                  <PracticalAssignmentModal isStandalone={true} />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/proctored-assessment/:trackId/:moduleId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<CodingLoader />}>
                  <ProctoredAssessmentWorkspace isStandalone={true} />
                </Suspense>
              </ProtectedRoute>
            }
          />
          {/* Fallback to default Landing Page */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </LoadingProvider>
      </Router>
      <ToastContainer
        position="top-right"
        theme="light"
        autoClose={1800}
        limit={2}
        newestOnTop={true}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
      />
    </ErrorBoundary>
  );
}

export default App;
