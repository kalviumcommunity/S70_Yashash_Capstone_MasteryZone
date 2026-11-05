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
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
