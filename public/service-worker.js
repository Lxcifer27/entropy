// Service worker for Entropy AI application
const CACHE_NAME = 'entropy-ai-cache-v1';
const DYNAMIC_CACHE = 'entropy-ai-dynamic-v1';

// App shell assets to cache on install
const APP_SHELL = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  '/favicon.ico',
  '/manifest.json',
  '/assets/fonts/fira-code.woff2',
];

// Install event - cache the app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app shell assets');
      return cache.addAll(APP_SHELL);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log('Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Helper function to determine if request should be cached
const shouldCache = (url) => {
  // Don't cache Firebase API calls or other API requests
  if (url.includes('firestore.googleapis.com') || url.includes('apis.google.com')) {
    return false;
  }
  
  // Don't cache authentication related requests
  if (url.includes('identitytoolkit') || url.includes('securetoken')) {
    return false;
  }
  
  // Cache static assets
  if (
    url.includes('/assets/') || 
    url.includes('.js') || 
    url.includes('.css') || 
    url.includes('.woff') || 
    url.includes('.svg') || 
    url.includes('.png') || 
    url.includes('.jpg') || 
    url.includes('.ico')
  ) {
    return true;
  }
  
  // Cache app shell routes
  if (
    url.endsWith('/') || 
    url.includes('/review') || 
    url.includes('/enhance') || 
    url.includes('/translate') || 
    url.includes('/snapshot')
  ) {
    return true;
  }
  
  return false;
};

// Fetch event - network first with cache fallback for dynamic content
// Cache first with network fallback for static assets
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('fonts.googleapis.com')) {
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  const requestUrl = new URL(event.request.url);
  
  // For static assets, use cache first, then network
  if (shouldCache(requestUrl.toString())) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Use cached version if available
        if (cachedResponse) {
          // In the background, try to update the cache
          fetch(event.request).then((networkResponse) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }).catch(() => {});
          
          return cachedResponse;
        }
        
        // Otherwise fetch from network and cache
        return fetch(event.request).then((networkResponse) => {
          // Cache a copy of the response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          
          return networkResponse;
        }).catch(() => {
          // If both network and cache fail, return a fallback for some assets
          if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|gif)$/)) {
            return new Response('Not found', { status: 404 });
          }
        });
      })
    );
  } else {
    // For API requests or other dynamic content, use network first then cache
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Only cache successful responses
          if (networkResponse.ok) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-chatHistory') {
    event.waitUntil(syncChatHistory());
  }
});

// Function to sync chat history when back online
const syncChatHistory = async () => {
  try {
    // Get data from IndexedDB
    const dbPromise = indexedDB.open('entropy-offline-db', 1);
    
    const db = await new Promise((resolve, reject) => {
      dbPromise.onsuccess = () => resolve(dbPromise.result);
      dbPromise.onerror = () => reject(dbPromise.error);
    });
    
    const tx = db.transaction('chat-sync', 'readwrite');
    const store = tx.objectStore('chat-sync');
    
    const pendingItems = await new Promise((resolve) => {
      const pendingItems = [];
      store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          pendingItems.push({
            id: cursor.key,
            data: cursor.value
          });
          cursor.continue();
        } else {
          resolve(pendingItems);
        }
      };
    });
    
    // Process pending items
    for (const item of pendingItems) {
      try {
        const response = await fetch('/api/chat-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
          // Remove from IndexedDB if successfully synced
          store.delete(item.id);
        }
      } catch (error) {
        console.error('Error syncing item:', error);
      }
    }
    
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
    
  } catch (error) {
    console.error('Error during sync:', error);
  }
};

// Notification click event
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  notification.close();
  
  // Open the app when a notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
}); 