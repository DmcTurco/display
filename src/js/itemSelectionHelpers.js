import _ from 'lodash';

/**
 * 🔥 Ordena items en jerarquía padre-hijo
 * @param {Array} items - Items procesados con isParent, isChild
 * @param {boolean} useAdditionalItems - Si usa additionalItems (true) o pid/uid (false)
 * @returns {Array} Items ordenados jerárquicamente
 */
export const getDisplayItemsHierarchy = (items, useAdditionalItems = true) => {
    if (!Array.isArray(items)) {
        console.warn('Items no es un array:', items);
        return [];
    }

    const result = [];
    const processedIds = new Set();

    items.forEach(item => {
        // Solo procesar items que no son hijos (padres o items normales)
        if (!item.isChild && !processedIds.has(item.id)) {

            // 🔥 SIEMPRE agregar el item (sea padre prestado o no)
            result.push(item);
            processedIds.add(item.id);

            // Agregar hijos según el modo
            if (useAdditionalItems) {
                if (item.additionalItems && Array.isArray(item.additionalItems)) {
                    item.additionalItems.forEach(child => {
                        if (!processedIds.has(child.id)) {
                            result.push(child);
                            processedIds.add(child.id);
                        }
                    });
                }
            } else {
                // Filtrar hijos que NO estén deshabilitados
                const children = items.filter(i => i.pid === item.uid);
                children.forEach(child => {
                    if (!processedIds.has(child.id)) {
                        result.push(child);
                        processedIds.add(child.id);
                    }
                });
            }
        }
    });

    return result;
};

/**
 * Obtiene todos los hijos de un item (usando additionalItems)
 */
export const getAllChildren = (item) => {
    if (!item.additionalItems || !Array.isArray(item.additionalItems)) {
        return [];
    }
    return item.additionalItems.filter(child => !child.isDisabled);
};

/**
 * Obtiene todos los hijos de un item por uid/pid (para casos legacy)
 */
export const getAllChildrenByPid = (parentUid, items) => {
    if (!Array.isArray(items)) {
        console.warn('Items no es un array:', items);
        return [];
    }
    return items.filter(item => item.pid === parentUid && !item.isDisabled);
};

/**
 * Obtiene todos los IDs de items de una mesa (incluyendo hijos)
 */
export const getTableItemIds = (tableGroup) => {
    const ids = new Set();

    tableGroup.orders.forEach(order => {
        order.items.forEach(item => {
            // Saltar items deshabilitados
            if (item.isDisabled) return;

            ids.add(item.id);

            // Si tiene hijos, agregarlos
            if (item.additionalItems) {
                item.additionalItems.forEach(child => {
                    if (!child.isDisabled) {
                        ids.add(child.id);
                    }
                });
            }
        });
    });

    return ids;
};

/**
 * Obtiene todos los IDs de items de una orden
 */
export const getOrderItemIds = (order) => {
    const ids = new Set();

    order.items.forEach(item => {
        if (item.isDisabled) return;

        ids.add(item.id);

        if (item.additionalItems) {
            item.additionalItems.forEach(child => {
                if (!child.isDisabled) {
                    ids.add(child.id);
                }
            });
        }
    });

    return ids;
};

/**
 * Obtiene los IDs de un item individual (incluyendo sus hijos)
 */
export const getItemIds = (item) => {
    // Si está deshabilitado, retornar vacío
    if (item.isDisabled) {
        console.warn(`⚠️ Item deshabilitado: ${item.name}`);
        return new Set();
    }

    const ids = new Set([item.id]);

    // Si tiene hijos (additionalItems), agregarlos
    if (item.additionalItems && Array.isArray(item.additionalItems)) {
        item.additionalItems.forEach(child => {
            if (!child.isDisabled) {
                ids.add(child.id);
            }
        });
    }

    return ids;
};

/**
 * Verifica si todos los items están seleccionados
 */
export const areAllItemsSelected = (itemIds, selectedItems) => {
    if (itemIds.size === 0) return false;
    return Array.from(itemIds).every(id => selectedItems.has(id));
};

