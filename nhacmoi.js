document.addEventListener('DOMContentLoaded', () => {
    // Danh sách bài nhạc mới
    const newSongs = [
        {
            id: 'audio-new-1',
            src: 'Nhac Dung Com.mp3',
            title: 'Nhạc Thiền Ngoại Cảnh'
        },
        {
            id: 'audio-new-2',
            src: 'guzheng nam mo a di da phat.mp3',
            title: 'Guzheng Nam Mô A Di Phật'
        },
		{
            id: 'audio-new-3',
            src: 'Than Thoai.mp3',
            title: 'Guitar Và Sáo Thần Thoại'
        },
		{
            id: 'audio-new-4',
            src: 'kiettuong.mp3',
            title: 'Nhạc Thiền Kiết Tường'
        }
    ];

    // Trạng thái của mỗi bài nhạc
    const songStates = {};
    const secondaryAudios = {};

    // Khởi tạo trạng thái và audio phụ
    newSongs.forEach(song => {
        const primaryAudio = document.getElementById(song.id);
        if (!primaryAudio) {
            console.error(`Audio element with id ${song.id} not found`);
            return;
        }

        songStates[song.id] = {
            isPlaying: false,
            pausedTime: 0,
            isHolding: false,
            pressStartTime: 0,
            activeAudio: null,
            waitingAudio: null
        };

        // Tạo audio phụ
        secondaryAudios[song.id] = createSecondaryAudio(song.id, song.src);
        setupSeamlessLoop(song.id);
    });

    // Tạo audio phụ
    function createSecondaryAudio(id, src) {
        const audio = document.createElement('audio');
        audio.id = `${id}-secondary`;
        audio.src = src;
        audio.preload = 'auto';
        audio.volume = 0;
        document.body.appendChild(audio);
        return audio;
    }

    // Thiết lập loop mượt mà
    function setupSeamlessLoop(audioId) {
        const state = songStates[audioId];
        if (!state) return;

        const primaryAudio = document.getElementById(audioId);
        const secondaryAudio = secondaryAudios[audioId];

        state.activeAudio = primaryAudio;
        state.waitingAudio = secondaryAudio;

        state.activeAudio.volume = 1;
        state.waitingAudio.volume = 0;

        const checkTime = () => {
            if (!state.isPlaying) return;
            if (state.activeAudio.currentTime >= state.activeAudio.duration - 1) {
                const playWaitingAudio = () => {
                    state.waitingAudio.volume = state.activeAudio.volume;
                    state.waitingAudio.currentTime = 0;
                    state.waitingAudio.play().catch(err => {
                        console.error('Lỗi phát audio phụ:', err);
                        if (err.name === 'NotAllowedError') {
                            const button = document.querySelector(`.play-pause[data-audio-id="${audioId}"]`);
                            if (button) {
                                const onUserInteraction = () => {
                                    state.waitingAudio.play().catch(e => console.error('Lỗi phát sau tương tác:', e));
                                    button.removeEventListener('click', onUserInteraction);
                                };
                                button.addEventListener('click', onUserInteraction, { once: true });
                            }
                        }
                    });
                };

                if (state.waitingAudio.readyState >= 3) {
                    playWaitingAudio();
                } else {
                    state.waitingAudio.addEventListener('canplaythrough', playWaitingAudio, { once: true });
                }

                // Chuyển đổi active và waiting audio
                const temp = state.activeAudio;
                state.activeAudio = state.waitingAudio;
                state.waitingAudio = temp;

                // Thiết lập lại waitingAudio
                state.waitingAudio.volume = 0;
                state.waitingAudio.pause();
                state.waitingAudio.currentTime = 0;
                state.waitingAudio.load();

                // Gắn lại sự kiện timeupdate cho activeAudio mới
                state.activeAudio.removeEventListener('timeupdate', checkTime);
                state.activeAudio.addEventListener('timeupdate', checkTime);
            }
        };

        state.activeAudio.addEventListener('timeupdate', checkTime);
    }

    // Xử lý sự kiện cho các nút
    newSongs.forEach(song => {
        const playPauseButton = document.querySelector(`.play-pause[data-audio-id="${song.id}"]`);
        const stopButton = document.querySelector(`.stop[data-audio-id="${song.id}"]`);
        if (!playPauseButton || !stopButton) {
            console.error(`Buttons for audio ${song.id} not found`);
            return;
        }

        let holdTimeout;

        const startPress = (e, action) => {
            e.preventDefault();
            const state = songStates[song.id];
            state.pressStartTime = Date.now();
            state.isHolding = true;

            if (action === 'stop') {
                holdTimeout = setTimeout(() => {
                    if (state.isHolding) {
                        stopAudio(song.id);
                    }
                }, 200);
            }
        };

        const endPress = (e, action) => {
            e.preventDefault();
            const state = songStates[song.id];
            const pressDuration = Date.now() - state.pressStartTime;

            clearTimeout(holdTimeout);

            if (pressDuration < 1000 && state.isHolding) {
                if (action === 'play-pause') {
                    if (state.isPlaying) {
                        pauseAudio(song.id);
                    } else {
                        playAudio(song.id);
                    }
                } else if (action === 'stop') {
                    stopAudio(song.id);
                }
            }
            state.isHolding = false;
        };

        playPauseButton.addEventListener('mousedown', e => startPress(e, 'play-pause'));
        playPauseButton.addEventListener('mouseup', e => endPress(e, 'play-pause'));
        playPauseButton.addEventListener('touchstart', e => startPress(e, 'play-pause'));
        playPauseButton.addEventListener('touchend', e => endPress(e, 'play-pause'));
        playPauseButton.addEventListener('touchmove', e => e.preventDefault());

        stopButton.addEventListener('mousedown', e => startPress(e, 'stop'));
        stopButton.addEventListener('mouseup', e => endPress(e, 'stop'));
        stopButton.addEventListener('touchstart', e => startPress(e, 'stop'));
        stopButton.addEventListener('touchend', e => endPress(e, 'stop'));
        stopButton.addEventListener('touchmove', e => e.preventDefault());
    });

    function playAudio(audioId) {
        const state = songStates[audioId];
        if (!state) return;

        const playPauseButton = document.querySelector(`.play-pause[data-audio-id="${audioId}"]`);

        state.activeAudio.currentTime = state.pausedTime;
        state.activeAudio.play().catch(err => {
            console.error('Lỗi phát audio:', err);
            if (err.name === 'NotAllowedError') {
                const button = document.querySelector(`.play-pause[data-audio-id="${audioId}"]`);
                if (button) {
                    const onUserInteraction = () => {
                        state.activeAudio.play().catch(e => console.error('Lỗi phát sau tương tác:', e));
                        button.removeEventListener('click', onUserInteraction);
                    };
                    button.addEventListener('click', onUserInteraction, { once: true });
                }
            }
        });
        state.waitingAudio.volume = 0;
        state.waitingAudio.pause();
        state.isPlaying = true;
        playPauseButton.classList.add('playing');
    }

    function pauseAudio(audioId) {
        const state = songStates[audioId];
        if (!state) return;

        const playPauseButton = document.querySelector(`.play-pause[data-audio-id="${audioId}"]`);

        state.pausedTime = state.activeAudio.currentTime;
        state.activeAudio.pause();
        state.waitingAudio.pause();
        state.isPlaying = false;
        playPauseButton.classList.remove('playing');
    }

    function stopAudio(audioId) {
        const state = songStates[audioId];
        if (!state) return;

        const playPauseButton = document.querySelector(`.play-pause[data-audio-id="${audioId}"]`);

        state.activeAudio.pause();
        state.activeAudio.currentTime = 0;
        state.waitingAudio.pause();
        state.waitingAudio.currentTime = 0;
        state.pausedTime = 0;
        state.isPlaying = false;
        playPauseButton.classList.remove('playing');
    }
});