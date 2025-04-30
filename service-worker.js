// Nome della cache
const CACHE_NAME = 'bullycar-cache-v8';

// File da memorizzare nella cache
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2'
];

// Installazione del service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aperta');
                return cache.addAll(urlsToCache);
            })
    );
});

// Recupero delle risorse
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - restituisci la risposta dalla cache
                if (response) {
                    return response;
                }

                // Clona la richiesta perché è un flusso e può essere usata solo una volta
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest)
                    .then((response) => {
                        // Verifica che la risposta sia valida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clona la risposta perché è un flusso e può essere usata solo una volta
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                // Non memorizzare nella cache le richieste di API o risorse dinamiche
                                if (!event.request.url.includes('/api/')) {
                                    cache.put(event.request, responseToCache);
                                }
                            });

                        return response;
                    });
            })
    );
});

// Attivazione e pulizia delle vecchie cache
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Se questa cache non è nella whitelist, eliminala
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});