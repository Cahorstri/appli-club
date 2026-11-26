// Service worker : met en cache l'interface pour un démarrage rapide.
// Les données (Supabase) ne sont jamais mises en cache.
const CACHE = 'club-tri-v17';
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

// ---------- Notifications ----------
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Cahors Triathlon', {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: d.url || '' },
    tag: d.url || undefined
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const cible = new URL(e.notification.data?.url || '', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(fenetres => {
    for (const f of fenetres) {
      if (f.url.startsWith(self.registration.scope)) { f.navigate(cible); return f.focus(); }
    }
    return clients.openWindow(cible);
  }));
});
