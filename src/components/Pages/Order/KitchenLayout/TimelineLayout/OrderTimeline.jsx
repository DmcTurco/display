import React, { useCallback, useMemo, useRef, useState } from 'react';
import _, { filter, update } from 'lodash';

const OrderTimeline = ({ orders, updateKitchenStatus }) => {
    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    const kitchen_cd = config.cd;
    const selectionMode = config.selectionMode || "1"; // Modo por defecto: botones
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedRows, setSelectedRows] = useState(new Set());

    const lastTouchRef = useRef({});
    const touchTimeoutRef = useRef({});
    const DOUBLE_TAP_DELAY = 300;

    // Procesamiento inicial de las órdenes
    const { orderItems, itemTotals } = useMemo(() => {
        const orderItems = orders.map((order) => {
            const itemsWithPid = order.items?.filter(item => item.pid) || [];
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
        }).filter(order => order.items.length > 0);

        // Calcular totales
        const itemTotals = {};
        orderItems.forEach(order => {
            order.items.forEach(item => {
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


    // Función para encontrar todos los hijos de un padre
    const getAllChildren = (parentId, items) => {
        if (!Array.isArray(items)) {
            console.warn('Items no es un array:', items);
            return [];
        }
        return items.filter(item => item.pid === parentId);
    };

    // Función para manejar el doble toque de un ítem
    const handleItemTouch = useCallback((item, allItems) => {
        const now = Date.now();
        const touchId = `item-${item.id}`; // Identificador único para este ítem

        if (selectionMode === "2") {
            // Si es modo doble toque
            if (now - (lastTouchRef.current[touchId] || 0) < DOUBLE_TAP_DELAY) {
                // Es un doble toque, limpiamos el timeout y actualizamos
                if (touchTimeoutRef.current[touchId]) {
                    clearTimeout(touchTimeoutRef.current[touchId]);
                }

                // Colección de ids a actualizar
                const itemIds = new Set([item.id]);

                // Si es padre, incluir a sus hijos
                if (item.isParent) {
                    const children = getAllChildren(item.uid, allItems);
                    children.forEach(child => itemIds.add(child.id));
                }
                // Si es hijo, verificar si debemos actualizar al padre
                else if (item.isChild) {
                    const siblings = getAllChildren(item.pid, allItems);
                    const allSiblingsWillBeReady = siblings.every(sibling =>
                        sibling.kitchen_status === 1 || sibling.id === item.id
                    );

                    if (allSiblingsWillBeReady) {
                        const parent = allItems.find(i => i.uid === item.pid);
                        if (parent) {
                            itemIds.add(parent.id);
                        }
                    }
                }

                // Realizar la actualización
                handleItemsUpdate(itemIds);
            } else {
                // Es el primer toque, guardamos tiempo y configuramos timeout
                if (touchTimeoutRef.current[touchId]) {
                    clearTimeout(touchTimeoutRef.current[touchId]);
                }

                touchTimeoutRef.current[touchId] = setTimeout(() => {
                    // Opcional: acción para toque simple en modo 2
                    // console.log("Toque simple en ítem:", item.name);
                }, 250);
            }

            // Actualizar la referencia del último toque
            lastTouchRef.current[touchId] = now;
        } else {
            // En modo 1, usar el comportamiento normal de selección
            toggleRowSelection(item, allItems);
        }
    }, [selectionMode, getAllChildren]);

    // Función para manejar el doble toque en una mesa completa
    const handleTableTouch = useCallback((order) => {
        const now = Date.now();
        const touchId = `table-${order.orderTime}-${order.table}`; // Identificador único para esta mesa

        if (selectionMode === "2") {
            // Si es modo doble toque
            if (now - (lastTouchRef.current[touchId] || 0) < DOUBLE_TAP_DELAY) {
                // Es un doble toque, limpiamos el timeout y actualizamos
                if (touchTimeoutRef.current[touchId]) {
                    clearTimeout(touchTimeoutRef.current[touchId]);
                }

                // Colección de ids a actualizar
                const itemIds = new Set();

                // Añadir todos los ítems de la mesa
                order.items.forEach(item => {
                    itemIds.add(item.id);

                    // Si es padre, incluir a sus hijos
                    if (item.isParent) {
                        const children = getAllChildren(item.uid, order.items);
                        children.forEach(child => itemIds.add(child.id));
                    }
                });

                // Realizar la actualización
                handleItemsUpdate(itemIds);
            } else {
                // Es el primer toque, guardamos tiempo y configuramos timeout
                if (touchTimeoutRef.current[touchId]) {
                    clearTimeout(touchTimeoutRef.current[touchId]);
                }

                touchTimeoutRef.current[touchId] = setTimeout(() => {
                    // Opcional: acción para toque simple en modo 2
                    // console.log("Toque simple en mesa:", order.table);
                }, 250);
            }

            // Actualizar la referencia del último toque
            lastTouchRef.current[touchId] = now;
        } else {
            // En modo 1, usar el comportamiento normal de selección
            toggleTableSelection(order);
        }
    }, [selectionMode, getAllChildren]);

    const handleItemsUpdate = useCallback(async (itemIds) => {
        if (!kitchen_cd) {
            console.error('No se encontró kitchen_cd en la configuración');
            return;
        }

        try {
            const updatePromises = [];

            for (const order of orderItems) {
                for (const item of order.items) {
                    if (itemIds.has(item.id)) {
                        updatePromises.push(updateKitchenStatus(item.id, 1, kitchen_cd));
                    }
                }
            }

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
        }
    }, [kitchen_cd, orderItems, updateKitchenStatus]);

    // Modificar toggleRowSelection para manejar la selección de padres e hijos
    const toggleRowSelection = useCallback((item, allItems) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);

            if (item.isParent) {
                const children = getAllChildren(item.uid, allItems);

                if (newSet.has(item.id)) {
                    newSet.delete(item.id);
                    children.forEach(child => newSet.delete(child.id));
                } else {
                    newSet.add(item.id);
                    children.forEach(child => newSet.add(child.id));
                }
            } else {
                if (newSet.has(item.id)) {
                    newSet.delete(item.id);
                } else {
                    newSet.add(item.id);
                }
            }

            return newSet;
        });
    }, [getAllChildren]);

    const toggleTableSelection = useCallback((order) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            const allItemsSelected = order.items.every(item =>
                newSet.has(item.id)
            );

            order.items.forEach(item => {
                if (allItemsSelected) {
                    newSet.delete(item.id);
                    // Si el ítem es padre, también deseleccionamos sus hijos
                    if (item.isParent) {
                        const children = getAllChildren(item.uid, order.items);
                        children.forEach(child => newSet.delete(child.id));
                    }
                } else {
                    newSet.add(item.id);
                    // Si el ítem es padre, también seleccionamos sus hijos
                    if (item.isParent) {
                        const children = getAllChildren(item.uid, order.items);
                        children.forEach(child => newSet.add(child.id));
                    }
                }
            });
            return newSet;
        });
    }, [getAllChildren]);

    const handleConfirm = useCallback(() => {
        handleUpdate();
        setShowConfirmDialog(false);
    }, []);

    // Actualizar estado de los ítems seleccionados
    const handleUpdate = useCallback(async () => {
        if (!kitchen_cd) {
            console.error('No se encontró kitchen_cd en la configuración');
            return;
        }

        try {
            for (const order of orderItems) {
                for (const item of order.items) {
                    if (selectedRows.has(item.id)) {
                        if (item.isParent) {
                            const children = getAllChildren(item.uid, order.items);
                            await Promise.all([
                                updateKitchenStatus(item.id, 1, kitchen_cd),
                                ...children.map(child => updateKitchenStatus(child.id, 1, kitchen_cd))
                            ]);
                        } else if (item.isChild) {
                            const siblings = getAllChildren(item.pid, order.items);
                            const allSiblingsWillBeReady = siblings.every(sibling =>
                                sibling.kitchen_status === 1 || selectedRows.has(sibling.id)
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

            setSelectedRows(new Set());
            setShowConfirmDialog(false);
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
        }
    }, [kitchen_cd, orderItems, selectedRows, updateKitchenStatus, getAllChildren]);

    // Contar ítems seleccionados
    const getSelectedItemsCount = useCallback(() => {
        let count = 0;
        orderItems.forEach(order => {
            order.items.forEach(item => {
                if (selectedRows.has(item.id)) {
                    count += item.quantity;
                }
            });
        });
        return count;
    }, [orderItems, selectedRows]);

    // Estilo para el tiempo transcurrido
    const getTimeStyle = useCallback((elapsedTime, configTime) => {
        const minutes = parseInt(elapsedTime?.toString().replace('分', '')) || 0;
        const threshold = parseInt(configTime || 0);
        return `pt-2 pb-0 px-4 align-top font-medium w-[100px] text-center text-3xl ${minutes >= threshold ? 'text-red-500' : 'text-gray-900'}`;
    }, []);


    return (
        <div className="flex flex-col h-full">
            {selectedRows.size > 0 && (
                <div className="sticky top-0 z-40 mb-2">
                    <button
                        onClick={() => setShowConfirmDialog(true)}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-3xl"
                    >
                        {/* 更新 ({getSelectedItemsCount()}イヤリング) */}
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
                                    <th className="w-[100px] py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200 bg-gray-200">
                                        注文時間
                                    </th>
                                    <th className="w-[100px] py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200 bg-gray-200">
                                        経過時間
                                    </th>
                                    <th className="w-[200px]py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200 bg-gray-200">
                                        テーブル
                                    </th>
                                    <th className="py-3 px-4 bg-gray-50 text-left font-bold text-gray-800 border-b border-gray-200">
                                        メニュー
                                    </th>
                                    <th className="w-[200px] py-3 px-4 bg-gray-50 text-right font-bold text-gray-800 border-b border-gray-200">
                                        数量
                                    </th>
                                    <th className="w-[200px] py-3 px-4 bg-gray-50 text-right font-bold text-gray-800 border-b border-gray-200">
                                        全体合計
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orderItems.map((order, orderIndex) => {
                                    const isTableSelected = order.items.every(item => selectedRows.has(item.id));
                                    return (
                                        <tr key={`${order.orderTime}-${order.table}-${orderIndex}`}>
                                            <td className="pt-2 pb-0 px-4 align-top w-[100px] text-center text-3xl">{order.orderTime}</td>
                                            <td className={getTimeStyle(order.elapsedTime, config.elapsed_time)}>
                                                {order.elapsedTime}
                                            </td>

                                            <td
                                                className={`pt-2 pb-0 px-4 align-top w-[200px] text-center text-3xl cursor-pointer ${isTableSelected
                                                    ? 'bg-yellow-200 hover:bg-yellow-200' // Estado seleccionado y su hover
                                                    : 'hover:bg-gray-50'                  // Hover solo cuando no está seleccionado
                                                    }`}
                                                onClick={() => handleTableTouch(order)}

                                            >
                                                {order.table}
                                            </td>
                                            <td colSpan="3" className="p-0"> {/* Removemos el padding para el contenedor de items */}
                                                <div className="divide-y divide-gray-100">
                                                    {order.items.map((item, itemIndex) => (
                                                        <div
                                                            key={itemIndex}
                                                            onClick={() => handleItemTouch(item, order.items)}
                                                            className={`flex items-left px-4 py-2 cursor-pointer ${selectedRows.has(item.id)
                                                                ? 'bg-yellow-200 hover:bg-yellow-200' // Estado seleccionado y su hover
                                                                : 'hover:bg-gray-50'                  // Hover solo cuando no está seleccionado
                                                                }`}
                                                        >
                                                            {/* Nombre del item */}
                                                            <div className={`flex-1 flex items-center ${item.isChild ? 'pl-4' : ''}`}>
                                                                {item.isChild && (
                                                                    <div className="w-2 h-px bg-gray-300 mr-3"></div>
                                                                )}
                                                                <span className="text-3xl">{item.name}</span>
                                                            </div>

                                                            {/* Cantidad del item */}
                                                            <div className="w-[200px] flex justify-end">
                                                                {/* {!item.isParent && ( */}
                                                                <span className="inline-flex items-center justify-center w-8 h-8 text-5xl font-medium text-black-500">
                                                                    {item.quantity}
                                                                </span>
                                                                {/* )} */}
                                                            </div>

                                                            {/* Total del item */}
                                                            <div className="w-[200px] flex justify-end px-4">
                                                                {/* {!item.isParent && ( */}
                                                                <span className="inline-flex items-center justify-center w-8 h-8 text-5xl font-medium text-red-500 ">
                                                                    {itemTotals[item.name].total}
                                                                </span>
                                                                {/* )} */}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )
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
        </div>
    );
};

export default OrderTimeline;