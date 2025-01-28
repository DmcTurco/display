import React, { useState, useEffect, useRef } from 'react';

import { useSwipe } from '../../../../../hooks/useSwipe';
import OrderCard from './OrderCard';


const OrderSwipe = ({ orders, expandedItemId, setExpandedItemId, updateKitchenStatus }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 4;
    const totalPages = Math.ceil(orders.length / ordersPerPage);
    const lastPageRef = useRef(currentPage);
    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    console.log(orders)
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
                                    {getPageOrders(index + 1).map(tableGroup => {
                                        // Encontrar el estado más urgente
                                        const mostUrgentOrder = tableGroup.orders.reduce((prev, current) => {
                                            if (current.status === 'urgente') return current;
                                            if (current.status === 'en-progreso' && prev.status !== 'urgente') return current;
                                            return prev;
                                        }, tableGroup.orders[0]);
                                        return (
                                            <div
                                                key={tableGroup.tableName}
                                                className="flex-shrink-0 w-full"
                                                style={{
                                                    width: `calc((100% - ${(ordersPerPage - 1) * 0.75}rem) / ${ordersPerPage})`,
                                                }}
                                            >


                                                <div className="bg-white rounded-lg shadow-md flex-shrink-0 w-full h-[calc(90vh-6rem)] flex flex-col">
                                                    <div className="p-4 border-b">
                                                        <h2 className="text-lg font-bold">テーブル : {tableGroup.tableName}</h2>
                                                        <div className="text-sm text-gray-500">
                                                            注文数: {tableGroup.orders.length}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 overflow-auto p-2">
                                                        {tableGroup.orders.map(order => (
                                                            <div
                                                                key={`${order.order_main_cd}_${order.order_count}`}
                                                                className={`mb-3 p-3 rounded-lg ${order.status === 'urgente'
                                                                        ? 'bg-red-100'
                                                                        : order.status === 'en-progreso'
                                                                            ? 'bg-yellow-100'
                                                                            : 'bg-gray-100'
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-sm font-medium">
                                                                        {order.formatted_time}
                                                                    </span>
                                                                    <span className="text-sm">
                                                                        #{`${order.order_main_cd}-${order.order_count}`}
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {order.items.map((item, idx) => (
                                                                        <div
                                                                            key={item.uid}
                                                                            className="text-sm flex justify-between"
                                                                        >
                                                                            <span>{item.name}</span>
                                                                            <span>×{item.quantity}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* {tableGroup.orders.map(order => (
                                                    <div
                                                        key={`${order.order_main_cd}_${order.order_count}`}
                                                        className="w-full min-w-[100px] max-w-[300px] transition-all duration-300 ease-in-out"
                                                    >
                                                        <OrderCard
                                                            time={config.type == 2 ? order.formatted_time_update : order.formatted_time}
                                                            type={order.type}
                                                            type_display={order.type_display}
                                                            number={`${order.order_main_cd}-${order.order_count}`}
                                                            customer={order.table_name}
                                                            items={order.items}
                                                            status={order.status}
                                                            elapsedTime={order.elapsedTime}
                                                            expandedItemId={expandedItemId}
                                                            setExpandedItemId={setExpandedItemId}
                                                            updateKitchenStatus={updateKitchenStatus}
                                                        />
                                                    </div>
                                                ))} */}
                                            </div>
                                        );
                                    })}
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