/* =============================================
   ASKER ŞAFAK HARİTASI - SERVICE WORKER
   Offline PWA Desteği
   ============================================= */

var CACHE_NAME = 'safak-haritasi-v7';

// Temel dosyalar (install sırasında cache'lenir)
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

// Google Fonts URL'leri (install sırasında cache'lenir)
var FONT_CSS = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;600;700&display=swap';

// ===== INSTALL =====
self.addEventListener('install', function (event) {
    console.log('🎖️ SW: Yükleniyor...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('🎖️ SW: Temel dosyalar cache\'leniyor');
            return cache.addAll(CORE_FILES);
        }).then(function () {
            // Font CSS'ini de cache'le (opsiyonel, hata verirse devam et)
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

// ===== ACTIVATE =====
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

// ===== FETCH =====
// Strateji: Cache-first, network fallback
// İlk ziyarette her şey cache'lenir, sonra offline da çalışır
self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            if (cached) {
                // Cache'te var → hemen döndür
                // Arka planda güncelle (stale-while-revalidate)
                var fetchPromise = fetch(event.request).then(function (response) {
                    if (response && response.status === 200) {
                        var responseClone = response.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                }).catch(function () {
                    // Network hatası, önemli değil
                });

                return cached;
            }

            // Cache'te yok → network'ten al ve cache'le
            return fetch(event.request).then(function (response) {
                if (!response || response.status !== 200) {
                    return response;
                }

                // Sadece aynı origin veya fonts isteklerini cache'le
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
                // Tamamen offline ve cache'te yok
                // HTML isteklerinde offline sayfası göster
                if (event.request.headers.get('accept') &&
                    event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});