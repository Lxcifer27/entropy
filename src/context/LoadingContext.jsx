import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [pendingOperations, setPendingOperations] = useState(0);
  
  // Track load progress for more responsive UI
  const [loadProgress, setLoadProgress] = useState(0);
  const operationsRef = useRef({});
  
  // More efficient cache implementation with LRU mechanism
  const [cache] = useState(() => {
    const cacheMap = new Map();
    const MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory issues
    
    return {
      get: (key) => {
        if (!cacheMap.has(key)) return null;
        
        const item = cacheMap.get(key);
        
        // Check if item has expired
        if (item.expiry && Date.now() - item.timestamp > item.expiry) {
          cacheMap.delete(key);
          return null;
        }
        
        // Update timestamp to mark as recently used
        item.lastAccessed = Date.now();
        return item.value;
      },
      
      set: (key, value, expiryMs = null) => {
        // If cache is full, remove least recently used item
        if (cacheMap.size >= MAX_CACHE_SIZE) {
          let oldestKey = null;
          let oldestAccess = Date.now();
          
          cacheMap.forEach((item, itemKey) => {
            if (item.lastAccessed < oldestAccess) {
              oldestAccess = item.lastAccessed;
              oldestKey = itemKey;
            }
          });
          
          if (oldestKey) {
            cacheMap.delete(oldestKey);
          }
        }
        
        cacheMap.set(key, {
          value,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
          expiry: expiryMs,
        });
      },
      
      delete: (key) => cacheMap.delete(key),
      
      clear: (pattern = null) => {
        if (pattern) {
          const regex = new RegExp(pattern);
          [...cacheMap.keys()].forEach(key => {
            if (regex.test(key)) cacheMap.delete(key);
          });
        } else {
          cacheMap.clear();
        }
      },
      
      size: () => cacheMap.size
    };
  });
  
  // Start a loading operation with a given message and ID
  const startLoading = useCallback((message = 'Loading...', opId = Date.now().toString()) => {
    setLoadingMessage(message);
    setIsLoading(true);
    setPendingOperations(prev => prev + 1);
    setLoadProgress(0);
    
    // Track this operation for progress updates
    operationsRef.current[opId] = { 
      id: opId,
      message,
      startTime: Date.now(),
      progress: 0
    };
    
    return opId;
  }, []);

  // Update the progress of a specific operation
  const updateProgress = useCallback((opId, progress) => {
    if (operationsRef.current[opId]) {
      operationsRef.current[opId].progress = Math.min(100, progress);
      
      // Calculate average progress across all operations
      const operations = Object.values(operationsRef.current);
      if (operations.length > 0) {
        const avgProgress = operations.reduce((sum, op) => sum + op.progress, 0) / operations.length;
        setLoadProgress(avgProgress);
      }
    }
  }, []);

  // Stop all loading operations or a specific one
  const stopLoading = useCallback((opId = null) => {
    if (opId && operationsRef.current[opId]) {
      delete operationsRef.current[opId];
    } else if (!opId) {
      // Clear all operations
      operationsRef.current = {};
    }
    
    setPendingOperations(prev => {
      const newCount = opId ? prev - 1 : 0;
      if (newCount <= 0) {
        setIsLoading(false);
        setLoadingMessage('');
        setLoadProgress(100);
        return 0;
      }
      return newCount;
    });
  }, []);
  
  // Cache management functions
  const getCachedItem = useCallback((key) => {
    return cache.get(key);
  }, [cache]);
  
  const setCachedItem = useCallback((key, value, expiryMs = null) => {
    cache.set(key, value, expiryMs);
  }, [cache]);
  
  const clearCache = useCallback((keyPattern = null) => {
    cache.clear(keyPattern);
  }, [cache]);
  
  // Enhanced wrapped loading function with caching, timeout, and progress
  const withCache = useCallback((fn, key, expiryMs = 5 * 60 * 1000, timeout = 30000) => {
    return async (...args) => {
      // Try to get from cache first
      const cacheKey = `${key}-${JSON.stringify(args)}`;
      const cachedResult = getCachedItem(cacheKey);
      if (cachedResult) return cachedResult;
      
      // Not in cache, we need to execute the function
      const opId = startLoading();
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeout}ms`));
        }, timeout);
      });
      
      try {
        // Race between the function and the timeout
        const resultPromise = fn(...args);
        
        // If the function returns a promise with progress updates
        if (resultPromise.onProgress) {
          resultPromise.onProgress(progress => {
            updateProgress(opId, progress);
          });
        }
        
        const result = await Promise.race([resultPromise, timeoutPromise]);
        
        // Store in cache
        setCachedItem(cacheKey, result, expiryMs);
        return result;
      } finally {
        stopLoading(opId);
      }
    };
  }, [getCachedItem, setCachedItem, startLoading, stopLoading, updateProgress]);
  
  // Create a memoized value object to optimize rerenders
  const contextValue = useMemo(() => ({
    isLoading,
    loadingMessage,
    loadProgress,
    startLoading,
    stopLoading,
    updateProgress,
    getCachedItem,
    setCachedItem,
    clearCache,
    withCache,
    cacheSize: cache.size()
  }), [
    isLoading, 
    loadingMessage,
    loadProgress,
    startLoading, 
    stopLoading,
    updateProgress,
    getCachedItem,
    setCachedItem,
    clearCache,
    withCache,
    cache
  ]);

  // Add safety timeout to clear any hanging loading states
  useEffect(() => {
    if (isLoading) {
      const safetyTimeout = setTimeout(() => {
        console.warn('Force clearing any hanging loading states after timeout');
        setIsLoading(false);
        setLoadingMessage('');
        setPendingOperations(0);
        setLoadProgress(100);
        operationsRef.current = {};
      }, 10000); // 10 second safety timeout
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [isLoading]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}; 