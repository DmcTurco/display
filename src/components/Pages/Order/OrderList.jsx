// import React from 'react';
// import OrderCard from './OrderCard';

// const OrderList = ({ orders }) => {
//     return (
//         <div className="flex flex-nowrap overflow-x-auto p-4 space-x-4">
//             {orders.map((order) => (
//                 <OrderCard
//                     key={`${order.order_main_cd}_${order.order_count}`}
//                     time={order.formatted_time}
//                     type={order.type}
//                     number={`${order.order_main_cd}-${order.order_count}`}
//                     customer={order.table_name}
//                     items={order.items}
//                     status={order.status}
//                     elapsedTime={order.elapsedTime}
//                 />
//             ))}
//         </div>
//     );
// };

// export default OrderList;


// OrderList.js
import React, { useState, useEffect } from 'react';
import OrderCard from './OrderCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const OrderList = ({ orders }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [dragOffset, setDragOffset] = useState(0);
    const ordersPerPage = 4;
    const totalPages = Math.ceil(orders.length / ordersPerPage);

    // Configuración ajustable
    const config = {
        minSwipeDistance: 70, // Reducido para mayor sensibilidad
        resistanceFactor: 0.3, // Aumentado para más resistencia en los límites
        transitionDuration: 250, // Velocidad de animación en ms
        dragSensitivity: 1.5 // Factor de sensibilidad del arrastre
    };

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

    const onTouchMove = (e) => {
        e.preventDefault(); // Prevenir scroll mientras se arrastra
        const point = e.touches ? e.touches[0].clientX : e.clientX;
        setTouchEnd(point);

        // Calcular offset con dirección corregida y sensibilidad ajustada
        const currentOffset = (touchStart - point) * config.dragSensitivity;

        // Aplicar resistencia en los límites
        if ((currentPage === 1 && currentOffset < 0) ||
            (currentPage === totalPages && currentOffset > 0)) {
            setDragOffset(currentOffset * config.resistanceFactor);
        } else {
            setDragOffset(currentOffset);
        }
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > config.minSwipeDistance;
        const isRightSwipe = distance < -config.minSwipeDistance;

        // Navegación con dirección corregida
        if (isLeftSwipe && currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        } else if (isRightSwipe && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }

        // Resetear valores
        setTouchStart(null);
        setTouchEnd(null);
        setDragOffset(0);
    };

    // Soporte para mouse events
    const onMouseDown = (e) => {
        e.preventDefault();
        onTouchStart(e);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
        e.preventDefault();
        onTouchMove(e);
    };

    const onMouseUp = (e) => {
        onTouchEnd(e);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    // Calcular transformación con dirección corregida
    const getTransform = () => {
        const baseTransform = -((currentPage - 1) * 100);
        const dragPercent = (dragOffset / window.innerWidth) * 100;
        return `translateX(calc(${baseTransform}% - ${dragPercent}px))`;
    };

    return (
        <div className="relative h-full overflow-hidden">
            <div
                className="relative w-full h-full"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
            >
                {/* Contenedor principal con ancho fijo */}
                <div
                    className="absolute flex h-full"
                    style={{
                        transform: getTransform(),
                        transition: touchStart ? 'none' : `transform ${config.transitionDuration}ms ease-out`,
                        width: `${totalPages * 100}%`, // Ancho total basado en número de páginas
                    }}
                >
                    {Array.from({ length: totalPages }).map((_, index) => (
                        <div
                            key={index}
                            className="flex min-w-full px-4"
                            style={{
                                justifyContent: 'flex-start', // Alinear cards a la izquierda
                                gap: '1rem', // Espacio fijo entre cards
                                width: `${100 / totalPages}%` // Ancho fijo para cada página
                            }}
                        >
                            {getPageOrders(index + 1).map(order => (
                                <div
                                    key={`${order.order_main_cd}_${order.order_count}`}
                                    className="flex-shrink-0" // Prevenir que los cards se encojan
                                    style={{ width: '320px' }} // Ancho fijo para cada card
                                >
                                    <OrderCard
                                        time={new Date(order.record_date).toLocaleTimeString('es-ES', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        })}
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
                    ))}
                </div>

                {/* Indicadores visuales */}
                <div className={`absolute inset-0 pointer-events-none 
                        ${Math.abs(dragOffset) > 0 ? 'opacity-100' : 'opacity-0'}
                        transition-opacity duration-200`}>
                    <div className={`absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/5 to-transparent
                          ${dragOffset < 0 ? 'opacity-100' : 'opacity-0'}`} />
                    <div className={`absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/5 to-transparent
                          ${dragOffset > 0 ? 'opacity-100' : 'opacity-0'}`} />
                </div>
            </div>

            {/* Indicador de página */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                    bg-black/75 text-white px-6 py-3 rounded-full text-lg 
                    backdrop-blur-sm select-none">
                {currentPage} / {totalPages}
            </div>
        </div>
    );
};

export default OrderList;