/**
 * Alterna la selección de un conjunto de items
 */
export const toggleItemSelection = (itemIds, selectedItems) => {
    const newSelection = new Set(selectedItems);
    const allSelected = areAllItemsSelected(itemIds, selectedItems);

    if (allSelected) {
        itemIds.forEach(id => newSelection.delete(id));
    } else {
        itemIds.forEach(id => newSelection.add(id));
    }

    return newSelection;
};

/**
 * 🔥 Alterna la selección de todos los items de una mesa/orden
 * @param {Object} order - Orden con items
 * @param {Set} currentSelection - Set actual de IDs seleccionados
 * @returns {Set} Nuevo Set con la selección actualizada
 */
export const toggleTableSelection = (order, currentSelection) => {
    if (!order || !order.items || !Array.isArray(order.items)) {
        console.warn('⚠️ Orden inválida:', order);
        return new Set(currentSelection);
    }

    const newSet = new Set(currentSelection);

    // Obtener solo items seleccionables (no deshabilitados)
    const selectableItems = order.items.filter(item => !item.isDisabled && !item.isChild);

    if (selectableItems.length === 0) {
        console.warn('⚠️ No hay items seleccionables en esta orden');
        return newSet;
    }

    // Verificar si todos los items seleccionables (y sus hijos) están seleccionados
    const allItemsSelected = selectableItems.every(item => {
        const itemIds = getItemIds(item);
        return Array.from(itemIds).every(id => newSet.has(id));
    });

    // Toggle: si todos están seleccionados → deseleccionar, si no → seleccionar
    selectableItems.forEach(item => {
        const itemIds = getItemIds(item);

        if (allItemsSelected) {
            // Deseleccionar todos
            itemIds.forEach(id => newSet.delete(id));
        } else {
            // Seleccionar todos
            itemIds.forEach(id => newSet.add(id));
        }
    });

    return newSet;
};

/**
 * 🔥 Función unificada para actualizar items con manejo de padres/hijos
 * 
 * @param {Object} params - Parámetros de configuración
 * @param {Set} params.selectedItemIds - IDs de items seleccionados
 * @param {Array} params.orderGroups - Grupos de órdenes (processedOrderGroups o orderItems)
 * @param {Function} params.updateKitchenStatus - Función para actualizar estado
 * @param {string} params.kitchen_cd - Código de cocina
 * @param {number} params.targetStatus - Estado objetivo (1 = preparado/servido, 0 = no preparado/devolver)
 * @param {boolean} params.useAdditionalItems - Si usa additionalItems (true) o pid/uid (false)
 * @param {any} params.extraParam - Parámetro extra opcional para updateKitchenStatus (usado en OrderServing y ServingTimeline handleCancel)
 * @param {string} params.parentUpdateStrategy - Estrategia para actualizar padres cuando se selecciona un hijo:
 *   - 'check-all-siblings': Actualiza padre solo si TODOS los hermanos están listos (ServingTimeline handleUpdate, OrderSwipe con targetStatus=1)
 *   - 'check-selected-siblings': Actualiza padre solo si TODOS los hermanos seleccionados (OrderServing, ServingTimeline handleCancel)
 *   - 'never': Nunca actualiza el padre automáticamente
 */
