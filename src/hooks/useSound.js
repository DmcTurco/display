import { useState, useEffect, useCallback, useRef } from 'react';

export const useSound = (soundUrl) => {
    const [isSoundEnabled, setIsSoundEnabled] = useState(() =>
        localStorage.getItem('soundEnabled') === 'true'
    );
    const notificationSound = useRef(null);

    useEffect(() => {
        localStorage.setItem('soundEnabled', isSoundEnabled);
    }, [isSoundEnabled]);

    useEffect(() => {
        try {
            const audio = new Audio(soundUrl);
            audio.volume = 0.5;
            audio.preload = 'auto';
            audio.muted = false;

            audio.addEventListener('loadeddata', () => {
                notificationSound.current = audio;
            });

            audio.load();

            return () => {
                if (notificationSound.current) {
                    notificationSound.current.pause();
                    notificationSound.current = null;
                }
            };
        } catch (error) {
            console.error('Error al inicializar el audio:', error);
        }
    }, [soundUrl]);

    const playSound = useCallback(() => {
        if (!isSoundEnabled || !notificationSound.current) return;

        try {
            notificationSound.current.currentTime = 0;
            const playPromise = notificationSound.current.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name === 'NotAllowedError') {
                        setIsSoundEnabled(false);
                        localStorage.setItem('soundEnabled', 'false');
                    }
                });
            }
        } catch (error) {
            console.error('Error al reproducir sonido:', error);
        }
    }, [isSoundEnabled]);

    const toggleSound = useCallback(() => {
        if (!notificationSound.current) return;

        if (isSoundEnabled) {
            setIsSoundEnabled(false);
            localStorage.setItem('soundEnabled', 'false');
            return;
        }

        try {
            notificationSound.current.volume = 0.5;
            notificationSound.current.muted = false;
            const playPromise = notificationSound.current.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        notificationSound.current.pause();
                        notificationSound.current.currentTime = 0;
                        setIsSoundEnabled(true);
                        localStorage.setItem('soundEnabled', 'true');
                    })
                    .catch(() => {
                        setIsSoundEnabled(false);
                        localStorage.setItem('soundEnabled', 'false');
                    });
            }
        } catch (error) {
            setIsSoundEnabled(false);
            localStorage.setItem('soundEnabled', 'false');
        }
    }, [isSoundEnabled]);

    return {
        playSound,
        toggleSound,
        isSoundEnabled
    };
};