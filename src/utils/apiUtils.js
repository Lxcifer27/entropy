import axios from 'axios';

// Use an environment variable with a fallback for the API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Makes a GET request with caching
 * @param {string} endpoint - The API endpoint
 * @param {Object} config - Axios request config
 * @param {boolean} bypassCache - Force skip cache
 * @returns {Promise<any>} Response data
 */
export const fetchWithCache = async (endpoint, config = {}, bypassCache = false) => {
  const cacheKey = `${endpoint}${JSON.stringify(config)}`;
  
  // Check cache first (unless bypassing)
  if (!bypassCache && cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
    // Cache expired, remove it
    cache.delete(cacheKey);
  }
  
  try {
    // Make the actual request
    const response = await apiClient.get(endpoint, config);
    
    // Store in cache
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    
    return response.data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Makes a POST request
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - Request body
 * @param {Object} config - Axios request config
 * @returns {Promise<any>} Response data
 */
export const postData = async (endpoint, data, config = {}) => {
  try {
    const response = await apiClient.post(endpoint, data, config);
    return response.data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Invalidates a specific cache entry or all entries
 * @param {string|null} endpoint - Specific endpoint to invalidate, or null for all
 */
export const invalidateCache = (endpoint = null) => {
  if (endpoint) {
    // Remove specific endpoint matches
    const keysToDelete = [];
    cache.forEach((_, key) => {
      if (key.startsWith(endpoint)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => cache.delete(key));
  } else {
    // Clear entire cache
    cache.clear();
  }
};

export default {
  fetchWithCache,
  postData,
  invalidateCache,
  apiClient
}; 