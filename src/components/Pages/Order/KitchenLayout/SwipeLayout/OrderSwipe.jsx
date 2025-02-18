import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSwipe } from '../../../../../hooks/useSwipe';
import OrderCard from './OrderCard';
import _ from "lodash";
import { useOrderHandlers } from '@/hooks/useOrderHandlers';

const OrderSwipe = ({ orders, expandedItemId, setExpandedItemId, updateKitchenStatus }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    const kitchen_cd = config.cd;
    const ordersPerPage = config.cardQuantity;
    const totalPages = Math.ceil(orders.length / ordersPerPage);
    const lastPageRef = useRef(currentPage);

    const [selectedItems, setSelectedItems] = useState(new Set());
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

    const getPageOrders = (page) => {
        const indexOfLastOrder = page * ordersPerPage;
        const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
        const pageOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
        return pageOrders;
    };

    const handleToggleSelection = (item, type = 'item', tableGroup = null, order = null) => {
        console.log('Item Seleccionado', item, 'Tipo: ', type);

        setSelectedItems(prev => {
            const newSet = new Set(prev);

            switch (type) {
                case 'table':
                    // Seleccionar/deseleccionar todos los items de la mesa
                    const allTableItemsSelected = tableGroup.orders.every(order =>
                        order.items.every(item =>
                            newSet.has(item.id) &&
                            (!item.additionalItems || item.additionalItems.every(child => newSet.has(child.id)))
                        )
                    );

                    tableGroup.orders.forEach(order => {
                        order.items.forEach(item => {
                            if (allTableItemsSelected) {
                                // Deseleccionar items
                                newSet.delete(item.id);
                                if (item.additionalItems) {
                                    item.additionalItems.forEach(child => newSet.delete(child.id));
                                }
                            } else {
                                // Seleccionar items
                                newSet.add(item.id);
                                if (item.additionalItems) {
                                    item.additionalItems.forEach(child => newSet.add(child.id));
                                }
                            }
                        });
                    });
                    break;

                case 'order':

                    // Seleccionar/deseleccionar todos los items de la orden
                    const allOrderItemsSelected = order.items.every(item =>
                        newSet.has(item.id) &&
                        (!item.additionalItems || item.additionalItems.every(child => newSet.has(child.id)))
                    );

                    order.items.forEach(item => {
                        if (allOrderItemsSelected) {
                            // Deseleccionar items
                            newSet.delete(item.id);
                            if (item.additionalItems) {
                                item.additionalItems.forEach(child => newSet.delete(child.id));
                            }
                        } else {
                            // Seleccionar items
                            newSet.add(item.id);
                            if (item.additionalItems) {
                                item.additionalItems.forEach(child => newSet.add(child.id));
                            }
                        }
                    });
                    break;
                    
                case 'item':
                    // Lógica existente para items individuales
                    if (item.additionalItems && item.additionalItems.length > 0) {
                        if (newSet.has(item.id)) {
                            // Si ya está seleccionado, eliminar padre e hijos
                            newSet.delete(item.id);
                            item.additionalItems.forEach(childItem => {
                                newSet.delete(childItem.id);
                            });
                        } else {
                            // Si no está seleccionado, agregar padre e hijos
                            newSet.add(item.id);
                            item.additionalItems.forEach(childItem => {
                                newSet.add(childItem.id);
                            });
                        }
                    } else {
                        // Si es un item hijo o individual
                        if (newSet.has(item.id)) {
                            newSet.delete(item.id);
                        } else {
                            newSet.add(item.id);
                        }
                    }

                    break;

            }

            // console.log('Items seleccionados:', Array.from(newSet));
            return newSet;
        });
    };

    const handleUpdate = async () => {
        if (!kitchen_cd) {
            console.error('No se encontró kitchen_cd en la configuración');
            return;
        }

        try {
            for (const tableGroup of orders) {
                for (const order of tableGroup.orders) {
                    // Array para almacenar todos los items a actualizar
                    const itemsToUpdate = [];

                    for (const item of order.items) {
                        // Si el item actual está seleccionado
                        if (selectedItems.has(item.id)) {
                            // Caso 1: Es un item padre con hijos
                            if (item.additionalItems?.length > 0) {
                                // Agregar el padre
                                itemsToUpdate.push({
                                    id: item.id,
                                    kitchen_cd: kitchen_cd
                                });
                                // Agregar todos sus hijos
                                item.additionalItems.forEach(childItem => {
                                    itemsToUpdate.push({
                                        id: childItem.id,
                                        kitchen_cd: kitchen_cd
                                    });
                                });
                            }
                            // Caso 2: Es un item individual o un hijo
                            else {
                                itemsToUpdate.push({
                                    id: item.id,
                                    kitchen_cd: kitchen_cd
                                });
                            }
                        }
                        // Caso 3: Si el item es padre pero no está seleccionado, revisar si alguno de sus hijos está seleccionado
                        else if (item.additionalItems?.length > 0) {
                            item.additionalItems.forEach(childItem => {
                                if (selectedItems.has(childItem.id)) {
                                    itemsToUpdate.push({
                                        id: childItem.id,
                                        kitchen_cd: kitchen_cd
                                    });
                                }
                            });
                        }
                    }

                    // Realizar todas las actualizaciones en paralelo
                    if (itemsToUpdate.length > 0) {
                        console.log('Items a actualizar:', itemsToUpdate.map(item => item.id));
                        await Promise.all(
                            itemsToUpdate.map(item =>
                                updateKitchenStatus(item.id, 1, item.kitchen_cd)
                            )
                        );
                    }
                }
            }

            // Limpiar selección y cerrar diálogo
            setSelectedItems(new Set());
            setShowConfirmDialog(false);
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
        }
    };

    return (

        <div className='flex flex-col h-screen'>
            {selectedItems.size > 0 && (
                <div className="sticky top-0 z-50 px-4  ">
                    <button
                        onClick={() => setShowConfirmDialog(true)}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xl"
                    >
                        {/* 戻す ({selectedItems.size}点) */}
                        【調理済みにする】
                    </button>
                </div>

            )}

            <div className='h-full overflow-hidden'>
                <div
                    ref={containerRef}
                    className='relative h-full overflow-hidden'
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    onMouseDown={onMouseDown}
                >
                    <div
                        className="flex absolute w-full h-full"
                        style={{
                            transform: getTransform(),
                            transition: touchStart ? 'none' : `transform ${transitionDuration}ms ease-out`,
                            width: `${totalPages * 100}%`,
                        }}
                    >
                        {Array.from({ length: totalPages }).map((_, pageIndex) => (
                            <div
                                key={pageIndex}
                                className="flex-shrink-0 h-full"
                                style={{
                                    width: `${100 / totalPages}%`
                                }}
                            >
                                <div className="h-full">
                                    <div
                                        className="grid gap-4 p-4 h-full"
                                        style={{
                                            gridTemplateColumns: `repeat(${ordersPerPage}, minmax(200px, 1fr))`
                                        }}
                                    >
                                        {getPageOrders(pageIndex + 1).map((tableGroup) => (
                                            <div
                                                key={`table-${tableGroup.tableName}`}
                                                className="h-full"
                                            >
                                                <OrderCard
                                                    orders={tableGroup.orders}
                                                    allorders={orders}
                                                    type={tableGroup.type}
                                                    total_people={tableGroup.total_people}
                                                    tableName={tableGroup.tableName}
                                                    expandedItemId={expandedItemId}
                                                    setExpandedItemId={setExpandedItemId}
                                                    updateKitchenStatus={updateKitchenStatus}
                                                    customer={tableGroup.tableName}
                                                    selectedItems={selectedItems}
                                                    onToggleSelection={handleToggleSelection}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Indicadores visuales de swipe */}
                    <div className={`absolute inset-0 pointer-events-none 
                        ${Math.abs(dragOffset) > 0 ? 'opacity-100' : 'opacity-0'}
                        transition-opacity duration-200`}
                    >
                        <div className={`absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/5 to-transparent
                            ${dragOffset < 0 ? 'opacity-100' : 'opacity-0'}`}
                        />
                        <div className={`absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/5 to-transparent
                            ${dragOffset > 0 ? 'opacity-100' : 'opacity-0'}`}
                        />
                    </div>

                    {/* Indicador de página */}
                    <div
                        className="fixed z-50 bg-black/60 text-white px-3 py-1 rounded-full text-sm 
                            backdrop-blur-sm select-none"
                        style={{ right: 110, top: 30 }}
                    >
                        {currentPage} / {totalPages}
                    </div>
                </div>
            </div>

            <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showConfirmDialog ? "" : "hidden"}`}>
                <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                    <h3 className="text-lg font-medium mb-2">確認</h3>
                    <p className="text-gray-500 mb-4">
                        {/* 選択したアイテム ({getSelectedItemsCount()} 点) を更新してもよろしいですか？ */}
                        キャンセル
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowConfirmDialog(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleUpdate}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600"
                        >
                            更新する
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OrderSwipe;