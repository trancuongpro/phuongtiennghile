const CACHE_NAME = 'audio-app-cache';
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
                console.log('Đã mở cache');
                return cache.addAll(urlsToCache);
            })
    );
    // Kích hoạt Service Worker mới ngay lập tức
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    // Bỏ qua các yêu cầu tới Cloudflare
    if (event.request.url.includes('/cdn-cgi/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        // Thử tải từ mạng trước
        fetch(event.request)
            .then(networkResponse => {
                // Nếu tải thành công, cập nhật cache
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Nếu không có mạng, lấy từ cache
                return caches.match(event.request).then(cachedResponse => {
                    return cachedResponse || new Response('Không có mạng và không có phiên bản cache', { status: 503 });
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
    // Kiểm soát các tab ngay lập tức
    self.clients.claim();
});