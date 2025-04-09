/**
 * Creates a memoized version of a function that caches results
 * @param {Function} fn - The function to memoize
 * @param {Function} keyFn - Optional function to generate the cache key
 * @returns {Function} Memoized function
 */
export function memoize(fn, keyFn = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  
  return (...args) => {
    const key = keyFn(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Debounces a function call
 * @param {Function} fn - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttles a function call
 * @param {Function} fn - The function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit = 300) {
  let inThrottle = false;
  
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Creates a one-time use function
 * @param {Function} fn - The function to execute once
 * @returns {Function} Function that will only execute once
 */
export function once(fn) {
  let called = false;
  let result;
  
  return (...args) => {
    if (!called) {
      result = fn(...args);
      called = true;
    }
    return result;
  };
}

/**
 * Measures execution time of a function
 * @param {Function} fn - Function to measure
 * @param {string} name - Optional name for logging
 * @returns {Function} Wrapped function
 */
export function measurePerformance(fn, name = fn.name || 'anonymous') {
  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(`${name} executed in ${(end - start).toFixed(2)}ms`);
    return result;
  };
}

export default {
  memoize,
  debounce,
  throttle,
  once,
  measurePerformance
}; 