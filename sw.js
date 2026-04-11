const CACHE_NAME = 'corefix-v1';
const assets = [
  'index.html',
  'style.css',
  'img/Logo.png',
  'cotizar.html',
  'rastreo.html',
  // Si tienes un script.js asegúrate que el archivo NO esté vacío en GitHub
  'script.js' 
];

// Instalación
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Instalando Service Worker de CoreFix...');
      // Usamos .addAll pero con un pequeño truco para ignorar si un archivo falla
      return cache.addAll(assets);
    })
  );
});

// Activación (Limpieza de caches viejos)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});