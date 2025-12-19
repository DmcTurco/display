// hooks/useItemSelection.js
import { useState, useCallback } from 'react';

import { useDoubleTap } from './useDoubleTap';
import { getItemIds, getOrderItemIds, getTableItemIds, toggleItemSelection } from './itemSelectionHelpers';

export function useItemSelection(selectionMode, onUpdate) {
    const [selectedItems, setSelectedItems] = useState(new Set());
    const { handleTap, cleanup } = useDoubleTap(300);

    /**
     * Obtiene los IDs relevantes según el tipo de selección
     */
    const getRelevantIds = useCallback((item, type, tableGroup, order) => {
        switch (type) {
            case 'table':
                return getTableItemIds(tableGroup);
            case 'order':
                return getOrderItemIds(order);
            case 'item':
                return getItemIds(item, order?.items || []);
            default:
                return new Set();
        }
    }, []);

    /**
     * Genera un ID único para el tap según el tipo
     */
    const getTapId = useCallback((item, type, tableGroup, order) => {
        switch (type) {
            case 'table':
                return `table-${tableGroup.tableName}`;
            case 'order':
                return `order-${order.orderTime}-${order.table}`;
            case 'item':
                return `item-${item.id}`;
            default:
                return `unknown-${Date.now()}`;
        }
    }, []);

    /**
     * Maneja la selección en modo single-tap (modo 1)
     */
    const handleSingleTapSelection = useCallback((itemIds) => {
        setSelectedItems(prev => toggleItemSelection(itemIds, prev));
    }, []);

    /**
     * Maneja la selección en modo double-tap (modo 2)
     */
    const handleDoubleTapSelection = useCallback((itemIds, shouldUpdate = false) => {
        if (shouldUpdate) {
            // Double tap - actualizar inmediatamente
            onUpdate?.(itemIds);
            setSelectedItems(new Set()); // Limpiar selección
        } else {
            // Single tap - solo marcar visualmente
            setSelectedItems(itemIds);
        }
    }, [onUpdate]);

    /**
     * Función principal de manejo de selección
     */
    const handleToggleSelection = useCallback((item, type = 'item', tableGroup = null, order = null) => {
        const itemIds = getRelevantIds(item, type, tableGroup, order);
        const tapId = getTapId(item, type, tableGroup, order);

        if (selectionMode === "2") {
            // Modo double-tap
            handleTap(
                tapId,
                // Single tap - solo selección visual
                () => handleDoubleTapSelection(itemIds, false),
                // Double tap - actualizar
                () => handleDoubleTapSelection(itemIds, true)
            );
        } else {
            // Modo single-tap - toggle normal
            handleSingleTapSelection(itemIds);
        }
    }, [
        selectionMode,
        getRelevantIds,
        getTapId,
        handleTap,
        handleSingleTapSelection,
        handleDoubleTapSelection
    ]);

    const clearSelection = useCallback(() => {
        setSelectedItems(new Set());
        cleanup();
    }, [cleanup]);

    return {
        selectedItems,
        handleToggleSelection,
        clearSelection,
        hasSelection: selectedItems.size > 0
    };
}