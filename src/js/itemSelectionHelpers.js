// utils/itemSelectionHelpers.js

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
                    const children = useAdditionalItems ? getAllChildren(item) : getAllChildrenByPid(item.uid, order.items);

                    // Actualizar padre
                    const updateArgs = extraParam !== null ? [item.id, targetStatus, kitchen_cd, extraParam] : [item.id, targetStatus, kitchen_cd];
                    updatePromises.push(updateKitchenStatus(...updateArgs));

                    // Actualizar hijos
                    children.forEach(child => {
                        const childArgs = extraParam !== null ? [child.id, targetStatus, kitchen_cd, extraParam] : [child.id, targetStatus, kitchen_cd];
                        updatePromises.push(updateKitchenStatus(...childArgs));
                    });

                } else if (item.isChild) {
                    // ============ HIJO ============
                    // Actualizar hijo primero
                    const updateArgs = extraParam !== null ? [item.id, targetStatus, kitchen_cd, extraParam] : [item.id, targetStatus, kitchen_cd];
                    updatePromises.push(updateKitchenStatus(...updateArgs));

                    // Determinar si actualizar padre según la estrategia
                    const parent = order.items.find(i => i.uid === item.pid);

                    // Solo actualizar padre si NO está deshabilitado (no es prestado)
                    if (parent && !parent.isDisabled && !parent.isBorrowedParent) {
                        let shouldUpdateParent = false;

                        switch (parentUpdateStrategy) {
                            case 'check-all-siblings':
                                // ServingTimeline handleUpdate, OrderSwipe targetStatus=1
                                // Actualizar padre solo si TODOS los hermanos están listos
                                const siblings = useAdditionalItems ? order.items.filter(i => i.pid === item.pid) : getAllChildrenByPid(item.pid, order.items);

                                shouldUpdateParent = siblings.every(sibling =>sibling.kitchen_status === 1 || selectedItemIds.has(sibling.id));
                                break;

                            case 'check-selected-siblings':
                                // OrderServing, ServingTimeline handleCancel
                                // Actualizar padre solo si TODOS los hermanos están siendo seleccionados
                                const allSiblings = useAdditionalItems ? order.items.filter(i => i.pid === item.pid) : getAllChildrenByPid(item.pid, order.items);

                                shouldUpdateParent = allSiblings.every(sibling => selectedItemIds.has(sibling.id));
                                break;

                            case 'never':
                                shouldUpdateParent = false;
                                break;
                        }

                        if (shouldUpdateParent) {
                            const parentArgs = extraParam !== null ? [parent.id, targetStatus, kitchen_cd, extraParam] : [parent.id, targetStatus, kitchen_cd];

                            updatePromises.push(updateKitchenStatus(...parentArgs));
                        }
                    }

                } else {
                    // ============ ITEM NORMAL ============
                    const updateArgs = extraParam !== null ? [item.id, targetStatus, kitchen_cd, extraParam] : [item.id, targetStatus, kitchen_cd];
                    updatePromises.push(updateKitchenStatus(...updateArgs));
                }
            }
        }
    }

    await Promise.all(updatePromises);
};