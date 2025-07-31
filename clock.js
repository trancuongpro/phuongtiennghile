document.addEventListener('DOMContentLoaded', () => {
    const clockElement = document.getElementById('real-time-clock');

    // Đặt cờ để ngăn updateClock cũ (dù script.js đã xóa, giữ lại để tương thích tương lai)
    window.__clockUpdated = true;

    function updateClock() {
        const now = new Date();
        const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const day = daysOfWeek[now.getDay()];
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        if (clockElement) {
            clockElement.textContent = `Trần Cường .Giờ Việt Nam: ${day} ${hours}:${minutes}:${seconds}`;
        }
    }

    updateClock();
    setInterval(updateClock, 1000);
});
