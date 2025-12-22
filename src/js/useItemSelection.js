// hooks/useItemSelection.js
import { useState, useRef } from 'react';

export function useItemSelection(selectionMode, onUpdate) {
    const [selectedItems, setSelectedItems] = useState(new Set());

    // Refs para double tap
    const lastTapRef = useRef({});
    const tapTimeoutRef = useRef({});
    const DOUBLE_TAP_DELAY = 300;

    const handleToggleSelection = (item, type = 'item', tableGroup = null, order = null) => {
        const now = Date.now();

        let tapId;
        switch (type) {
            case 'table':
                tapId = `table-${tableGroup.tableName}`;
                break;
            case 'order':
                tapId = `order-${order.record_date || order.formatted_time}`;
                break;
            case 'item':
                tapId = `item-${item.id}`;
                break;
        }

        // 🔥 LÓGICA DE TOGGLE COMÚN
        const performToggle = () => {
            setSelectedItems(prev => {
                const newSet = new Set(prev);

                switch (type) {
                    case 'table':
                        const allTableItemsSelected = tableGroup.orders.every(order =>
                            order.items.every(item => {
                                if (item.isDisabled) return true;
                                const hasItem = newSet.has(item.id);
                                if (item.additionalItems) {
                                    return hasItem && item.additionalItems.every(child =>
                                        child.isDisabled || newSet.has(child.id)
                                    );
                                }
                                return hasItem;
                            })
                        );

                        tableGroup.orders.forEach(order => {
                            order.items.forEach(item => {
                                if (item.isDisabled) return;

                                if (allTableItemsSelected) {
                                    newSet.delete(item.id);
                                    if (item.additionalItems) {
                                        item.additionalItems.forEach(child => newSet.delete(child.id));
                                    }
                                } else {
                                    newSet.add(item.id);
                                    if (item.additionalItems) {
                                        item.additionalItems.forEach(child => {
                                            if (!child.isDisabled) newSet.add(child.id);
                                        });
                                    }
                                }
                            });
                        });
                        break;

                    case 'order':
                        const allOrderItemsSelected = order.items.every(item => {
                            if (item.isDisabled) return true;
                            const hasItem = newSet.has(item.id);
                            if (item.additionalItems) {
                                return hasItem && item.additionalItems.every(child =>
                                    child.isDisabled || newSet.has(child.id)
                                );
                            }
                            return hasItem;
                        });

                        order.items.forEach(item => {
                            if (item.isDisabled) return;

                            if (allOrderItemsSelected) {
                                newSet.delete(item.id);
                                if (item.additionalItems) {
                                    item.additionalItems.forEach(child => newSet.delete(child.id));
                                }
                            } else {
                                newSet.add(item.id);
                                if (item.additionalItems) {
                                    item.additionalItems.forEach(child => {
                                        if (!child.isDisabled) newSet.add(child.id);
                                    });
                                }
                            }
                        });
                        break;

                    case 'item':
                        if (item.isDisabled) {
                            console.warn('⚠️ Item deshabilitado:', item.name);
                            return prev;
                        }

                        if (item.additionalItems && item.additionalItems.length > 0) {
                            if (newSet.has(item.id)) {
                                newSet.delete(item.id);
                                item.additionalItems.forEach(childItem => {
                                    newSet.delete(childItem.id);
                                });
                            } else {
                                newSet.add(item.id);
                                item.additionalItems.forEach(childItem => {
                                    if (!childItem.isDisabled) {
                                        newSet.add(childItem.id);
                                    }
                                });
                            }
                        } else {
                            if (newSet.has(item.id)) {
                                newSet.delete(item.id);
                            } else {
                                newSet.add(item.id);
                            }
                        }
                        break;
                }

                return newSet;
            });
        };

        // 🔥 DIFERENCIA ENTRE MODOS
        if (selectionMode === "2") {
            // MODO 2: Double-Tap
            if (now - (lastTapRef.current[tapId] || 0) < DOUBLE_TAP_DELAY) {
                // Segundo tap - Confirmar
                clearTimeout(tapTimeoutRef.current[tapId]);

                if (selectedItems.size > 0) {
                    onUpdate?.(selectedItems);
                }
                setSelectedItems(new Set());
            } else {
                // Primer tap - Toggle
                performToggle();
            }

            lastTapRef.current[tapId] = now;
        } else {
            // MODO 1: Single-Tap con botón
            performToggle();
        }
    };

    const clearSelection = () => {
        setSelectedItems(new Set());
        // Limpiar timeouts
        Object.values(tapTimeoutRef.current).forEach(clearTimeout);
        lastTapRef.current = {};
        tapTimeoutRef.current = {};
    };

    return {
        selectedItems,
        handleToggleSelection,
        clearSelection,
        hasSelection: selectedItems.size > 0
    };
}