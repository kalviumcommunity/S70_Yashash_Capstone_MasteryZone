import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global safeguard: enforce overscroll-behavior-x none to prevent trackpad horizontal swipe-to-navigate
if (typeof window !== 'undefined') {
  try {
    document.documentElement.style.overscrollBehaviorX = 'none';
    if (document.body) document.body.style.overscrollBehaviorX = 'none';
  } catch {}

  // Automatically reload if a new deployment changed chunk hashes while the user had the page open
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Dynamic chunk import failed due to updated build, reloading page...', event);
    const retryKey = 'mz_chunk_preload_retry';
    const lastRetry = sessionStorage.getItem(retryKey);
    const now = Date.now();
    if (!lastRetry || now - parseInt(lastRetry, 10) > 10000) {
      sessionStorage.setItem(retryKey, String(now));
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
