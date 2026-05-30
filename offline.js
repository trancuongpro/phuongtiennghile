/**
 * offline.js (Bản cập nhật sửa lỗi DataError - Đồng bộ cấu trúc bảng)
 * Quản lý tải trước và lưu trữ nhạc MP3 vào IndexedDB phục vụ chạy Offline hoàn toàn.
 * Phát triển bởi: Trần Cường
 */

(function () {
    const DB_NAME = 'AudioOfflineDB';
    const DB_VERSION = 2; // Nâng lên version 2 để buộc trình duyệt xóa cấu trúc cũ, tránh lỗi DataError
    const STORE_NAME = 'mp3_files';
    let db = null;

    // 1. Thu thập tự động tất cả các file MP3 từ thẻ <audio> trong DOM
    function getAudioFilesList() {
        const audioElements = document.querySelectorAll('audio');
        const files = [];
        audioElements.forEach(audio => {
            const src = audio.getAttribute('src');
            const id = audio.getAttribute('id');
            if (src && id) {
                files.push({ id: id, url: src });
            }
        });
        return files;
    }

    // 2. Mở / Khởi tạo IndexedDB
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function (e) {
                const dbInstance = e.target.result;
                // Nếu tồn tại bảng cũ có cấu trúc lỗi, xóa bỏ để làm sạch dữ liệu
                if (dbInstance.objectStoreNames.contains(STORE_NAME)) {
                    dbInstance.deleteObjectStore(STORE_NAME);
                    console.log(`[OfflineDB] Đã dọn dẹp cấu trúc bảng cũ để đồng bộ nâng cấp.`);
                }
                // Tạo bảng mới sử dụng 'url' làm khóa chính tối ưu
                dbInstance.createObjectStore(STORE_NAME, { keyPath: 'url' });
                console.log(`[OfflineDB] Đã tạo cấu trúc bảng lưu trữ mới với keyPath: 'url'`);
            };

            request.onsuccess = function (e) {
                db = e.target.result;
                console.log('[OfflineDB] Kết nối IndexedDB thành công.');
                resolve(db);
            };

            request.onerror = function (e) {
                console.error('[OfflineDB] Lỗi kết nối IndexedDB:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    // 3. Đọc file từ IndexedDB dựa vào URL bản gốc (đã chuẩn hóa đường dẫn)
    function getFileFromDB(url) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB chưa sẵn sàng');
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(url);

            request.onsuccess = function (e) {
                resolve(e.target.result ? e.target.result.blob : null);
            };

            request.onerror = function (e) {
                reject(e.target.error);
            };
        });
    }

    // 4. Lưu file Blob vào IndexedDB dùng URL làm định danh
    function saveFileToDB(url, blob) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('DB chưa sẵn sàng');
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const data = { url: url, blob: blob, updatedAt: Date.now() };
            const request = store.put(data);

            request.onsuccess = function () {
                console.log(`[OfflineDB] Đã lưu thành công file vào bộ nhớ máy: ${url}`);
                resolve();
            };

            request.onerror = function (e) {
                console.error(`[OfflineDB] Lỗi khi lưu file ${url}:`, e.target.error);
                reject(e.target.error);
            };
        });
    }

    // 5. Tải file từ internet mạng về chuyển thành Blob
    async function downloadFile(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Không thể tải file từ mạng: ${url}. Status: ${response.status}`);
        }
        return await response.blob();
    }

    // Chuẩn hóa tên đường dẫn để tránh lệch ký tự mã hóa URL (%20, khoảng trắng...)
    function normalizeURL(url) {
        try {
            return new URL(url, window.location.href).pathname;
        } catch (e) {
            return url;
        }
    }

    // 6. Xử lý chính: Kiểm tra, tải ngầm và gán Blob URL cho thẻ Audio
    async function processAudioOffline() {
        try {
            await initDB();
            const audioList = getAudioFilesList();
            console.log(`[OfflineDB] Tìm thấy tổng cộng ${audioList.length} thẻ audio trên giao diện.`);

            // Dùng Map để quản lý cache tạm thời các Blob URL trong phiên làm việc hiện tại, tránh tạo lập lặp lại
            const blobUrlCache = new Map();

            for (const item of audioList) {
                const audioElement = document.getElementById(item.id);
                if (!audioElement) continue;

                const normalizedUrl = normalizeURL(item.url);

                try {
                    let cachedBlob = null;
                    let localBlobURL = blobUrlCache.get(normalizedUrl);

                    if (!localBlobURL) {
                        // Kiểm tra trong DB xem file vật lý đã được tải về lần nào chưa
                        cachedBlob = await getFileFromDB(normalizedUrl);

                        if (!cachedBlob) {
                            if (navigator.onLine) {
                                console.log(`[OfflineDB] Đang tải ngầm file mới: ${item.url}...`);
                                cachedBlob = await downloadFile(item.url);
                                await saveFileToDB(normalizedUrl, cachedBlob);
                            } else {
                                console.warn(`[OfflineDB] Đang mất mạng và không có bản lưu cho: ${item.url}`);
                            }
                        } else {
                            console.log(`[OfflineDB] File đã có sẵn trong máy: ${item.url}`);
                            
                            // Cập nhật ngầm nếu có mạng
                            if (navigator.onLine) {
                                downloadFile(item.url).then(newBlob => {
                                    saveFileToDB(normalizedUrl, newBlob);
                                }).catch(err => console.log('[OfflineDB] Cập nhật ngầm thất bại (Bỏ qua):', err));
                            }
                        }

                        if (cachedBlob) {
                            localBlobURL = URL.createObjectURL(cachedBlob);
                            blobUrlCache.set(normalizedUrl, localBlobURL);
                        }
                    }

                    // Gán nguồn phát offline cho thẻ audio
                    if (localBlobURL) {
                        const currentTime = audioElement.currentTime;
                        const isPlaying = !audioElement.paused;

                        audioElement.src = localBlobURL;
                        audioElement.load();

                        if (isPlaying) {
                            audioElement.currentTime = currentTime;
                            audioElement.play().catch(e => console.error(e));
                        }
                        console.log(`[OfflineDB] Đã chuyển đổi đường dẫn Offline cho thẻ #${item.id}`);
                    }

                } catch (fileError) {
                    console.error(`[OfflineDB] Xử lý lỗi cho thẻ ${item.id} (${item.url}):`, fileError);
                }
            }
            console.log('[OfflineDB] Hoàn tất tiến trình quét và tối ưu lưu trữ Offline.');
        } catch (globalError) {
            console.error('[OfflineDB] Lỗi hệ thống đồng bộ dữ liệu Offline:', globalError);
        }
    }

    // Kích hoạt chạy
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processAudioOffline);
    } else {
        processAudioOffline();
    }
})();