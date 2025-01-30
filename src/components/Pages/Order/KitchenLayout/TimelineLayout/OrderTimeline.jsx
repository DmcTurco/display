import React, { useMemo, useState } from 'react';
import _ from 'lodash';

const OrderTimeline = ({ orders, updateKitchenStatus }) => {
    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    const kitchen_cd = config.cd;
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const { orderItems, itemTotals } = useMemo(() => {
        // Primero procesamos las órdenes como antes
        const orderItems = orders.map(order => {
            return {
                orderTime: order.formatted_time,
                elapsedTime: `${order.elapsedTime}分`,
                table: order.table_name || 'Sin Mesa',
                items: order.items?.filter(item => item.kitchen_status !== 1) || [],
                originalOrder: order
            };
        }).filter(order => order.items.length > 0);

        // Ahora calculamos los totales por cada item
        const itemTotals = {};
        orderItems.forEach(order => {
            order.items.forEach(item => {
                if (!itemTotals[item.name]) {
                    itemTotals[item.name] = {
                        total: 0,
                        occurrences: 0
                    };
                }
                itemTotals[item.name].total += item.quantity;
                itemTotals[item.name].occurrences += 1;
            });
        });

        return {
            orderItems: _.sortBy(orderItems, item => new Date(item.originalOrder.record_date)),
            itemTotals
        };
    }, [orders]);

    const [selectedRows, setSelectedRows] = useState(new Set());

    const toggleRowSelection = (itemId) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        handleUpdate();
        setShowConfirmDialog(false);
    };

    // Modificar la función de actualización
    const handleUpdate = () => {
        if (!kitchen_cd) {
            console.error('No se encontró kitchen_cd en la configuración');
            return;
        }

        orderItems.forEach(order => {
            order.items.forEach(item => {
                if (selectedRows.has(item.id)) {
                    updateKitchenStatus(item.id, 1, kitchen_cd);
                }
            });
        });

        setSelectedRows(new Set());
        setShowConfirmDialog(false);
    };

    // Modificar la función de conteo
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

    return (
        <div className="flex flex-col h-full">
            {selectedRows.size > 0 && (
                <div className="sticky top-0 z-40 mb-2">
                    <button
                        onClick={() => setShowConfirmDialog(true)}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        更新 ({getSelectedItemsCount()}イヤリング)
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
                                    <th className="w-[100px]py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200 bg-gray-200">
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
                                {orderItems.map((order, orderIndex) => (
                                    <tr key={`${order.orderTime}-${order.table}-${orderIndex}`}>
                                        <td className="pt-2 pb-0 px-4 align-top w-[100px] text-center">{order.orderTime}</td>
                                        <td className="pt-2 pb-0 px-4 align-top text-red-500 font-medium w-[100px] text-center">{order.elapsedTime}</td>
                                        <td className="pt-2 pb-0 px-4 align-top w-[100px] text-center">{order.table}</td>
                                        <td colSpan="3" className="p-0"> {/* Removemos el padding para el contenedor de items */}
                                            <div className="divide-y divide-gray-100">
                                                {order.items.map(item => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => toggleRowSelection(item.id)}
                                                        className={`flex items-left px-4 py-2 cursor-pointer ${selectedRows.has(item.id)
                                                            ? 'bg-yellow-200 hover:bg-yellow-200' // Estado seleccionado y su hover
                                                            : 'hover:bg-gray-50'                  // Hover solo cuando no está seleccionado
                                                            }`}
                                                    >
                                                        {/* Nombre del item */}
                                                        <div className="flex-1">
                                                            <span className="text-sm">{item.name}</span>
                                                        </div>

                                                        {/* Cantidad del item */}
                                                        <div className="w-[200px] flex justify-end ">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-blue-500 rounded-full">
                                                                {item.quantity}
                                                            </span>
                                                        </div>

                                                        {/* Total del item */}
                                                        <div className="w-[200px] flex justify-end px-4">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-green-500 rounded-full">
                                                                {itemTotals[item.name].total}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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