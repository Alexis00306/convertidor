const CACHE_NAME = `temperature-converter-v1`;

// --- EVENTOS DE CICLO DE VIDA Y CACHÉ ---

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    console.log('[Service Worker] Cacheando archivos iniciales');
    await cache.addAll([
      '/',
      '/converter.js',
      '/converter.css',
      'icon-192x192.png',
    ]);
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) {
          console.log('[Service Worker] Eliminando caché antigua:', cacheName);
          return caches.delete(cacheName);
        }
      })
    );
  })());
});

self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    } else {
      try {
        const fetchResponse = await fetch(event.request);
        cache.put(event.request, fetchResponse.clone());
        return fetchResponse;
      } catch (e) {
        console.error('[Service Worker] Fallo en la petición fetch:', e);
      }
    }
  })());
});

// --- EVENTOS AVANZADOS ---

self.addEventListener('sync', event => {
  console.log('[Service Worker] Ejecutando sincronización en segundo plano:', event.tag);
  if (event.tag === 'send-conversion-data') {
    event.waitUntil(sendQueuedData());
  }
});

function sendQueuedData() {
  console.log('[Service Worker] Reenviando datos al servidor...');
  // Lógica para enviar datos pendientes.
  return Promise.resolve();
}

self.addEventListener('push', event => {
  console.log('[Service Worker] Notificación Push recibida.');
  const data = event.data ? event.data.json() : { title: 'Convertidor de Clima', body: '¡Hay algo nuevo para ti!' };
  const title = data.title;
  const options = {
    body: data.body,
    icon: 'icon-192x192.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Clic en notificación recibido.');
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});