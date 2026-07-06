/**
 * DB — IndexedDB wrapper for offline data
 *
 * Provides a simple promise-based API over IndexedDB for caching
 * API responses and queueing mutations when offline.
 *
 * Stores:
 *   - cache:    API response cache (key-value, with TTL)
 *   - queue:    Pending mutations to replay on reconnection
 *   - assets:   Static asset cache for offline PWA usage
 */

const DB_NAME = 'ecole-offline';
const DB_VERSION = 1;

/** @type {Promise<IDBDatabase>|null} */
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // API response cache
      if (!db.objectStoreNames.contains('cache')) {
        const store = db.createObjectStore('cache', { keyPath: 'key' });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }

      // Mutation queue (for offline-triggered writes)
      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Assets cache
      if (!db.objectStoreNames.contains('assets')) {
        db.createObjectStore('assets', { keyPath: 'url' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/* ─── Cache ────────────────────────────────────────────────────────────── */

/**
 * Set a value in the cache with optional TTL.
 * @param {string} key
 * @param {*} value
 * @param {number} ttlMs — Time to live in ms (default 5 min)
 */
export async function cacheSet(key, value, ttlMs = 5 * 60 * 1000) {
  const db = await openDB();
  const tx = db.transaction('cache', 'readwrite');
  const store = tx.objectStore('cache');
  store.put({
    key,
    value,
    expiresAt: Date.now() + ttlMs,
    updatedAt: new Date().toISOString(),
  });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get a value from the cache.
 * Returns null if missing or expired.
 * @param {string} key
 * @returns {Promise<*>}
 */
export async function cacheGet(key) {
  const db = await openDB();
  const tx = db.transaction('cache', 'readonly');
  const store = tx.objectStore('cache');
  const request = store.get(key);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const entry = request.result;
      if (!entry) return resolve(null);
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        // Expired — remove and return null
        const delTx = db.transaction('cache', 'readwrite');
        delTx.objectStore('cache').delete(key);
        return resolve(null);
      }
      resolve(entry.value);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove expired entries from cache.
 */
export async function cacheCleanup() {
  const db = await openDB();
  const tx = db.transaction('cache', 'readwrite');
  const store = tx.objectStore('cache');
  const index = store.index('expiresAt');
  const range = IDBKeyRange.upperBound(Date.now());
  const request = index.openCursor(range);

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear entire cache.
 */
export async function cacheClear() {
  const db = await openDB();
  const tx = db.transaction('cache', 'readwrite');
  tx.objectStore('cache').clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ─── Mutation Queue ───────────────────────────────────────────────────── */

/**
 * Enqueue a mutation to replay when online.
 * @param {'POST'|'PUT'|'PATCH'|'DELETE'} method
 * @param {string} url
 * @param {*} [data]
 * @returns {Promise<number>} — The queue entry ID
 */
export async function queueMutation(method, url, data = null) {
  const db = await openDB();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  const request = store.add({
    method,
    url,
    data,
    status: 'pending',
    createdAt: new Date().toISOString(),
    retries: 0,
  });

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending mutations.
 * @returns {Promise<Array>}
 */
export async function getPendingMutations() {
  const db = await openDB();
  const tx = db.transaction('queue', 'readonly');
  const store = tx.objectStore('queue');
  const index = store.index('status');
  const request = index.getAll('pending');

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark a mutation as completed (remove it).
 * @param {number} id
 */
export async function completeMutation(id) {
  const db = await openDB();
  const tx = db.transaction('queue', 'readwrite');
  tx.objectStore('queue').delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Update a mutation's retry count or mark as failed.
 * @param {number} id
 * @param {object} updates
 */
export async function updateMutation(id, updates) {
  const db = await openDB();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const entry = request.result;
      if (!entry) return resolve();
      Object.assign(entry, updates);
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Count pending mutations.
 * @returns {Promise<number>}
 */
export async function pendingMutationCount() {
  const db = await openDB();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  const index = store.index('status');
  const request = index.count('pending');

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || 0);
    request.onerror = () => reject(request.error);
  });
}

/* ─── Assets ───────────────────────────────────────────────────────────── */

/**
 * Cache an asset (e.g., API response for offline access).
 * @param {string} url
 * @param {*} data
 */
export async function assetCacheSet(url, data) {
  const db = await openDB();
  const tx = db.transaction('assets', 'readwrite');
  tx.objectStore('assets').put({ url, data, cachedAt: new Date().toISOString() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get cached asset.
 * @param {string} url
 * @returns {Promise<*>}
 */
export async function assetCacheGet(url) {
  const db = await openDB();
  const tx = db.transaction('assets', 'readonly');
  const store = tx.objectStore('assets');
  const request = store.get(url);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result?.data ?? null);
    request.onerror = () => reject(request.error);
  });
}

/* ─── Connection State ─────────────────────────────────────────────────── */

/**
 * Check if the browser is currently online.
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

export default {
  cacheSet,
  cacheGet,
  cacheCleanup,
  cacheClear,
  queueMutation,
  getPendingMutations,
  completeMutation,
  updateMutation,
  pendingMutationCount,
  assetCacheSet,
  assetCacheGet,
  isOnline,
};
