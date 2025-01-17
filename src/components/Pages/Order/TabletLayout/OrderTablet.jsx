import React, { useMemo, useState } from 'react';
import _ from 'lodash';

const OrderTablet = ({ orders }) => {
    const { uniqueItems, uniqueTables, orderMatrix } = useMemo(() => {
        const items = new Set();
        const tables = new Set();
        const matrix = {};

        orders.forEach(order => {
            const tableName = order.table_name || 'Sin Mesa';
            tables.add(tableName);

            order.items?.forEach(item => {
                const itemName = item.name;
                // console.log(itemName);
                items.add(itemName);

                if (!matrix[itemName]) {
                    matrix[itemName] = {
                        totals: 0,
                        byTable: {}
                    };
                }
                if (!matrix[itemName].byTable[tableName]) {
                    matrix[itemName].byTable[tableName] = 0;
                }
                matrix[itemName].byTable[tableName] += item.quantity;
                matrix[itemName].totals += item.quantity;
            });
        });

        return {
            uniqueItems: Array.from(items),
            uniqueTables: Array.from(tables).sort(),
            orderMatrix: matrix
        };
    }, [orders]);

    const [selectedCells, setSelectedCells] = useState(new Set());
    const [selectedRows, setSelectedRows] = useState(new Set());

    const toggleRowSelection = (item) => {
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

    const isCellSelected = (item, table) => selectedCells.has(`${item}-${table}`);
    const isRowSelected = (item) => selectedRows.has(item);

    return (
        <div className="flex flex-col h-full">
            <div className="m-2 bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 w-full h-full max-h-[calc(100vh-6rem)]">
                    <div className="overflow-auto h-full touch-pan-x touch-pan-y">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-20 bg-white">
                                <tr>
                                    <th className="py-3 px-4 bg-gray-50 text-left font-bold text-gray-800 border-b border-gray-200 min-w-[200px] sticky left-0 z-30 bg-gray-200">
                                        メニュー項目
                                    </th>
                                    <th className="py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200 min-w-[100px] sticky left-[200px] z-30 bg-gray-200">
                                        合計
                                    </th>
                                    {uniqueTables.map(table => (
                                        <th key={table}
                                            className="py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200 min-w-[100px]">
                                            {table}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {uniqueItems.map((item, idx) => (
                                    <tr key={item}
                                        className={`cursor-pointer ${isRowSelected(item) ? 'bg-yellow-200' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} 
                                              hover:bg-gray-100 transition-colors`}
                                        onClick={() => toggleRowSelection(item)}>
                                        <td className={`py-3 px-4 border-b border-gray-200 font-medium text-gray-700 whitespace-nowrap sticky left-0 z-10 ${isRowSelected(item) ? 'bg-yellow-200' : 'bg-white'}`}>
                                            {item}
                                        </td>
                                        <td className={`py-3 px-4 text-center border-b border-gray-200 sticky left-[200px] z-10 ${isRowSelected(item) ? 'bg-yellow-200' : 'bg-white'}`}>
                                            <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-green-500 rounded-full">
                                                {orderMatrix[item].totals}
                                            </span>
                                        </td>
                                        {uniqueTables.map(table => {
                                            const quantity = orderMatrix[item].byTable[table] || 0;
                                            return (
                                                <td key={`${item}-${table}`}
                                                    className={`py-3 px-4 text-center border-b border-gray-200 
                                                        ${isCellSelected(item, table) || isRowSelected(item) ? 'bg-yellow-200' : ''} 
                                                        ${quantity > 0 ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleCellSelection(item, table, quantity);
                                                    }}>
                                                    {quantity > 0 && (
                                                        <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-blue-500 rounded-full">
                                                            {quantity}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

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