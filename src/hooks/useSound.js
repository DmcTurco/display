import { useState, useEffect, useCallback, useRef } from 'react';
import _ from 'lodash';

export function useSound(soundUrl, initialVolume = 0.5) {
    const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
        const savedState = localStorage.getItem('soundEnabled');
        return savedState === 'true';
    });

    const notificationSound = useRef(null);
    const lastPlayedTime = useRef(0);
    const DEBOUNCE_DELAY = 2000;

    // Recrear el audio cuando cambie la URL
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
        if (!isSoundEnabled || !notificationSound.current) return;

        const now = Date.now();
        if (now - lastPlayedTime.current >= DEBOUNCE_DELAY) {
            lastPlayedTime.current = now;
            
            notificationSound.current.currentTime = 0;
            notificationSound.current.volume = initialVolume;
            
            const playPromise = notificationSound.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name === 'NotAllowedError') {
                        setIsSoundEnabled(false);
                        localStorage.setItem('soundEnabled', 'false');
                    }
                });
            }
        }
    }, [isSoundEnabled, initialVolume]);

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
                    setIsSoundEnabled(false);
                    localStorage.setItem('soundEnabled', 'false');
                });
        }
    }, [isSoundEnabled, initialVolume]);

    return {
        isSoundEnabled,
        toggleSound,
        playSound
    };
}