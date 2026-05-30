/**
 * chan.js
 * Chức năng: Chặn chuột phải, bôi đen quét khối và các phím tắt sao chép dữ liệu.
 * Lưu ý: Giữ nguyên phím F12 để phục vụ lập trình và kiểm tra hệ thống.
 * Phát triển bởi: Trần Cường
 */

(function () {
    // 1. Chặn menu chuột phải trên toàn bộ trang web
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    }, false);

    // 2. Chặn hành vi quét khối, bôi đen văn bản/giao diện
    document.addEventListener('selectstart', function (e) {
        e.preventDefault();
    }, false);

    // 3. Chặn các tổ hợp phím tắt sao chép và xem mã nguồn nâng cao
    document.addEventListener('keydown', function (e) {
        // Kiểm tra xem người dùng có nhấn kèm phím Ctrl (hoặc Cmd trên Mac) không
        const isCtrl = e.ctrlKey || e.metaKey;

        if (isCtrl) {
            switch (e.key.toLowerCase()) {
                case 'c': // Chặn Ctrl + C (Copy)
                case 'x': // Chặn Ctrl + X (Cut)
                case 'a': // Chặn Ctrl + A (Chọn tất cả)
                case 'u': // Chặn Ctrl + U (Xem nguồn trang / View Source)
                    e.preventDefault();
                    e.stopPropagation();
                    break;
            }
        }

        // Chặn thêm tổ hợp phím Ctrl + Shift + I (Mở DevTools phụ) nếu cần thiết
        // Nhưng phím F12 độc lập thì KHÔNG bị chặn, vẫn bấm hoạt động bình thường.
        if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'i') {
            e.preventDefault();
            e.stopPropagation();
        }
    }, false);
})();