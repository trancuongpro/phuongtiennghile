const CACHE_NAME = `audio-app-cache-${Date.now()}`;
const urlsToCache = [
    '/',
    '/index.html',
    '/content.html',
    '/styles.css',
    '/script.js',
    '/audioLoopManager.js',
    '/clock.js',
    '/nhacmoi.js',
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
    '/Phap Loa 2.mp3',
    '/Nhac Dung Com.mp3',
    '/guzheng nam mo a di da phat.mp3'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    if (!event.request.url.startsWith('http')) {
        return;
    }
    if (event.request.url.includes('/cdn-cgi/')) {
        return event.respondWith(fetch(event.request));
    }

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request)
                    .then(cachedResponse => {
                        return cachedResponse || new Response('Offline and no cached resource available', { status: 503 });
                    });
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});