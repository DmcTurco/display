import { useState, useEffect, useCallback, useRef } from 'react';

export function useSound(soundUrl, initialVolume = 0.5) {
    const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
        const savedState = localStorage.getItem('soundEnabled');
        return savedState === 'true';
    });

    const notificationSound = useRef(null);
    const lastPlayedTime = useRef(0);
    const DEBOUNCE_DELAY = 2000;

	const configLocal = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    const soundName = configLocal.sound || 'sound2';

    // Audio 初期化（Web用）
    useEffect(() => {
        if (!soundUrl) return;

        const audio = new Audio(soundUrl);
        audio.volume = initialVolume;
        audio.preload = 'auto';

        notificationSound.current = audio;

        return () => {
            if (notificationSound.current) {
                notificationSound.current.pause();
                notificationSound.current = null;
            }
        };
    }, [soundUrl, initialVolume]);

	const playSound = useCallback(() => {
		const enabled = localStorage.getItem('soundEnabled') === 'true';
		if (!enabled) return;

		if (window.Android && typeof Android.playSound === 'function') {
			Android.playSound(soundName);
			return;
		}

		const now = Date.now();
		if (now - lastPlayedTime.current >= DEBOUNCE_DELAY) {
			lastPlayedTime.current = now;
			if (notificationSound.current) {
				notificationSound.current.currentTime = 0;
				notificationSound.current.volume = initialVolume;
				notificationSound.current.play().catch(() => {});
			}
		}
	}, [initialVolume, soundUrl, soundName]);

    const toggleSound = useCallback(() => {
        if (!notificationSound.current) return;

        const newState = !isSoundEnabled;
        setIsSoundEnabled(newState);
        localStorage.setItem('soundEnabled', newState.toString());

        if (newState) {
            // Reproducir un sonido de prueba
                notificationSound.current.currentTime = 0;
                notificationSound.current.volume = initialVolume;
            notificationSound.current.play()
                .catch(error => {
                    console.error('Error al reproducir el sonido:', error);
                });
        }
    }, [isSoundEnabled, initialVolume]);

    return {
        isSoundEnabled,
        toggleSound,
        playSound
    };
}