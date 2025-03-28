import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSwipe } from '../../../../../hooks/useSwipe';
import OrderCard from './OrderCard';
import _ from "lodash";
import { useOrderHandlers } from '@/hooks/useOrderHandlers';
import ImageModal from '@/components/ui/ImagenModal';
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

const OrderSwipe = ({ orders, expandedItemId, setExpandedItemId, updateKitchenStatus, enableSound, isSoundEnabled }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    const kitchen_cd = config.cd;
    const ordersPerPage = config.cardQuantity;
    const totalPages = Math.ceil(orders.length / ordersPerPage);
    const lastPageRef = useRef(currentPage);
    const selectionMode = config.selectionMode || "1";

    const [selectedItems, setSelectedItems] = useState(new Set());
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Estado para el modal de imagen
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    //Referencias para double tap 
    const lastTapRef = useRef({});
    const tapTimeoutRef = useRef({});
    const DOUBLE_TAP_DELAY = 300;

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

    // Función para manejar el clic en el icono de imagen
    const handleImageClick = (item) => {
        setSelectedImage({
            url: item.handwriteImage,
            name: item.name
        });
        setImageModalOpen(true);
    };

    useEffect(() => {
        lastPageRef.current = currentPage;
    }, [currentPage]);

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
        // console.log('Item Seleccionado', item, 'Tipo: ', type);
        const now = Date.now();

        let tapId;
        switch (type) {
            case 'table':
                tapId = `table-${tableGroup.tableName}`;
                break;
            case 'order':
                tapId = `order-${order.orderTime}-${order.table}`;
                break;
            case 'item':

                tapId = `item-${item.id}`;
                break;
        }

        if (selectionMode === "2") {
            if (now - (lastTapRef.current[tapId] || 0) < DOUBLE_TAP_DELAY) {
                clearTimeout(tapTimeoutRef.current[tapId]);
                const itemIds = new Set();
                switch (type) {
                    case 'table':
                        tableGroup.orders.forEach(ord => {
                            ord.items.forEach(itm => {
                                itemIds.add(itm.id);

                                //si es padre incluir a sus hijos
                                if (itm.isParent) {
                                    const children = getAllChildren(itm.uid, ord.items);
                                    children.forEach(child => itemIds.add(child.id));
                                }
                            });
                        });
                        break;
                    case 'order':
                        order.items.forEach(itm => {
                            itemIds.add(itm.id);

                            if (itm.isParent) {
                                const children = getAllChildren(itm.uid, order.items);
                                children.forEach(child => itemIds.add(child.id));
                            }
                        });
                        break;
                    case 'item':
                        itemIds.add(item.id);
                        if (item.isParent) {
                            const children = getAllChildren(item.uid, order.items);
                            children.forEach(child => itemIds.add(child.id));
                        };
                        break;
                }

                // Actualizar items y limpiar selecciones
                handleUpdate(itemIds);
                setSelectedItems(new Set());

            } else {
                // Primer tap - selección visual única
                setSelectedItems(prev => {
                    const newSet = new Set();
                    switch (type) {
                        case 'table':
                            // Si ya está todo seleccionado, deseleccionar todo
                            const allTableItemsSelected = tableGroup.orders.every(ord =>
                                ord.items.every(itm =>
                                    prev.has(itm.id) &&
                                    (!itm.additionalItems || itm.additionalItems.every(child => prev.has(child.id)))
                                )
                            );

                            if (allTableItemsSelected) {
                                return newSet; // Set vacío para deseleccionar
                            }

                            // Seleccionar todos los items de la mesa
                            tableGroup.orders.forEach(ord => {
                                ord.items.forEach(itm => {
                                    newSet.add(itm.id);
                                    if (itm.additionalItems) {
                                        itm.additionalItems.forEach(child => newSet.add(child.id));
                                    }
                                });
                            });
                            break;
                        case 'order':
                            // Si ya está todo seleccionado, deseleccionar todo
                            const allOrderItemsSelected = order.items.every(itm =>
                                prev.has(itm.id) &&
                                (!itm.additionalItems || itm.additionalItems.every(child => prev.has(child.id)))
                            );

                            if (allOrderItemsSelected) {
                                return newSet; // Set vacío para deseleccionar
                            }

                            // Seleccionar todos los items de la orden
                            order.items.forEach(itm => {
                                newSet.add(itm.id);
                                if (itm.additionalItems) {
                                    itm.additionalItems.forEach(child => newSet.add(child.id));
                                }
                            });
                            break;
                        case 'item':
                            // Si ya está seleccionado, deseleccionar
                            if (prev.has(item.id)) {
                                return newSet; // Set vacío para deseleccionar
                            }

                            // Seleccionar este item (y sus hijos si tiene)
                            newSet.add(item.id);
                            if (item.additionalItems) {
                                item.additionalItems.forEach(child => newSet.add(child.id));
                            }
                            break;
                    }

                    return newSet;
                });
            }

            // Guardar tiempo de tap
            lastTapRef.current[tapId] = now;
        } else {

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
        }


    };


    const { orderItems } = useMemo(() => {
        // Procesar cada grupo de mesa
        const processedGroups = orders.map((tableGroup) => {
            // Procesar cada orden dentro del grupo
            const processedOrders = tableGroup.orders.map(order => {
                // Encontrar items que son hijos
                const itemsWithPid = order.items?.filter(item => item.pid) || [];
                // Obtener IDs únicos de padres
                const parentUids = [...new Set(itemsWithPid.map(item => item.pid))];

                // Identificar padres activos (con hijos sin cocinar)
                const activeParentUids = parentUids.filter(parentUid => {
                    const children = order.items?.filter(item =>
                        item.pid === parentUid && item.kitchen_status !== 1
                    );
                    return children.length > 0;
                });

                // Filtrar ítems relevantes
                const processedItems = order.items?.filter(item =>
                    (activeParentUids.includes(item.uid)) || // Es un padre con hijos sin cocinar
                    (!item.pid && item.kitchen_status !== 1) || // Es un ítem normal no cocinado
                    (item.pid && item.kitchen_status !== 1) // Es un hijo no cocinado
                ).map(item => ({
                    ...item,
                    isParent: parentUids.includes(item.uid),
                    isChild: Boolean(item.pid)
                })) || [];

                return {
                    orderTime: order.formatted_time,
                    elapsedTime: `${order.elapsedTime}分`,
                    table: order.table_name || 'Sin Mesa',
                    items: processedItems,
                    originalOrder: order
                };
            }).filter(order => order.items.length > 0); // Filtrar órdenes sin items

            // Retornar el grupo procesado solo si tiene órdenes con items
            return {
                tableName: tableGroup.tableName,
                type: tableGroup.type,
                total_people: tableGroup.total_people,
                orders: processedOrders
            };
        }).filter(group => group.orders.length > 0); // Filtrar grupos sin órdenes

        // Ordenar por fecha
        const flattenedOrders = processedGroups.flatMap(group =>
            group.orders.map(order => ({
                ...order,
                tableGroup: {
                    tableName: group.tableName,
                    type: group.type,
                    total_people: group.total_people
                }
            }))
        );

        return {
            orderItems: _.sortBy(
                flattenedOrders,
                order => new Date(order.originalOrder.record_date)
            )
        };
    }, [orders]);

    const getAllChildren = (parentId, items) => {
        if (!Array.isArray(items)) {
            console.warn('Items no es un array:', items);
            return [];
        }
        return items.filter(item => item.pid === parentId);
    };

    const handleUpdate = async (itemIdsToUpdate = null) => {
        if (!kitchen_cd) {
            console.error('No se encontró kitchen_cd en la configuración');
            return;
        }

        try {

            const itemIds = itemIdsToUpdate || selectedItems;

            for (const order of orderItems) {
                for (const item of order.items) {
                    if (itemIds.has(item.id)) {
                        if (item.isParent) {
                            const children = getAllChildren(item.uid, order.items)
                            await Promise.all([
                                updateKitchenStatus(item.id, 1, kitchen_cd),
                                ...children.map(child => updateKitchenStatus(child.id, 1, kitchen_cd))
                            ]);
                        } else if (item.isChild) {
                            const siblings = getAllChildren(item.pid, order.items);
                            const allSiblingsWillBeReady = siblings.every(sibling =>
                                sibling.kitchen_status === 1 || itemIds.has(sibling.id)
                            );

                            if (allSiblingsWillBeReady) {
                                const parent = order.items.find(i => i.uid === item.pid);
                                if (parent) {
                                    await Promise.all([
                                        updateKitchenStatus(item.id, 1, kitchen_cd),
                                        updateKitchenStatus(parent.id, 1, kitchen_cd)
                                    ]);
                                }
                            } else {
                                await updateKitchenStatus(item.id, 1, kitchen_cd);
                            }
                        } else {
                            await updateKitchenStatus(item.id, 1, kitchen_cd);
                        }
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
            {selectedItems.size > 0 &&
                (selectionMode !== "2") && (
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
                                                    expandedItemId={() => { }}
                                                    setExpandedItemId={() => { }}
                                                    updateKitchenStatus={updateKitchenStatus}
                                                    customer={tableGroup.tableName}
                                                    selectedItems={selectedItems}
                                                    onToggleSelection={handleToggleSelection}
                                                    onImageClick={handleImageClick}  // Pasar la función de manejo de imagen
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

                    {/* Indicador de sonido */}
                    {/* <div>
                        {(config.type === "1" || config.type === "2") && (
                            <button
                                style={{
                                    right: config.type === "1" ? 420 : 320,
                                    top: 23,
                                }}
                                onClick={enableSound}
                                className={`
                                    fixed right-4 z-50 p-3 
                                    rounded-full shadow-lg 
                                    transition-all duration-300 
                                    ${isSoundEnabled ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}`}
                                title={isSoundEnabled ? "通知音オン" : "通知音オフ"}
                            >
                                {isSoundEnabled ? (
                                    <FaVolumeUp className="text-white text-xl" />
                                ) : (
                                    <FaVolumeMute className="text-white text-xl" />
                                )}
                            </button>
                        )}
                    </div> */}


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
                            onClick={() => handleUpdate()}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600"
                        >
                            更新する
                        </button>
                    </div>
                </div>

            </div>
            {/* Modal para mostrar la imagen */}
            {selectedImage && (
                <ImageModal
                    open={imageModalOpen}
                    onOpenChange={setImageModalOpen}
                    imageUrl={selectedImage.url}
                    itemName={selectedImage.name}
                />
            )}



        </div>
    );
};

export default OrderSwipe;