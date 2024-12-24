import { useState, useEffect, useRef } from 'react';

export const useSwipe = ({
    onSwipeLeft,
    onSwipeRight,
    direction = 'horizontal',
    enabled = true,
    currentPage = 1,
    totalPages = 1
}) => {
    // Configuración interna del hook
    const config = {
        minSwipeDistance: 70,
        resistanceFactor: 0.3,
        transitionDuration: 250,
        dragSensitivity: 1.5,
        dragThreshold: 10
    };

    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);
    const initialTouchRef = useRef(null);

    // En el useSwipe.js
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !enabled) return;

        const touchMoveHandler = (e) => {
            if (!enabled) return;
            e.preventDefault();

            if (direction === 'vertical') {
                const touch = e.touches[0];
                const currentY = touch.clientY;
                const initialY = initialTouchRef.current;
                const deltaY = touchStart - currentY;

                //verificar si el movimiento supera el umbral
                if(Math.abs(currentY - initialY) > config.dragThreshold){
                    setIsDragging(true);
                }

                // Scroll directo basado en el movimiento del dedo
                container.scrollTop += deltaY;
                setTouchStart(currentY); // Actualizar la posición inicial para el siguiente movimiento
            } else {
                // Tu código existente para movimiento horizontal
                const point = e.touches ?
                    e.touches[0].clientX :
                    e.clientX;
                setTouchEnd(point);

                const currentOffset = (touchStart - point) * config.dragSensitivity;

                if ((currentPage === 1 && currentOffset < 0) ||
                    (currentPage === totalPages && currentOffset > 0)) {
                    setDragOffset(currentOffset * config.resistanceFactor);
                } else {
                    setDragOffset(currentOffset);
                }
            }
        };

        container.addEventListener('touchmove', touchMoveHandler, { passive: false });

        return () => {
            container.removeEventListener('touchmove', touchMoveHandler);
        };
    }, [touchStart, currentPage, totalPages, enabled, direction]);

    const onTouchStart = (e) => {
        if (!enabled) return;
        const point = e.touches ?
            (direction === 'horizontal' ? e.touches[0].clientX : e.touches[0].clientY) :
            (direction === 'horizontal' ? e.clientX : e.clientY);
        setTouchStart(point);
        setTouchEnd(point);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd || !enabled) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > config.minSwipeDistance; // Usar config
        const isRightSwipe = distance < -config.minSwipeDistance; // Usar config

        if (direction === 'horizontal') {
            if (isLeftSwipe && onSwipeLeft) {
                onSwipeLeft();
            } else if (isRightSwipe && onSwipeRight) {
                onSwipeRight();
            }
        } else {
            if (isLeftSwipe && onSwipeLeft) {
                onSwipeLeft();
            } else if (isRightSwipe && onSwipeRight) {
                onSwipeRight();
            }
        }

        setTouchStart(null);
        setTouchEnd(null);
        setDragOffset(0);
    };

    const onMouseMove = (e) => {
        if (!enabled) return;
        e.preventDefault();
        const point = direction === 'horizontal' ? e.clientX : e.clientY;
        setTouchEnd(point);

        const currentOffset = (touchStart - point) * config.dragSensitivity; // Usar config

        if ((currentPage === 1 && currentOffset < 0) ||
            (currentPage === totalPages && currentOffset > 0)) {
            setDragOffset(currentOffset * config.resistanceFactor); // Usar config
        } else {
            setDragOffset(currentOffset);
        }
    };

    const onMouseDown = (e) => {
        if (!enabled) return;
        e.preventDefault();
        onTouchStart(e);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseUp = (e) => {
        if (!enabled) return;
        onTouchEnd(e);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    const getTransform = () => {
        const baseTransform = -((currentPage - 1) * 100);
        const dragPercent = (dragOffset / window.innerWidth) * 100;
        const transformProperty = direction === 'horizontal' ? 'translateX' : 'translateY';
        return `${transformProperty}(calc(${baseTransform}% - ${dragPercent}px))`;
    };

    return {
        containerRef,
        dragOffset,
        touchStart,
        onTouchStart,
        onTouchEnd,
        onMouseDown,
        getTransform,
        transitionDuration: config.transitionDuration
    };
};