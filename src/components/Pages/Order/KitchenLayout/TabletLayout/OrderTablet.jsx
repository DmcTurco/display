import React, { useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import '@/assets/styles/marquee.css';
import '@/assets/styles/scrollingText.css';


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
        const items = new Set();
        const tables = new Set();
        const matrix = {};
        const itemsMap = {};

        // Mapeo para registrar las relaciones padre-hijo
        const parentChildRelations = {};

        // Para agrupar ítems idénticos (mismo tipo de ítem)
        const itemTypeToGroupKey = {};

        // Primera pasada: identificar relaciones padre-hijo y crear mapeo
        orders.forEach(order => {
            const itemsWithPid = order.items?.filter(item => item.pid) || [];

            // Registrar relaciones padre-hijo
            itemsWithPid.forEach(childItem => {
                if (!parentChildRelations[childItem.pid]) {
                    parentChildRelations[childItem.pid] = new Set();
                }
                parentChildRelations[childItem.pid].add(childItem.uid);
            });
        });

        // Segunda pasada: procesar los ítems
        orders.forEach(order => {
            const tableName = order.table_name || 'Sin Mesa';
            tables.add(tableName);

            // Identificar relaciones padre-hijo
            const itemsWithPid = order.items?.filter(item => item.pid) || [];
            const parentUids = [...new Set(itemsWithPid.map(item => item.pid))];

            // Identificar padres activos (con hijos sin cocinar)
            const activeParentUids = parentUids.filter(parentUid => {
                const children = order.items?.filter(item =>
                    item.pid === parentUid && item.kitchen_status !== 1
                );
                return children.length > 0;
            });

            order.items?.forEach(item => {
                // Aplicamos la lógica de filtrado
                const shouldProcess =
                    (activeParentUids.includes(item.uid)) || // Es un padre con hijos sin cocinar
                    (!item.pid && item.kitchen_status !== 1) || // Es un ítem normal no cocinado
                    (item.pid && item.kitchen_status !== 1); // Es un hijo no cocinado

                if (shouldProcess) {
                    const isParent = parentUids.includes(item.uid);
                    const isChild = Boolean(item.pid);

                    // Determinar una clave que identifique el tipo de ítem
                    let itemTypeKey;

                    if (isParent) {
                        // Para padres, usamos su code o id o cualquier identificador único de tipo
                        itemTypeKey = `PARENT_${item.code || item.menu_id || item.name}`;
                    } else if (isChild) {
                        // Para hijos, usamos su code + parentCode
                        const parentItem = order.items?.find(parentItem => parentItem.uid === item.pid);
                        const parentCode = parentItem ? (parentItem.code || parentItem.menu_id || parentItem.name) : 'unknown';
                        itemTypeKey = `CHILD_${item.code || item.menu_id || item.name}_OF_${parentCode}`;
                    } else {
                        // Ítems normales
                        itemTypeKey = `NORMAL_${item.code || item.menu_id || item.name}`;
                    }

                    // Crear una clave de grupo para este tipo de ítem si no existe
                    if (!itemTypeToGroupKey[itemTypeKey]) {
                        // Generar una clave única para este grupo (podemos usar el primer UID que encontremos)
                        itemTypeToGroupKey[itemTypeKey] = item.uid;
                    }

                    // Usar la clave de grupo asignada a este tipo de ítem
                    const groupKey = itemTypeToGroupKey[itemTypeKey];

                    // Añadir a items
                    items.add(groupKey);

                    // Enriquecer el ítem
                    const enrichedItem = {
                        ...item,
                        isParent,
                        isChild,
                        groupKey,
                        parentUid: isChild ? item.pid : null,
                        itemTypeKey // Guardamos el tipo para referencia
                    };

                    // Almacenar en itemsMap
                    if (!itemsMap[groupKey]) {
                        itemsMap[groupKey] = {};
                    }
                    if (!itemsMap[groupKey][tableName]) {
                        itemsMap[groupKey][tableName] = [];
                    }
                    itemsMap[groupKey][tableName].push(enrichedItem);

                    // Crear o actualizar la matriz
                    if (!matrix[groupKey]) {
                        matrix[groupKey] = {
                            totals: 0,
                            byTable: {},
                            pendingByTable: {},
                            isParent,
                            isChild,
                            displayName: item.name,
                            uid: item.uid,
                            originalUids: new Set([item.uid]), // Para seguimiento de todos los UIDs
                            parentUid: isChild ? item.pid : null,
                            itemTypeKey
                        };
                    } else {
                        // Agregar este UID al conjunto de UIDs originales
                        matrix[groupKey].originalUids.add(item.uid);
                    }

                    if (!matrix[groupKey].byTable[tableName]) {
                        matrix[groupKey].byTable[tableName] = 0;
                        matrix[groupKey].pendingByTable[tableName] = 0;
                    }

                    // Actualizar conteos
                    matrix[groupKey].byTable[tableName] += item.quantity;
                    matrix[groupKey].pendingByTable[tableName] += item.quantity;
                    matrix[groupKey].totals += item.quantity;
                }
            });
        });

        // Filtrar ítems sin pendientes
        const filteredItems = Array.from(items).filter(item =>
            matrix[item] && matrix[item].totals > 0
        );

        // Construir mapa de relaciones para la lógica de selección
        const parentToChildrenMap = {};
        filteredItems.forEach(groupKey => {
            if (matrix[groupKey].isParent) {
                // Para cada padre, encontrar todos sus hijos agrupados
                parentToChildrenMap[groupKey] = filteredItems.filter(childKey =>
                    matrix[childKey].isChild &&
                    matrix[childKey].parentUid &&
                    matrix[groupKey].originalUids.has(matrix[childKey].parentUid)
                );
            }
        });

        // Ordenar los ítems para mantener la jerarquía correcta
        // 1. Primero ordenamos los padres
        // 2. Generamos una nueva lista ordenada
        const sortedItems = [];
        const parentItems = filteredItems.filter(item => matrix[item].isParent);
        const standaloneItems = filteredItems.filter(item => !matrix[item].isParent && !matrix[item].isChild);

        // Primero añadimos todos los padres con sus hijos
        parentItems.forEach(parentKey => {
            // Añadir el padre
            sortedItems.push(parentKey);

            // Añadir todos sus hijos inmediatamente después
            if (parentToChildrenMap[parentKey]) {
                parentToChildrenMap[parentKey].forEach(childKey => {
                    sortedItems.push(childKey);
                });
            }
        });

        // Finalmente añadimos los ítems independientes
        standaloneItems.forEach(itemKey => {
            // Verificar que no lo hayamos añadido ya
            if (!sortedItems.includes(itemKey)) {
                sortedItems.push(itemKey);
            }
        });

        return {
            uniqueItems: sortedItems,
            uniqueTables: Array.from(tables).sort(),
            orderMatrix: matrix,
            itemsMap,
            parentToChildrenMap,
            parentChildRelations
        };
    }, [orders]);

    const [selectedCells, setSelectedCells] = useState(new Set());
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [selectedColumns, setSelectedColumns] = useState(new Set());

    const [mode2SelectedRows, setMode2SelectedRows] = useState(new Set());
    const [mode2SelectedCells, setMode2SelectedCells] = useState(new Set());
    const [mode2SelectedColumns, setMode2SelectedColumns] = useState(new Set());

    const lastColumnTapRef = useRef({});
    const columnTapTimeoutRef = useRef({});
    const DOUBLE_TAP_DELAY = 300;

    const toggleColumnSelection = (table) => {

        // const selectionMode = config.selectionMode || "1";

        if (selectionMode === "2") {
            const now = Date.now(); // Añadir esta línea
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
                    // Si ya estaba seleccionada, deseleccionar
                    if (prev.has(table)) {
                        // Creamos un nuevo Set vacío para deseleccionar
                        setSelectedCells(new Set());
                        return new Set(); // Retornar Set vacío para deseleccionar
                    } else {
                        // Seleccionar la columna
                        const newSet = new Set();
                        newSet.add(table);
                        
                        // Seleccionar todas las celdas con items pendientes en esta columna
                        setSelectedCells(prevCells => {
                            const newCells = new Set();
                            uniqueItems.forEach(groupKey => {
                                const pendingQuantity = orderMatrix[groupKey].pendingByTable[table] || 0;
                                if (pendingQuantity > 0) {
                                    newCells.add(`${groupKey}-${table}`);
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
            return; // Importante: detener la ejecución aquí para que no ejecute el código del modo 1
        }

        setSelectedColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(table)) {
                // Deseleccionar la columna
                newSet.delete(table);
                // Limpiar las celdas de esta columna
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
                // Seleccionar la columna
                newSet.add(table);
                // Seleccionar todas las celdas con items pendientes en esta columna
                uniqueItems.forEach(groupKey => {
                    const pendingQuantity = orderMatrix[groupKey].pendingByTable[table] || 0;
                    if (pendingQuantity > 0) {
                        setSelectedCells(prevCells => {
                            const newCells = new Set(prevCells);
                            newCells.add(`${groupKey}-${table}`);
                            return newCells;
                        });
                    }
                });
            }
            return newSet;
        });
    };

    const lastRowTapRef = useRef({});
    const rowTapTimeoutRef = useRef({});

    const toggleRowSelection = (groupKey) => {

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

        // Obtener el modo de selección del localStorage
        // const selectionMode = config.selectionMode || "1";

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
            // Recolectar todos los UIDs a actualizar
            const uidsToUpdate = new Set();
            const parentStatuses = new Map(); // Para rastrear el estado de los padres
            const parentChildMap = new Map(); // Mapa de padres a sus hijos

            // Recopilar todos los hijos por cada padre
            orders.forEach(order => {
                order.items?.forEach(item => {
                    if (item.pid) {
                        if (!parentChildMap.has(item.pid)) {
                            parentChildMap.set(item.pid, []);
                        }
                        parentChildMap.get(item.pid).push(item);
                    }
                });
            });

            // Procesar según el caso de actualización
            if (specificItems) {
                // Actualizaciones específicas (doble toque)
                switch (specificItems.type) {
                    case 'column': {
                        const { table } = specificItems;
                        const itemsToUpdate = uniqueItems.filter(groupKey =>
                            (orderMatrix[groupKey].pendingByTable[table] || 0) > 0
                        );

                        itemsToUpdate.forEach(groupKey => {
                            if (orderMatrix[groupKey] && orderMatrix[groupKey].originalUids) {
                                orderMatrix[groupKey].originalUids.forEach(uid => {
                                    orders.forEach(order => {
                                        if (order.table_name === table || (!order.table_name && table === 'Sin Mesa')) {
                                            const item = order.items?.find(item => item.uid === uid && item.kitchen_status !== 1);
                                            if (item) {
                                                // Añadir el ítem a la lista de actualización
                                                uidsToUpdate.add(item.id);

                                                // Si es un padre, añadir todos sus hijos
                                                if (parentChildMap.has(item.uid)) {
                                                    parentChildMap.get(item.uid).forEach(child => {
                                                        if (child.kitchen_status !== 1) {
                                                            uidsToUpdate.add(child.id);
                                                        }
                                                    });
                                                }

                                                // Si es un hijo, registrar para verificar si el padre debe actualizarse
                                                if (item.pid) {
                                                    if (!parentStatuses.has(item.pid)) {
                                                        const siblings = parentChildMap.get(item.pid) || [];
                                                        const pendingSiblings = siblings.filter(sibling => sibling.kitchen_status !== 1);

                                                        parentStatuses.set(item.pid, {
                                                            parentItem: order.items?.find(i => i.uid === item.pid),
                                                            pendingSiblings: pendingSiblings,
                                                            selectedSiblings: new Set()
                                                        });
                                                    }

                                                    const parentStatus = parentStatuses.get(item.pid);
                                                    if (parentStatus) {
                                                        parentStatus.selectedSiblings.add(item.id);
                                                    }
                                                }
                                            }
                                        }
                                    });
                                });
                            }
                        });
                        break;
                    }

                    case 'row': {
                        const { groupKey } = specificItems;

                        if (orderMatrix[groupKey] && orderMatrix[groupKey].originalUids) {
                            orderMatrix[groupKey].originalUids.forEach(uid => {
                                orders.forEach(order => {
                                    const item = order.items?.find(item => item.uid === uid && item.kitchen_status !== 1);
                                    if (item) {
                                        // Añadir el ítem a la lista de actualización
                                        uidsToUpdate.add(item.id);

                                        // Si es un padre, añadir todos sus hijos
                                        if (parentChildMap.has(item.uid)) {
                                            parentChildMap.get(item.uid).forEach(child => {
                                                if (child.kitchen_status !== 1) {
                                                    uidsToUpdate.add(child.id);
                                                }
                                            });
                                        }

                                        // Si es un hijo, registrar para verificar si el padre debe actualizarse
                                        if (item.pid) {
                                            if (!parentStatuses.has(item.pid)) {
                                                const siblings = parentChildMap.get(item.pid) || [];
                                                const pendingSiblings = siblings.filter(sibling => sibling.kitchen_status !== 1);

                                                parentStatuses.set(item.pid, {
                                                    parentItem: order.items?.find(i => i.uid === item.pid),
                                                    pendingSiblings: pendingSiblings,
                                                    selectedSiblings: new Set()
                                                });
                                            }

                                            const parentStatus = parentStatuses.get(item.pid);
                                            if (parentStatus) {
                                                parentStatus.selectedSiblings.add(item.id);
                                            }
                                        }
                                    }
                                });
                            });
                        }
                        break;
                    }

                    case 'cell': {
                        const { groupKey, table } = specificItems;

                        if (orderMatrix[groupKey] && orderMatrix[groupKey].originalUids) {
                            orderMatrix[groupKey].originalUids.forEach(uid => {
                                orders.forEach(order => {
                                    if (order.table_name === table || (!order.table_name && table === 'Sin Mesa')) {
                                        const item = order.items?.find(item => item.uid === uid && item.kitchen_status !== 1);
                                        if (item) {
                                            // Añadir el ítem a la lista de actualización
                                            uidsToUpdate.add(item.id);

                                            // Si es un padre, añadir todos sus hijos
                                            if (parentChildMap.has(item.uid)) {
                                                parentChildMap.get(item.uid).forEach(child => {
                                                    if (child.kitchen_status !== 1) {
                                                        uidsToUpdate.add(child.id);
                                                    }
                                                });
                                            }

                                            // Si es un hijo, registrar para verificar si el padre debe actualizarse
                                            if (item.pid) {
                                                if (!parentStatuses.has(item.pid)) {
                                                    const siblings = parentChildMap.get(item.pid) || [];
                                                    const pendingSiblings = siblings.filter(sibling => sibling.kitchen_status !== 1);

                                                    parentStatuses.set(item.pid, {
                                                        parentItem: order.items?.find(i => i.uid === item.pid),
                                                        pendingSiblings: pendingSiblings,
                                                        selectedSiblings: new Set()
                                                    });
                                                }

                                                const parentStatus = parentStatuses.get(item.pid);
                                                if (parentStatus) {
                                                    parentStatus.selectedSiblings.add(item.id);
                                                }
                                            }
                                        }
                                    }
                                });
                            });
                        }
                        break;
                    }
                }
            }
            else {
                // Actualización de selección múltiple (modo 1)

                // Procesar filas seleccionadas
                selectedRows.forEach(groupKey => {
                    if (orderMatrix[groupKey] && orderMatrix[groupKey].originalUids) {
                        orderMatrix[groupKey].originalUids.forEach(uid => {
                            orders.forEach(order => {
                                const item = order.items?.find(item => item.uid === uid && item.kitchen_status !== 1);
                                if (item) {
                                    // Añadir el ítem a la lista de actualización
                                    uidsToUpdate.add(item.id);

                                    // Si es un padre, añadir todos sus hijos
                                    if (parentChildMap.has(item.uid)) {
                                        parentChildMap.get(item.uid).forEach(child => {
                                            if (child.kitchen_status !== 1) {
                                                uidsToUpdate.add(child.id);
                                            }
                                        });
                                    }

                                    // Si es un hijo, registrar para verificar si el padre debe actualizarse
                                    if (item.pid) {
                                        if (!parentStatuses.has(item.pid)) {
                                            // Encontrar todos los hermanos
                                            const siblings = parentChildMap.get(item.pid) || [];
                                            const pendingSiblings = siblings.filter(sibling => sibling.kitchen_status !== 1);

                                            parentStatuses.set(item.pid, {
                                                parentItem: order.items?.find(i => i.uid === item.pid),
                                                pendingSiblings: pendingSiblings,
                                                selectedSiblings: new Set()
                                            });
                                        }

                                        // Añadir este hijo a la lista de seleccionados para este padre
                                        const parentStatus = parentStatuses.get(item.pid);
                                        if (parentStatus) {
                                            parentStatus.selectedSiblings.add(item.id);
                                        }
                                    }
                                }
                            });
                        });
                    }
                });

                // Procesar celdas seleccionadas
                selectedCells.forEach(cellKey => {
                    const [groupKey, tableName] = cellKey.split('-');

                    if (orderMatrix[groupKey] && orderMatrix[groupKey].originalUids) {
                        orderMatrix[groupKey].originalUids.forEach(uid => {
                            orders.forEach(order => {
                                if (order.table_name === tableName || (!order.table_name && tableName === 'Sin Mesa')) {
                                    const item = order.items?.find(item => item.uid === uid && item.kitchen_status !== 1);
                                    if (item) {
                                        // Añadir el ítem a la lista de actualización
                                        uidsToUpdate.add(item.id);

                                        // Si es un padre, añadir todos sus hijos
                                        if (parentChildMap.has(item.uid)) {
                                            parentChildMap.get(item.uid).forEach(child => {
                                                if (child.kitchen_status !== 1) {
                                                    uidsToUpdate.add(child.id);
                                                }
                                            });
                                        }

                                        // Si es un hijo, registrar para verificar si el padre debe actualizarse
                                        if (item.pid) {
                                            if (!parentStatuses.has(item.pid)) {
                                                // Encontrar todos los hermanos
                                                const siblings = parentChildMap.get(item.pid) || [];
                                                const pendingSiblings = siblings.filter(sibling => sibling.kitchen_status !== 1);

                                                parentStatuses.set(item.pid, {
                                                    parentItem: order.items?.find(i => i.uid === item.pid),
                                                    pendingSiblings: pendingSiblings,
                                                    selectedSiblings: new Set()
                                                });
                                            }

                                            // Añadir este hijo a la lista de seleccionados para este padre
                                            const parentStatus = parentStatuses.get(item.pid);
                                            if (parentStatus) {
                                                parentStatus.selectedSiblings.add(item.id);
                                            }
                                        }
                                    }
                                }
                            });
                        });
                    }
                });
            }

            // Verificar qué padres deben actualizarse automáticamente
            parentStatuses.forEach((status, parentUid) => {
                // Si todos los hijos pendientes están seleccionados para actualizar
                const allPendingSelected = status.pendingSiblings.every(sibling =>
                    sibling.kitchen_status === 1 || status.selectedSiblings.has(sibling.id) || uidsToUpdate.has(sibling.id)
                );

                if (allPendingSelected && status.parentItem && status.parentItem.kitchen_status !== 1) {
                    // Si todos los hijos pendientes serán actualizados, añadir el padre
                    uidsToUpdate.add(status.parentItem.id);
                }
            });

            // Realizar las actualizaciones
            if (uidsToUpdate.size > 0) {
                const updatePromises = Array.from(uidsToUpdate).map(id =>
                    updateKitchenStatus(id, 1, kitchen_cd)
                );

                await Promise.all(updatePromises);
            }

            // Limpiar selecciones solo si no son ítems específicos
            if (!specificItems) {
                setSelectedRows(new Set());
                setSelectedCells(new Set());
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
                (selectionMode !== "2") &&(
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
                                    const displayName = orderMatrix[groupKey].displayName;

                                    return (
                                        <tr key={groupKey}
                                            className={`${hasPendingItems ? 'cursor-pointer' : 'cursor-not-allowed'}
                                                ${isRowSelected(groupKey) ? 'bg-yellow-300' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}
                                                transition-colors text-3xl`}
                                            onClick={() => hasPendingItems && toggleRowSelection(groupKey)}>
                                            <td className={`w-[350px] min-w-[300px] max-w-[300px] py-3 px-4 border-b border-gray-200 font-medium text-gray-700 whitespace-nowrap sticky left-0 z-10 text-3xl
                                                ${isRowSelected(groupKey) ? 'bg-yellow-300' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                <div className={`flex items-center ${isChild ? 'pl-4' : ''}`}>
                                                    {isChild && (
                                                        <div className="w-2 h-px bg-gray-300 mr-3"></div>
                                                    )}
                                                    <ScrollingText text={displayName} />
                                                </div>
                                            </td>
                                            <td className={`w-[100px] min-w-[100px] max-w-[100px] py-3 px-4 text-center border-b border-gray-200 sticky left-[300px] z-10
                                                ${isRowSelected(groupKey) ? 'bg-yellow-300' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                <span className="inline-flex items-center justify-center text-5xl font-medium text-red-500">
                                                    {orderMatrix[groupKey].totals}
                                                </span>
                                            </td>
                                            {uniqueTables.map(table => {
                                                const quantity = orderMatrix[groupKey].byTable[table] || 0;
                                                const pendingQuantity = orderMatrix[groupKey].pendingByTable[table] || 0;
                                                return (
                                                    <td key={`${groupKey}-${table}`}
                                                        className={`w-[100px] min-w-[100px] max-w-[100px] py-3 px-4 text-center border-b border-gray-200
                                                        ${isCellSelected(groupKey, table) || isRowSelected(groupKey) ? 'bg-yellow-300' : ''}
                                                        ${pendingQuantity > 0 ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            pendingQuantity > 0 && toggleCellSelection(groupKey, table, pendingQuantity);
                                                        }}>
                                                        {quantity > 0 && (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={`inline-flex items-center justify-center text-5xl font-medium text-black-500
                                                                    ${pendingQuantity > 0 ? '' : 'bg-gray-400'}`}>
                                                                    {quantity}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            {/* Celda fantasma que se expande */}
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