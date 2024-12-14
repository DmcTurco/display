import React, { useState, useEffect } from 'react';
import OrderCard from '../Base/OrderCard';

const OrderGrid = ({ orders, expandedItemId, setExpandedItemId }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 8; // 4x2 = 8 cards por página
    const totalPages = Math.ceil(orders.length / ordersPerPage);

    // Función para obtener las órdenes de la página actual
    const getPageOrders = (page) => {
        const indexOfLastOrder = page * ordersPerPage;
        const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
        return orders.slice(indexOfFirstOrder, indexOfLastOrder);
    };

    // Botones de navegación
    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="max-w-[1600px] mx-auto w-full px-4 h-full relative">
                {/* Grid de 4x2 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-fr">
                    {getPageOrders(currentPage).map(order => (
                        <div
                            key={`${order.order_main_cd}_${order.order_count}`}
                            className="min-h-[300px] transition-all duration-300 ease-in-out"
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

                {/* Navegación y contador de páginas */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                    flex items-center gap-4 bg-black/60 text-white px-4 py-2 
                    rounded-full text-sm backdrop-blur-sm select-none">
                    <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className={`${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-400'}`}
                    >
                        ←
                    </button>
                    <span>{currentPage} / {totalPages}</span>
                    <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className={`${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-400'}`}
                    >
                        →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderGrid;