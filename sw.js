// Service worker : met en cache l'interface pour un démarrage rapide.
// Les données (Supabase) ne sont jamais mises en cache.
const CACHE = 'club-tri-v6';
const FICHIERS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './logo.png', './supabase.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Réseau d'abord (pour toujours avoir la dernière version), cache en secours
  e.respondWith(
    fetch(req).then(rep => {
      const copie = rep.clone();
      caches.open(CACHE).then(c => c.put(req, copie));
      return rep;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
