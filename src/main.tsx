import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Debug: log effective API base URL and environment at startup
// This helps verify that the built app uses the intended endpoint

createRoot(document.getElementById("root")!).render(<App />);
