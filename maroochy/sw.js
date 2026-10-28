/* Maroochy River speed zones: offline service worker.
   Bump CACHE when any precached file changes so clients pick up the new version. */
const CACHE = 'maroochy-v1';
const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'maps/00.webp', 'maps/01.webp', 'maps/02.webp', 'maps/03.webp', 'maps/04.webp',
  'maps/05.webp', 'maps/06.webp', 'maps/07.webp', 'maps/08.webp', 'maps/09.webp',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE.map(u => new Request(u, {cache: 'reload'}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('maroochy-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, {ignoreSearch: req.mode === 'navigate'}).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(err => {
        // Offline and not cached: fall back to the app shell for page navigations.
        if (req.mode === 'navigate') return caches.match('./').then(r => r || caches.match('index.html'));
        throw err;
      });
    })
  );
});
