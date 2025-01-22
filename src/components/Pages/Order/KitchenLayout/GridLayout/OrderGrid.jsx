import React, { useState, useEffect, useRef } from 'react';
import { useSwipe } from '../../../../../hooks/useSwipe';
import OrderGridCard from './OrderGridCard';

const OrderGrid = ({ orders, expandedItemId, setExpandedItemId,updateKitchenStatus }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 8;
    const totalPages = Math.ceil(orders.length / ordersPerPage);
    const lastPageRef = useRef(currentPage);

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
        enabled: true
    });

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
        <div className="flex flex-col h-screen w-full">
            <div
                ref={containerRef}
                className="flex-1 w-full relative overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
            >
                <div 
                    className="absolute flex h-full w-full"
                    style={{
                        transform: getTransform(),
                        transition: touchStart ? 'none' : `transform ${transitionDuration}ms ease-out`,
                        width: `${totalPages * 100}%`,
                    }}
                >
                    {Array.from({ length: totalPages }).map((_, index) => (
                        <div
                            key={index}
                            className="float-left h-full flex-shrink-0 w-full"
                            style={{
                                width: `${100 / totalPages}%`,
                            }}
                        >
                            <div className="grid grid-cols-4 grid-rows-2 gap-3 h-full p-4">
                                {getPageOrders(index + 1).map(order => (
                                    <div
                                        key={`${order.order_main_cd}_${order.order_count}`}
                                        className="h-full w-full"
                                    >
                                        {order && (
                                            <OrderGridCard
                                                time={order.formatted_time}
                                                type={order.type}
                                                number={`${order.order_main_cd}-${order.order_count}`}
                                                customer={order.table_name}
                                                items={order.items}
                                                status={order.status}
                                                elapsedTime={order.elapsedTime}
                                                expandedItemId={expandedItemId}
                                                setExpandedItemId={setExpandedItemId}
                                                updateKitchenStatus={updateKitchenStatus}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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

export default OrderGrid;