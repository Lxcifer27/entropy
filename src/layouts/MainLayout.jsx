import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { useLoading } from '../context/LoadingContext';

const MainLayout = () => {
  const { isLoading, loadingMessage } = useLoading();
  const location = useLocation();
  const [prevPath, setPrevPath] = useState("");
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  
  // Handle smooth page transitions when route changes
  useEffect(() => {
    if (prevPath && prevPath !== location.pathname) {
      setIsPageTransitioning(true);
      const timer = setTimeout(() => {
        setIsPageTransitioning(false);
      }, 300); // Animation duration
      
      return () => clearTimeout(timer);
    }
    
    setPrevPath(location.pathname);
  }, [location.pathname, prevPath]);
  
  // Scroll to top when navigating between pages
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Global Loading Overlay */}
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      
      {/* Fixed Header */}
      <header className="sticky top-0 z-50">
        <Navbar />
      </header>
      
      {/* Main Content */}
      <main 
        className={`flex-grow relative overflow-hidden transition-opacity duration-300 ${
          isPageTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="min-h-[calc(100vh-64px-170px)]">
          <Outlet />
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout; 