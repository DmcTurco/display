import React, { useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import '@/assets/styles/marquee.css';
import '@/assets/styles/scrollingText.css';
import { processOrdersAsMatrix, updateSelectedItems } from '@/js/itemSelectionHelpers';
import { Lock } from 'lucide-react';


const ScrollingText = ({ text }) => {
    const width = getTextWidth(text, "30px");
    const needsScroll = width > 300;

    if (!needsScroll) {
        return <div className="text-3xl">{text}</div>;
    }

    return (
        <div className="relative w-full overflow-hidden">
            <div className="marquee-container whitespace-nowrap">
                <span className="animate-scroll inline-block">
                    {text}
                    <span className="mx-2"></span>
                    {text}
                    <span className="mx-2"></span>
                    {text}
                </span>
            </div>
        </div>
    );
};

const getTextWidth = (text) => {
    const span = document.createElement("span");
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    span.style.whiteSpace = "nowrap";
    span.style.fontSize = "30px";
    span.textContent = text;
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);
    return width;
}

const OrderTablet = ({ orders, updateKitchenStatus }) => {
    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    const selectionMode = config.selectionMode || "1";
    const kitchen_cd = config.cd;
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Actualización del useMemo para el conteo separado de ítems normales e hijos
    // Actualización del useMemo para agrupar correctamente padres e hijos usando UIDs
    const { uniqueItems, uniqueTables, orderMatrix, itemsMap, parentToChildrenMap, parentChildRelations } = useMemo(() => {
        return processOrdersAsMatrix(orders);
    }, [orders]);

    const [selectedCells, setSelectedCells] = useState(new Set());
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [selectedColumns, setSelectedColumns] = useState(new Set());

    const lastColumnTapRef = useRef({});
    const columnTapTimeoutRef = useRef({});
    const DOUBLE_TAP_DELAY = 300;

    const toggleColumnSelection = (table) => {
        if (selectionMode === "2") {
            const now = Date.now();
            const columnId = table;

            if (now - (lastColumnTapRef.current[columnId] || 0) < DOUBLE_TAP_DELAY) {
                clearTimeout(columnTapTimeoutRef.current[columnId]);
                handleUpdate({
                    type: 'column',
                    table
                });
                setSelectedColumns(new Set());
                setSelectedCells(new Set());
            } else {
                setSelectedColumns(prev => {
                    if (prev.has(table)) {
                        setSelectedCells(new Set());
                        return new Set();
                    } else {
                        const newSet = new Set();
                        newSet.add(table);

                        setSelectedCells(prevCells => {
                            const newCells = new Set();
                            uniqueItems.forEach(groupKey => {
                                // 🔥 Excluir padres prestados
                                if (!orderMatrix[groupKey].isDisabled) {
                                    const pendingQuantity = orderMatrix[groupKey].pendingByTable[table] || 0;
                                    if (pendingQuantity > 0) {
                                        newCells.add(`${groupKey}-${table}`);
                                    }
                                }
                            });
                            return newCells;
                        });

                        setSelectedRows(new Set());
                        return newSet;
                    }
                });
            }
            lastColumnTapRef.current[columnId] = now;
            return;
        }

        setSelectedColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(table)) {
                newSet.delete(table);
                setSelectedCells(prevCells => {
                    const newCells = new Set(prevCells);
                    Array.from(prevCells).forEach(cellKey => {
                        if (cellKey.endsWith(`-${table}`)) {
                            newCells.delete(cellKey);
                        }
                    });
                    return newCells;
                });
            } else {
                newSet.add(table);
                uniqueItems.forEach(groupKey => {
                    // 🔥 Excluir padres prestados
                    if (!orderMatrix[groupKey].isDisabled) {
                        const pendingQuantity = orderMatrix[groupKey].pendingByTable[table] || 0;
                        if (pendingQuantity > 0) {
                            setSelectedCells(prevCells => {
                                const newCells = new Set(prevCells);
                                newCells.add(`${groupKey}-${table}`);
                                return newCells;
                            });
                        }
                    }
                });
            }
            return newSet;
        });
    };

    const lastRowTapRef = useRef({});
    const rowTapTimeoutRef = useRef({});

    const toggleRowSelection = (groupKey) => {
        if (orderMatrix[groupKey].isDisabled) {
            return;
        }

        // const selectionMode = config.selectionMode || "1";

        if (selectionMode === "2") {

            const now = Date.now();
            const rowId = groupKey; // O simplemente usa groupKey directamente

            if (now - (lastRowTapRef.current[rowId] || 0) < DOUBLE_TAP_DELAY) {
                clearTimeout(rowTapTimeoutRef.current[rowId]);
                handleUpdate({
                    type: 'row',
                    groupKey
                });
                setSelectedRows(new Set());
                setSelectedCells(new Set());
            } else {
                // // Primer toque - solo lo registramos
                // if (rowTapTimeoutRef.current[rowId]) {
                //     clearTimeout(rowTapTimeoutRef.current[rowId]);
                // }

                // rowTapTimeoutRef.current[rowId] = setTimeout(() => {
                //     // Opcional: acción para toque simple
                //     console.log("Toque simple en fila:", groupKey);
                // }, 250);
                setSelectedRows(prev => {
                    // Si ya estaba seleccionada, deseleccionar
                    if (prev.has(groupKey)) {
                        return new Set(); // Retornar Set vacío
                    } else {
                        // Seleccionar el ítem
                        const newSelected = new Set();
                        newSelected.add(groupKey);

                        // Si es un padre, seleccionar todos sus hijos
                        if (orderMatrix[groupKey].isParent && parentToChildrenMap[groupKey]) {
                            parentToChildrenMap[groupKey].forEach(childKey => {
                                newSelected.add(childKey);
                            });
                        }

                        setSelectedColumns(new Set());
                        setSelectedCells(new Set());
                        return newSelected;
                    }
                });
            }
            lastRowTapRef.current[rowId] = now;
            return; // Importante: detener la ejecución aquí para que no ejecute el código del modo 1
        }

        setSelectedRows(prev => {
            const newSelected = new Set(prev);

            if (prev.has(groupKey)) {
                // Deseleccionar el ítem
                newSelected.delete(groupKey);

                // Si es un padre, deseleccionar todos sus hijos
                if (orderMatrix[groupKey].isParent && parentToChildrenMap[groupKey]) {
                    parentToChildrenMap[groupKey].forEach(childKey => {
                        newSelected.delete(childKey);
                    });
                }
            } else {
                // Seleccionar el ítem
                newSelected.add(groupKey);

                // Si es un padre, seleccionar todos sus hijos
                if (orderMatrix[groupKey].isParent && parentToChildrenMap[groupKey]) {
                    parentToChildrenMap[groupKey].forEach(childKey => {
                        newSelected.add(childKey);
                    });
                }
            }

            return newSelected;
        });
    };

    const lastCellTapRef = useRef({});
    const cellTapTimeoutRef = useRef({});

    const toggleCellSelection = (item, table, quantity) => {

        // Si la cantidad es 0, no hacemos nada
        if (quantity <= 0) return;

        if (orderMatrix[item].isDisabled) {
            return;
        }

        if (selectionMode === "2") {

            const now = Date.now();
            const cellId = `${item}-${table}`; // Añadir esta línea
            // Para celdas

            if (now - (lastCellTapRef.current[cellId] || 0) < DOUBLE_TAP_DELAY) {
                clearTimeout(cellTapTimeoutRef.current[cellId]);
                handleUpdate({
                    type: 'cell',
                    groupKey: item,
                    table
                });
                setSelectedCells(new Set());
            } else {
                setSelectedCells(prev => {
                    const cellKey = `${item}-${table}`;

                    // Si ya estaba seleccionada, deseleccionar
                    if (prev.has(cellKey)) {
                        return new Set(); // Retornar Set vacío para deseleccionar
                    } else {
                        // Seleccionar solo esta celda
                        const newSet = new Set();
                        newSet.add(cellKey);

                        setSelectedRows(new Set());
                        setSelectedColumns(new Set());
                        return newSet;
                    }
                });

            }
            lastCellTapRef.current[cellId] = now;
            return; // Importante: detener la ejecución aquí para que no ejecute el código del modo 1
        }

        setSelectedCells(prev => {
            const cellKey = `${item}-${table}`;
            const newSet = new Set(prev);
            if (newSet.has(cellKey)) {
                newSet.delete(cellKey);
            } else {
                // Limpiar selección de fila si existe
                if (selectedRows.has(item)) {
                    setSelectedRows(prev => {
                        const newRows = new Set(prev);
                        newRows.delete(item);
                        return newRows;
                    });
                }
                // Limpiar selección de columna si existe
                if (selectedColumns.has(table)) {
                    setSelectedColumns(prev => {
                        const newCols = new Set(prev);
                        newCols.delete(table);
                        return newCols;
                    });
                }
                newSet.add(cellKey);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        handleUpdate();
        setShowConfirmDialog(false);
    };

    // Actualización de la función handleUpdate para manejar correctamente los UIDs
    const handleUpdate = async (specificItems = null) => {
        if (!kitchen_cd) {
            console.error('No se encontró kitchen_cd en la configuración');
            return;
        }

        try {
            // Recolectar IDs a actualizar según el tipo de selección
            const itemIdsToUpdate = new Set();

            if (specificItems) {
                // Doble tap
                switch (specificItems.type) {
                    case 'column': {
                        const { table } = specificItems;
                        uniqueItems.forEach(groupKey => {
                            if ((orderMatrix[groupKey].pendingByTable[table] || 0) > 0) {
                                // Agregar todos los UIDs de este grupo en esta mesa
                                if (itemsMap[groupKey] && itemsMap[groupKey][table]) {
                                    itemsMap[groupKey][table].forEach(item => {
                                        if (item.kitchen_status !== 1 && !item.isDisabled) {
                                            itemIdsToUpdate.add(item.id);
                                        }
                                    });
                                }
                            }
                        });
                        break;
                    }

                    case 'row': {
                        const { groupKey } = specificItems;
                        // Agregar el item y sus hijos si es padre
                        if (itemsMap[groupKey]) {
                            Object.values(itemsMap[groupKey]).forEach(tableItems => {
                                tableItems.forEach(item => {
                                    if (item.kitchen_status !== 1 && !item.isDisabled) {
                                        itemIdsToUpdate.add(item.id);
                                    }
                                });
                            });
                        }
                        break;
                    }

                    case 'cell': {
                        const { groupKey, table } = specificItems;
                        if (itemsMap[groupKey] && itemsMap[groupKey][table]) {
                            itemsMap[groupKey][table].forEach(item => {
                                if (item.kitchen_status !== 1 && !item.isDisabled) {
                                    itemIdsToUpdate.add(item.id);
                                }
                            });
                        }
                        break;
                    }
                }
            } else {
                // Selección múltiple (modo 1)

                // Procesar filas seleccionadas
                selectedRows.forEach(groupKey => {
                    if (itemsMap[groupKey]) {
                        Object.values(itemsMap[groupKey]).forEach(tableItems => {
                            tableItems.forEach(item => {
                                if (item.kitchen_status !== 1 && !item.isDisabled) {
                                    itemIdsToUpdate.add(item.id);
                                }
                            });
                        });
                    }
                });

                // Procesar celdas seleccionadas
                selectedCells.forEach(cellKey => {
                    const [groupKey, tableName] = cellKey.split('-');
                    if (itemsMap[groupKey] && itemsMap[groupKey][tableName]) {
                        itemsMap[groupKey][tableName].forEach(item => {
                            if (item.kitchen_status !== 1 && !item.isDisabled) {
                                itemIdsToUpdate.add(item.id);
                            }
                        });
                    }
                });
            }

            // 🔥 USAR HELPER para actualizar
            // Convertir a estructura que el helper espera
            const orderGroups = orders.map(order => ({
                items: order.items,
                originalOrder: order
            }));

            await updateSelectedItems({
                selectedItemIds: itemIdsToUpdate,
                orderGroups: orderGroups,
                updateKitchenStatus,
                kitchen_cd,
                targetStatus: 1,
                useAdditionalItems: false, // OrderTablet usa pid/uid
                parentUpdateStrategy: 'check-all-siblings'
            });

            // Limpiar selecciones
            if (!specificItems) {
                setSelectedRows(new Set());
                setSelectedCells(new Set());
                setSelectedColumns(new Set());
                setShowConfirmDialog(false);
            }
        } catch (error) {
            console.error('Error al actualizar el estado:', error);
        }
    };

    const getSelectedPendingCount = () => {
        let count = 0;

        // Contar items de filas seleccionadas
        selectedRows.forEach(itemKey => {
            // Verificar que el ítem exista en orderMatrix
            if (orderMatrix[itemKey]) {
                uniqueTables.forEach(tableName => {
                    // Verificar que pendingByTable exista y tenga el valor de la tabla
                    count += (orderMatrix[itemKey].pendingByTable || {})[tableName] || 0;
                });
            }
        });

        // Contar items de celdas seleccionadas
        selectedCells.forEach(cellKey => {
            const [itemKey, tableName] = cellKey.split('-');
            // Verificar que el ítem exista en orderMatrix y tenga pendingByTable
            if (orderMatrix[itemKey] && orderMatrix[itemKey].pendingByTable) {
                count += orderMatrix[itemKey].pendingByTable[tableName] || 0;
            }
        });

        return count;
    };

    const isCellSelected = (item, table) => selectedCells.has(`${item}-${table}`);
    const isRowSelected = (item) => selectedRows.has(item);
    const isColumnSelected = (table) => selectedColumns.has(table);

    return (
        <div className="flex flex-col h-full">
            {(selectedRows.size > 0 || selectedCells.size > 0) &&
                (selectionMode !== "2") && (
                    <div className="sticky top-0 z-40 mb-2">
                        <button
                            onClick={() => setShowConfirmDialog(true)}  // Cambiar aquí
                            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-3xl"
                        >
                            {/* 更新 ({getSelectedPendingCount()}イヤリング) */}
                            【調理済みにする】
                        </button>
                    </div>
                )}
            <div className="m-2 bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 w-full h-full max-h-[calc(100vh-6rem)]">
                    <div className="overflow-auto h-full touch-pan-x touch-pan-y">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-20 bg-white">
                                <tr>
                                    <th className="w-[350px] min-w-[300px] max-w-[300px] py-3 px-4 bg-gray-200 text-left text-3xl font-bold text-gray-800 border-b border-gray-200 sticky left-0 z-30 ">
                                        メニュー項目
                                    </th>
                                    <th className="w-[100px] min-w-[100px] max-w-[100px] py-3 px-4 bg-gray-200 text-center font-bold text-3xl text-gray-800 border-b border-gray-200 sticky left-[300px] z-30 ">
                                        合計
                                    </th>
                                    {uniqueTables.map(table => (
                                        <th key={table}
                                            onClick={() => toggleColumnSelection(table)}
                                            className={`w-[100px] min-w-[100px] max-w-[100px] py-3 px-4 
                                                bg-gray-200 text-center font-bold text-3xl text-gray-800 
                                                border-b border-gray-200 cursor-pointer  
                                                transition-colors
                                                ${isColumnSelected(table) ? 'bg-yellow-300' : ''}`}>
                                            {table}
                                        </th>
                                    ))}
                                    {/* Columna fantasma que se expande */}
                                    <th className="w-full bg-gray-200 border-b border-gray-200"></th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {uniqueItems.map((groupKey, idx) => {
                                    const hasPendingItems = Object.values(orderMatrix[groupKey].pendingByTable).some(count => count > 0);
                                    const isChild = orderMatrix[groupKey].isChild;
                                    const isDisabled = orderMatrix[groupKey].isDisabled; // 🔥 Padre prestado
                                    const displayName = orderMatrix[groupKey].displayName;

                                    return (
                                        <tr key={groupKey}
                                            className={`${hasPendingItems && !isDisabled ? 'cursor-pointer' : 'cursor-not-allowed'}
                                                ${isRowSelected(groupKey) ? 'bg-yellow-300' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}
                                                transition-colors text-3xl`}
                                            onClick={() => hasPendingItems && !isDisabled && toggleRowSelection(groupKey)}>

                                            {/* 🔥 NOMBRE - Gris si es padre prestado */}
                                            <td className={`w-[350px] min-w-[300px] max-w-[300px] py-3 px-4 border-b border-gray-200 font-medium whitespace-nowrap sticky left-0 z-10 text-3xl
                                                ${isDisabled ? 'text-gray-400' : 'text-gray-700'}
                                                ${isRowSelected(groupKey) ? 'bg-yellow-300' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                <div className={`flex items-center ${isChild ? 'pl-4' : ''}`}>
                                                    {isChild && (
                                                        <div className="w-2 h-px bg-gray-300 mr-3"></div>
                                                    )}
                                                    <ScrollingText text={displayName} />
                                                </div>
                                            </td>

                                            {/* 🔥 COLUMNA TOTAL - Candado si es padre prestado */}
                                            <td className={`w-[100px] min-w-[100px] max-w-[100px] py-3 px-4 text-center border-b border-gray-200 sticky left-[300px] z-10
                                                    ${isRowSelected(groupKey) ? 'bg-yellow-300' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                {isDisabled ? (
                                                    <div className="inline-flex items-center justify-center">
                                                        <Lock className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center text-5xl font-medium text-red-500">
                                                        {orderMatrix[groupKey].totals}
                                                    </span>
                                                )}
                                            </td>

                                            {/* 🔥 CELDAS DE MESA - Candados si es padre prestado */}
                                            {uniqueTables.map(table => {
                                                const quantity = orderMatrix[groupKey].byTable[table] || 0;
                                                const pendingQuantity = orderMatrix[groupKey].pendingByTable[table] || 0;

                                                return (
                                                    <td key={`${groupKey}-${table}`}
                                                        className={`w-[100px] min-w-[100px] max-w-[100px] py-3 px-4 text-center border-b border-gray-200
                                                            ${isCellSelected(groupKey, table) || isRowSelected(groupKey) ? 'bg-yellow-300' : ''}
                                                            ${pendingQuantity > 0 && !isDisabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            !isDisabled && pendingQuantity > 0 && toggleCellSelection(groupKey, table, pendingQuantity);
                                                        }}>
                                                        {isDisabled ? (
                                                            // 🔥 Mostrar candado en lugar de cantidad
                                                            <div className="inline-flex items-center justify-center">
                                                                <Lock className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                        ) : quantity > 0 ? (
                                                            // Mostrar cantidad normal
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={`inline-flex items-center justify-center text-5xl font-medium text-black-500 ${pendingQuantity > 0 ? '' : 'bg-gray-400'}`}>
                                                                    {quantity}
                                                                </span>
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                );
                                            })}

                                            <td className={`border-b border-gray-200 ${isRowSelected(groupKey) ? 'bg-yellow-300' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}></td>
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

        </div>
    );
};

export default OrderTablet;