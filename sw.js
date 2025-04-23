const CACHE_NAME = `audio-app-cache-${Date.now()}`;

// Danh sách tài nguyên sử dụng đường dẫn tương đối
const urlsToCache = [
    'content.html',
    'styles.css',
    'script.js',
    'audioLoopManager.js',
    'clock.js',
    'nhacmoi.js',
    'favicon.png',
    'Nen App.png',
    'Button Chao.png',
    'Button Chinh.png',
    'Ba Hoi Bat Nha.mp3',
    'Luu Thuy Cung Nghinh.mp3',
    'Ngam Tho Hue.mp3',
    'Rao Dan Bau.mp3',
    'Rao Dan Nhi.mp3',
    'Rao Tranh Sao.mp3',
    'Nhac Thien 1.mp3',
    'Nhac Thien 2.mp3',
    'Quoc Ca.mp3',
    'Dao Ca.mp3',
    'Nhac Trao Hoa.mp3',
    'Chuong Mat Niem.mp3',
    'Nhac Niem Bon Su.mp3',
    'Nhac Thien 3.mp3',
    'Trong Tu Thinh.mp3',
    'Phap Loa 1.mp3',
    'Phap Loa 2.mp3',
    'Nhac Dung Com.mp3',
    'guzheng nam mo a di da phat.mp3',
    'Than Thoai.mp3',
    'kiettuong.mp3',
    'doantinhduyenbantangchoai.mp3'
];

// Hàm thêm base path nếu cần
const getBasePath = () => {
    // Lấy base path từ scope của Service Worker
    const scope = self.registration.scope;
    const url = new URL(scope);
    // Nếu scope chứa subpath (như /phuongtiennghile/), trả về subpath, nếu không thì trả về ''
    return url.pathname === '/' ? '' : url.pathname;
};

// Sự kiện install: Cache các tài nguyên
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                const basePath = getBasePath();
                // Thêm base path vào các URL nếu cần
                const urlsWithBasePath = urlsToCache.map(url => `${basePath}/${url}`.replace('//', '/'));
                // Sử dụng Promise.allSettled để bỏ qua các tài nguyên lỗi
                return Promise.allSettled(
                    urlsWithBasePath.map(url => {
                        return fetch(url)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch ${url}`);
                                }
                                return cache.put(url, response);
                            })
                            .catch(err => {
                                console.warn(`Warning: Failed to cache ${url}:`, err);
                                // Trả về null để Promise.allSettled không reject
                                return null;
                            });
                    })
                ).then(results => {
                    // Kiểm tra xem có tài nguyên nào được cache thành công không
                    const successfulCaches = results.filter(result => result.status === 'fulfilled' && result.value !== null);
                    if (successfulCaches.length === 0) {
                        throw new Error('No resources were cached successfully');
                    }
                    console.log(`Cached ${successfulCaches.length} out of ${urlsWithBasePath.length} resources`);
                });
            })
            .catch(err => {
                console.error('Cache setup failed:', err);
                throw err;
            })
    );
    self.skipWaiting();
});

// Sự kiện fetch: Phục vụ từ cache hoặc mạng
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

// Sự kiện activate: Xóa cache cũ
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
