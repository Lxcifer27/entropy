import React, { Suspense, lazy, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { LoadingProvider } from './context/LoadingContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// Fix viewport height on mobile devices
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// Set initial viewport height
setViewportHeight();

// Update on resize and orientation change with throttling
let resizeTimer;
const handleResize = () => {
  if (!resizeTimer) {
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      setViewportHeight();
    }, 100);
  }
};

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', setViewportHeight);

// Enable React Concurrent Mode optimization
if (typeof window !== 'undefined' && 'scheduler' in window) {
  window.scheduler.unstable_shouldYield = () => false;
}

// Styled fallback component for React Suspense with timeout
const SuspenseFallback = () => {
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  useEffect(() => {
    // Force timeout after 10 seconds to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('SuspenseFallback timeout reached, forcing app to load');
      setTimeoutReached(true);
    }, 10000);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // If timeout is reached, show simplified fallback with error message
  if (timeoutReached) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
        <div className="text-2xl font-bold text-white mb-4">
          Entropy <span className="text-cyan-400">AI</span>
        </div>
        <div className="text-lg text-red-400 mb-4">
          Taking longer than expected to load...
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-50 animate-fadeIn">
      <div className="text-2xl font-bold text-white mb-8">
        Entropy <span className="text-cyan-400">AI</span>
      </div>
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-t-4 border-r-4 border-cyan-400 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-b-4 border-l-4 border-cyan-500 animate-spin animate-delay-150 animate-reverse"></div>
        <div className="absolute inset-4 rounded-full border-t-4 border-r-4 border-cyan-600 animate-spin animate-delay-300"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
        </div>
      </div>
      <div className="w-48 h-1 mt-6 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 animate-progress rounded-full"></div>
      </div>
    </div>
  );
};

// Preload critical resources with priority and optimization
const preloadResources = () => {
  // Preload key fonts
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.href = 'https://fonts.googleapis.com/css2?family=Fira+Code&display=swap';
  fontPreload.as = 'style';
  document.head.appendChild(fontPreload);
  
  // Add font stylesheet
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = fontPreload.href;
  document.head.appendChild(fontLink);
  
  // Preconnect to important domains
  ['https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://firestore.googleapis.com'].forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
  
  // Lazy load non-critical JS with requestIdleCallback
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      import('./utils/perfUtils.js');
    }, { timeout: 2000 });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      import('./utils/perfUtils.js');
    }, 2000);
  }
};

// Call the preload function
preloadResources();

// Create an isolated scope for the app mount to prevent memory leaks
const mountApp = () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  root.render(
    <React.StrictMode>
      <LoadingProvider>
        <AuthProvider>
          <Suspense fallback={<SuspenseFallback />}>
            <App />
          </Suspense>
        </AuthProvider>
      </LoadingProvider>
    </React.StrictMode>
  );
  
  // Register service worker if available
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(error => {
        console.error('SW registration failed:', error);
      });
    });
  }
};

// Execute mount function
mountApp();