export const updateSelectedItems = async ({
    selectedItemIds,
    orderGroups,
    updateKitchenStatus,
    kitchen_cd,
    targetStatus = 1,
    useAdditionalItems = true,
    extraParam = null,
    parentUpdateStrategy = 'check-all-siblings'
}) => {
    if (!kitchen_cd) {
        throw new Error('No se encontró kitchen_cd en la configuración');
    }

    const updatePromises = [];

    for (const orderGroup of orderGroups) {
        // Manejar tanto tableGroup.orders como orderItems directos
        const orders = orderGroup.orders || [orderGroup];

        for (const order of orders) {
            // 🔥 Crear un mapa de todos los items disponibles (incluyendo additionalItems)
            const allItemsMap = new Map();

            order.items.forEach(item => {
                allItemsMap.set(item.id, item);

                // Agregar también los additionalItems si existen
                if (item.additionalItems && Array.isArray(item.additionalItems)) {
                    item.additionalItems.forEach(child => {
                        allItemsMap.set(child.id, child);
                    });
                }
            });

            const allItemsArray = Array.from(allItemsMap.values());

            for (const item of order.items) {
                if (!selectedItemIds.has(item.id)) continue;

                // 🔥 Saltar items deshabilitados (padres prestados)
                if (item.isDisabled) {
                    console.log(`⚠️ Saltando padre prestado: ${item.name}`);
                    continue;
                }

                if (item.isParent) {
                    // ============ PADRE ============
                    // Actualizar padre + todos sus hijos
                    const children = useAdditionalItems
                        ? getAllChildren(item)
                        : getAllChildrenByPid(item.uid, allItemsArray);

                    // Actualizar padre
                    const updateArgs = extraParam !== null
                        ? [item.id, targetStatus, kitchen_cd, extraParam]
                        : [item.id, targetStatus, kitchen_cd];
                    updatePromises.push(updateKitchenStatus(...updateArgs));

                    // Actualizar hijos
                    children.forEach(child => {
                        const childArgs = extraParam !== null
                            ? [child.id, targetStatus, kitchen_cd, extraParam]
                            : [child.id, targetStatus, kitchen_cd];
                        updatePromises.push(updateKitchenStatus(...childArgs));
                    });

                } else if (item.isChild) {
                    // ============ HIJO ============
                    // Actualizar hijo primero
                    const updateArgs = extraParam !== null
                        ? [item.id, targetStatus, kitchen_cd, extraParam]
                        : [item.id, targetStatus, kitchen_cd];
                    updatePromises.push(updateKitchenStatus(...updateArgs));

                    // 🔥 Buscar padre en todos los items disponibles
                    const parent = allItemsArray.find(i => i.uid === item.pid);

                    // 🔥 Si el padre NO existe o está deshabilitado, ya terminamos con este hijo
                    if (!parent || parent.isDisabled || parent.isBorrowedParent) {
                        console.log(`ℹ️ Hijo sin padre válido (padre prestado o no existe): ${item.name}`);
                        continue; // No intentar actualizar el padre
                    }

                    // Determinar si actualizar padre según la estrategia
                    let shouldUpdateParent = false;

                    switch (parentUpdateStrategy) {
                        case 'check-all-siblings': {
                            // ServingTimeline handleUpdate, OrderSwipe targetStatus=1
                            // Actualizar padre solo si TODOS los hermanos están listos
                            const siblings = allItemsArray.filter(i => i.pid === item.pid);

                            shouldUpdateParent = siblings.every(sibling =>
                                sibling.kitchen_status === 1 || selectedItemIds.has(sibling.id)
                            );
                            break;
                        }

                        case 'check-selected-siblings': {
                            // OrderServing, ServingTimeline handleCancel
                            // Actualizar padre solo si TODOS los hermanos están siendo seleccionados
                            const allSiblings = allItemsArray.filter(i => i.pid === item.pid);

                            shouldUpdateParent = allSiblings.every(sibling =>
                                selectedItemIds.has(sibling.id)
                            );
                            break;
                        }

                        case 'never':
                            shouldUpdateParent = false;
                            break;
                    }

                    if (shouldUpdateParent) {
                        const parentArgs = extraParam !== null
                            ? [parent.id, targetStatus, kitchen_cd, extraParam]
                            : [parent.id, targetStatus, kitchen_cd];

                        updatePromises.push(updateKitchenStatus(...parentArgs));
                    }

                } else {
                    // ============ ITEM NORMAL ============
                    const updateArgs = extraParam !== null
                        ? [item.id, targetStatus, kitchen_cd, extraParam]
                        : [item.id, targetStatus, kitchen_cd];
                    updatePromises.push(updateKitchenStatus(...updateArgs));
                }
            }

            // 🔥 También procesar items en additionalItems que fueron seleccionados
            for (const item of order.items) {
                if (item.additionalItems && Array.isArray(item.additionalItems)) {
                    for (const child of item.additionalItems) {
                        if (!selectedItemIds.has(child.id)) continue;
                        if (child.isDisabled) continue;

                        // El hijo ya fue procesado arriba si estaba en order.items
                        // Pero si SOLO está en additionalItems, procesarlo aquí
                        const alreadyProcessed = order.items.some(i => i.id === child.id);
                        if (alreadyProcessed) continue;

                        // Actualizar hijo
                        const updateArgs = extraParam !== null
                            ? [child.id, targetStatus, kitchen_cd, extraParam]
                            : [child.id, targetStatus, kitchen_cd];
                        updatePromises.push(updateKitchenStatus(...updateArgs));

                        // Verificar si actualizar padre
                        const parent = item; // El padre es el item actual

                        if (!parent.isDisabled && !parent.isBorrowedParent) {
                            let shouldUpdateParent = false;

                            switch (parentUpdateStrategy) {
                                case 'check-all-siblings': {
                                    const siblings = allItemsArray.filter(i => i.pid === parent.uid);
                                    shouldUpdateParent = siblings.every(sibling =>
                                        sibling.kitchen_status === 1 || selectedItemIds.has(sibling.id)
                                    );
                                    break;
                                }

                                case 'check-selected-siblings': {
                                    const siblings = allItemsArray.filter(i => i.pid === parent.uid);
                                    shouldUpdateParent = siblings.every(sibling =>
                                        selectedItemIds.has(sibling.id)
                                    );
                                    break;
                                }

                                case 'never':
                                    shouldUpdateParent = false;
                                    break;
                            }

                            if (shouldUpdateParent) {
                                const parentArgs = extraParam !== null
                                    ? [parent.id, targetStatus, kitchen_cd, extraParam]
                                    : [parent.id, targetStatus, kitchen_cd];

                                updatePromises.push(updateKitchenStatus(...parentArgs));
                            }
                        }
                    }
                }
            }
        }
    }

    await Promise.all(updatePromises);
};

