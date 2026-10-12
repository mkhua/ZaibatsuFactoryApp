const CACHE_NAME = 'zaibatsu-factory-draw-v11';
const APP_FILES = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const navigationUrl = new URL(event.request.url);
        navigationUrl.searchParams.set('app-version', CACHE_NAME);
        const response = await fetch(navigationUrl, { cache: 'no-store' });
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await Promise.all([
            cache.put(event.request, response.clone()),
            cache.put(new URL('./index.html', self.registration.scope), response.clone()),
          ]);
        }
        return response;
      } catch {
        return (await caches.match(event.request)) || caches.match(new URL('./index.html', self.registration.scope));
      }
    })());
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.endsWith('/app.js') || requestUrl.pathname.endsWith('/styles.css')) {
    requestUrl.searchParams.set('app-version', CACHE_NAME);
    event.respondWith((async () => {
      try {
        const response = await fetch(requestUrl, { cache: 'no-store' });
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        return caches.match(event.request);
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }))
  );
});