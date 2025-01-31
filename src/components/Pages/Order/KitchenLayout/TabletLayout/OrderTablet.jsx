import React, { useMemo, useState } from 'react';
import _ from 'lodash';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../../ui/alert-dialog';

const OrderTablet = ({ orders, updateKitchenStatus }) => {
    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    const kitchen_cd = config.cd;
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const { uniqueItems, uniqueTables, orderMatrix, itemsMap } = useMemo(() => {
        const items = new Set();
        const tables = new Set();
        const matrix = {};
        const itemsMap = {};

        orders.forEach(order => {
            const tableName = order.table_name || 'Sin Mesa';
            tables.add(tableName);

            order.items?.forEach(item => {
                // Solo procesamos si no está completado
                if (item.kitchen_status !== 1) {
                    const itemName = item.name;
                    items.add(itemName);

                    if (!itemsMap[itemName]) {
                        itemsMap[itemName] = {};
                    }
                    if (!itemsMap[itemName][tableName]) {
                        itemsMap[itemName][tableName] = [];
                    }
                    itemsMap[itemName][tableName].push(item);

                    if (!matrix[itemName]) {
                        matrix[itemName] = {
                            totals: 0,
                            byTable: {},
                            pendingByTable: {}
                        };
                    }
                    if (!matrix[itemName].byTable[tableName]) {
                        matrix[itemName].byTable[tableName] = 0;
                        matrix[itemName].pendingByTable[tableName] = 0;
                    }

                    // Solo sumamos los pendientes
                    matrix[itemName].byTable[tableName] += item.quantity;
                    matrix[itemName].pendingByTable[tableName] += item.quantity;
                    matrix[itemName].totals += item.quantity;
                }
            });
        });

        // Filtramos los items que no tienen pendientes
        const filteredItems = Array.from(items).filter(item =>
            matrix[item] && matrix[item].totals > 0
        );

        return {
            uniqueItems: filteredItems,
            uniqueTables: Array.from(tables).sort(),
            orderMatrix: matrix,
            itemsMap
        };
    }, [orders]);

    const [selectedCells, setSelectedCells] = useState(new Set());
    const [selectedRows, setSelectedRows] = useState(new Set());

    const toggleRowSelection = (item) => {
        // Solo permitir selección si hay items pendientes
        const hasPendingItems = Object.values(orderMatrix[item].pendingByTable).some(count => count > 0);
        if (!hasPendingItems) return;

        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(item)) {
                // Si la fila está seleccionada, la deseleccionamos
                newSet.delete(item);
                // Y limpiamos todas las celdas de esa fila
                setSelectedCells(prevCells => {
                    const newCells = new Set(prevCells);
                    Array.from(prevCells).forEach(cellKey => {
                        if (cellKey.startsWith(`${item}-`)) {
                            newCells.delete(cellKey);
                        }
                    });
                    return newCells;
                });
            } else {
                // Si vamos a seleccionar la fila
                // Primero limpiamos cualquier celda individual de esta fila
                setSelectedCells(prevCells => {
                    const newCells = new Set(prevCells);
                    Array.from(prevCells).forEach(cellKey => {
                        if (cellKey.startsWith(`${item}-`)) {
                            newCells.delete(cellKey);
                        }
                    });
                    return newCells;
                });
                // Luego seleccionamos la fila completa
                newSet.add(item);
            }
            return newSet;
        });
    };

    const toggleCellSelection = (item, table, quantity) => {
        if (quantity > 0) {
            setSelectedCells(prev => {
                const cellKey = `${item}-${table}`;
                const newSet = new Set(prev);
                if (newSet.has(cellKey)) {
                    newSet.delete(cellKey);
                } else {
                    newSet.add(cellKey);
                }
                return newSet;
            });
        }
    };
    
    const handleConfirm = () => {
        handleUpdate();
        setShowConfirmDialog(false);
    };

    const handleUpdate = () => {
        if (!kitchen_cd) {
            console.error('No se encontró kitchen_cd en la configuración');
            return;
        }

        const updateItem = (item) => {
            if (item && item.id && item.kitchen_status !== 1) {
                updateKitchenStatus(item.id, 1, kitchen_cd);
            }
        };

        // Actualizar items seleccionados por fila
        selectedRows.forEach(itemName => {
            uniqueTables.forEach(tableName => {
                const items = itemsMap[itemName][tableName] || [];
                items.forEach(updateItem);
            });
        });

        // Actualizar celdas individuales
        selectedCells.forEach(cellKey => {
            const [itemName, tableName] = cellKey.split('-');
            const items = itemsMap[itemName][tableName] || [];
            items.forEach(updateItem);
        });

        // Limpiar selecciones
        setSelectedRows(new Set());
        setSelectedCells(new Set());
    };

    const getSelectedPendingCount = () => {
        let count = 0;

        // Contar items de filas seleccionadas
        selectedRows.forEach(itemName => {
            uniqueTables.forEach(tableName => {
                count += orderMatrix[itemName].pendingByTable[tableName] || 0;
            });
        });

        // Contar items de celdas seleccionadas
        selectedCells.forEach(cellKey => {
            const [itemName, tableName] = cellKey.split('-');
            count += orderMatrix[itemName].pendingByTable[tableName] || 0;
        });

        return count;
    };

    const isCellSelected = (item, table) => selectedCells.has(`${item}-${table}`);
    const isRowSelected = (item) => selectedRows.has(item);

    return (
        <div className="flex flex-col h-full">
            {(selectedRows.size > 0 || selectedCells.size > 0) && (
                <div className="sticky top-0 z-40 mb-2">
                    <button
                        onClick={() => setShowConfirmDialog(true)}  // Cambiar aquí
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        更新 ({getSelectedPendingCount()}イヤリング)
                    </button>
                </div>
            )}
            <div className="m-2 bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 w-full h-full max-h-[calc(100vh-6rem)]">
                    <div className="overflow-auto h-full touch-pan-x touch-pan-y">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-20 bg-white">
                                <tr>
                                    <th className="w-[300px] min-w-[300px] max-w-[300px] py-3 px-4 bg-gray-50 text-left font-bold text-gray-800 border-b border-gray-200 sticky left-0 z-30 bg-gray-200">
                                        メニュー項目
                                    </th>
                                    <th className="w-[100px] min-w-[100px] max-w-[100px] py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200 sticky left-[300px] z-30 bg-gray-200">
                                        合計
                                    </th>
                                    {uniqueTables.map(table => (
                                        <th key={table}
                                            className="w-[100px] min-w-[100px] max-w-[100px] py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200">
                                            {table}
                                        </th>
                                    ))}
                                    {/* Columna fantasma que se expande */}
                                    <th className="w-full bg-gray-50 border-b border-gray-200"></th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {uniqueItems.map((item, idx) => {
                                    const hasPendingItems = Object.values(orderMatrix[item].pendingByTable).some(count => count > 0);
                                    return (
                                        <tr key={item}
                                            className={`${hasPendingItems ? 'cursor-pointer' : 'cursor-not-allowed'} 
                                                ${isRowSelected(item) ? 'bg-yellow-200' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} 
                                                hover:bg-gray-100 transition-colors`}
                                            onClick={() => hasPendingItems && toggleRowSelection(item)}>
                                            <td className={`w-[300px] min-w-[300px] max-w-[300px] py-3 px-4 border-b border-gray-200 font-medium text-gray-700 whitespace-nowrap sticky left-0 z-10
                                                ${isRowSelected(item) ? 'bg-yellow-200' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                {item}
                                            </td>
                                            <td className={`w-[100px] min-w-[100px] max-w-[100px] py-3 px-4 text-center border-b border-gray-200 sticky left-[300px] z-10
                                                ${isRowSelected(item) ? 'bg-yellow-200' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-green-500 rounded-full">
                                                    {orderMatrix[item].totals}
                                                </span>
                                            </td>
                                            {uniqueTables.map(table => {
                                                const quantity = orderMatrix[item].byTable[table] || 0;
                                                const pendingQuantity = orderMatrix[item].pendingByTable[table] || 0;
                                                return (
                                                    <td key={`${item}-${table}`}
                                                        className={`w-[100px] min-w-[100px] max-w-[100px] py-3 px-4 text-center border-b border-gray-200
                                                            ${isCellSelected(item, table) || isRowSelected(item) ? 'bg-yellow-200' : ''} 
                                                            ${pendingQuantity > 0 ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            pendingQuantity > 0 && toggleCellSelection(item, table, pendingQuantity);
                                                        }}>
                                                        {quantity > 0 && (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={`inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-white rounded-full
                                                                    ${pendingQuantity > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}>
                                                                    {quantity}
                                                                </span>
                                                                {pendingQuantity < quantity && pendingQuantity > 0 && (
                                                                    <span className="text-xs text-orange-500 font-medium">
                                                                        ({pendingQuantity} pend.)
                                                                    </span>
                                                                )}
                                                                {pendingQuantity === 0 && (
                                                                    <span className="text-xs text-green-500 font-medium">
                                                                        (Completado)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            {/* Celda fantasma que se expande */}
                                            <td className={`border-b border-gray-200 ${isRowSelected(item) ? 'bg-yellow-200' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* Modal de confirmación */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確認</AlertDialogTitle>
                        <AlertDialogDescription>
                            選択したアイテム ({getSelectedPendingCount()} 点) を更新してもよろしいですか？
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
                            キャンセル
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>
                            更新する
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <style>{`
                /* Estilos generales para scrollbars */
                .overflow-auto {
                    scrollbar-width: thin;
                    scrollbar-color: #9CA3AF #F3F4F6;
                    -webkit-overflow-scrolling: touch;
                }

                /* Estilos para Chrome, Edge, y Safari */
                .overflow-auto::-webkit-scrollbar {
                    width: 12px;
                    height: 12px;
                    display: block;
                }

                .overflow-auto::-webkit-scrollbar-track {
                    background: #F3F4F6;
                    border-radius: 6px;
                }

                .overflow-auto::-webkit-scrollbar-thumb {
                    background-color: #9CA3AF;
                    border-radius: 6px;
                    border: 3px solid #F3F4F6;
                }

                .overflow-auto::-webkit-scrollbar-thumb:hover {
                    background-color: #6B7280;
                }

                .overflow-auto::-webkit-scrollbar-corner {
                    background: #F3F4F6;
                }

                /* Asegura que el scroll sea visible en dispositivos táctiles */
                @media (hover: none) and (pointer: coarse) {
                    .overflow-auto::-webkit-scrollbar {
                        width: 6px;
                        height: 6px;
                    }
                    
                    .overflow-auto::-webkit-scrollbar-thumb {
                        background-color: rgba(156, 163, 175, 0.7);
                        border: 1px solid #F3F4F6;
                    }
                }
            `}</style>
        </div>
    );
};

export default OrderTablet;