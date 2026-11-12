import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css'
import { GlobalLoader, CodingLoader } from "./components/Loaders.jsx";

import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
// Resilient lazy loader: handles Vite deployment chunk invalidation seamlessly
const lazyWithRetry = (importFn) =>
  lazy(async () => {
    try {
      return await importFn();
    } catch (err) {
      console.warn("[App] Lazy component import failed, attempting reload...", err);
      const retryKey = "mz_lazy_retry_" + (typeof window !== "undefined" ? window.location.pathname : "root");
      const alreadyRetried = typeof window !== "undefined" ? sessionStorage.getItem(retryKey) : null;
      if (!alreadyRetried && typeof window !== "undefined") {
        sessionStorage.setItem(retryKey, "true");
        window.location.reload();
        return new Promise(() => {}); // Halt promise until browser reload
      }
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(retryKey);
      }
      throw err;
    }
  });

const LandingPage = lazyWithRetry(() => import("./components/LandingPage.jsx"));
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { LoadingProvider } from "./context/LoadingContext.jsx";
import { ThemeProvider, useTheme } from "./context/ThemeContext.jsx";

// Lazy load secondary/authenticated components
const Signup = lazyWithRetry(() => import("./components/signup.jsx"));
const Login = lazyWithRetry(() => import("./components/Login.jsx"));
const ForgotPassword = lazyWithRetry(() => import("./components/ForgotPassword.jsx")); 
const ResetPassword = lazyWithRetry(() => import("./components/ResetPassword.jsx")); 
const Home = lazyWithRetry(() => import("./components/Home.jsx"));
const Profile = lazyWithRetry(() => import("./components/Profile.jsx"));
const Progress = lazyWithRetry(() => import("./components/Progress.jsx"));
const Coding = lazyWithRetry(() => import("./components/Coding.jsx"));
const MasteryZoneCompilerWorkspace = lazyWithRetry(() => import("./components/MasteryZoneCompilerWorkspace.jsx"));
const AssessmentReportPage = lazyWithRetry(() => import("./components/AssessmentReportPage.jsx"));
const MasteryZoneLivePlatform = lazyWithRetry(() => import("./components/MasteryZoneLive/MasteryZoneLivePlatform.jsx"));
const CertificateVerificationPage = lazyWithRetry(() => import("./components/CertificateVerificationPage.jsx"));
const ProjectWorkspaceModal = lazyWithRetry(() => import("./components/ProjectWorkspaceModal.jsx"));
const ChallengeWorkspaceModal = lazyWithRetry(() => import("./components/ChallengeWorkspaceModal.jsx"));
const FullScreenConceptLearning = lazyWithRetry(() => import("./components/FullScreenConceptLearning.jsx"));
const PracticalAssignmentModal = lazyWithRetry(() => import("./components/PracticalAssignmentModal.jsx"));
const ProctoredAssessmentWorkspace = lazyWithRetry(() => import("./components/ProctoredAssessmentWorkspace.jsx"));
const CertificationExamWorkspace = lazyWithRetry(() => import("./components/CertificationExamWorkspace.jsx"));
const HelpSupport = lazyWithRetry(() => import("./components/HelpSupport.jsx"));

import AdminRoute from "./components/Admin/AdminRoute.jsx";
const AdminLayout = lazyWithRetry(() => import("./components/Admin/AdminLayout.jsx"));
const AdminOverview = lazyWithRetry(() => import("./components/Admin/AdminOverview.jsx"));
const AdminUsers = lazyWithRetry(() => import("./components/Admin/AdminUsers.jsx"));
const AdminLiveActivity = lazyWithRetry(() => import("./components/Admin/AdminLiveActivity.jsx"));
const AdminLearningAnalytics = lazyWithRetry(() => import("./components/Admin/AdminLearningAnalytics.jsx"));
const AdminCodingAnalytics = lazyWithRetry(() => import("./components/Admin/AdminCodingAnalytics.jsx"));
const AdminAssessments = lazyWithRetry(() => import("./components/Admin/AdminAssessments.jsx"));
const AdminProctoring = lazyWithRetry(() => import("./components/Admin/AdminProctoring.jsx"));
const AdminProctoringAuditDetail = lazyWithRetry(() => import("./components/Admin/AdminProctoringAuditDetail.jsx"));
const AdminReports = lazyWithRetry(() => import("./components/Admin/AdminReports.jsx"));
const AdminRecordings = lazyWithRetry(() => import("./components/Admin/AdminRecordings.jsx"));
const AdminStorage = lazyWithRetry(() => import("./components/Admin/AdminStorage.jsx"));
const AdminHelpSupport = lazyWithRetry(() => import("./components/Admin/AdminHelpSupport.jsx"));
const AdminSettings = lazyWithRetry(() => import("./components/Admin/AdminSettings.jsx"));