/**
 * 🔥 Procesa y filtra órdenes con detección de padres/hijos y padres prestados
 * 
 * @param {Array} orders - Array de órdenes sin procesar
 * @param {Object} options - Opciones de procesamiento
 * @param {boolean} options.filterByKitchenStatus - Filtrar por kitchen_status === 1
 * @param {boolean} options.filterByServingStatus - Filtrar por serving_status === 0
 * @param {string} options.sortBy - Campo para ordenar ('record_date' | 'elapsedTime')
 * @param {string} options.sortOrder - Orden ('asc' | 'desc')
 * @param {Function} options.mapOrderFields - Función opcional para mapear campos adicionales de la orden
 * @returns {Array} Órdenes procesadas y ordenadas
 */
export const processOrdersWithHierarchy = (orders, options = {}) => {
    const {
        filterByKitchenStatus = false,
        filterByServingStatus = false,
        filterByServingCompleted = false,
        filterPendingOnly = false,
        sortBy = 'record_date',
        sortOrder = 'asc',
        mapOrderFields = null
    } = options;

    if (!Array.isArray(orders)) {
        console.warn('⚠️ Orders no es un array:', orders);
        return [];
    }

    const processedOrders = orders.map((order) => {
        const itemsWithPid = order.items?.filter(item => item.pid) || [];
        const parentUids = [...new Set(itemsWithPid.map(item => item.pid))];

        const borrowedParentUids = parentUids.filter(parentUid => {
            const parent = order.items?.find(item => item.uid === parentUid);
            return parent?.belongs_to_kitchen === false;
        });

        const activeParentUids = parentUids.filter(parentUid => {
            const children = order.items?.filter(item => {
                if (item.pid !== parentUid) return false;

                let isActive = true;

                if (filterByKitchenStatus) {
                    isActive = isActive && item.kitchen_status === 1;
                }

                if (filterByServingStatus) {
                    isActive = isActive && !(item.kitchen_status === 1 && item.serving_status === 1);
                }

                if (filterByServingCompleted) {
                    isActive = isActive && item.serving_status === 1;
                }

                if (filterPendingOnly) {
                    isActive = isActive && item.kitchen_status !== 1;
                }

                return isActive;
            });

            return children.length > 0;
        });

        const allProcessedItems = order.items?.map(item => {
            const isParent = parentUids.includes(item.uid);
            const isBorrowedParent = borrowedParentUids.includes(item.uid);

            return {
                ...item,
                isParent,
                isChild: Boolean(item.pid),
                isBorrowedParent,
                isDisabled: isBorrowedParent,
            };
        }) || [];

        const processedItems = allProcessedItems
            .filter(item => {
                // 🔥 REGLA: Items que no pertenecen a la cocina
                if (item.belongs_to_kitchen === false) {
                    // Solo permitir si es padre prestado con hijos activos
                    if (activeParentUids.includes(item.uid)) {
                        return true;  // ✅ Padre prestado con hijos → permitir sin más filtros
                    } else {
                        return false;  // ❌ Item suelto → excluir
                    }
                }

                // Padres activos que SÍ pertenecen a la cocina
                if (activeParentUids.includes(item.uid)) {
                    if (filterPendingOnly) {
                        return item.kitchen_status !== 1;
                    }
                    if (filterByKitchenStatus) {
                        return item.kitchen_status === 1;
                    }
                    return true;
                }

                // Items normales
                let include = true;

                if (filterByKitchenStatus) {
                    include = include && item.kitchen_status === 1;
                }

                if (filterByServingStatus) {
                    include = include && item.serving_status === 0;
                }

                if (filterByServingCompleted) {
                    include = include && item.serving_status === 1;
                }

                if (filterPendingOnly) {
                    include = include && item.kitchen_status !== 1;
                }

                if (!include) return false;

                if (item.isChild) {
                    const parentIsPresent = activeParentUids.includes(item.pid);
                    return !parentIsPresent;
                }

                return true;
            })
            .map(item => {
                if (item.isParent) {
                    const children = allProcessedItems.filter(child => {
                        if (child.pid !== item.uid) return false;

                        let include = true;

                        if (filterByKitchenStatus) {
                            include = include && child.kitchen_status === 1;
                        }

                        if (filterByServingStatus) {
                            include = include && !(child.kitchen_status === 1 && child.serving_status === 1);
                        }

                        if (filterByServingCompleted) {
                            include = include && child.serving_status === 1;
                        }

                        if (filterPendingOnly) {
                            include = include && child.kitchen_status !== 1;
                        }

                        return include;
                    });

                    return {
                        ...item,
                        additionalItems: children.map(child => ({
                            ...child,
                            isDisabled: false
                        }))
                    };
                }

                return {
                    ...item,
                    additionalItems: []
                };
            });

        const finalItems = processedItems.filter(item => {
            if (item.isDisabled && item.isParent) {
                const hasVisibleChildren = item.additionalItems && item.additionalItems.length > 0;
                return hasVisibleChildren;
            }
            return true;
        });

        const baseOrderData = {
            table: order.table_name || "Sin Mesa",
            items: finalItems,
            originalOrder: order,
        };

        const mappedFields = mapOrderFields ? mapOrderFields(order) : {};

        return {
            ...baseOrderData,
            ...mappedFields
        };
    }).filter((order) => order.items.length > 0);

    const sorted = _.orderBy(
        processedOrders,
        [sortBy === 'record_date'
            ? (item) => new Date(item.originalOrder.record_date)
            : sortBy],
        [sortOrder]
    );

    return sorted;
};


