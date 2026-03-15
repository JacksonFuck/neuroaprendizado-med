const CACHE_NAME = 'neuroapp-v29';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/app.css',
    '/app.js',
    '/neuro-tools.js',
    '/flashcards.js',
    '/planner.js',
    '/charts.js',
    '/gamification.js',
    '/survey.js',
    '/messages.js',
    '/assessment.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Ignore API requests for caching
    if (event.request.url.includes('/api/') || event.request.url.includes('/auth/')) {
        return;
    }

    // Network-first strategy: always try fresh version, fallback to cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clone and cache the fresh response
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => {
                // Offline fallback: serve from cache
                return caches.match(event.request);
            })
    );
});