function ThemedToastContainer() {
  const { resolvedTheme } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      theme={resolvedTheme}
      autoClose={1800}
      limit={2}
      newestOnTop={true}
      hideProgressBar={false}
      closeOnClick
      pauseOnHover
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <LoadingProvider>
            <NotificationProvider>
              <Routes>
          {/* Public Landing & Authentication Routes */}
          <Route path="/" element={<Suspense fallback={<GlobalLoader />}><LandingPage /></Suspense>} />
          <Route path="/landing" element={<Suspense fallback={<GlobalLoader />}><LandingPage /></Suspense>} />
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

          {/* Help & Support Route */}
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <HelpSupport />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* 2. Legacy Select Interests Route -> Dedicated Coding Platform */}
          <Route
            path="/select-interests"
            element={<Navigate to="/home" replace />}
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
          {/* Coding Routes */}
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
          <Route path="/practice" element={<Navigate to="/coding" replace />} />
          <Route path="/learn" element={<Navigate to="/coding" replace />} />
          <Route path="/challenges" element={<Navigate to="/coding" replace />} />
          <Route path="/projects" element={<Navigate to="/coding" replace />} />
          <Route path="/assessments" element={<Navigate to="/certificates" replace />} />

          {/* Legacy Unrelated Tracks Redirect to Coding */}
          <Route path="/fitness" element={<Navigate to="/coding" replace />} />
          <Route path="/driving" element={<Navigate to="/coding" replace />} />
          <Route path="/language" element={<Navigate to="/coding" replace />} />
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
          {/* Super Admin Dashboard Routes (Strictly Isolated & Protected) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Suspense fallback={<GlobalLoader />}>
                  <AdminLayout />
                </Suspense>
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/overview" replace />} />
            <Route path="overview" element={<Suspense fallback={<GlobalLoader />}><AdminOverview /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<GlobalLoader />}><AdminUsers /></Suspense>} />
            <Route path="live-activity" element={<Suspense fallback={<GlobalLoader />}><AdminLiveActivity /></Suspense>} />
            <Route path="learning-analytics" element={<Suspense fallback={<GlobalLoader />}><AdminLearningAnalytics /></Suspense>} />
            <Route path="coding-analytics" element={<Suspense fallback={<GlobalLoader />}><AdminCodingAnalytics /></Suspense>} />
            <Route path="assessments" element={<Suspense fallback={<GlobalLoader />}><AdminAssessments /></Suspense>} />
            <Route path="proctoring" element={<Suspense fallback={<GlobalLoader />}><AdminProctoring /></Suspense>} />
            <Route path="proctoring/audit/:sessionId" element={<Suspense fallback={<GlobalLoader />}><AdminProctoringAuditDetail /></Suspense>} />
            <Route path="reports" element={<Suspense fallback={<GlobalLoader />}><AdminReports /></Suspense>} />
            <Route path="recordings" element={<Suspense fallback={<GlobalLoader />}><AdminRecordings /></Suspense>} />
            <Route path="storage" element={<Suspense fallback={<GlobalLoader />}><AdminStorage /></Suspense>} />
            <Route path="help" element={<Suspense fallback={<GlobalLoader />}><AdminHelpSupport /></Suspense>} />
            <Route path="support" element={<Navigate to="/admin/help" replace />} />
            <Route path="settings" element={<Suspense fallback={<GlobalLoader />}><AdminSettings /></Suspense>} />
          </Route>

            {/* Fallback to default Landing Page */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NotificationProvider>
          </LoadingProvider>
        </Router>
        <ThemedToastContainer />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
