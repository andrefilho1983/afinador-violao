const CACHE_NAME = 'afinador-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Adicione aqui o caminho do seu arquivo JavaScript principal
];

// Instala o Service Worker e guarda os arquivos no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Intercepta as requisições de rede para carregar do cache se estiver offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});