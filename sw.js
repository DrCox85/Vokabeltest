const CACHE_NAME = 'vokabel-trainer-v1';
const ASSETS = [
    'index.html',
    // Falls du externe CSS/JS lokal speichern willst, hier auflisten. 
    // Da du CDN-Links (Tailwind/FontAwesome) nutzt, werden diese 
    // vom Browser oft automatisch gecacht, aber für echtes Offline 
    // müssten sie hier rein oder lokal im Projekt liegen.
];

// Installieren: Dateien in den Cache laden
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Aktivieren: Alte Caches löschen
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// Fetch: Anfragen abfangen und aus dem Cache bedienen
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});