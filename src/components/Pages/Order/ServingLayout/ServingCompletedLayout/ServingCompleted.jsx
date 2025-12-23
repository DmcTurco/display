import React, { useMemo, useState } from 'react';
import { FaClipboardList } from 'react-icons/fa';
import { Lock } from 'lucide-react';
import {
    getDisplayItemsHierarchy,
    getItemIds,
    processOrdersWithHierarchy,
    toggleItemSelection,
    toggleTableSelection,
    updateSelectedItems
} from '@/js/itemSelectionHelpers';

const ServingCompleted = ({ completedOrders, updateKitchenStatus }) => {
    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    const kitchen_cd = config.cd;
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedRows, setSelectedRows] = useState(new Set());

    // 🔥 Usar helper unificado
    const orderItems = useMemo(() => {
        return processOrdersWithHierarchy(completedOrders, {
            filterByKitchenStatus: true,
            filterByServingStatus: false, // No filtrar por serving_status aquí
            filterByServingCompleted: true, // 🔥 Nueva opción para serving_status === 1
            sortBy: 'record_date',
            sortOrder: 'asc',
            mapOrderFields: (order) => ({
                orderTime: order.formatted_time_update,
                elapsedTime: `${order.elapsedTime}分`,
            })
        });
    }, [completedOrders]);

    // 🔥 Usar helper para toggle de item individual
    const toggleRowSelection = (item) => {
        const itemIds = getItemIds(item);
        const newSelection = toggleItemSelection(itemIds, selectedRows);
        setSelectedRows(newSelection);
    };

    // 🔥 Toggle de selección de mesa completa
    const handleToggleTableSelection = (order) => {
        const newSelection = toggleTableSelection(order, selectedRows);
        setSelectedRows(newSelection);
    };

    const handleConfirm = () => {
        handleUpdate();
        setShowConfirmDialog(false);
    };

    // 🔥 Usar helper para handleUpdate (devolver items servidos)
    const handleUpdate = async () => {
        try {
            await updateSelectedItems({
                selectedItemIds: selectedRows,
                orderGroups: orderItems,
                updateKitchenStatus,
                kitchen_cd,
                targetStatus: 0, // Marcar como no preparado
                useAdditionalItems: true,
                extraParam: null, // Sin parámetro extra
                parentUpdateStrategy: 'check-selected-siblings' // Actualizar padre solo si todos los hermanos seleccionados
            });

            setSelectedRows(new Set());
            setShowConfirmDialog(false);
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
        }
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
                    <button
                        onClick={() => setShowConfirmDialog(true)}
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
                                    <th className="w-[200px] py-3 px-4 text-center font-bold text-gray-800 border-b border-gray-200 bg-gray-200">
                                        テーブル
                                    </th>
                                    <th className="py-3 px-4 bg-gray-200 text-left font-bold text-gray-800 border-b border-gray-200">
                                        メニュー
                                    </th>
                                    <th className="w-[100px] py-3 px-4 bg-gray-200 text-right font-bold text-gray-800 border-b border-gray-200">
                                        数量
                                    </th>
                                    <th className="w-[200px] py-3 px-4 bg-gray-200 border-b border-gray-200"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orderItems.map((order, orderIndex) => {
                                    const selectableItems = order.items.filter(item => !item.isDisabled);
                                    const isTableSelected = selectableItems.length > 0 && selectableItems.every(item => selectedRows.has(item.id));

                                    return (
                                        <tr key={`${order.orderTime}-${order.table}-${orderIndex}`}>
                                            <td className="pt-2 pb-0 px-4 align-top w-[100px] text-center text-3xl">
                                                {order.orderTime}
                                            </td>
                                            <td className={getTimeStyle(order.elapsedTime, config.elapsed_time)}>
                                                {order.elapsedTime}
                                            </td>
                                            <td
                                                className={`pt-2 pb-0 px-4 align-top w-[200px] text-center text-3xl cursor-pointer ${isTableSelected
                                                    ? 'bg-yellow-200 hover:bg-yellow-200'
                                                    : 'hover:bg-gray-50'
                                                    }`}
                                                onClick={() => handleToggleTableSelection(order)}
                                            >
                                                {order.table}
                                            </td>
                                            <td colSpan="3" className="p-0">
                                                <div className="divide-y divide-gray-100">
                                                    {getDisplayItemsHierarchy(order.items).map((item, itemIndex) => (
                                                        <div
                                                            key={itemIndex}
                                                            onClick={() => !item.isDisabled && toggleRowSelection(item)}
                                                            className={`flex items-center px-4 py-2 ${item.isDisabled
                                                                ? 'cursor-not-allowed opacity-50'
                                                                : 'cursor-pointer'
                                                                } ${selectedRows.has(item.id)
                                                                    ? "bg-yellow-200 hover:bg-yellow-200"
                                                                    : "hover:bg-gray-50"
                                                                }`}
                                                        >
                                                            <div className={`flex-1 flex items-center ${item.isChild ? 'pl-4' : ''}`}>
                                                                {item.isChild && (
                                                                    <div className="w-2 h-px bg-gray-300 mr-3"></div>
                                                                )}
                                                                <span className="text-3xl">{item.name}</span>
                                                                {item.isDisabled && (
                                                                    <Lock className="h-4 w-4 text-gray-400 flex-shrink-0 mr-2" />
                                                                )}
                                                            </div>

                                                            <div className="w-[100px] flex justify-end">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 text-5xl font-medium text-black-500">
                                                                    {item.quantity}
                                                                </span>
                                                            </div>

                                                            <div className="w-[200px] flex justify-center px-4"></div>
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
            <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showConfirmDialog ? '' : 'hidden'}`}>
                <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                    <h3 className="text-lg font-medium mb-2">確認</h3>
                    <p className="text-gray-500 mb-4">選択した料理を戻しますか？</p>
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
            </div>
        </div>
    );
};

export default ServingCompleted;