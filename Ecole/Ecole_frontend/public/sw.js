// Service Worker for Performance Optimization
const CACHE_NAME = 'ecole-app-v1';
const API_CACHE_NAME = 'ecole-api-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/candidats',
  '/api/classes',
  '/api/matieres',
  '/api/dashboard'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Default: network first
  event.respondWith(fetch(request));
});

// Handle API requests with cache-first strategy for GET requests
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  // For GET requests, try cache first
  if (request.method === 'GET') {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached response and update cache in background
      fetchAndCache(request, cache);
      return cachedResponse;
    }
  }
  
  // For non-GET requests or cache miss, fetch from network
  try {
    const response = await fetch(request);
    
    // Cache successful GET responses
    if (request.method === 'GET' && response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // If network fails, try to serve from cache
    if (request.method === 'GET') {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return a fallback response for failed requests
    if (request.destination === 'document') {
      return new Response('<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>Application hors ligne</h1><p>Veuillez vérifier votre connexion internet.</p></body></html>', {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

// Background fetch and cache update
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
  } catch (error) {
    console.log('Background fetch failed:', error);
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  // Process any queued actions when back online
  const cache = await caches.open(API_CACHE_NAME);
  // Implementation for syncing offline actions
  console.log('Processing background sync');
}

// Handle push notifications (if needed)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/dashboard')
  );
});

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ cacheSize: size });
    });
  }
});

// Get cache size for monitoring
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  
  return totalSize;
}