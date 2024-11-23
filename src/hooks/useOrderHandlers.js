// src/hooks/useOrderHandlers.js
import { useState, useRef } from 'react';
import { useOrders } from '../js/useOrders';


export const useOrderHandlers = (organizedItems) => {
  const [expandedItemId, setExpandedItemId] = useState(null);
  const { updateKitchenStatus } = useOrders();
  
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  const areAllAdditionalsComplete = (additionalItems) => {
    return additionalItems.every((item) => item.kitchen_status === 1);
  };

  const checkAndUpdateParent = async (parentId) => {
    const parent = organizedItems[parentId];
    if (parent && areAllAdditionalsComplete(parent.additionalItems)) {
      try {
        await updateKitchenStatus(parent.id, 1);
      } catch (error) {
        console.error('Error al actualizar el estado del padre:', error);
      }
    }
  };

  const handleConfirm = async (item, isAdditional) => {
    try {
      await updateKitchenStatus(item.id, 1);
      setExpandedItemId(null);

      if (isAdditional && item.pid) {
        await checkAndUpdateParent(item.pid);
      }
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
    }
  };

  const handleCancel = () => {
    setExpandedItemId(null);
  };

  const handleItemClick = (item, isAdditional = false, isDoubleTap = false, isCancel = false) => {
    // Si es un item principal con hijos, solo permitir interacción si todos los hijos están completos
    if (!isAdditional && organizedItems[item.uid]?.additionalItems.length > 0) {
      return;
    }

    if (item.kitchen_status !== 1) {
      if (isAdditional) {
        if (isCancel) {
          setExpandedItemId(null);
          return;
        }

        if (isDoubleTap) {
          // Actualizar estado directamente
          handleConfirm(item, true);
        } else {
          // Para items adicionales, siempre reemplazar el expandedItemId
          setExpandedItemId(expandedItemId === item.uid ? null : item.uid);
        }
      } else {
        // Para items principales
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
          // Doble toque detectado
          clearTimeout(tapTimeoutRef.current);
          handleConfirm(item, false);
        } else {
          // Toque simple
          tapTimeoutRef.current = setTimeout(() => {
            setExpandedItemId(expandedItemId === item.uid ? null : item.uid);
          }, 150);
        }
        lastTapRef.current = now;
      }
    }
  };

  return {
    expandedItemId,
    handleItemClick,
    handleConfirm,
    handleCancel,
    areAllAdditionalsComplete
  };
};