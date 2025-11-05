import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Debug: log effective API base URL and environment at startup
// This helps verify that the built app uses the intended endpoint
console.log('[Boot] VITE_API_BASE_URL =', import.meta.env.VITE_API_BASE_URL, {
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
});

createRoot(document.getElementById("root")!).render(<App />);
