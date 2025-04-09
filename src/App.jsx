import { useEffect, lazy, Suspense, useCallback, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { useLoading } from "./context/LoadingContext";

// Lazy load pages for better performance
const HomePage = lazy(() => import("./pages/HomePage"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const EnhancePage = lazy(() => import("./pages/EnhancePage"));
const SnapshotPage = lazy(() => import("./pages/SnapshotPage"));
const TranslatePage = lazy(() => import("./pages/TranslatePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ChatHistoryPage = lazy(() => import("./pages/ChatHistoryPage"));

// Enhanced page transition loader with progress indication
const PageLoader = () => {
  const { loadProgress, loadingMessage } = useLoading();
  const displayMessage = loadingMessage || "Loading content...";
  
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] animate-blurIn">
      <div className="relative w-20 h-20 mb-4">
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin"></div>
        <div className="absolute inset-3 rounded-full border-b-2 border-l-2 border-cyan-500 animate-spin animate-reverse animate-delay-150"></div>
        <div className="absolute inset-6 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin animate-delay-300"></div>
        
        {/* Center content logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-sm font-bold">
            <span className="text-white">AI</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-cyan-400 font-medium">{displayMessage}</div>
      
      {/* Progress bar */}
      <div className="w-48 h-1 mt-4 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${loadProgress}%` }}
        ></div>
      </div>
      
      {/* Progress percentage */}
      <div className="mt-2 text-xs text-gray-400">
        {Math.round(loadProgress)}%
      </div>
      
      {/* Subtle shimmer effect below */}
      <div className="w-64 h-0.5 mt-8 animate-shimmer rounded-full"></div>
    </div>
  );
};

function App() {
  const [preloaded, setPreloaded] = useState(false);

  // Add smooth scrolling for anchor links
  const setupAnchorLinks = useCallback(() => {
    const handleAnchorClick = (e) => {
      const target = e.target.closest('a[href^="#"]');
      if (!target) return;
      
      e.preventDefault();
      const targetId = target.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Adjust for navbar height
          behavior: 'smooth'
        });
      }
    };

    // Event delegation to improve performance
    document.body.addEventListener('click', handleAnchorClick);
    return () => document.body.removeEventListener('click', handleAnchorClick);
  }, []);
  
  // Preload critical components with a timeout
  const preloadCriticalAssets = useCallback(async () => {
    if (preloaded) return;
    
    try {
      // Track performance
      const startTime = performance.now();
      
      // Set a timeout to ensure we don't get stuck in preloading
      const timeoutPromise = new Promise(resolve => {
        setTimeout(() => {
          console.warn('Preloading assets timed out - forcing completion');
          resolve();
        }, 5000); // 5 second timeout
      });
      
      // Race between actual preloading and timeout
      await Promise.race([
        Promise.all([
          HomePage,
          ReviewPage
        ].map(component => {
          if (component._payload && component._payload._status === 1) {
            return Promise.resolve(); // Already loaded
          }
          return component._payload._result;
        })),
        timeoutPromise
      ]);
      
      const loadTime = performance.now() - startTime;
      console.log(`Critical assets preloaded in ${Math.round(loadTime)}ms`);
      
      setPreloaded(true);
    } catch (error) {
      console.warn("Error preloading assets:", error);
      // Set preloaded to true anyway to prevent being stuck
      setPreloaded(true);
    }
  }, [preloaded]);
  
  useEffect(() => {
    // Setup anchor links
    const cleanup = setupAnchorLinks();
    
    // Preload after a short delay to not block initial render
    const timer = setTimeout(preloadCriticalAssets, 2000);
    
    // Force preloaded state after a timeout regardless of asset loading
    const forcePreloadedTimer = setTimeout(() => {
      if (!preloaded) {
        console.warn('Forcing preloaded state after timeout');
        setPreloaded(true);
      }
    }, 8000); // 8 second timeout
    
    // Load additional pages after initial render
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        const nonCriticalPages = [LoginPage, SignupPage, PrivacyPolicy];
        Promise.all(nonCriticalPages.map(page => page._payload._result));
      }, { timeout: 5000 });
    }
    
    return () => {
      cleanup();
      clearTimeout(timer);
      clearTimeout(forcePreloadedTimer);
    };
  }, [setupAnchorLinks, preloadCriticalAssets, preloaded]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={
            <Suspense fallback={<PageLoader />}>
              <HomePage />
            </Suspense>
          } />
          <Route path="review" element={
            <Suspense fallback={<PageLoader />}>
              <ReviewPage />
            </Suspense>
          } />
          <Route path="enhance" element={
            <Suspense fallback={<PageLoader />}>
              <EnhancePage />
            </Suspense>
          } />
          <Route path="snapshot" element={
            <Suspense fallback={<PageLoader />}>
              <SnapshotPage />
            </Suspense>
          } />
          <Route path="translate" element={
            <Suspense fallback={<PageLoader />}>
              <TranslatePage />
            </Suspense>
          } />
          <Route path="login" element={
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          } />
          <Route path="signup" element={
            <Suspense fallback={<PageLoader />}>
              <SignupPage />
            </Suspense>
          } />
          <Route path="privacy" element={
            <Suspense fallback={<PageLoader />}>
              <PrivacyPolicy />
            </Suspense>
          } />
          <Route path="history" element={
            <Suspense fallback={<PageLoader />}>
              <ChatHistoryPage />
            </Suspense>
          } />
          <Route path="404" element={
            <Suspense fallback={<PageLoader />}>
              <NotFoundPage />
            </Suspense>
          } />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
