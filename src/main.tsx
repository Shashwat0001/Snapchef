import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clean up any stale dev-sw.js service worker registrations in the browser
// that could emit Workbox precache errors or info logs inside the preview iframe
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      })
      .catch(() => {});
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);

