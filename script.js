document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.chinh-button');
    const volumeSliders = document.querySelectorAll('.volume-slider');
    let longPressTimer;

    // Quản lý trạng thái của từng button
    const buttonStates = new Map();

    // Hiển thị thời gian thực
    function updateRealTimeClock() {
        const now = new Date();
        const vietnamTime = now.toLocaleTimeString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const clockElement = document.getElementById('real-time-clock');
        if (clockElement) {
            clockElement.textContent = `Giờ Việt Nam: ${vietnamTime}`;
        }
    }

    // Cập nhật thời gian mỗi giây
    updateRealTimeClock(); // Gọi ngay lần đầu
    setInterval(updateRealTimeClock, 1000); // Cập nhật mỗi giây

    buttons.forEach(button => {
        const audioId = button.getAttribute('data-audio-id');
        // Xử lý trường hợp audio-16 có hai file
        const audios = audioId === 'audio-16' 
            ? [document.getElementById('audio-16-1'), document.getElementById('audio-16-2')]
            : [document.getElementById(audioId)];

        // Kiểm tra xem các audio element có tồn tại không
        audios.forEach((audio, index) => {
            if (!audio) {
                console.error(`Audio element not found for ${audioId}${index === 0 ? '' : '-' + (index + 1)}`);
            }
        });

        // Khởi tạo trạng thái cho button
        buttonStates.set(button, { isPlaying: false, isPaused: false });

        // Xử lý khi audio kết thúc (dành cho audio không loop)
        audios.forEach(audio => {
            if (audio) {
                audio.addEventListener('ended', () => {
                    const state = buttonStates.get(button);
                    state.isPlaying = false;
                    state.isPaused = false;
                    button.classList.remove('playing', 'paused');
                });
            }
        });

        // Xử lý nhấn 1 lần: Phát hoặc pause/play
        button.addEventListener('click', () => {
            const state = buttonStates.get(button);

            if (!state.isPlaying) {
                // Phát nhạc
                audios.forEach(audio => {
                    if (audio) {
                        audio.play().catch(e => console.error(`Error playing audio ${audio.id}:`, e));
                    }
                });
                state.isPlaying = true;
                state.isPaused = false;
                button.classList.add('playing');
                button.classList.remove('paused');
            } else if (state.isPlaying && !state.isPaused) {
                // Tạm dừng
                audios.forEach(audio => audio && audio.pause());
                state.isPaused = true;
                button.classList.remove('playing');
                button.classList.add('paused');
            } else {
                // Tiếp tục phát
                audios.forEach(audio => {
                    if (audio) {
                        audio.play().catch(e => console.error(`Error playing audio ${audio.id}:`, e));
                    }
                });
                state.isPaused = false;
                button.classList.add('playing');
                button.classList.remove('paused');
            }
        });

        // Xử lý nhấn giữ 1 giây: Stop
        button.addEventListener('mousedown', () => {
            longPressTimer = setTimeout(() => {
                audios.forEach(audio => {
                    if (audio) {
                        audio.pause();
                        audio.currentTime = 0;
                    }
                });
                const state = buttonStates.get(button);
                state.isPlaying = false;
                state.isPaused = false;
                button.classList.remove('playing', 'paused');
            }, 1000); // 1 giây
        });

        button.addEventListener('mouseup', () => {
            clearTimeout(longPressTimer);
        });

        button.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Ngăn hành vi mặc định trên di động
            longPressTimer = setTimeout(() => {
                audios.forEach(audio => {
                    if (audio) {
                        audio.pause();
                        audio.currentTime = 0;
                    }
                });
                const state = buttonStates.get(button);
                state.isPlaying = false;
                state.isPaused = false;
                button.classList.remove('playing', 'paused');
            }, 1000); // 1 giây
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            clearTimeout(longPressTimer);
        });
    });

    // Điều chỉnh âm lượng
    volumeSliders.forEach(slider => {
        const audioId = slider.getAttribute('data-audio-id');
        const audios = audioId === 'audio-16' 
            ? [document.getElementById('audio-16-1'), document.getElementById('audio-16-2')]
            : [document.getElementById(audioId)];
        
        audios.forEach(audio => {
            if (audio) {
                audio.volume = 1; // Đặt âm lượng mặc định là 100%
            }
        });
        slider.value = 1; // Đồng bộ giá trị thanh trượt

        slider.addEventListener('input', () => {
            audios.forEach(audio => {
                if (audio) {
                    audio.volume = slider.value;
                }
            });
        });
    });
});