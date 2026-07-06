/**
 * Service Worker — École PWA v2
 *
 * Stratégies :
 * - Cache-first : assets statiques (JS, CSS, images, polices)
 * - Network-first : requêtes API
 * - Stale-while-revalidate : pages HTML (navigation)
 * - Cache-only : assets pré-cachés à l'install
 *
 * Diffusion des mises à jour via BroadcastChannel.
 */

const CACHE_NAME = 'ecole-cache-v2';
const API_CACHE_NAME = 'ecole-api-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
];

// ─── Installation ──────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Pré-cache atomique : on ignore les échecs individuels
      await Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch(() => console.warn(`[SW] Failed to cache ${url}`))
        )
      );
      self.skipWaiting();
    })()
  );
});

// ─── Activation ────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Supprime les anciens caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );

      // Notifie tous les clients du nouveau SW
      const clients = await self.clients.matchAll();
      clients.forEach((client) =>
        client.postMessage({ type: 'SW_UPDATED' })
      );

      self.clients.claim();
    })()
  );
});

// ─── Interception des requêtes ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Requêtes non-GET → réseau uniquement
  if (request.method !== 'GET') {
    event.respondWith(fetch(request).catch(() => new Response(null, { status: 503 })));
    return;
  }

  // Requêtes API → network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE_NAME));
    return;
  }

  // Navigation (pages HTML) → stale-while-revalidate
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Assets statiques (JS, CSS, images, polices) → cache-first
  if (
    url.origin === self.location.origin &&
    (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|eot)$/) ||
     url.pathname === '/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Images externes → cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Par défaut → réseau
  event.respondWith(fetch(request).catch(() => new Response(null, { status: 503 })));
});

// ─── Stratégies de cache ────────────────────────────────────────────────────

/**
 * Cache-first : cherche dans le cache, sinon va au réseau.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network-first : essaie le réseau, sinon cache de secours.
 * Utile pour les données fraîches avec fallback offline.
 */
async function networkFirst(request, cacheName = CACHE_NAME) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      // Nettoie les anciennes entrées du cache si nécessaire
      const cloned = response.clone();
      cache.put(request, cloned);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback JSON structuré pour les API
    if (request.headers.get('Accept')?.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Vous êtes hors ligne', offline: true }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Vous êtes hors ligne', { status: 503 });
  }
}

/**
 * Stale-while-revalidate : retourne le cache immédiatement,
 * puis met à jour en arrière-plan.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ─── Écoute des messages du client ─────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CACHE_CLEAR') {
    caches.delete(CACHE_NAME);
    caches.delete(API_CACHE_NAME);
  }
});

// ─── Background Sync (si le navigateur le supporte) ────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncQueue());
  }
});

async function syncQueue() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) =>
      client.postMessage({ type: 'SYNC_TRIGGERED' })
    );
  } catch {
    // Background sync n'est pas critique
  }
}
