const CACHE_NAME = 'corefix-v1';
// Quitamos las diagonales iniciales y corregimos el nombre del Logo
const assets = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'img/Logo.png', // Corregido: L mayúscula y extensión .png
  'cotizar.html',
  'rastreo.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cacheando archivos de CoreFix...');
      return cache.addAll(assets);
    }).catch(err => console.log('Error de cacheo:', err))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});