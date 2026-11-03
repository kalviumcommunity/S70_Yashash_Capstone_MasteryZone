import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Session Isolation: If the web was reopened after being fully closed or restarted,
// automatically log out and do not remember previous session login details.
if (typeof window !== "undefined") {
  try {
    const hasActiveSession = sessionStorage.getItem("mz_session_active");
    if (!hasActiveSession) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("mz_user");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("Step2Dev_token");
      localStorage.removeItem("mz_persistent_guest");
      sessionStorage.clear();
    }
  } catch (err) {
    console.warn("Session check warning:", err);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
