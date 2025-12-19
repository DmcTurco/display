import { useRef, useCallback } from 'react';

export function useDoubleTap(delay = 300) {
    const lastTapRef = useRef({});
    const tapTimeoutRef = useRef({});

    const handleTap = useCallback((id, onSingleTap, onDoubleTap) => {
        const now = Date.now();
        const lastTapTime = lastTapRef.current[id] || 0;

        if (now - lastTapTime < delay) {
            // Double tap detectado
            clearTimeout(tapTimeoutRef.current[id]);
            delete lastTapRef.current[id];
            delete tapTimeoutRef.current[id];
            onDoubleTap?.();
        } else {
            // Primer tap - esperar por segundo tap
            lastTapRef.current[id] = now;
            tapTimeoutRef.current[id] = setTimeout(() => {
                delete lastTapRef.current[id];
                delete tapTimeoutRef.current[id];
                onSingleTap?.();
            }, delay);
        }
    }, [delay]);

    const cleanup = useCallback(() => {
        Object.values(tapTimeoutRef.current).forEach(clearTimeout);
        lastTapRef.current = {};
        tapTimeoutRef.current = {};
    }, []);

    return { handleTap, cleanup };
}