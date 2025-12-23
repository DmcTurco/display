import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSwipe } from '../../../../../hooks/useSwipe';
import OrderCard from './OrderCard';
import _ from "lodash";
import ImageModal from '@/components/ui/ImagenModal';
import { useItemSelection } from '@/js/useItemSelection';
import { getAllChildrenByPid, processTableGroupsWithHierarchy, updateSelectedItems } from '@/js/itemSelectionHelpers';

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
    // console.log("ORdernes : ",orders);
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

    // ==================== PROCESAMIENTO DE ÓRDENES ====================
    const processedOrderGroups = useMemo(() => {
        return processTableGroupsWithHierarchy(orders, {
            filterByKitchenStatus: false, // NO filtrar, mostrar todos
            checkPendingItems: true // Verificar items pendientes
        });
    }, [orders]);

    const totalPages = Math.max(1, Math.ceil(processedOrderGroups.length / ordersPerPage));
    
    // ==================== MANEJO DE ACTUALIZACIÓN ====================
    const handleUpdate = async (itemIdsToUpdate = null) => {
        setIsUpdating(true);

        try {
            const itemIds = itemIdsToUpdate || selectedItems;

            await updateSelectedItems({
                selectedItemIds: itemIds,
                orderGroups: processedOrderGroups,
                updateKitchenStatus,
                kitchen_cd,
                targetStatus: 1,
                useAdditionalItems: false, // Usa pid/uid
                extraParam: null,
                parentUpdateStrategy: 'check-all-siblings'
            });

            clearSelection();
            setShowConfirmDialog(false);
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
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
    }, [totalPages, currentPage]);

    const getPageOrders = (page) => {
        const start = (page - 1) * ordersPerPage;
        const end = start + ordersPerPage;
        return processedOrderGroups.slice(start, end);
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
                        className="fixed z-50 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm select-none"
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
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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