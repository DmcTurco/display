import React, { useMemo } from 'react';
import _ from 'lodash';

const OrderTablet = ({ orders }) => {
    // Procesar pedidos para agruparlos por item y mesa
    const { uniqueItems, uniqueTables, orderMatrix } = useMemo(() => {
        // Extraer ítems únicos y mesas únicas
        const items = new Set();
        const tables = new Set();
        const matrix = {};

        orders.forEach(order => {
            // Asumiendo que cada orden tiene una propiedad table_name y items
            const tableName = order.table_name || 'Sin Mesa';
            tables.add(tableName);

            order.items?.forEach(item => {
                const itemName = item.name || item.item_name;
                items.add(itemName);

                // Inicializar matriz
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

    return (
        <div className="flex flex-col h-full">
            <div className="m-2 bg-white rounded-lg shadow-lg  overflow-hidden">
                <div className="p-2 w-full h-full">
                    <div className="overflow-auto touch-pan-x touch-pan-y h-full">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-10 bg-white">
                                <tr>
                                    <th className="py-3 px-4 bg-gray-50 text-left font-bold text-gray-800 border-b border-gray-200 min-w-[200px]">
                                        メニュー項目
                                    </th>
                                    <th className="py-3 px-4 bg-gray-50 text-center font-bold text-gray-800 border-b border-gray-200 min-w-[100px]">
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

                            <tbody>
                                {uniqueItems.map((item, idx) => (
                                    <tr key={item}
                                        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                                                      hover:bg-gray-100 transition-colors`}>
                                        <td className="py-3 px-4 border-b border-gray-200 font-medium text-gray-700 whitespace-nowrap">
                                            {item}
                                        </td>
                                        <td className="py-3 px-4 text-center border-b border-gray-200">
                                            <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-green-500 rounded-full">
                                                {orderMatrix[item].totals}
                                            </span>
                                        </td>
                                        {uniqueTables.map(table => {
                                            const quantity = orderMatrix[item].byTable[table] || 0;
                                            return (
                                                <td key={`${item}-${table}`}
                                                    className="py-3 px-4 text-center border-b border-gray-200">
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
        </div>
    );
};

export default OrderTablet;