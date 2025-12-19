import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSwipe } from '../../../../../hooks/useSwipe';
import OrderCard from './OrderCard';
import _ from "lodash";
import ImageModal from '@/components/ui/ImagenModal';
import { getAllChildren } from '@/js/itemSelectionHelpers';
import { useItemSelection } from '@/js/useItemSelection';

const OrderSwipe = ({
    orders,
    expandedItemId,
    setExpandedItemId,
    updateKitchenStatus,
    enableSound,
    isSoundEnabled
}) => {
    // ==================== CONFIGURACIÓN Y ESTADO ====================
    const config = useMemo(() => JSON.parse(localStorage.getItem('kitchenConfig')) || {}, []);

    const {
        cd: kitchen_cd,
        cardQuantity: ordersPerPage = 6,
        selectionMode = "1"
    } = config;
    
    const [currentPage, setCurrentPage] = useState(1);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const lastPageRef = useRef(currentPage);
    const totalPages = Math.max(1, Math.ceil(orders.length / ordersPerPage));

    // ==================== PROCESAMIENTO DE ÓRDENES ====================
    const orderItems = useMemo(() => {
        const processedGroups = orders.map((tableGroup) => {
            const processedOrders = tableGroup.orders.map(order => {
                const itemsWithPid = order.items?.filter(item => item.pid) || [];
                const parentUids = [...new Set(itemsWithPid.map(item => item.pid))];

                const activeParentUids = parentUids.filter(parentUid => {
                    const children = order.items?.filter(item =>
                        item.pid === parentUid && item.kitchen_status !== 1
                    );
                    return children.length > 0;
                });

                const processedItems = order.items?.filter(item =>
                    (activeParentUids.includes(item.uid)) ||
                    (!item.pid && item.kitchen_status !== 1) ||
                    (item.pid && item.kitchen_status !== 1)
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
            }).filter(order => order.items.length > 0);

            return {
                tableName: tableGroup.tableName,
                type: tableGroup.type,
                total_people: tableGroup.total_people,
                orders: processedOrders
            };
        }).filter(group => group.orders.length > 0);

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

        return _.sortBy(flattenedOrders, order =>
            new Date(order.originalOrder.record_date)
        );
    }, [orders]);

    // ==================== MANEJO DE ACTUALIZACIÓN ====================
    const handleUpdate = async (itemIdsToUpdate = null) => {
        if (!kitchen_cd) {
            console.error('No se encontró kitchen_cd en la configuración');
            return;
        }

        setIsUpdating(true);

        try {
            const itemIds = itemIdsToUpdate || selectedItems;
            const updatePromises = [];

            for (const order of orderItems) {
                for (const item of order.items) {
                    if (itemIds.has(item.id)) {
                        if (item.isParent) {
                            // Padre: actualizar padre e hijos
                            const children = getAllChildren(item.uid, order.items);
                            updatePromises.push(
                                updateKitchenStatus(item.id, 1, kitchen_cd),
                                ...children.map(child =>
                                    updateKitchenStatus(child.id, 1, kitchen_cd)
                                )
                            );
                        } else if (item.isChild) {
                            // Hijo: verificar si actualizar padre también
                            const siblings = getAllChildren(item.pid, order.items);
                            const allSiblingsReady = siblings.every(sibling =>
                                sibling.kitchen_status === 1 || itemIds.has(sibling.id)
                            );

                            updatePromises.push(
                                updateKitchenStatus(item.id, 1, kitchen_cd)
                            );

                            if (allSiblingsReady) {
                                const parent = order.items.find(i => i.uid === item.pid);
                                if (parent) {
                                    updatePromises.push(
                                        updateKitchenStatus(parent.id, 1, kitchen_cd)
                                    );
                                }
                            }
                        } else {
                            // Item normal
                            updatePromises.push(
                                updateKitchenStatus(item.id, 1, kitchen_cd)
                            );
                        }
                    }
                }
            }

            await Promise.all(updatePromises);
            clearSelection();
            setShowConfirmDialog(false);
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            // Aquí podrías agregar un toast o notificación de error
        } finally {
            setIsUpdating(false);
        }
    };

    // ==================== HOOK DE SELECCIÓN ====================
    const {
        selectedItems,
        handleToggleSelection,
        clearSelection,
        hasSelection
    } = useItemSelection(selectionMode, handleUpdate);

    // ==================== PAGINACIÓN ====================
    useEffect(() => {
        lastPageRef.current = currentPage;
    }, [currentPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages]);

    const getPageOrders = (page) => {
        const start = (page - 1) * ordersPerPage;
        const end = start + ordersPerPage;
        return orders.slice(start, end);
    };

    // ==================== SWIPE ====================
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

    // ==================== MANEJO DE IMÁGENES ====================
    const handleImageClick = (item) => {
        setSelectedImage({
            url: item.handwriteImage,
            name: item.name
        });
        setImageModalOpen(true);
    };

    // ==================== RENDER ====================
    return (
        <div className='flex flex-col h-screen'>
            {/* Botón de confirmación (solo en modo single-tap) */}
            {hasSelection && selectionMode !== "2" && (
                <div className="sticky top-0 z-50 px-4">
                    <button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={isUpdating}
                        className={`
                            w-full px-4 py-2 text-white rounded-lg 
                            transition-colors text-xl
                            ${isUpdating
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600'
                            }
                        `}
                    >
                        {isUpdating ? '更新中...' : '【調理済みにする】'}
                    </button>
                </div>
            )}

            {/* Área de swipe */}
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
                            transition: touchStart
                                ? 'none'
                                : `transform ${transitionDuration}ms ease-out`,
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
                                                    onImageClick={handleImageClick}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Indicadores visuales de swipe */}
                    <div className={`
                        absolute inset-0 pointer-events-none 
                        transition-opacity duration-200
                        ${Math.abs(dragOffset) > 0 ? 'opacity-100' : 'opacity-0'}
                    `}>
                        <div className={`
                            absolute inset-y-0 left-0 w-16 
                            bg-gradient-to-r from-black/5 to-transparent
                            transition-opacity
                            ${dragOffset < 0 ? 'opacity-100' : 'opacity-0'}
                        `} />
                        <div className={`
                            absolute inset-y-0 right-0 w-16 
                            bg-gradient-to-l from-black/5 to-transparent
                            transition-opacity
                            ${dragOffset > 0 ? 'opacity-100' : 'opacity-0'}
                        `} />
                    </div>

                    {/* Indicador de página */}
                    <div
                        className="fixed z-50 bg-black/60 text-white px-3 py-1 
                                   rounded-full text-sm backdrop-blur-sm select-none"
                        style={{ right: 110, top: 30 }}
                    >
                        {currentPage} / {totalPages}
                    </div>
                </div>
            </div>

            {/* Dialog de confirmación */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center 
                                justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-medium mb-2">確認</h3>
                        <p className="text-gray-500 mb-4">
                            選択したアイテムを更新してもよろしいですか？
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                disabled={isUpdating}
                                className="px-4 py-2 text-sm font-medium text-gray-700 
                                         bg-gray-100 rounded-md hover:bg-gray-200
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={() => handleUpdate()}
                                disabled={isUpdating}
                                className="px-4 py-2 text-sm font-medium text-white 
                                         bg-green-500 rounded-md hover:bg-green-600
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? '更新中...' : '更新する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de imagen */}
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