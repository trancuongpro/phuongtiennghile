const CACHE_NAME = `audio-app-cache-${Date.now()}`;
const urlsToCache = [
    '/',
    '/index.html',
    '/content.html',
    '/styles.css',
    '/script.js',
    '/audioLoopManager.js',
    '/clock.js',
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
    // Kích hoạt ngay lập tức để cập nhật
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    // Bỏ qua các yêu cầu không phải http hoặc https
    if (!event.request.url.startsWith('http')) {
        return;
    }
    // Bỏ qua các yêu cầu tới Cloudflare
    if (event.request.url.includes('/cdn-cgi/')) {
        return event.respondWith(fetch(event.request));
    }

    event.respondWith(
        // Luôn thử lấy từ mạng trước
        fetch(event.request)
            .then(networkResponse => {
                // Kiểm tra response hợp lệ
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                // Lưu response mới vào cache
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            })
            .catch(() => {
                // Nếu không có mạng, lấy từ cache
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
    // Đảm bảo client sử dụng service worker mới ngay lập tức
    self.clients.claim();
});