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
    if (!item || item.isDisabled) {
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
    // Aquí ya no necesitamos verificar size === 0
    // porque lo hacemos antes de llamar esta función

    const newSelection = new Set(selectedItems);
    const allSelected = areAllItemsSelected(itemIds, selectedItems);

    if (allSelected) {
        itemIds.forEach(id => newSelection.delete(id));
    } else {
        itemIds.forEach(id => newSelection.add(id));
    }

    return newSelection;
};