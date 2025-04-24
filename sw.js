const CACHE_NAME = `audio-app-cache-${Date.now()}`;
const urlsToCache = [
    '/phuongtiennghile/content.html',
    '/phuongtiennghile/styles.css',
    '/phuongtiennghile/script.js',
    '/phuongtiennghile/audioLoopManager.js',
    '/phuongtiennghile/clock.js',
    '/phuongtiennghile/nhacmoi.js',
    '/phuongtiennghile/favicon.png',
    '/phuongtiennghile/Nen App.png',
    '/phuongtiennghile/Button Chao.png',
    '/phuongtiennghile/Button Chinh.png',
    '/phuongtiennghile/Ba Hoi Bat Nha.mp3',
    '/phuongtiennghile/Luu Thuy Cung Nghinh.mp3',
    '/phuongtiennghile/Ngam Tho Hue.mp3',
    '/phuongtiennghile/Rao Dan Bau.mp3',
    '/phuongtiennghile/Rao Dan Nhi.mp3',
    '/phuongtiennghile/Rao Tranh Sao.mp3',
    '/phuongtiennghile/Nhac Thien 1.mp3',
    '/phuongtiennghile/Nhac Thien 2.mp3',
    '/phuongtiennghile/Quoc Ca.mp3',
    '/phuongtiennghile/Dao Ca.mp3',
    '/phuongtiennghile/Nhac Trao Hoa.mp3',
    '/phuongtiennghile/Chuong Mat Niem.mp3',
    '/phuongtiennghile/Nhac Niem Bon Su.mp3',
    '/phuongtiennghile/Nhac Thien 3.mp3',
    '/phuongtiennghile/Trong Tu Thinh.mp3',
    '/phuongtiennghile/Phap Loa 1.mp3',
    '/phuongtiennghile/Phap Loa 2.mp3',
    '/phuongtiennghile/Nhac Dung Com.mp3',
    '/phuongtiennghile/guzheng nam mo a di da phat.mp3',
    '/phuongtiennghile/Than Thoai.mp3',
    '/phuongtiennghile/kiettuong.mp3',
    '/phuongtiennghile/doantinhduyenbantangchoai.mp3',
	'/phuongtiennghile/nhacbuddha.mp3'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return Promise.all(
                    urlsToCache.map(url => {
                        return fetch(url)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch ${url}`);
                                }
                                return cache.put(url, response);
                            })
                            .catch(err => {
                                console.error(`Error caching ${url}:`, err);
                                throw err;
                            });
                    })
                );
            })
            .catch(err => {
                console.error('Cache addAll failed:', err);
                throw err;
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
