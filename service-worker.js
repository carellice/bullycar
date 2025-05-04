// Service worker che non cacha le risorse e richiede sempre connessione internet
self.addEventListener('fetch', (event) => {
    // Bypassa la cache e richiedi sempre la rete
    event.respondWith(
        fetch(event.request)
            .catch((error) => {
                console.error('Errore di rete:', error);

                // Per le richieste di navigazione (caricamento della pagina)
                if (event.request.mode === 'navigate') {
                    return new Response(
                        `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>BullyCar - Connessione assente</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    padding: 20px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 80vh;
                  }
                  h1 { color: #007aff; }
                  button {
                    background: #007aff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                  }
                </style>
              </head>
              <body>
                <h1>Connessione Internet necessaria</h1>
                <p>BullyCar richiede una connessione internet per funzionare.</p>
                <p>Verifica la tua connessione e riprova.</p>
                <button onclick="window.location.reload()">Riprova</button>
              </body>
            </html>
            `,
                        {
                            headers: {
                                'Content-Type': 'text/html',
                                'Cache-Control': 'no-store'
                            },
                        }
                    );
                }

                // Per altre richieste, restituisci un errore semplice
                return new Response('Errore di rete', {
                    status: 503,
                    headers: { 'Cache-Control': 'no-store' }
                });
            })
    );
});

// Impedisci qualsiasi caching
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Cancella tutte le cache esistenti durante l'attivazione
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});