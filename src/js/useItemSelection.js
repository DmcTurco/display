// hooks/useItemSelection.js
import { useState, useCallback } from 'react';
import { useDoubleTap } from './useDoubleTap';
import { getItemIds, getOrderItemIds, getTableItemIds, toggleItemSelection } from './itemSelectionHelpers';

export function useItemSelection(selectionMode, onUpdate) {
    const [selectedItems, setSelectedItems] = useState(new Set());
    const { handleTap, cleanup } = useDoubleTap(300);

    /**
     * Obtiene los IDs relevantes según el tipo de selección
     * 🔥 MODIFICADO: Excluye items deshabilitados
     */
    const getRelevantIds = useCallback((item, type, tableGroup, order) => {
        let ids;

        switch (type) {
            case 'table':
                ids = getTableItemIds(tableGroup);
                break;
            case 'order':
                ids = getOrderItemIds(order);
                break;
            case 'item':
                ids = getItemIds(item, order?.items || []);
                break;
            default:
                return new Set();
        }

        // 🔥 NUEVO: Filtrar items deshabilitados
        // Si el tipo es 'item' y está deshabilitado, retornar Set vacío
        if (type === 'item' && item.isDisabled) {
            return new Set();
        }

        // Para 'table' y 'order', filtrar los items deshabilitados de la lista
        if (type === 'table' || type === 'order') {
            const enabledIds = new Set();
            const itemsToCheck = type === 'table'
                ? tableGroup.orders.flatMap(o => o.items)
                : order.items;

            ids.forEach(id => {
                const foundItem = itemsToCheck.find(i => i.id === id);
                if (foundItem && !foundItem.isDisabled) {
                    enabledIds.add(id);
                }
            });
            return enabledIds;
        }

        return ids;
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
        // 🔥 NUEVO: No hacer nada si no hay items válidos
        if (itemIds.size === 0) return;
        setSelectedItems(prev => toggleItemSelection(itemIds, prev));
    }, []);

    /**
     * Maneja la selección en modo double-tap (modo 2)
     */
    const handleDoubleTapSelection = useCallback((itemIds, shouldUpdate = false) => {
        // 🔥 NUEVO: No hacer nada si no hay items válidos
        if (itemIds.size === 0) return;

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
     * 🔥 MODIFICADO: Prevenir selección de items deshabilitados
     */
    const handleToggleSelection = useCallback((item, type = 'item', tableGroup = null, order = null) => {
        // 🔥 NUEVO: Verificar si es un item deshabilitado antes de continuar
        if (type === 'item' && item?.isDisabled) {
            console.log('❌ Item deshabilitado, no se puede seleccionar:', item.name);
            return;
        }

        const itemIds = getRelevantIds(item, type, tableGroup, order);

        // Si no hay IDs válidos (todos deshabilitados), no hacer nada
        if (itemIds.size === 0) {
            console.log('❌ No hay items válidos para seleccionar');
            return;
        }

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