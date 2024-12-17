import React, { useState, useEffect, useRef } from 'react';

import { useSwipe } from '../../../../hooks/useSwipe';
import OrderCard from './OrderCard';


const OrderSwipe = ({ orders, expandedItemId, setExpandedItemId }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 4;
    const totalPages = Math.ceil(orders.length / ordersPerPage);
    const lastPageRef = useRef(currentPage);

    // Usar el hook de swipe
    const {
        containerRef,
        dragOffset,
        touchStart,
        getTransform,
        onTouchStart,
        onTouchEnd,
        onMouseDown,
        transitionDuration
    } = useSwipe({
        onSwipeLeft: () => {
            if (currentPage < totalPages) {
                setCurrentPage(prev => prev + 1);
            }
        },
        onSwipeRight: () => {
            if (currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }
        },
        currentPage,
        totalPages,
        direction: 'horizontal',
        enabled: true  // Lo añadimos explícitamente
    });

    // Mantener estos useEffect
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

    // Mantener la función getPageOrders
    const getPageOrders = (page) => {
        const indexOfLastOrder = page * ordersPerPage;
        const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
        return orders.slice(indexOfFirstOrder, indexOfLastOrder);
    };

    return (
        <div className="flex flex-col h-full">
            <div 
                ref={containerRef}
                className="max-w-[1200px] mx-auto w-full px-4 h-full"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
            >
                <div className="relative w-full h-full">
                    <div
                        className="absolute flex h-full"
                        style={{
                            transform: getTransform(),
                            transition: touchStart ? 'none' : `transform ${transitionDuration}ms ease-out`,
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
                                                expandedItemId={expandedItemId}
                                                setExpandedItemId={setExpandedItemId}
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

export default OrderSwipe;