document.addEventListener('DOMContentLoaded', () => {
    // Lấy tất cả các thanh trượt volume
    const volumeSliders = document.querySelectorAll('.volume-slider');

    volumeSliders.forEach(slider => {
        const audioId = slider.dataset.audioId;
        const primaryAudio = document.getElementById(audioId);
        const isArrayAudio = audioId === 'audio-16'; // Kiểm tra trường hợp audio-16

        // Kiểm tra xem audio có tồn tại không
        if (primaryAudio || isArrayAudio) {
            // Hàm cập nhật âm lượng cho tất cả audio liên quan
            const updateVolume = () => {
                const volume = parseFloat(slider.value); // Chuyển đổi giá trị thành số

                // Trường hợp audio-16 (array của hai audio)
                if (isArrayAudio) {
                    const audios = [
                        document.getElementById('audio-16-1'),
                        document.getElementById('audio-16-2'),
                        document.getElementById('audio-16-1-secondary'),
                        document.getElementById('audio-16-2-secondary')
                    ];
                    audios.forEach(audio => {
                        if (audio) {
                            audio.volume = volume;
                            console.log(`Volume for ${audio.id} set to: ${volume}`); // Debug log
                        }
                    });
                } else {
                    // Các audio thông thường
                    const secondaryAudio = document.getElementById(`${audioId}-secondary`);
                    if (primaryAudio) {
                        primaryAudio.volume = volume;
                        console.log(`Volume for ${audioId} set to: ${volume}`); // Debug log
                    }
                    if (secondaryAudio) {
                        secondaryAudio.volume = volume;
                        console.log(`Volume for ${audioId}-secondary set to: ${volume}`); // Debug log
                    }
                }
            };

            // Cập nhật âm lượng khi người dùng kéo thanh trượt
            slider.addEventListener('input', () => {
                updateVolume();
            });

            // Cập nhật âm lượng khi người dùng thả thanh trượt (để đảm bảo đồng bộ trên Safari)
            slider.addEventListener('change', () => {
                updateVolume();
            });

            // Xử lý touch để đảm bảo tương thích với Safari
            slider.addEventListener('touchmove', () => {
                updateVolume();
            });
        } else {
            console.warn(`Audio element with ID ${audioId} not found.`);
        }
    });
});