/**
 * 🔥 Procesa órdenes agrupadas por mesa (para OrderSwipe)
 * 
 * @param {Array} tableGroups - Array de grupos de mesa con órdenes
 * @param {Object} options - Opciones de procesamiento
 * @returns {Array} Grupos de mesa procesados con órdenes y items jerárquicos
 */
export const processTableGroupsWithHierarchy = (tableGroups, options = {}) => {
    const {
        filterByKitchenStatus = false,
        checkPendingItems = true // Solo para OrderSwipe
    } = options;

    if (!Array.isArray(tableGroups)) {
        console.warn('⚠️ TableGroups no es un array:', tableGroups);
        return [];
    }

    return tableGroups
        .map((tableGroup) => {
            const processedOrders = tableGroup.orders
                .map(order => {
                    if (!Array.isArray(order.items) || order.items.length === 0) {
                        return null;
                    }

                    // 🔥 Verificar si la orden tiene items pendientes (solo OrderSwipe)
                    if (checkPendingItems) {
                        const hasPendingItems = order.items.some(item =>
                            !item.isDisabled &&
                            item.belongs_to_kitchen !== false &&
                            item.kitchen_status !== 1
                        );

                        if (!hasPendingItems) {
                            return null; // ⛔ Orden terminada → no se muestra
                        }
                    }

                    // Detectar padres (por pid)
                    const itemsWithPid = order.items.filter(item => item.pid);
                    const parentUids = [...new Set(itemsWithPid.map(item => item.pid))];

                    // 🔥 Detectar padres prestados
                    const borrowedParentUids = parentUids.filter(parentUid => {
                        const parent = order.items.find(item => item.uid === parentUid);
                        return parent?.belongs_to_kitchen === false;
                    });

                    // 🔥 Procesar items
                    let processedItems;

                    if (filterByKitchenStatus) {
                        // Con filtro (similar a OrderServing/ServingTimeline)
                        const activeParentUids = parentUids.filter(parentUid => {
                            const children = order.items.filter(item =>
                                item.pid === parentUid &&
                                item.kitchen_status === 1
                            );
                            return children.length > 0;
                        });

                        const allProcessedItems = order.items.map(item => {
                            const isParent = parentUids.includes(item.uid);
                            const isBorrowedParent = borrowedParentUids.includes(item.uid);

                            return {
                                ...item,
                                isParent,
                                isChild: Boolean(item.pid),
                                isBorrowedParent,
                                isDisabled: isBorrowedParent,
                            };
                        });

                        processedItems = allProcessedItems
                            .filter(item => {
                                if (activeParentUids.includes(item.uid)) {
                                    return true;
                                }
                                if (item.kitchen_status === 1) {
                                    if (item.isChild) {
                                        const parentIsPresent = activeParentUids.includes(item.pid);
                                        return !parentIsPresent;
                                    }
                                    return true;
                                }
                                return false;
                            })
                            .map(item => {
                                if (item.isParent) {
                                    return {
                                        ...item,
                                        additionalItems: allProcessedItems
                                            .filter(child =>
                                                child.pid === item.uid &&
                                                child.kitchen_status === 1
                                            )
                                            .map(child => ({
                                                ...child,
                                                isDisabled: false
                                            }))
                                    };
                                }
                                return {
                                    ...item,
                                    additionalItems: []
                                };
                            });
                    } else {
                        // Sin filtro (OrderSwipe - muestra TODOS los items)
                        processedItems = order.items.map(item => {
                            const isParent = parentUids.includes(item.uid);
                            const isBorrowedParent = borrowedParentUids.includes(item.uid);

                            return {
                                ...item,
                                isParent,
                                isChild: Boolean(item.pid),
                                isBorrowedParent,
                                isDisabled: isBorrowedParent,
                            };
                        });
                    }

                    return {
                        ...order,
                        items: processedItems
                    };
                })
                .filter(Boolean); // elimina órdenes cerradas

            if (processedOrders.length === 0) {
                return null; // ⛔ Mesa sin órdenes vivas
            }

            return {
                tableName: tableGroup.tableName,
                type: tableGroup.type,
                total_people: tableGroup.total_people,
                orders: processedOrders
            };
        })
        .filter(Boolean); // elimina mesas vacías
};