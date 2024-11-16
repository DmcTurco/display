import React, { useState, useEffect, useRef } from 'react';
import OrderCard from './OrderCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const OrderList = ({ orders }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [dragOffset, setDragOffset] = useState(0);
    const containerRef = useRef(null);
    const ordersPerPage = 4;
    const totalPages = Math.ceil(orders.length / ordersPerPage);
    const lastPageRef = useRef(currentPage); // Añadir esta línea

    const config = {
        minSwipeDistance: 70,
        resistanceFactor: 0.3,
        transitionDuration: 250,
        dragSensitivity: 1.5
    };
    // Añadir este useEffect para guardar la última página conocida
    useEffect(() => {
        lastPageRef.current = currentPage;
    }, [currentPage]);

    useEffect(() => {
        if (lastPageRef.current > totalPages) {
            setCurrentPage(totalPages);
        } else {
            setCurrentPage(lastPageRef.current);
        }
    }, [orders, totalPages]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const touchMoveHandler = (e) => {
            e.preventDefault();
            const point = e.touches ? e.touches[0].clientX : e.clientX;
            setTouchEnd(point);

            const currentOffset = (touchStart - point) * config.dragSensitivity;

            if ((currentPage === 1 && currentOffset < 0) ||
                (currentPage === totalPages && currentOffset > 0)) {
                setDragOffset(currentOffset * config.resistanceFactor);
            } else {
                setDragOffset(currentOffset);
            }
        };

        // Agregar event listener con passive: false
        container.addEventListener('touchmove', touchMoveHandler, { passive: false });

        return () => {
            container.removeEventListener('touchmove', touchMoveHandler);
        };
    }, [touchStart, currentPage, totalPages]);

    const getPageOrders = (page) => {
        const indexOfLastOrder = page * ordersPerPage;
        const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
        return orders.slice(indexOfFirstOrder, indexOfLastOrder);
    };

    const onTouchStart = (e) => {
        const point = e.touches ? e.touches[0].clientX : e.clientX;
        setTouchStart(point);
        setTouchEnd(point);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > config.minSwipeDistance;
        const isRightSwipe = distance < -config.minSwipeDistance;

        if (isLeftSwipe && currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        } else if (isRightSwipe && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }

        setTouchStart(null);
        setTouchEnd(null);
        setDragOffset(0);
    };

    const onMouseDown = (e) => {
        e.preventDefault();
        onTouchStart(e);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
        e.preventDefault();
        const point = e.clientX;
        setTouchEnd(point);

        const currentOffset = (touchStart - point) * config.dragSensitivity;

        if ((currentPage === 1 && currentOffset < 0) ||
            (currentPage === totalPages && currentOffset > 0)) {
            setDragOffset(currentOffset * config.resistanceFactor);
        } else {
            setDragOffset(currentOffset);
        }
    };

    const onMouseUp = (e) => {
        onTouchEnd(e);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    const getTransform = () => {
        const baseTransform = -((currentPage - 1) * 100);
        const dragPercent = (dragOffset / window.innerWidth) * 100;
        return `translateX(calc(${baseTransform}% - ${dragPercent}px))`;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="max-w-[1200px] mx-auto w-full px-4">
                <div
                    ref={containerRef}
                    className="relative w-full h-full"
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    onMouseDown={onMouseDown}
                >
                    <div
                        className="absolute flex h-full"
                        style={{
                            transform: getTransform(),
                            transition: touchStart ? 'none' : `transform ${config.transitionDuration}ms ease-out`,
                            width: `${totalPages * 100}%`,
                        }}
                    >
                        {Array.from({ length: totalPages }).map((_, index) => (
                            <div
                                key={index}
                                className="flex min-w-full gap-4"
                                style={{
                                    width: `${100 / totalPages}%`
                                }}
                            >
                                <div className="flex min-w-full gap-3">
                                    {getPageOrders(index + 1).map(order => (
                                        <div
                                            key={`${order.order_main_cd}_${order.order_count}`}
                                            className="flex-shrink-0 w-full 
                                            min-w-[100px] 
                                            max-w-[130px] 
                                            sm:max-w-[160px] 
                                            md:max-w-[200px] 
                                            lg:max-w-[240px]
                                            xl:max-w-[280px]
                                            2xl:max-w-[300px]
                                            transition-all 
                                            duration-300 
                                            ease-in-out"
                                            style={{
                                                width: `calc((100% - ${(ordersPerPage - 1) * 0.75}rem) / ${ordersPerPage})`,
                                                minHeight: '300px'
                                            }}
                                        >
                                            <OrderCard
                                                time={order.formatted_time}
                                                type={order.type}
                                                number={`${order.order_main_cd}-${order.order_count}`}
                                                customer={order.table_name}
                                                items={order.items}
                                                status={order.status}
                                                elapsedTime={order.elapsedTime}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`absolute inset-0 pointer-events-none 
                        ${Math.abs(dragOffset) > 0 ? 'opacity-100' : 'opacity-0'}
                        transition-opacity duration-200`}>
                        <div className={`absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/5 to-transparent
                        ${dragOffset < 0 ? 'opacity-100' : 'opacity-0'}`} />
                        <div className={`absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/5 to-transparent
                        ${dragOffset > 0 ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                </div>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                    bg-black/60 text-white px-3 py-1 rounded-full text-sm 
                    backdrop-blur-sm select-none">
                    {currentPage} / {totalPages}
                </div>
            </div>
        </div>
    );
};

export default OrderList;