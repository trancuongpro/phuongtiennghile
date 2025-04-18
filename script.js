document.addEventListener('DOMContentLoaded', () => {
    // Lấy các nút và thanh volume
    const buttons = document.querySelectorAll('.chinh-button');
    const volumeSliders = document.querySelectorAll('.volume-slider');
    const chaoButton = document.querySelector('.chao-button');
    const clockElement = document.getElementById('real-time-clock');

    // Danh sách các audio
    const audios = {
        'audio-1': document.getElementById('audio-1'),
        'audio-2': document.getElementById('audio-2'),
        'audio-3': document.getElementById('audio-3'),
        'audio-4': document.getElementById('audio-4'),
        'audio-5': document.getElementById('audio-5'),
        'audio-6': document.getElementById('audio-6'),
        'audio-7': document.getElementById('audio-7'),
        'audio-8': document.getElementById('audio-8'),
        'audio-9': document.getElementById('audio-9'),
        'audio-10': document.getElementById('audio-10'),
        'audio-11': document.getElementById('audio-11'),
        'audio-12': document.getElementById('audio-12'),
        'audio-13': document.getElementById('audio-13'),
        'audio-14': document.getElementById('audio-14'),
        'audio-15': document.getElementById('audio-15'),
        'audio-16': [
            document.getElementById('audio-16-1'),
            document.getElementById('audio-16-2')
        ]
    };

    // Theo dõi trạng thái mỗi audio
    const audioStates = {};
    Object.keys(audios).forEach(id => {
        audioStates[id] = { isPlaying: false, lastClickTime: 0 };
    });

    // Xử lý loop sớm 1 giây cho tất cả audio
    Object.entries(audios).forEach(([id, audio]) => {
        if (Array.isArray(audio)) {
            audio.forEach(a => setupSeamlessLoop(a));
        } else {
            setupSeamlessLoop(audio);
        }
    });

    function setupSeamlessLoop(audio) {
        audio.preload = 'auto'; // Tải trước file MP3
        // Tắt sự kiện ended để tránh xung đột
        audio.removeEventListener('ended', () => {});
        // Dùng timeupdate để kiểm tra thời gian
        audio.addEventListener('timeupdate', () => {
            if (audio.loop && audio.currentTime >= audio.duration - 0.25) { // Loop sớm 0.25 giây
                audio.currentTime = 0; // Nhảy về đầu
                audioプレイ().catch(err => console.error('Lỗi phát lại audio:', err));
            }
        });
    }

    // Điều khiển volume
    volumeSliders.forEach(slider => {
        const audioId = slider.dataset.audioId;
        const audio = audioId === 'audio-16' ? audios['audio-16'] : audios[audioId];

        slider.addEventListener('input', () => {
            const volume = slider.value;
            if (Array.isArray(audio)) {
                audio.forEach(a => a.volume = volume);
            } else {
                audio.volume = volume;
            }
        });
    });

    // Xử lý nhấn nút
    buttons.forEach(button => {
        const audioId = button.dataset.audioId;
        const audio = audioId === 'audio-16' ? audios['audio-16'] : audios[audioId];

        button.addEventListener('click', () => {
            const now = Date.now();
            const state = audioStates[audioId];

            // Nhấn lâu 1 giây để dừng
            if (now - state.lastClickTime < 1000 && state.isPlaying) {
                if (Array.isArray(audio)) {
                    audio.forEach(a => {
                        a.pause();
                        a.currentTime = 0;
                    });
                } else {
                    audio.pause();
                    audio.currentTime = 0;
                }
                button.classList.remove('playing', 'paused');
                state.isPlaying = false;
            } else {
                // Chuyển đổi play/pause
                if (state.isPlaying) {
                    if (Array.isArray(audio)) {
                        audio.forEach(a => a.pause());
                    } else {
                        audio.pause();
                    }
                    button.classList.remove('playing');
                    button.classList.add('paused');
                    state.isPlaying = false;
                } else {
                    // Dừng tất cả audio khác
                    Object.entries(audios).forEach(([id, a]) => {
                        if (id !== audioId) {
                            if (Array.isArray(a)) {
                                a.forEach(au => {
                                    au.pause();
                                    au.currentTime = 0;
                                });
                            } else {
                                a.pause();
                                a.currentTime = 0;
                            }
                            audioStates[id].isPlaying = false;
                            document.querySelector(`[data-audio-id="${id}"]`)?.classList.remove('playing', 'paused');
                        }
                    });

                    // Phát audio hiện tại
                    if (Array.isArray(audio)) {
                        audio.forEach(a => a.play().catch(err => console.error('Lỗi phát audio:', err)));
                    } else {
                        audio.play().catch(err => console.error('Lỗi phát audio:', err));
                    }
                    button.classList.remove('paused');
                    button.classList.add('playing');
                    state.isPlaying = true;
                }
            }

            state.lastClickTime = now;
        });
    });

    // Nút Chao (phát audio-9: Quốc Ca)
    chaoButton.addEventListener('click', () => {
        const audioId = 'audio-9';
        const audio = audios[audioId];
        const state = audioStates[audioId];

        if (state.isPlaying) {
            audio.pause();
            audio.currentTime = 0;
            state.isPlaying = false;
        } else {
            // Dừng tất cả audio khác
            Object.entries(audios).forEach(([id, a]) => {
                if (id !== audioId) {
                    if (Array.isArray(a)) {
                        a.forEach(au => {
                            au.pause();
                            au.currentTime = 0;
                        });
                    } else {
                        a.pause();
                        a.currentTime = 0;
                    }
                    audioStates[id].isPlaying = false;
                    document.querySelector(`[data-audio-id="${id}"]`)?.classList.remove('playing', 'paused');
                }
            });

            audio.play().catch(err => console.error('Lỗi phát audio:', err));
            state.isPlaying = true;
        }
    });

    // Đồng hồ thời gian thực
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
    updateClock();
    setInterval(updateClock, 1000);
});