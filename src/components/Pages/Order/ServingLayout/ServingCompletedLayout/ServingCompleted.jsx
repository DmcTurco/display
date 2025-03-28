import React, { useMemo, useState } from 'react';
import _ from 'lodash';
import { FaClipboardList } from 'react-icons/fa';

const ServingCompleted = ({ completedOrders, updateKitchenStatus }) => {

    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    const kitchen_cd = config.cd;
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedRows, setSelectedRows] = useState(new Set);
    const [selectedItemId, setSelectedItemId] = useState(null);

    const { orderItems } = useMemo(() => {
        const orderItems = completedOrders.map(order => {
            // Encontrar items que tienen pid
            const itemsWithPid = order.items?.filter(item => item.pid) || [];

            // Obtener los uids únicos de los padres
            const parentUids = [...new Set(itemsWithPid.map(item => item.pid))];

            // Primero encontrar padres que tienen al menos un hijo completado
            const activeParentUids = parentUids.filter(parentUid => {
                const children = order.items?.filter(item =>
                    item.pid === parentUid &&
                    item.kitchen_status === 1 &&
                    item.serving_status === 1
                );
                return children.length > 0; // Solo incluir padres con hijos completados
            });

            // Filtrar items completados y procesarlos
            const processedItems = order.items?.filter(item =>
                // Incluir el item si:
                (activeParentUids.includes(item.uid)) || // Es un padre con hijos completados
                (item.kitchen_status === 1 && item.serving_status === 1) // Es un item completado (sea hijo o item normal)
            ).map(item => ({
                ...item,
                isParent: parentUids.includes(item.uid),
                isChild: Boolean(item.pid)
            })) || [];

            return {
                orderTime: order.formatted_time_update,
                elapsedTime: `${order.elapsedTime}分`,
                table: order.table_name || 'Sin Mesa',
                items: processedItems,
                originalOrder: order
            };
        }).filter(order => order.items.length > 0);

        return {
            orderItems: _.sortBy(orderItems, item => new Date(item.originalOrder.record_date))
        };
    }, [completedOrders]);

    const getAllChildren = (parentId, items) => {
        if (!Array.isArray(items)) {
            console.warn('Items no es un array:', items);
            return [];
        }
        return items.filter(item => item.pid === parentId);
    };

    const toggleRowSelection = (item, allItems) => {
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
    };

    const toggleTableSelection = (order) => {
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
    };

    const handleConfirm = () => {
        handleUpdate();
        setShowConfirmDialog(false);
    };

    const handleUpdate = async () => {
        if (!kitchen_cd) {
            console.error('No se encontró kitchen_cd en la configuración');
            return;
        }

        try {

            for (const completedOrders of orderItems) {
                for (const item of completedOrders.items) {
                    if (selectedRows.has(item.id)) {
                        if (item.isParent) {

                            const children = getAllChildren(item.uid, completedOrders.items);
                            await Promise.all([
                                updateKitchenStatus(item.id, 0, kitchen_cd),
                                ...children.map(child => updateKitchenStatus(child.id, 0, kitchen_cd))
                            ]);
                        } else if (item.isChild) {

                            const siblings = getAllChildren(item.pid, completedOrders.items);
                            const allSiblingsWillBeCanceled = siblings.every(sibling =>
                                sibling.serving_status === 1 || selectedRows.has(sibling.id)
                            );

                            if (allSiblingsWillBeCanceled) {
                                const parent = completedOrders.items.find(i => i.uid === item.pid)
                                if (parent) {
                                    await Promise.all([
                                        updateKitchenStatus(item.id, 0, kitchen_cd),
                                        updateKitchenStatus(parent.id, 0, kitchen_cd)
                                    ]);
                                }
                            } else {
                                await updateKitchenStatus(item.id, 0, kitchen_cd)
                            }

                        } else {
                            await updateKitchenStatus(item.id, 0, kitchen_cd)
                        }
                    }
                }
            }

            setSelectedRows(new Set());
            setShowConfirmDialog(false);
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
        }
    };

    const getSelectedItemsCount = () => {
        // Usar flatMap para obtener todos los items y encontrar el seleccionado
        const selectedItem = orderItems
            .flatMap(order => order.items)
            .find(item => item.id === selectedItemId);

        // Si encontramos el item, devolver su cantidad, si no, devolver 0
        return selectedItem ? selectedItem.quantity : 0;
    };

    const getTimeStyle = (elapsedTime, configTime) => {
        const minutes = parseInt(elapsedTime?.toString().replace('分', '')) || 0;
        const threshold = parseInt(configTime || 0);
        return `pt-2 pb-0 px-4 align-top font-medium w-[100px] text-center text-3xl ${minutes >= threshold ? 'text-red-500' : 'text-gray-900'
            }`;
    };

    if (!orderItems?.length) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center animate-bounce">
                    <FaClipboardList className="text-blue-500 text-6xl mx-auto mb-4" />
                    <p className="text-2xl font-semibold text-gray-700">注文データがありません</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">

            {selectedRows.size > 0 && (
                <div className="sticky top-0 z-40 mb-2">
                    <button onClick={() => setShowConfirmDialog(true)}
                        className='w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-3xl'
                    >
                        戻す
                    </button>
                </div>

            )}


            <div className="m-2 bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 w-full h-full max-h-[calc(100vh-6rem)]">
                    <div className="overflow-auto h-full">
                        <table className="w-full">
                            <thead className="sticky top-0 z-20 bg-white">
                                <tr>
                                    <th className="w-[100px] py-3 px-4 text-center font-bold text-gray-800 border-b border-gray-200 bg-gray-200">
                                        配膳時間
                                    </th>
                                    <th className="w-[100px] py-3 px-2 text-left font-bold text-gray-800 border-b border-gray-200 bg-gray-200">
                                        経過時間
                                    </th>
                                    <th className="w-[200px]py-3 px-4  text-center font-bold text-gray-800 border-b border-gray-200 bg-gray-200">
                                        テーブル
                                    </th>
                                    <th className="py-3 px-4 bg-gray-200 text-left font-bold text-gray-800 border-b border-gray-200">
                                        メニュー
                                    </th>
                                    <th className="w-[100px] py-3 px-4 bg-gray-200 text-right font-bold text-gray-800 border-b border-gray-200">
                                        数量
                                    </th>
                                    <th className="w-[200px] py-3 px-4 bg-gray-200 border-b border-gray-200">
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
                                                onClick={() => toggleTableSelection(order)}

                                            >
                                                {order.table}
                                            </td>
                                            <td colSpan="3" className="p-0">
                                                <div className="divide-y divide-gray-100">
                                                    {order.items.map((item, itemIndex) => (
                                                        <div
                                                            key={itemIndex}
                                                            onClick={() => toggleRowSelection(item, order.items)}
                                                            className={`flex items-center px-4 py-2 cursor-pointer ${selectedRows.has(item.id)
                                                                ? "bg-yellow-200 hover:bg-yellow-200"
                                                                : "hover:bg-gray-50"
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
                                                            <div className="w-[100px] flex justify-end">
                                                                {/* {!item.isParent && ( */}
                                                                <span className="inline-flex items-center justify-center w-8 h-8 text-5xl font-medium text-black-500">
                                                                    {item.quantity}
                                                                </span>
                                                                {/* )} */}
                                                            </div>

                                                            {/* Botón de acción - solo visible cuando la fila está seleccionada */}
                                                            <div className="w-[200px] flex justify-center px-4">
                                                                {/* {!item.isParent && selectedItemId === item.id && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Evita que se deseleccione la fila
                                                                        setShowConfirmDialog(true);
                                                                    }}
                                                                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                                                                >
                                                                    戻す
                                                                </button>
                                                            )} */}
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
            <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showConfirmDialog ? '' : 'hidden'}`}>

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
                            onClick={handleConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
                        >
                            更新する
                        </button>
                    </div>
                </div>

                {/* <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                    <h3 className="text-lg font-medium mb-2">配膳取消確認</h3>
                    {selectedItemId ? (
                        <p className="text-gray-500 mb-4">
                            選択した料理の配膳を取り消しますか？
                        </p>
                    ) : (
                        <p className="text-gray-500 mb-4">
                            選択した料理がありません
                        </p>
                    )}
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowConfirmDialog(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedItemId}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${selectedItemId
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-gray-400 cursor-not-allowed'
                                }`}
                        >
                            取り消す
                        </button>
                    </div>
                </div> */}
            </div>


        </div>
    );
};

export default ServingCompleted;