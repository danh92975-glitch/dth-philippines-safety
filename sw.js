/* DTH offline shell — caches static assets and JSON data. No personal data is cached.
   All cache keys are resolved relative to this script so they work both at a site root
   and at a GitHub Pages project subpath (/dth-philippines-safety/). */
const CACHE = 'dth-survival-v4';
const BASE = new URL('./', self.location.href);
const rel = (p) => new URL(p, BASE).href;
const SHELL = [
  './', 'index.html', 'manifest.json',
  'assets/css/styles.css', 'assets/js/app.js',
  'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  'assets/data/locations.json', 'assets/data/emergency.json',
  'assets/data/transport.json', 'assets/data/safety.json',
  'assets/data/english.json', 'assets/data/tourist.json',
  'assets/data/checklist.json', 'assets/data/legal.json',
  'docs/SOURCES.md', 'docs/DEPLOYMENT.md'
].map(rel);
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin && !/unpkg\.com|tile\.openstreetmap\.org/.test(url.host)) return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit || (e.request.mode === 'navigate' ? caches.match(rel('index.html')) : Response.error()));
      return hit || net;
    })
  );
});
