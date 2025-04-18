const CACHE_NAME = 'audio-app-cache-v5';
const urlsToCache = [
    '/',
    '/index.html',
    '/content.html',
    '/styles.css',
    '/script.js',
    '/favicon.png',
    '/Nen App.png',
    '/Button Chao.png',
    '/Button Chinh.png',
    '/Ba Hoi Bat Nha.mp3',
    '/Luu Thuy Cung Nghinh.mp3',
    '/Ngam Tho Hue.mp3',
    '/Rao Dan Bau.mp3',
    '/Rao Dan Nhi.mp3',
    '/Rao Tranh Sao.mp3',
    '/Nhac Thien 1.mp3',
    '/Nhac Thien 2.mp3',
    '/Quoc Ca.mp3',
    '/Dao Ca.mp3',
    '/Nhac Trao Hoa.mp3',
    '/Chuong Mat Niem.mp3',
    '/Nhac Niem Bon Su.mp3',
    '/Nhac Thien 3.mp3',
    '/Trong Tu Thinh.mp3',
    '/Phap Loa 1.mp3',
    '/Phap Loa 2.mp3'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    // Bỏ qua các yêu cầu tới Cloudflare
    if (event.request.url.includes('/cdn-cgi/')) {
        return event.respondWith(fetch(event.request));
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Nếu có trong cache, trả về từ cache
                if (response) {
                    return response;
                }
                // Nếu không có trong cache, tải từ mạng và lưu vào cache
                return fetch(event.request).then(networkResponse => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                }).catch(() => {
                    // Nếu không có mạng, trả về từ cache (nếu có)
                    return caches.match(event.request);
                });
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});