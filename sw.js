
var CACHE_NAME = 'safak-haritasi-v22';


var CORE_FILES = [
    './',
    './index.html',
    './style.css',
    './data.js',
    './app.js',
    './turkey.json',
    './manifest.json',
    './icon.svg'
];


var FONT_CSS = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;600;700&display=swap';
self.addEventListener('install', function (event) {
    console.log('🎖️ SW: Yükleniyor...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('🎖️ SW: Temel dosyalar cache\'leniyor');
            return cache.addAll(CORE_FILES);
        }).then(function () {
            return caches.open(CACHE_NAME).then(function (cache) {
                return cache.add(FONT_CSS).catch(function () {
                    console.log('🎖️ SW: Font cache\'lenemedi, sorun değil');
                });
            });
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (event) {
    console.log('🎖️ SW: Aktif edildi');
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names.filter(function (name) {
                    return name !== CACHE_NAME;
                }).map(function (name) {
                    console.log('🎖️ SW: Eski cache silindi:', name);
                    return caches.delete(name);
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});
self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            if (cached) {
                var fetchPromise = fetch(event.request).then(function (response) {
                    if (response && response.status === 200) {
                        var responseClone = response.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                }).catch(function () {
                });

                return cached;
            }
            return fetch(event.request).then(function (response) {
                if (!response || response.status !== 200) {
                    return response;
                }
                var url = event.request.url;
                var shouldCache = url.startsWith(self.location.origin) ||
                                  url.includes('fonts.googleapis.com') ||
                                  url.includes('fonts.gstatic.com');

                if (shouldCache) {
                    var responseClone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, responseClone);
                    });
                }

                return response;
            }).catch(function () {
                if (event.request.headers.get('accept') &&
                    event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});