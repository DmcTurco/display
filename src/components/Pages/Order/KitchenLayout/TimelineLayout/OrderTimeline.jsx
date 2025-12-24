import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'lucide-react';
import _ from 'lodash';
import ImageModal from '@/components/ui/ImagenModal';
import { getAllChildrenByPid, getDisplayItemsHierarchy, updateSelectedItems } from '@/js/itemSelectionHelpers';
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
        const orderItems = orders.map((order) => {
            const itemsWithPid = order.items?.filter(item => item.pid) || [];
            const parentUids = [...new Set(itemsWithPid.map(item => item.pid))];

            // Detectar padres prestados
            const borrowedParentUids = parentUids.filter(parentUid => {
                const parent = order.items?.find(item => item.uid === parentUid);
                return parent?.belongs_to_kitchen === false;
            });

            // Identificar padres activos (con hijos sin cocinar)
            const activeParentUids = parentUids.filter(parentUid => {
                const children = order.items?.filter(item =>
                    item.pid === parentUid && item.kitchen_status !== 1
                );
                return children.length > 0;
            });

            // Filtrar ítems relevantes
            const processedItems = order.items?.filter(item =>
                (activeParentUids.includes(item.uid)) ||
                (!item.pid && item.kitchen_status !== 1) ||
                (item.pid && item.kitchen_status !== 1)
            ).map(item => {
                const isParent = parentUids.includes(item.uid);
                const isBorrowedParent = borrowedParentUids.includes(item.uid);

                return {
                    ...item,
                    isParent,
                    isChild: Boolean(item.pid),
                    isBorrowedParent,
                    isDisabled: isBorrowedParent
                };
            }) || [];

            // 🔥 POST-FILTRADO: Eliminar padres prestados sin hijos visibles
            const finalItems = processedItems.filter(item => {
                // Si es un padre prestado, verificar que tenga hijos en la lista
                if (item.isDisabled && item.isParent) {
                    const hasVisibleChildren = processedItems.some(child =>
                        child.pid === item.uid && !child.isDisabled
                    );
                    return hasVisibleChildren; // Solo incluir si tiene hijos visibles
                }
                return true; // Incluir todos los demás items
            });

            return {
                orderTime: order.formatted_time,
                elapsedTime: `${order.elapsedTime}分`,
                table: order.table_name || 'Sin Mesa',
                items: finalItems, // 🔥 Usar finalItems en vez de processedItems
                originalOrder: order
            };
        }).filter(order => order.items.length > 0);

        // Calcular totales
        const itemTotals = {};
        orderItems.forEach(order => {
            order.items.forEach(item => {
                if (item.isDisabled) return;

                if (!itemTotals[item.name]) {
                    itemTotals[item.name] = { total: 0, occurrences: 0 };
                }
                itemTotals[item.name].total += item.quantity;
                itemTotals[item.name].occurrences += 1;
            });
        });

        return {
            orderItems: _.sortBy(orderItems, (item) => new Date(item.originalOrder.record_date)),
            itemTotals
        };
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
                useAdditionalItems: false, // OrderTimeline usa pid/uid directamente
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

            if (item.isParent) {
                const children = getAllChildrenByPid(item.uid, allItems);

                if (selectionMode === "2" || !prev.has(item.id)) {
                    // Seleccionar
                    newSet.add(item.id);
                    children.forEach(child => newSet.add(child.id));
                } else {
                    // Deseleccionar
                    newSet.delete(item.id);
                    children.forEach(child => newSet.delete(child.id));
                }
            } else {
                if (selectionMode === "2" || !prev.has(item.id)) {
                    newSet.add(item.id);
                } else {
                    newSet.delete(item.id);
                }
            }

            return newSet;
        });
    }, [selectionMode]);

    // 🔥 MEJORADO: Simplificar toggleTableSelection usando helper
    const toggleTableSelection = useCallback((order) => {
        setSelectedRows(prev => {
            const newSet = new Set(selectionMode === "2" ? [] : prev);
            const allItemsSelected = order.items.every(item => prev.has(item.id));

            order.items.forEach(item => {
                if (selectionMode === "2" || !allItemsSelected) {
                    // Seleccionar
                    newSet.add(item.id);
                    if (item.isParent) {
                        const children = getAllChildrenByPid(item.uid, order.items);
                        children.forEach(child => newSet.add(child.id));
                    }
                } else {
                    // Deseleccionar
                    newSet.delete(item.id);
                    if (item.isParent) {
                        const children = getAllChildrenByPid(item.uid, order.items);
                        children.forEach(child => newSet.delete(child.id));
                    }
                }
            });

            return newSet;
        });
    }, [selectionMode]);

    // 🔥 MEJORADO: Usar helper para doble toque de item
    const handleItemTouch = useCallback((item, allItems) => {
        if (item.isDisabled) return;

        if (selectionMode === "2") {
            // MODO 2: Double tap
            handleTap(
                `item-${item.id}`,
                // Single tap: Seleccionar
                () => toggleRowSelection(item, allItems),
                // Double tap: Actualizar
                () => {
                    const itemIds = new Set();
                    itemIds.add(item.id);

                    if (item.isParent) {
                        const children = getAllChildrenByPid(item.uid, allItems);
                        children.forEach(child => itemIds.add(child.id));
                    } else if (item.isChild) {
                        const siblings = getAllChildrenByPid(item.pid, allItems);
                        const allSiblingsWillBeReady = siblings.every(sibling =>
                            sibling.kitchen_status === 1 || sibling.id === item.id
                        );

                        if (allSiblingsWillBeReady) {
                            const parent = allItems.find(i => i.uid === item.pid);
                            if (parent) itemIds.add(parent.id);
                        }
                    }

                    handleItemsUpdate(itemIds);
                    setSelectedRows(new Set());
                }
            );
        } else {
            // MODO 1: Single tap directo
            toggleRowSelection(item, allItems);
        }
    }, [selectionMode, handleTap, toggleRowSelection, handleItemsUpdate]);


    // 🔥 NUEVO: Handler unificado para mesas
    const handleTableTouch = useCallback((order) => {
        if (selectionMode === "2") {
            // MODO 2: Double tap
            handleTap(
                `table-${order.orderTime}-${order.table}`,
                // Single tap: Seleccionar
                () => toggleTableSelection(order),
                // Double tap: Actualizar
                () => {
                    const itemIds = new Set();
                    order.items.forEach(item => {
                        if (!item.isDisabled) {
                            itemIds.add(item.id);
                            if (item.isParent) {
                                const children = getAllChildrenByPid(item.uid, order.items);
                                children.forEach(child => itemIds.add(child.id));
                            }
                        }
                    });

                    handleItemsUpdate(itemIds);
                    setSelectedRows(new Set());
                }
            );
        } else {
            // MODO 1: Single tap directo
            toggleTableSelection(order);
        }
    }, [selectionMode, handleTap, toggleTableSelection, handleItemsUpdate]);

    const handleConfirm = () => {
        handleUpdate();
    };

    // 🔥 NUEVO: Actualizar usando helper
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
                useAdditionalItems: false, // OrderTimeline usa pid/uid
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
                                    const isTableSelected = order.items.every(item => selectedRows.has(item.id));
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
                                                    {getDisplayItemsHierarchy(order.items, false).map((item, itemIndex) => (
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
                                                                <span className={`inline-flex items-center justify-center w-8 h-8 text-5xl font-medium ${item.isDisabled ? 'text-gray-400' : 'text-black-500'
                                                                    }`}>
                                                                    {item.quantity}
                                                                </span>
                                                            </div>

                                                            <div className="w-[120px] flex justify-end px-4">
                                                                {/* 🔥 Solo mostrar total si NO es padre prestado */}
                                                                {!item.isDisabled && (
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