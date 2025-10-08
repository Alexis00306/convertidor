const CACHE_NAME = `temperature-converter-v1`;

// Lista de archivos para el App Shell y la página offline
const FILES_TO_CACHE = [
  '/',
  '/converter.js',
  '/converter.css',
  '/offline.html' 
];

// Evento 'install': Se cachean los archivos del App Shell
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    console.log('[Service Worker] Pre-cacheando archivos de la aplicación');
    await cache.addAll(FILES_TO_CACHE);
  })());
});

// Evento 'activate'. Se encarga de limpiar cachés viejas.
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Obtenemos todos los nombres de las cachés existentes
    const cacheNames = await caches.keys();
    
    // Eliminamos las cachés que no coincidan con el nombre de la caché actual
    await Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) {
          console.log(`[Service Worker] Borrando caché antigua: ${cacheName}`);
          return caches.delete(cacheName);
        }
      })
    );
  })());
});


// Evento 'fetch': Intercepta peticiones y aplica la estrategia "Cache first, then network"
self.addEventListener('fetch', event => {
  // Solo interceptamos peticiones GET
  if (event.request.method !== 'GET') {
      return;
  }
  
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // 1. Intentar obtener el recurso desde la caché
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      console.log(`[Service Worker] Sirviendo desde caché: ${event.request.url}`);
      return cachedResponse;
    }
    
    // 2. Si no está en caché, intentar obtenerlo de la red
    try {
      const fetchResponse = await fetch(event.request);
      
      console.log(`[Service Worker] Guardando en caché recurso de red: ${event.request.url}`);
      // Guardamos la nueva respuesta en la caché para futuras visitas
      cache.put(event.request, fetchResponse.clone());
      
      return fetchResponse;
    } catch (e) {
      // Si la red falla, mostrar la página offline de respaldo
      console.log(`[Service Worker] La red falló. Sirviendo página offline.`);
      // Solo devolvemos la página offline para peticiones de navegación
      if (event.request.mode === 'navigate') {
        return await cache.match('/offline.html');
      }
    }
  })());
});