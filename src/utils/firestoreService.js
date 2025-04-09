import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  doc, 
  deleteDoc,
  writeBatch,
  limit,
  enableIndexedDbPersistence,
  getFirestore,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import { db } from './firebase';

// Maximum number of retries for Firebase operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// Enable offline persistence for better performance and offline capabilities
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firestore persistence unavailable - multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('Firestore persistence not supported in this browser');
    }
  });
} catch (err) {
  console.error('Error enabling persistence:', err);
}

// Helper function to retry Firebase operations
const retryOperation = async (operation, maxRetries = MAX_RETRIES) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try to ensure we're online before attempting operation
      if (attempt > 0) {
        try {
          await enableNetwork(db);
        } catch (e) {
          console.warn('Failed to enable network before retry:', e);
        }
      }
      
      return await operation();
    } catch (error) {
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error;
      
      // Wait before retrying
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
      }
    }
  }
  
  // If we got here, all retries failed
  throw lastError;
};

const COLLECTIONS = {
  CHAT_HISTORY: 'chatHistory',
};

// Improved cache with expiration, size limits, and query signatures
class FirestoreCache {
  constructor(maxSize = 50, ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.lastCleanup = Date.now();
  }
  
  // Create a unique key based on query parameters
  createKey(userId, type, limit) {
    return `${userId}:${type || 'all'}:${limit}`;
  }
  
  get(userId, type, limit) {
    // Auto-cleanup expired items occasionally
    if (Date.now() - this.lastCleanup > 60000) {
      this.cleanup();
    }
    
    const key = this.createKey(userId, type, limit);
    const cachedItem = this.cache.get(key);
    
    if (!cachedItem) return null;
    if (Date.now() - cachedItem.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cachedItem.data;
  }
  
  set(userId, type, limit, data) {
    const key = this.createKey(userId, type, limit);
    
    // Remove oldest items if we've reached capacity
    if (this.cache.size >= this.maxSize) {
      let oldestKey = null;
      let oldestTime = Infinity;
      
      for (const [itemKey, item] of this.cache.entries()) {
        if (item.timestamp < oldestTime) {
          oldestTime = item.timestamp;
          oldestKey = itemKey;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  invalidateUser(userId) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
    this.lastCleanup = now;
  }
}

// Create a singleton instance
const firestoreCache = new FirestoreCache();

// Batch processing for bulk operations
let pendingBatch = null;
let pendingBatchCount = 0;
const MAX_BATCH_SIZE = 500;

// Function to commit batch if it reaches a certain size
const commitBatchIfNeeded = async () => {
  if (pendingBatch && pendingBatchCount >= MAX_BATCH_SIZE) {
    try {
      await pendingBatch.commit();
    } catch (error) {
      console.error('Error committing batch:', error);
    } finally {
      pendingBatch = null;
      pendingBatchCount = 0;
    }
  }
};

// Get or create a batch
const getBatch = () => {
  if (!pendingBatch) {
    pendingBatch = writeBatch(db);
    pendingBatchCount = 0;
  }
  return pendingBatch;
};

// Commit any pending batches explicitly
export const commitPendingBatches = async () => {
  if (pendingBatch && pendingBatchCount > 0) {
    try {
      await pendingBatch.commit();
    } catch (error) {
      console.error('Error committing pending batch:', error);
      throw error;
    } finally {
      pendingBatch = null;
      pendingBatchCount = 0;
    }
  }
};

// Network state management for offline support
export const goOffline = () => disableNetwork(db);
export const goOnline = () => enableNetwork(db);

// Save a new chat entry
export const saveChatHistory = async (userId, type, content, response) => {
  return retryOperation(async () => {
    try {
      const chatData = {
        userId,
        type, // 'review', 'enhance', or 'translate'
        content, // User input
        response, // AI response
        timestamp: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.CHAT_HISTORY), chatData);
      
      // Invalidate cache for this user
      invalidateUserCache(userId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving chat history:', error);
      throw error;
    }
  });
};

// Get chat history for a user with optimized performance
export const getUserChatHistory = async (userId, maxResults = 50) => {
  return retryOperation(async () => {
    try {
      // Check cache first
      const cachedResult = firestoreCache.get(userId, null, maxResults);
      if (cachedResult) {
        return cachedResult;
      }
      
      const q = query(
        collection(db, COLLECTIONS.CHAT_HISTORY),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      
      const querySnapshot = await getDocs(q);
      const history = [];
      
      querySnapshot.forEach((doc) => {
        // Extract data and avoid unnecessary spread which is costly
        const data = doc.data();
        history.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          content: data.content,
          response: data.response,
          // Convert Firebase timestamp to JS Date
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      
      // Store in cache
      firestoreCache.set(userId, null, maxResults, history);
      
      return history;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  });
};

// Delete a chat history entry
export const deleteChatHistoryEntry = async (chatId, userId) => {
  return retryOperation(async () => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CHAT_HISTORY, chatId));
      
      // Invalidate cache if userId is provided
      if (userId) {
        invalidateUserCache(userId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting chat history:', error);
      throw error;
    }
  });
};

// Batch delete multiple chat history entries
export const batchDeleteChatHistory = async (chatIds, userId) => {
  return retryOperation(async () => {
    try {
      const batch = getBatch();
      
      for (const chatId of chatIds) {
        const docRef = doc(db, COLLECTIONS.CHAT_HISTORY, chatId);
        batch.delete(docRef);
        pendingBatchCount++;
        
        // Commit if needed
        if (pendingBatchCount >= MAX_BATCH_SIZE) {
          await commitBatchIfNeeded();
        }
      }
      
      // Commit any remaining operations
      await commitPendingBatches();
      
      // Invalidate cache
      if (userId) {
        invalidateUserCache(userId);
      }
      
      return true;
    } catch (error) {
      console.error('Error batch deleting chat history:', error);
      throw error;
    }
  });
};

// Filter chat history by type with optimized performance
export const getChatHistoryByType = async (userId, type, maxResults = 50) => {
  return retryOperation(async () => {
    try {
      // Check cache first
      const cachedResult = firestoreCache.get(userId, type, maxResults);
      if (cachedResult) {
        return cachedResult;
      }
      
      const q = query(
        collection(db, COLLECTIONS.CHAT_HISTORY),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      
      const querySnapshot = await getDocs(q);
      const history = [];
      
      querySnapshot.forEach((doc) => {
        // Extract data and avoid unnecessary spread which is costly
        const data = doc.data();
        history.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          content: data.content,
          response: data.response,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      
      // Store in cache
      firestoreCache.set(userId, type, maxResults, history);
      
      return history;
    } catch (error) {
      console.error('Error getting chat history by type:', error);
      throw error;
    }
  });
};

// Replace the old invalidate function with the new version
const invalidateUserCache = (userId) => {
  firestoreCache.invalidateUser(userId);
}; 