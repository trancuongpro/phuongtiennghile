document.addEventListener('DOMContentLoaded', () => {
    // Danh sách các audio ID cần loop mượt mà
    const loopAudioIds = [
        'audio-2',  // Lưu Thủy Cung Nghinh
        'audio-3',  // Ngâm Thơ Huế
        'audio-4',  // Rao Đàn Bầu
        'audio-5',  // Rao Đàn Nhị
        'audio-6',  // Rao Tranh Sáo
        'audio-7',  // Nhạc Thiền 1
        'audio-8',  // Nhạc Thiền 2
        'audio-11', // Nhạc Trao Hoa
        'audio-13', // Nhạc Niệm Bổn Sư
        'audio-14', // Nhạc Thiền 3
        'audio-15', // Trống Tứ Liên Hồi
        'audio-16'  // Pháp Loa Thỉnh (array của hai audio)
    ];

    // Lưu trữ audio phụ và trạng thái
    const secondaryAudios = {};
    const seamlessStates = {};

    // Khởi tạo cho mỗi audio loop
    loopAudioIds.forEach(id => {
        seamlessStates[id] = {
            isPlaying: false,
            activeAudio: null,
            waitingAudio: null,
            isHolding: false,
            pressStartTime: 0,
            pausedTime: 0 // Lưu thời điểm dừng khi pause
        };

        if (id === 'audio-16') {
            // Trường hợp đặc biệt cho audio-16 (array của hai audio)
            secondaryAudios[id] = [
                createSecondaryAudio('audio-16-1', 'Phap Loa 1.mp3'),
                createSecondaryAudio('audio-16-2', 'Phap Loa 2.mp3')
            ];
        } else {
            const primaryAudio = document.getElementById(id);
            secondaryAudios[id] = createSecondaryAudio(id, primaryAudio.src);
        }
    });

    // Tạo audio phụ
    function createSecondaryAudio(id, src) {
        const audio = document.createElement('audio');
        audio.id = `${id}-secondary`;
        audio.src = src;
        audio.preload = 'auto';
        audio.volume = 0; // Bắt đầu im lặng
        document.body.appendChild(audio);
        return audio;
    }

    // Thiết lập loop mượt mà cho audio
    function setupSeamlessLoop(audioId) {
        const state = seamlessStates[audioId];
        const primaryAudio = audioId === 'audio-16' ? audios[audioId] : audios[audioId];
        const secondaryAudio = secondaryAudios[audioId];

        // Gán audio chính và phụ
        state.activeAudio = Array.isArray(primaryAudio) ? primaryAudio.map(a => a.cloneNode()) : primaryAudio;
        state.waitingAudio = secondaryAudio;

        // Lấy âm lượng ban đầu từ thanh trượt
        const slider = document.querySelector(`.volume-slider[data-audio-id="${audioId}"]`);
        const initialVolume = slider ? slider.value : 1;

        if (Array.isArray(state.activeAudio)) {
            state.activeAudio.forEach(a => {
                a.volume = initialVolume;
                a.preload = 'auto';
            });
            state.waitingAudio.forEach(a => {
                a.volume = 0;
                a.preload = 'auto';
            });
        } else {
            state.activeAudio.volume = initialVolume;
            state.waitingAudio.volume = 0;
        }

        // Theo dõi audio chính để chuyển đổi
        const monitorAudio = (audio, isArray = false) => {
    const checkTime = () => {
        if (!state.isPlaying) return;

        const currentAudio = isArray ? audio[0] : audio;
        if (currentAudio.currentTime >= currentAudio.duration - 0.5) {
            // Kiểm tra audio phụ đã sẵn sàng
            const playWaitingAudio = () => {
                if (isArray) {
                    state.waitingAudio.forEach(w => {
                        w.volume = initialVolume;
                        w.currentTime = 0;
                        w.play().catch(err => {
                            console.error('Lỗi phát audio phụ:', err);
                            if (err.name === 'NotAllowedError') {
                                // Đợi tương tác người dùng
                                const button = document.querySelector(`button[data-audio-id="${audioId}"]`);
                                const onUserInteraction = () => {
                                    w.play().catch(e => console.error('Lỗi phát audio phụ sau tương tác:', e));
                                    button.removeEventListener('click', onUserInteraction);
                                };
                                button.addEventListener('click', onUserInteraction, { once: true });
                            }
                        });
                    });
                } else {
                    state.waitingAudio.volume = initialVolume;
                    state.waitingAudio.currentTime = 0;
                    state.waitingAudio.play().catch(err => {
                        console.error('Lỗi phát audio phụ:', err);
                        if (err.name === 'NotAllowedError') {
                            const button = document.querySelector(`button[data-audio-id="${audioId}"]`);
                            const onUserInteraction = () => {
                                state.waitingAudio.play().catch(e => console.error('Lỗi phát audio phụ sau tương tác:', e));
                                button.removeEventListener('click', onUserInteraction);
                            };
                            button.addEventListener('click', onUserInteraction, { once: true });
                        }
                    });
                }
            };

            // Đợi audio phụ sẵn sàng
            if (isArray) {
                Promise.all(state.waitingAudio.map(w => new Promise(resolve => {
                    if (w.readyState >= 3) resolve();
                    else w.addEventListener('canplaythrough', resolve, { once: true });
                }))).then(playWaitingAudio);
            } else {
                if (state.waitingAudio.readyState >= 3) {
                    playWaitingAudio();
                } else {
                    state.waitingAudio.addEventListener('canplaythrough', playWaitingAudio, { once: true });
                }
            }

            // Hoán đổi sau 100ms
            setTimeout(() => {
                if (!state.isPlaying) return;
                const temp = state.activeAudio;
                state.activeAudio = state.waitingAudio;
                state.waitingAudio = temp;

                // Reset audio phụ
                if (isArray) {
                    state.waitingAudio.forEach(w => {
                        w.volume = 0;
                        w.pause();
                        w.currentTime = 0;
                        w.load(); // Tải lại để đảm bảo sẵn sàng
                    });
                } else {
                    state.waitingAudio.volume = 0;
                    state.waitingAudio.pause();
                    state.waitingAudio.currentTime = 0;
                    state.waitingAudio.load(); // Tải lại để đảm bảo sẵn sàng
                }

                // Gắn lại sự kiện timeupdate cho activeAudio mới
                if (isArray) {
                    state.activeAudio.forEach(a => {
                        a.removeEventListener('timeupdate', checkTime); // Xóa sự kiện cũ
                        a.addEventListener('timeupdate', checkTime); // Gắn lại
                    });
                } else {
                    state.activeAudio.removeEventListener('timeupdate', checkTime);
                    state.activeAudio.addEventListener('timeupdate', checkTime);
                }
            }, 100);
        }
    };

    if (isArray) {
        audio.forEach(a => {
            a.addEventListener('timeupdate', checkTime);
        });
    } else {
        audio.addEventListener('timeupdate', checkTime);
    }
};

    // Danh sách audio từ script.js
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

    // Ghi đè hành vi nút cho audio loop
    loopAudioIds.forEach(audioId => {
        const button = document.querySelector(`button[data-audio-id="${audioId}"]`);
        if (!button) return;

        setupSeamlessLoop(audioId);

        let holdTimeout;

        const startPress = (e) => {
            e.preventDefault();
            const state = seamlessStates[audioId];
            state.pressStartTime = Date.now();
            state.isHolding = true;

            holdTimeout = setTimeout(() => {
                if (state.isHolding) {
                    console.log(`Dừng audio mượt ${audioId}`);
                    stopAudio(audioId);
                }
            }, 1000);
        };

        const endPress = (e) => {
            e.preventDefault();
            const state = seamlessStates[audioId];
            const pressDuration = Date.now() - state.pressStartTime;

            clearTimeout(holdTimeout);

            if (pressDuration < 1000 && state.isHolding) {
                if (state.isPlaying) {
                    console.log(`Tạm dừng audio mượt ${audioId}`);
                    pauseAudio(audioId);
                } else {
                    console.log(`Phát audio mượt ${audioId}`);
                    playAudio(audioId);
                }
            }
            state.isHolding = false;
        };

        // Xóa listener cũ từ script.js
        button.removeEventListener('mousedown', startPress);
        button.removeEventListener('mouseup', endPress);
        button.removeEventListener('touchstart', startPress);
        button.removeEventListener('touchend', endPress);

        // Thêm listener mới
        button.addEventListener('mousedown', startPress);
        button.addEventListener('mouseup', endPress);
        button.addEventListener('touchstart', startPress);
        button.addEventListener('touchend', endPress);
        button.addEventListener('touchmove', e => e.preventDefault());
    });

    // Phát audio
    function playAudio(audioId) {
        const state = seamlessStates[audioId];
        const button = document.querySelector(`button[data-audio-id="${audioId}"]`);
        const slider = document.querySelector(`.volume-slider[data-audio-id="${audioId}"]`);
        const volume = slider ? slider.value : 1;

        if (Array.isArray(state.activeAudio)) {
            state.activeAudio.forEach(a => {
                a.volume = volume;
                // Nếu có thời điểm dừng, tiếp tục từ đó, nếu không thì từ đầu
                a.currentTime = state.pausedTime || 0;
                a.play().catch(err => console.error('Lỗi phát audio:', err));
            });
            state.waitingAudio.forEach(a => {
                a.volume = 0;
                a.currentTime = 0;
                a.pause();
            });
        } else {
            state.activeAudio.volume = volume;
            // Nếu có thời điểm dừng, tiếp tục từ đó, nếu không thì từ đầu
            state.activeAudio.currentTime = state.pausedTime || 0;
            state.activeAudio.play().catch(err => console.error('Lỗi phát audio:', err));
            state.waitingAudio.volume = 0;
            state.waitingAudio.currentTime = 0;
            state.waitingAudio.pause();
        }

        state.isPlaying = true;
        button.classList.remove('paused');
        button.classList.add('playing');
    }

    // Tạm dừng audio
    function pauseAudio(audioId) {
        const state = seamlessStates[audioId];
        const button = document.querySelector(`button[data-audio-id="${audioId}"]`);

        if (Array.isArray(state.activeAudio)) {
            state.activeAudio.forEach(a => {
                state.pausedTime = a.currentTime; // Lưu thời điểm dừng
                a.pause();
            });
            state.waitingAudio.forEach(a => a.pause());
        } else {
            state.pausedTime = state.activeAudio.currentTime; // Lưu thời điểm dừng
            state.activeAudio.pause();
            state.waitingAudio.pause();
        }

        state.isPlaying = false;
        button.classList.remove('playing');
        button.classList.add('paused');
    }

    // Dừng audio
    function stopAudio(audioId) {
        const state = seamlessStates[audioId];
        const button = document.querySelector(`button[data-audio-id="${audioId}"]`);

        if (Array.isArray(state.activeAudio)) {
            state.activeAudio.forEach(a => {
                a.pause();
                a.currentTime = 0;
            });
            state.waitingAudio.forEach(a => {
                a.pause();
                a.currentTime = 0;
            });
        } else {
            state.activeAudio.pause();
            state.activeAudio.currentTime = 0;
            state.waitingAudio.pause();
            state.waitingAudio.currentTime = 0;
        }

        state.isPlaying = false;
        state.pausedTime = 0; // Reset thời điểm dừng
        button.classList.remove('playing', 'paused');
    }

    // Xử lý thay đổi âm lượng
    document.querySelectorAll('.volume-slider').forEach(slider => {
        const audioId = slider.dataset.audioId;
        if (loopAudioIds.includes(audioId)) {
            slider.addEventListener('input', () => {
                const state = seamlessStates[audioId];
                const volume = slider.value;
                if (Array.isArray(state.activeAudio)) {
                    state.activeAudio.forEach(a => a.volume = volume);
                    state.waitingAudio.forEach(a => {
                        if (a.volume > 0) a.volume = volume;
                    });
                } else {
                    state.activeAudio.volume = volume;
                    if (state.waitingAudio.volume > 0) state.waitingAudio.volume = volume;
                }
            });
        }
    });
});