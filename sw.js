const CACHE_NAME = 'zopiplan-cache-v3';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './images/zopilote_icon.png',
    './images/victory_trophy.png',
    './images/australian_row.png',
    './images/basket.png',
    './images/bench_dip.png',
    './images/carrera.png',
    './images/dead_hang.png',
    './images/incline_pushup.png',
    './images/reverse_lunge.png',
    './images/sumo_squat.png',
    './images/support_isometric.png',
    './images/walk.png'
];

// Instalar el Service Worker y cachear recursos iniciales
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cacheando recursos estáticos de Zopiplan...');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activar y limpiar cachés anteriores
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('Borrando caché antigua:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
    // Si es la navegación de la página principal (index.html o la raíz del repositorio)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Guardar la página más reciente en caché
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // Si no hay conexión, servir la versión guardada en caché
                    return caches.match(event.request);
                })
        );
    } else {
        // Para imágenes y fuentes, buscar primero en caché
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request).then(response => {
                        // Guardar en caché si es una respuesta válida y de nuestro dominio o de Google Fonts
                        const isGet = event.request.method === 'GET';
                        const isHttp = event.request.url.startsWith('http');
                        if (isGet && isHttp && response && response.status === 200) {
                            return caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, response.clone());
                                return response;
                            });
                        }
                        return response;
                    }).catch(() => {
                        // En caso de fallo de red absoluto, retornar nada
                    });
                })
        );
    }
});
