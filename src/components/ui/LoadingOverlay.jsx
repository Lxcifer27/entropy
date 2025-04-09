import React, { useState, useEffect } from 'react';

const LoadingOverlay = ({ message = 'Loading...' }) => {
  const [progress, setProgress] = useState(0);
  const [loadingTip, setLoadingTip] = useState('');

  // Loading tips to show randomly while waiting
  const loadingTips = [
    "Analyzing your code with advanced AI...",
    "Finding optimization opportunities...",
    "Generating high-quality improvements...",
    "Preparing beautiful code snapshots...",
    "Scanning for potential issues...",
    "AI models are working their magic..."
  ];

  // Randomly change loading tip every few seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      const randomTip = loadingTips[Math.floor(Math.random() * loadingTips.length)];
      setLoadingTip(randomTip);
    }, 3000);

    return () => clearInterval(tipInterval);
  }, []);

  // Simulate progress animation
  useEffect(() => {
    // Fake progress that moves faster at first, then slows down
    let animationFrame;
    let startTime;
    
    const animateProgress = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      
      // Calculate progress with easing function
      // Goes quickly to 70%, then slows down
      const newProgress = Math.min(
        95, // Never reach 100% until actually done
        Math.floor(100 * (1 - Math.exp(-elapsedTime / 2000)))
      );
      
      setProgress(newProgress);
      
      if (newProgress < 95) {
        animationFrame = requestAnimationFrame(animateProgress);
      }
    };
    
    animationFrame = requestAnimationFrame(animateProgress);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center transition-all duration-300 animate-fadeIn">
      <div className="p-8 bg-gray-800/80 backdrop-blur rounded-xl shadow-2xl border border-gray-700 flex flex-col items-center max-w-md mx-4">
        <div className="relative w-20 h-20 mb-4">
          {/* Multi-layered spinner with glowing effect */}
          <div className="absolute inset-0 rounded-full border-t-3 border-r-3 border-cyan-400 animate-spin shadow-lg shadow-cyan-400/20"></div>
          <div className="absolute inset-2 rounded-full border-b-3 border-l-3 border-cyan-500 animate-spin animate-delay-150 animate-reverse"></div>
          <div className="absolute inset-4 rounded-full border-t-3 border-r-3 border-cyan-600 animate-spin animate-delay-300"></div>
          
          {/* Center dot with pulse effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
          </div>
        </div>
        
        {/* Main loading message */}
        <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
        
        {/* Random loading tip with fade effect */}
        <p className="text-sm text-cyan-300/80 mb-6 text-center h-10 flex items-center animate-pulse">
          {loadingTip}
        </p>
        
        {/* Progress bar with animated gradient */}
        <div className="w-full h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 rounded-full"
            style={{ 
              width: `${progress}%`,
              transition: 'width 0.3s ease-out',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
            }}
          ></div>
        </div>
        
        {/* Progress percentage */}
        <div className="mt-2 text-xs text-gray-400 font-mono">
          {progress}%
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay; 