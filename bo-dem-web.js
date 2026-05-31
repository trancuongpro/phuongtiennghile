/**
 * sw.js - Service Worker quản lý Cache giao diện Offline
 */

const CACHE_NAME = 'app-shell-v1';
// Danh sách các file cốt lõi cần để hiển thị giao diện khi không có mạng
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './script.js',
    './offline.js',
    // Nếu anh có file style.css hay hình ảnh giao diện nào, hãy thêm đường dẫn vào đây:
    // './style.css'
];

// 1. Cài đặt Service Worker và lưu các file giao diện vào Cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Đang cache khung ứng dụng...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 2. Kích hoạt và dọn dẹp cache cũ nếu có thay đổi
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Đang dọn dẹp cache cũ:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Đánh chặn các yêu cầu mạng: Nếu mất mạng thì lấy từ Cache ra hiển thị
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Bỏ qua không can thiệp vào các file MP3 (Vì file MP3 đã có offline.js quản lý riêng trong IndexedDB)
    if (url.pathname.endsWith('.mp3')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Trả về file từ Cache nếu có (giúp chạy khi offline)
                return cachedResponse;
            }
            // Nếu không có trong cache thì tải từ mạng
            return fetch(event.request).catch(() => {
                console.error('[Service Worker] Thất bại khi tải tài nguyên mạng lúc offline:', event.request.url);
            });
        })
    );
});