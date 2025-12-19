// utils/itemSelectionHelpers.js

/**
 * Obtiene todos los hijos de un item padre
 */
export const getAllChildren = (parentUid, items) => {
    if (!Array.isArray(items)) {
        console.warn('Items no es un array:', items);
        return [];
    }
    return items.filter(item => item.pid === parentUid);
};

/**
 * Obtiene todos los IDs de items de una mesa (incluyendo hijos)
 */
export const getTableItemIds = (tableGroup) => {
    const ids = new Set();

    tableGroup.orders.forEach(order => {
        order.items.forEach(item => {
            ids.add(item.id);
            if (item.isParent) {
                const children = getAllChildren(item.uid, order.items);
                children.forEach(child => ids.add(child.id));
            }
        });
    });

    return ids;
};

/**
 * Obtiene todos los IDs de items de una orden (incluyendo hijos)
 */
export const getOrderItemIds = (order) => {
    const ids = new Set();

    order.items.forEach(item => {
        ids.add(item.id);
        if (item.isParent) {
            const children = getAllChildren(item.uid, order.items);
            children.forEach(child => ids.add(child.id));
        }
    });

    return ids;
};

/**
 * Obtiene los IDs de un item individual (incluyendo sus hijos si es padre)
 */
export const getItemIds = (item, orderItems) => {
    const ids = new Set([item.id]);

    if (item.isParent) {
        const children = getAllChildren(item.uid, orderItems);
        children.forEach(child => ids.add(child.id));
    }

    return ids;
};

/**
 * Verifica si todos los items están seleccionados
 */
export const areAllItemsSelected = (itemIds, selectedItems) => {
    return Array.from(itemIds).every(id => selectedItems.has(id));
};

/**
 * Alterna la selección de un conjunto de items
 */
export const toggleItemSelection = (itemIds, selectedItems) => {
    const newSelection = new Set(selectedItems);
    const allSelected = areAllItemsSelected(itemIds, selectedItems);

    itemIds.forEach(id => {
        if (allSelected) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
    });

    return newSelection;
};