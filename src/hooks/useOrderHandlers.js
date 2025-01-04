import { useState, useRef, useEffect } from 'react';



export const useOrderHandlers = (organizedItems, expandedItemId, setExpandedItemId, updateKitchenStatus) => {

  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);
  const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
  const kitchen_cd = config.cd;
  const isServing = config.type === 2;

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []); // Se ejecuta solo al desmontar

  const areAllAdditionalsComplete = (additionalItems) => {
    if (isServing) {
      return additionalItems.every((item) => item.serving_status === 1);
    }
    return additionalItems.every((item) => item.kitchen_status === 1);
  };


  const handleConfirm = async (item, isAdditional) => {
    try {
      if (isServing) {
        // Lógica para serving
        if (isAdditional && item.pid) {
          const parent = organizedItems[item.pid];
          const otherServed = parent.additionalItems
            .filter(siblingItem => siblingItem.id !== item.id)
            .every(siblingItem => siblingItem.serving_status === 1);

          if (otherServed) {
            await Promise.all([
              updateKitchenStatus(item.id, 1, kitchen_cd), // Actualiza serving_status
              updateKitchenStatus(parent.id, 1, kitchen_cd)
            ]);
          } else {
            await updateKitchenStatus(item.id, 1, kitchen_cd);
          }
        } else {
          await updateKitchenStatus(item.id, 1, kitchen_cd);
        }
      } else {
        // Lógica original para kitchen
        if (isAdditional && item.pid) {
          const parent = organizedItems[item.pid];
          const otherComplete = parent.additionalItems
            .filter(siblingItem => siblingItem.id !== item.id)
            .every(siblingItem => siblingItem.kitchen_status === 1);

          if (otherComplete) {
            await Promise.all([
              updateKitchenStatus(item.id, 1, kitchen_cd),
              updateKitchenStatus(parent.id, 1, kitchen_cd)
            ]);
          } else {
            await updateKitchenStatus(item.id, 1, kitchen_cd);
          }
        } else {
          await updateKitchenStatus(item.id, 1, kitchen_cd);
        }
      }
      setExpandedItemId(null);
    } catch (error) {
      console.error('Error al actualizar el estado en useOrderHandlers:', error);
    }
  };

  const handleCancel = () => {
    setExpandedItemId(null);
  };

  const handleItemClick = (item, isAdditional = false, isDoubleTap = false, isCancel = false, isServing = false) => {

    // No procesar si es un item principal con hijos

    if (isServing) {
      // En serving, solo verificamos que el ítem esté listo en cocina
      if (!item.kitchen_status === 1 || item.serving_status === 1) {
        return;
      }
    } else {
      // En kitchen, mantenemos la lógica original
      if (!isAdditional && organizedItems[item.uid]?.additionalItems.length > 0) {
        return;
      }
      // Si el item ya está completado, no hacer nada
      if (item.kitchen_status === 1) {
        return;
      }

    }


    // Manejar cancelación
    if (isCancel) {
      setExpandedItemId(null);
      return;
    }

    // Manejar doble toque
    if (isDoubleTap) {
      handleConfirm(item, isAdditional);
      return;
    }

    if (!isAdditional) {

      //para items principales
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        //Double toque detectado
        clearTimeout(tapTimeoutRef.current);
        handleConfirm(item, false)
      } else {
        //toque simple
        tapTimeoutRef.current = setTimeout(() => {
          if (expandedItemId && expandedItemId !== item.uid) {
            setExpandedItemId(item.uid); // Cambia al nuevo item
          } else {
            setExpandedItemId(expandedItemId === item.uid ? null : item.uid);
          }
        }, 150);
      }
      lastTapRef.current = now;

    } else {
      //Para items adicionales
      if (expandedItemId && expandedItemId !== item.uid) {
        setExpandedItemId(item.uid);// Cambia al nuevo item
      } else {
        setExpandedItemId(expandedItemId === item.uid ? null : item.uid);
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