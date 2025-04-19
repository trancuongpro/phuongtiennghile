document.addEventListener('DOMContentLoaded', () => {
    // Lấy các nút và thanh volume
    const buttons = document.querySelectorAll('.chinh-button');
    const volumeSliders = document.querySelectorAll('.volume-slider');
    const chaoButton = document.querySelector('.chao-button');

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
        audioStates[id] = { isPlaying: false, pressStartTime: 0, isHolding: false };
    });

    // Xử lý loop và không loop cho tất cả audio
    Object.entries(audios).forEach(([id, audio]) => {
        if (Array.isArray(audio)) {
            audio.forEach(a => setupAudio(a, id));
        } else {
            setupAudio(audio, id);
        }
    });

    function setupAudio(audio, audioId) {
        audio.preload = 'auto'; // Tải trước file MP3
        // Xóa sự kiện ended cũ để tránh xung đột
        audio.removeEventListener('ended', () => {});

        if (audio.loop) {
            // Xử lý loop cho audio có thuộc tính loop
            audio.addEventListener('timeupdate', () => {
                if (audio.currentTime >= audio.duration - 0.2) { // Loop sớm 0.2 giây
                    audio.currentTime = 0; // Nhảy về đầu
                    audio.play().catch(err => console.error('Lỗi phát lại audio:', err));
                }
            });
        } else {
            // Xử lý audio không loop: khi kết thúc, trở về trạng thái stop
            audio.addEventListener('ended', () => {
                console.log(`Audio ${audioId} ended, resetting to stop state`); // Debug log
                const state = audioStates[audioId];
                const button = document.querySelector(`button[data-audio-id="${audioId}"]`);
                audio.pause();
                audio.currentTime = 0;
                state.isPlaying = false;
                state.isHolding = false;
                if (button) {
                    console.log(`Resetting button for ${audioId}`); // Debug log
                    button.classList.remove('playing', 'paused');
                } else {
                    console.warn(`Button for ${audioId} not found`); // Debug log
                }
            });
        }
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

    // Xử lý nhấn giữ nút
    buttons.forEach(button => {
        const audioId = button.dataset.audioId;
        const audio = audioId === 'audio-16' ? audios['audio-16'] : audios[audioId];
        let holdTimeout;

        // Hàm xử lý bắt đầu nhấn (chuột hoặc cảm ứng)
        const startPress = (e) => {
            e.preventDefault(); // Ngăn hành vi mặc định
            const state = audioStates[audioId];
            state.pressStartTime = Date.now();
            state.isHolding = true;

            // Đặt timeout để kiểm tra giữ 1 giây
            holdTimeout = setTimeout(() => {
                if (state.isHolding) {
                    console.log(`Stop audio ${audioId} by hold`); // Debug log
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
                    state.isHolding = false;
                }
            }, 1000);
        };

        // Hàm xử lý thả nút (chuột hoặc cảm ứng)
        const endPress = (e) => {
            e.preventDefault(); // Ngăn hành vi mặc định
            const state = audioStates[audioId];
            const pressDuration = Date.now() - state.pressStartTime;

            clearTimeout(holdTimeout);

            // Nếu nhấn nhanh (dưới 1 giây), xử lý play/pause
            if (pressDuration < 1000 && state.isHolding) {
                if (state.isPlaying) {
                    console.log(`Pause audio ${audioId}`); // Debug log
                    if (Array.isArray(audio)) {
                        audio.forEach(a => a.pause());
                    } else {
                        audio.pause();
                    }
                    button.classList.remove('playing');
                    button.classList.add('paused');
                    state.isPlaying = false;
                } else {
                    console.log(`Play audio ${audioId}`); // Debug log
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
            state.isHolding = false;
        };

        // Sự kiện cho chuột
        button.addEventListener('mousedown', startPress);
        button.addEventListener('mouseup', endPress);

        // Sự kiện cho cảm ứng
        button.addEventListener('touchstart', startPress);
        button.addEventListener('touchend', endPress);

        // Ngăn sự kiện touchmove gây nhiễu
        button.addEventListener('touchmove', e => e.preventDefault());
    });

    // Nút Chao (phát audio-9: Quốc Ca)
    chaoButton.addEventListener('click', () => {
        const audioId = 'audio-9';
        const audio = audios[audioId];
        const state = audioStates[audioId];

        if (state.isPlaying) {
            console.log(`Stop audio-9 by Chao button`); // Debug log
            audio.pause();
            audio.currentTime = 0;
            state.isPlaying = false;
        } else {
            console.log(`Play audio-9 by Chao button`); // Debug log
            audio.play().catch(err => console.error('Lỗi phát audio:', err));
            state.isPlaying = true;
        }
    });
});