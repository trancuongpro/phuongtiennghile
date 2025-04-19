document.addEventListener('DOMContentLoaded', () => {
    // Lấy tất cả các thanh trượt volume
    const volumeSliders = document.querySelectorAll('.volume-slider');

    volumeSliders.forEach(slider => {
        const audioId = slider.dataset.audioId;
        const audio = document.getElementById(audioId);

        // Kiểm tra xem audio có tồn tại không
        if (audio) {
            // Cập nhật âm lượng khi người dùng thay đổi thanh trượt
            slider.addEventListener('input', () => {
                const volume = slider.value;
                audio.volume = volume; // Cập nhật âm lượng của audio
                console.log(`Volume for ${audioId} set to: ${volume}`); // Debug log
            });

            // Cập nhật âm lượng khi người dùng thả thanh trượt
            slider.addEventListener('change', () => {
                const volume = slider.value;
                audio.volume = volume; // Cập nhật âm lượng của audio
                console.log(`Volume for ${audioId} changed to: ${volume}`); // Debug log
            });
        }
    });
});