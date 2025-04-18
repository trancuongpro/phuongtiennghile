document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.chinh-button');
    const volumeSliders = document.querySelectorAll('.volume-slider');
    let longPressTimer;
    let touchStartTime;

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
    updateRealTimeClock();
    setInterval(updateRealTimeClock, 1000);

    buttons.forEach(button => {
        const audioId = button.getAttribute('data-audio-id');
        const audios = audioId === 'audio-16'
            ? [document.getElementById('audio-16-1'), document.getElementById('audio-16-2')]
            : [document.getElementById(audioId)];

        audios.forEach((audio, index) => {
            if (!audio) {
                console.error(`Audio element not found for ${audioId}${index === 0 ? '' : '-' + (index + 1)}`);
            }
        });

        buttonStates.set(button, { isPlaying: false, isPaused: false });

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

        // Hàm xử lý phát/tạm dừng âm thanh
        const handlePlayPause = () => {
            const state = buttonStates.get(button);

            if (!state.isPlaying) {
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
                audios.forEach(audio => audio && audio.pause());
                state.isPaused = true;
                button.classList.remove('playing');
                button.classList.add('paused');
            } else {
                audios.forEach(audio => {
                    if (audio) {
                        audio.play().catch(e => console.error(`Error playing audio ${audio.id}:`, e));
                    }
                });
                state.isPaused = false;
                button.classList.add('playing');
                button.classList.remove('paused');
            }
        };

        // Xử lý click trên PC
        button.addEventListener('click', handlePlayPause);

        // Xử lý chạm trên di động
        button.addEventListener('touchstart', (e) => {
            // Không gọi e.preventDefault() để tránh chặn sự kiện chạm
            touchStartTime = Date.now();
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
            }, 1000); // Nhấn giữ 1 giây để dừng
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault(); // Ngăn hành vi mặc định chỉ trong touchend nếu cần
            clearTimeout(longPressTimer);
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 500) { // Chạm ngắn dưới 0.5 giây là tap
                handlePlayPause();
            }
        });

        // Xử lý nhấn giữ trên PC
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
            }, 1000);
        });

        button.addEventListener('mouseup', () => {
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
                audio.volume = 1;
            }
        });
        slider.value = 1;

        slider.addEventListener('input', () => {
            audios.forEach(audio => {
                if (audio) {
                    audio.volume = slider.value;
                }
            });
        });
    });
});
