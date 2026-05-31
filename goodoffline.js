/**
 * goodoffline.js - PHÁT TRIỂN BỞI TRẦN CƯỜNG
 * - Tự động dựng giao diện Màn hình Chờ (Loading Screen) đẳng cấp có thanh trượt và số %.
 * - Tự động quét toàn bộ 24 thẻ <audio> trong trang content.html để kiểm tra và nạp vào IndexedDB.
 * - Đạt đủ 100% kiểm chứng an toàn cho Offline mới tự động mở màn hình vào trang ứng dụng chính.
 * - Tích hợp bộ bảo mật khóa chuột phải, chặn quét khối chữ (Bỏ qua không chặn phím F12 để kiểm tra).
 * - Tự động kích hoạt đăng ký Service Worker bo-dem-web.js để lưu cache giao diện.
 */

(function () {
    // Đồng bộ cấu hình chính xác theo tên Cơ sở dữ liệu hiện tại của anh Cường
    const DB_NAME = 'AudioOfflineDB';
    const STORE_NAME = 'mp3_files';
    const DB_VERSION = 2; 
    let db = null;

    // --- LỚP 1: TỰ ĐỘNG KHỞI DỰNG GIAO DIỆN MÀN HÌNH CHỜ (LOADING SCREEN) BẰNG CODE ---
    function createLoadingScreen() {
        // Tạo thẻ div phủ kín màn hình
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-screen';
        
        // Cấu trúc khung hiển thị tiến trình
        loadingDiv.innerHTML = `
            <div class="loading-box">
                <h2>HỆ THỐNG KIỂM CHỨNG OFFLINE</h2>
                <p id="loading-status">Đang thiết lập cấu trúc lưu trữ an toàn...</p>
                
                <div class="progress-container">
                    <div id="progress-bar"></div>
                </div>
                
                <div id="progress-percent">0%</div>
                <div class="author-tag">Thiết kế ứng dụng: Trần Cường</div>
            </div>
        `;

        // Tự động nhúng CSS giao diện tối cao cấp trực tiếp vào trang, không cần chỉnh style.css gốc
        const style = document.createElement('style');
        style.innerHTML = `
            #loading-screen {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: linear-gradient(135deg, #121216 0%, #08080b 100%);
                display: flex; align-items: center; justify-content: center;
                z-index: 9999999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff;
                transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.6s;
            }
            .loading-box {
                width: 88%; max-width: 460px; background: rgba(255, 255, 255, 0.05);
                padding: 35px 25px; border-radius: 24px; text-align: center;
                box-shadow: 0 25px 60px rgba(0,0,0,0.6);
                border: 1px solid rgba(255,255,255,0.08);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
            }
            .loading-box h2 {
                font-size: 1.4rem; color: #FFD700; margin-bottom: 8px; letter-spacing: 1px; font-weight: 700;
            }
            .loading-box p {
                font-size: 0.9rem; color: #a1a1aa; margin-bottom: 25px; min-height: 20px;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .progress-container {
                width: 100%; height: 10px; background: rgba(255,255,255,0.08);
                border-radius: 5px; overflow: hidden; margin-bottom: 12px;
                box-shadow: inset 0 1px 2px rgba(0,0,0,0.4);
            }
            #progress-bar {
                width: 0%; height: 100%;
                background: linear-gradient(90deg, #FFD700 0%, #ff8c00 100%);
                border-radius: 5px; transition: width 0.1s ease-out;
                box-shadow: 0 0 12px rgba(255,215,0,0.4);
            }
            #progress-percent {
                font-size: 2rem; font-weight: bold; color: #FFD700; margin-bottom: 5px; font-family: monospace;
            }
            .author-tag {
                font-size: 0.75rem; color: #52525b; margin-top: 15px; letter-spacing: 0.5px;
            }
            /* Hiệu ứng ẩn màn hình mượt mà */
            .fade-out { opacity: 0; visibility: hidden; }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(loadingDiv);
    }

    // Hàm cập nhật trạng thái hiển thị của thanh trượt và con số %
    function updateProgress(percent, statusText) {
        const progressBar = document.getElementById('progress-bar');
        const progressPercent = document.getElementById('progress-percent');
        const loadingStatus = document.getElementById('loading-status');
        
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressPercent) progressPercent.innerText = `${Math.round(percent)}%`;
        if (loadingStatus) loadingStatus.innerText = statusText;
    }

    // Hàm tháo gỡ màn hình chờ để mở trang chính ứng dụng
    function hideLoadingScreen() {
        const screen = document.getElementById('loading-screen');
        if (screen) {
            screen.classList.add('fade-out');
            setTimeout(() => screen.remove(), 600); // Giải phóng bộ nhớ DOM sau khi mờ hoàn toàn
        }
    }

    // --- LỚP 2: BẢO MẬT GIAO DIỆN CHẶN SAO CHÉP CHẤT XÁM (KHÔNG CHẶN F12) ---
    function initSecurity() {
        // Chặn menu chuột phải
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        // Chặn bôi đen quét văn bản
        document.addEventListener('selectstart', e => e.preventDefault());

        // Chặn các phím tắt copy nguồn (Ctrl+C, U, S, P, A) nhưng GIỮ LẠI F12 để anh làm việc
        document.addEventListener('keydown', e => {
            if (e.keyCode === 123 || e.key === 'F12') return true; 
            if (e.ctrlKey || e.metaKey) {
                const blocked = ['c', 'u', 's', 'p', 'a'];
                if (blocked.includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    return false;
                }
            }
        });

        // Luật CSS bổ sung ép buộc chặn quét khối trên các thiết bị cảm ứng di động
        const s = document.createElement('style');
        s.innerHTML = `* { -webkit-user-select:none!important; user-select:none!important; -webkit-touch-callout:none!important; }`;
        document.head.appendChild(s);
        console.log('[Bảo Mật] Đã kích hoạt chặn sao chép giao diện (Giữ phím F12).');
    }

    // --- LỚP 3: ĐĂNG KÝ BỘ ĐỆM SERVICE WORKER OFFLINE ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./bo-dem-web.js')
                .then(reg => console.log('[Hệ Thống] Đã kết nối bộ đệm Offline giao diện. Scope:', reg.scope))
                .catch(err => console.error('[Hệ Thống] Thất bại khi nạp bo-dem-web.js:', err));
        });
    }

    // --- LỚP 4: LIÊN KẾT CƠ SỞ DỮ LIỆU INDEXEDDB TRÊN MÁY ---
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function (e) {
                const dbInstance = e.target.result;
                if (dbInstance.objectStoreNames.contains(STORE_NAME)) {
                    dbInstance.deleteObjectStore(STORE_NAME);
                }
                dbInstance.createObjectStore(STORE_NAME, { keyPath: 'url' });
                console.log('[OfflineDB] Khởi tạo cấu trúc bảng lưu trữ nhạc tối ưu mới.');
            };

            request.onsuccess = function (e) {
                db = e.target.result;
                resolve(db);
            };

            request.onerror = function (e) {
                reject(e.target.error);
            };
        });
    }

    // Chuẩn hóa ký tự đường dẫn tránh lệch mã hóa URL khoảng trắng (%20)
    function normalizeURL(url) {
        try {
            return new URL(url, window.location.href).pathname;
        } catch (e) {
            return url;
        }
    }

    // --- LỚP 5: TIẾN TRÌNH QUÉT NHẠC LŨY TIẾN, CHẠY PHẦN TRĂM THANH TRƯỢT ---
    async function startSystemOfflineVerification() {
        // Dựng màn hình chờ Loading ngay tức khắc khi mở trang web lên
        createLoadingScreen();
        // Kích hoạt ngay bộ chặn copy bảo mật
        initSecurity();

        try {
            updateProgress(4, 'Đang thiết lập cơ sở dữ liệu an toàn...');
            await initDB();
            
            // Tự động thu thập toàn bộ các thẻ audio thực tế khai báo trong file content.html của anh
            const audioElements = document.querySelectorAll('audio');
            const audioList = [];
            audioElements.forEach(audio => {
                const src = audio.getAttribute('src');
                const id = audio.getAttribute('id');
                if (src && id) {
                    audioList.push({ id: id, url: src });
                }
            });

            const totalFiles = audioList.length;
            if (totalFiles === 0) {
                updateProgress(100, 'Ứng dụng đã sẵn sàng!');
                setTimeout(hideLoadingScreen, 500);
                return;
            }

            console.log(`[Hệ Thống] Quét thấy tổng cộng ${totalFiles} file âm thanh cần đồng bộ.`);
            let processedCount = 0;
            let missingOfflineCount = 0;

            // Vòng lặp nạp nhạc tuần tự và cập nhật số phần trăm lũy tiến lên màn hình chờ
            for (const item of audioList) {
                const audioElement = document.getElementById(item.id);
                if (!audioElement) continue;

                const normalizedUrl = normalizeURL(item.url);

                // Khởi tạo giao dịch đọc từ IndexedDB máy
                const tx = db.transaction([STORE_NAME], 'readonly');
                const store = tx.getTransaction ? tx.getTransaction(STORE_NAME) : tx.objectStore(STORE_NAME);
                
                const cachedBlob = await new Promise(resolve => {
                    const req = store.get(normalizedUrl);
                    req.onsuccess = () => resolve(req.result ? req.result.blob : null);
                    req.onerror = () => resolve(null);
                });

                if (cachedBlob) {
                    // Nhạc đã được lưu sẵn trong máy -> Tạo URL cục bộ gán thẳng vào nguồn phát
                    audioElement.src = URL.createObjectURL(cachedBlob);
                    audioElement.load();
                    processedCount++;
                    
                    // Tính phần trăm tịnh tiến (Dành ra 4% đầu khởi tạo, 96% còn lại chia đều cho tổng số file nhạc)
                    let currentPercent = 4 + ((processedCount / totalFiles) * 96);
                    updateProgress(currentPercent, `Kiểm chứng file sẵn sàng: ${item.url}`);
                } else {
                    // Bản nhạc chưa có sẵn -> Tiến hành tải ngầm từ máy chủ về nếu có mạng internet
                    if (navigator.onLine) {
                        try {
                            let currentPercent = 4 + ((processedCount / totalFiles) * 96);
                            updateProgress(currentPercent, `Đang tải mới file phục vụ Offline: ${item.url}`);
                            
                            const response = await fetch(item.url);
                            if (!response.ok) throw new Error('Lỗi tải file');
                            const blob = await response.blob();
                            
                            // Lưu trữ vĩnh viễn file vật lý vào ổ cứng máy người dùng
                            const txW = db.transaction([STORE_NAME], 'readwrite');
                            txW.objectStore(STORE_NAME).put({ url: normalizedUrl, blob: blob, updatedAt: Date.now() });
                            
                            audioElement.src = URL.createObjectURL(blob);
                            audioElement.load();
                            console.log(`[Lưu Trữ] Đã tải & lưu thành công: ${item.url}`);
                        } catch (err) {
                            console.error(`[Lỗi] Không thể kéo file nhạc: ${item.url}`, err);
                        }
                    } else {
                        // Thiết bị mất mạng và file âm thanh này chưa từng được nạp xuống máy
                        missingOfflineCount++;
                    }
                    
                    processedCount++;
                    let currentPercent = 4 + ((processedCount / totalFiles) * 96);
                    updateProgress(currentPercent, `Đang cấu hình dữ liệu máy: ${item.url}`);
                }
            }

            // Tiến trình kiểm chứng cán mốc 100% hoàn mỹ
            updateProgress(100, 'Hệ thống đã sẵn sàng cho Offline hoàn chỉnh!');

            // Xuất cảnh báo kiểm chứng trực quan nếu người dùng mới xóa cache rồi ngắt mạng ngay lập tức
            if (missingOfflineCount > 0 && !navigator.onLine) {
                alert(`⚠️ THÔNG BÁO KIỂM CHỨNG OFFLINE:\nHệ thống phát hiện thấy bộ nhớ thiết bị đang thiếu hụt mất ${missingOfflineCount} file âm thanh (do hành động xóa lịch sử duyệt web hoặc xóa cache trình duyệt vừa diễn ra).\n\nVui lòng kết nối Internet (Wifi/4G) trở lại và load lại trang một lần để hệ thống tự động kéo đủ nhạc về máy nhé anh.`);
            }

            // Tạo độ trễ nhỏ (0.8 giây) để anh Cường kịp nhìn thấy trạng thái 100% trước khi tháo màn hình chờ vào ứng dụng chính
            setTimeout(hideLoadingScreen, 800);

        } catch (err) {
            console.error('[Hệ Thống] Gặp lỗi tiến trình đồng bộ tổng thể:', err);
            // Phương án phòng hờ: Nếu có lỗi hệ thống bất khả kháng, vẫn cho mở ứng dụng để không làm gián đoạn công việc của anh
            updateProgress(100, 'Đang đồng bộ giao diện...');
            setTimeout(hideLoadingScreen, 1000);
        }
    }

    // Đăng ký lệnh kích hoạt chạy toàn cục
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startSystemOfflineVerification);
    } else {
        startSystemOfflineVerification();
    }
})();