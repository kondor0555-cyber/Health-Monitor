// sw.js – Service Worker για HealthMonitor PWA

const CACHE_NAME = 'healthmonitor-cache-v1';

const OFFLINE_URLS = [
  './',
  './index.html',
  './manifest.json',
  // icons
  './icons/icon-72.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-16.png',
  './icons/favicon-32.png',
  './icons/favicon-48.png',
  './icons/apple-120.png',
  './icons/apple-180.png'
];

// Εγκατάσταση – cache βασικών αρχείων
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Ενεργοποίηση – καθάρισμα παλιών cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch – offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((resp) => {
      return (
        resp ||
        fetch(event.request).catch(() => caches.match('./index.html'))
      );
    })
  );
});

// Όταν ο χρήστης πατήσει πάνω σε ειδοποίηση
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Για μελλοντικά push notifications από server (προαιρετικό)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { body: event.data.text() }; }

  const title = data.title || 'HealthMonitor';
  const body = data.body || '';
  const options = {
    body,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-72.png',
    data: { url: data.url || './' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
