import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Lock } from 'lucide-react';
import _ from 'lodash';
import ImageModal from '@/components/ui/ImagenModal';
import { getAllChildrenByPid, getDisplayItemsHierarchy, processOrdersWithHierarchy, updateSelectedItems } from '@/js/itemSelectionHelpers';
import { useDoubleTap } from '@/js/useDoubleTap';


const OrderTimeline = ({ orders, updateKitchenStatus }) => {
    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    const kitchen_cd = config.cd;
    const selectionMode = config.selectionMode || "1";
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedRows, setSelectedRows] = useState(new Set());

    // Estado para el modal de imagen
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const { handleTap, cleanup } = useDoubleTap(250);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    const { orderItems, itemTotals } = useMemo(() => {
        // 🔥 USAR HELPER
        const processedOrders = processOrdersWithHierarchy(orders, {
            filterPendingOnly: true,  // Solo items pendientes (kitchen_status !== 1)
            sortBy: 'record_date',
            sortOrder: 'asc',
            mapOrderFields: (order) => ({
                orderTime: order.formatted_time,
                elapsedTime: `${order.elapsedTime}分`
            })
        });

        // Calcular totales
        const itemTotals = {};
        processedOrders.forEach(order => {
            order.items.forEach(item => {
                // No contar padres prestados
                if (item.isDisabled) return;

                if (!itemTotals[item.name]) {
                    itemTotals[item.name] = { total: 0, occurrences: 0 };
                }
                itemTotals[item.name].total += item.quantity;
                itemTotals[item.name].occurrences += 1;

                // 🔥 También contar hijos en additionalItems
                if (item.additionalItems?.length > 0) {
                    item.additionalItems.forEach(child => {
                        if (child.isDisabled) return;

                        if (!itemTotals[child.name]) {
                            itemTotals[child.name] = { total: 0, occurrences: 0 };
                        }
                        itemTotals[child.name].total += child.quantity;
                        itemTotals[child.name].occurrences += 1;
                    });
                }
            });
        });

        return { orderItems: processedOrders, itemTotals };
    }, [orders]);

    // 🔥 NUEVO: Usar updateSelectedItems del helper
    const handleItemsUpdate = useCallback(async (itemIds) => {
        if (!kitchen_cd) {
            console.error('No se encontró kitchen_cd en la configuración');
            return;
        }

        try {
            await updateSelectedItems({
                selectedItemIds: itemIds,
                orderGroups: orderItems,
                updateKitchenStatus,
                kitchen_cd,
                targetStatus: 1,
                useAdditionalItems: true,  // 🔥 CAMBIO: Ahora usa additionalItems
                parentUpdateStrategy: 'check-all-siblings'
            });
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
        }
    }, [kitchen_cd, orderItems, updateKitchenStatus]);

    // 🔥 MEJORADO: Simplificar toggleRowSelection usando helper
    const toggleRowSelection = useCallback((item, allItems) => {
        setSelectedRows(prev => {
            const newSet = new Set(selectionMode === "2" ? [] : prev);
            const isSelected = prev.has(item.id);

            if (item.isParent) {
                // 🔥 CAMBIO: Usar additionalItems en lugar de getAllChildrenByPid
                const children = item.additionalItems || [];

                if (isSelected) {
                    newSet.delete(item.id);
                    children.forEach(child => newSet.delete(child.id));
                } else {
                    newSet.add(item.id);
                    children.forEach(child => newSet.add(child.id));
                }
            } else {
                isSelected ? newSet.delete(item.id) : newSet.add(item.id);
            }

            return newSet;
        });
    }, [selectionMode]);

    // 🔥 MEJORADO: Simplificar toggleTableSelection usando helper
    const toggleTableSelection = useCallback((order) => {
        setSelectedRows(prev => {
            // 🔥 CAMBIO: Obtener todos los items con getDisplayItemsHierarchy
            const displayItems = getDisplayItemsHierarchy(order.items, true);
            const selectableItems = displayItems.filter(item => !item.isDisabled);
            const allItemsSelected = selectableItems.every(item => prev.has(item.id));

            const newSet = new Set(selectionMode === "2" ? [] : prev);

            selectableItems.forEach(item => {
                if (allItemsSelected) {
                    newSet.delete(item.id);
                } else {
                    newSet.add(item.id);
                }
            });

            return newSet;
        });
    }, [selectionMode]);

    // 🔥 MEJORADO: Usar helper para doble toque de item
    const handleItemTouch = useCallback((item, allItems) => {
        if (item.isDisabled) return;

        if (selectionMode === "2") {
            handleTap(
                `item-${item.id}`,
                () => toggleRowSelection(item, allItems),
                () => {
                    const itemIds = new Set();
                    itemIds.add(item.id);

                    if (item.isParent) {
                        // 🔥 CAMBIO: Usar additionalItems
                        const children = item.additionalItems || [];
                        children.forEach(child => itemIds.add(child.id));
                    } else if (item.isChild) {
                        // 🔥 CAMBIO: Buscar padre en order.items
                        const parent = allItems.find(i => i.uid === item.pid);
                        if (parent && parent.additionalItems) {
                            const siblings = parent.additionalItems;
                            const allSiblingsWillBeReady = siblings.every(sibling =>
                                sibling.kitchen_status === 1 || sibling.id === item.id
                            );

                            if (allSiblingsWillBeReady && parent) {
                                itemIds.add(parent.id);
                            }
                        }
                    }

                    handleItemsUpdate(itemIds);
                    setSelectedRows(new Set());
                }
            );
        } else {
            toggleRowSelection(item, allItems);
        }
    }, [selectionMode, handleTap, toggleRowSelection, handleItemsUpdate]);


    // 🔥 NUEVO: Handler unificado para mesas
    const handleTableTouch = useCallback((order) => {
        if (selectionMode === "2") {
            handleTap(
                `table-${order.orderTime}-${order.table}`,
                () => toggleTableSelection(order),
                () => {
                    const itemIds = new Set();

                    // 🔥 CAMBIO: Usar getDisplayItemsHierarchy para obtener todos los items
                    const displayItems = getDisplayItemsHierarchy(order.items, true);

                    displayItems.forEach(item => {
                        if (!item.isDisabled) {
                            itemIds.add(item.id);
                        }
                    });

                    handleItemsUpdate(itemIds);
                    setSelectedRows(new Set());
                }
            );
        } else {
            toggleTableSelection(order);
        }
    }, [selectionMode, handleTap, toggleTableSelection, handleItemsUpdate]);

    const handleConfirm = () => {
        handleUpdate();
    };

    const handleUpdate = async () => {
        if (!kitchen_cd) {
            console.error('No se encontró kitchen_cd en la configuración');
            return;
        }

        try {
            await updateSelectedItems({
                selectedItemIds: selectedRows,
                orderGroups: orderItems,
                updateKitchenStatus,
                kitchen_cd,
                targetStatus: 1,
                useAdditionalItems: true,  // 🔥 CAMBIO: Ahora usa additionalItems
                parentUpdateStrategy: 'check-selected-siblings'
            });

            setSelectedRows(new Set());
            setShowConfirmDialog(false);
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
        }
    };

    // Contar ítems seleccionados
    const getSelectedItemsCount = () => {
        let count = 0;
        orderItems.forEach(order => {
            order.items.forEach(item => {
                if (selectedRows.has(item.id)) {
                    count += item.quantity;
                }
            });
        });
        return count;
    };

    // Estilo para el tiempo transcurrido
    const getTimeStyle = (elapsedTime, configTime) => {
        const minutes = parseInt(elapsedTime?.toString().replace('分', '')) || 0;
        const threshold = parseInt(configTime || 0);
        return `pt-2 pb-0 px-4 align-top font-medium w-[100px] text-center text-3xl ${minutes >= threshold ? 'text-red-500' : 'text-gray-900'
            }`;
    };

    // Función para manejar el clic en el icono de imagen
    const handleImageClick = (item) => {
        setSelectedImage({
            url: item.handwriteImage,
            name: item.name
        });
        setImageModalOpen(true);
    };


    return (
        <div className="flex flex-col h-full">
            {selectedRows.size > 0 && selectionMode !== "2" && (
                <div className="sticky top-0 z-40 mb-2">
                    <button
                        onClick={() => setShowConfirmDialog(true)}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-3xl"
                    >
                        【調理済みにする】
                    </button>
                </div>
            )}

            <div className="m-2 bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 w-full h-full max-h-[calc(100vh-6rem)]">
                    <div className="overflow-auto h-full">
                        <table className="w-full">
                            <thead className="sticky top-0 z-20 bg-white">
                                <tr>
                                    <th className="w-[100px] py-3 px-4 bg-gray-200 text-center font-bold text-gray-800 border-b border-gray-200">
                                        注文時間
                                    </th>
                                    <th className="w-[100px] py-3 px-4 bg-gray-200 text-center font-bold text-gray-800 border-b border-gray-200">
                                        経過時間
                                    </th>
                                    <th className="w-[200px] py-3 px-4 bg-gray-200 text-center font-bold text-gray-800 border-b border-gray-200">
                                        テーブル
                                    </th>
                                    <th className="py-3 px-4 bg-gray-200 text-left font-bold text-gray-800 border-b border-gray-200">
                                        メニュー
                                    </th>
                                    <th className="w-[120px] py-3 px-4 bg-gray-200 text-right font-bold text-gray-800 border-b border-gray-200">
                                        数量
                                    </th>
                                    <th className="w-[120px] py-3 px-4 bg-gray-200 text-right font-bold text-gray-800 border-b border-gray-200">
                                        全体合計
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orderItems.map((order, orderIndex) => {
                                    const selectableItems = getDisplayItemsHierarchy(order.items, true)
                                        .filter(item => !item.isDisabled);

                                    const isTableSelected = selectableItems.length > 0 &&
                                        selectableItems.every(item => selectedRows.has(item.id));

                                    return (
                                        <tr key={`${order.orderTime}-${order.table}-${orderIndex}`}>
                                            <td className="pt-2 pb-0 px-4 align-top w-[100px] text-center text-3xl">
                                                {order.orderTime}
                                            </td>
                                            <td className={getTimeStyle(order.elapsedTime, config.elapsed_time)}>
                                                {order.elapsedTime}
                                            </td>
                                            <td
                                                className={`pt-2 pb-0 px-4 align-top w-[200px] text-center text-3xl cursor-pointer ${isTableSelected ? 'bg-yellow-300' : ''
                                                    }`}
                                                onClick={() => handleTableTouch(order)}
                                            >
                                                {order.table}
                                            </td>
                                            <td colSpan="3" className="p-0">
                                                <div className="divide-y divide-gray-200">
                                                    {getDisplayItemsHierarchy(order.items, true).map((item, itemIndex) => (
                                                        <div
                                                            key={itemIndex}
                                                            onClick={() => {
                                                                // 🔥 NO permitir clic en items deshabilitados (padres prestados)
                                                                if (!item.isDisabled) {
                                                                    handleItemTouch(item, order.items);
                                                                }
                                                            }}
                                                            className={`flex items-left px-4 py-2 ${item.isDisabled
                                                                ? 'cursor-not-allowed opacity-50'  // 🔥 Estilo deshabilitado
                                                                : `cursor-pointer ${selectedRows.has(item.id) ? 'bg-yellow-300' : ''}`
                                                                }`}
                                                        >
                                                            <div className="w-[50px] flex justify-start">
                                                                {item.modification && item.modification !== "　" && (
                                                                    <span className="text-3xl bg-gray-100 rounded text-red-600">
                                                                        {item.modification}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className={`flex-1 flex items-center ${item.isChild ? 'pl-4' : ''}`}>
                                                                {item.isChild && (
                                                                    <div className="w-2 h-px bg-gray-300 mr-3 mt-4"></div>
                                                                )}
                                                                <span className={`text-3xl ${item.isDisabled ? 'text-gray-400' : ''}`}>
                                                                    {item.name}
                                                                    {item.price_type === 2 &&
                                                                        (item.later_price_change_flg === 0 || item.later_price_change_flg == null) && (
                                                                            <span className="text-3xl text-red-500">
                                                                                {"　"}@{item.price}
                                                                            </span>
                                                                        )}
                                                                </span>
                                                            </div>

                                                            {item.handwriteImage !== null && (
                                                                <div className="w-[50px] flex justify-end">
                                                                    <div
                                                                        className="flex-shrink-0 cursor-pointer hover:bg-indigo-100 p-1 rounded-full"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (!item.isDisabled && handleImageClick) {
                                                                                handleImageClick(item);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Image className="h-10 w-10 text-indigo-500" />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="w-[120px] flex justify-end">
                                                                {item.isDisabled ? (
                                                                    // 🔥 Mostrar candado en lugar de cantidad
                                                                    <Lock className="h-6 w-6 text-gray-400" />
                                                                ) : (
                                                                    // Mostrar cantidad normal
                                                                    <span className="inline-flex items-center justify-center w-8 h-8 text-5xl font-medium text-black-500">
                                                                        {item.quantity}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="w-[120px] flex justify-end px-4">
                                                                {/* 🔥 Solo mostrar total si NO es padre prestado */}
                                                                {item.isDisabled ?
                                                                    (
                                                                        <Lock className="h-6 w-6 text-gray-400" />
                                                                    ) : (
                                                                        <span className="inline-flex items-center justify-center w-8 h-8 text-5xl font-medium text-red-500">
                                                                            {itemTotals[item.name]?.total || 0}
                                                                        </span>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de confirmación */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showConfirmDialog ? '' : 'hidden'
                    }`}
            >
                <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                    <h3 className="text-lg font-medium mb-2">確認</h3>
                    <p className="text-gray-500 mb-4">
                        選択したアイテム ({getSelectedItemsCount()} 点) を更新してもよろしいですか？
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowConfirmDialog(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleConfirm}
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

export default OrderTimeline;