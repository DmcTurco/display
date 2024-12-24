import { useState, useRef, useEffect } from 'react';



export const useOrderHandlers = (organizedItems, expandedItemId, setExpandedItemId, updateKitchenStatus) => {

  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);
  const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
  const kitchen_cd = config.cd;

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []); // Se ejecuta solo al desmontar

  const areAllAdditionalsComplete = (additionalItems) => {
    return additionalItems.every((item) => item.kitchen_status === 1);
  };


  const handleConfirm = async (item, isAdditional) => {
    try {

      if (isAdditional && item.pid) {

        const parent = organizedItems[item.pid];
        const otherComplete = parent.additionalItems
          .filter(siblingItem => siblingItem.id !== item.id)
          .every(siblingItem => siblingItem.kitchen_status === 1);

        if (otherComplete) {
          console.log('Todos los hermanos completos, actualizando padre e hijo');
          await Promise.all([
            updateKitchenStatus(item.id, 1, kitchen_cd),
            updateKitchenStatus(parent.id, 1, kitchen_cd)
          ]);
        } else {
          console.log('Actualizando solo el hijo');
          await updateKitchenStatus(item.id, 1, kitchen_cd);
        }


      } else {
        await updateKitchenStatus(item.id, 1, kitchen_cd);
      }

      setExpandedItemId(null);

    } catch (error) {
      console.error('Error al actualizar el estado en useOrderHandlers :', error);
    }
  };

  const handleCancel = () => {
    setExpandedItemId(null);
  };

  const handleItemClick = (item, isAdditional = false, isDoubleTap = false, isCancel = false) => {
    // No procesar si es un item principal con hijos
    if (!isAdditional && organizedItems[item.uid]?.additionalItems.length > 0) {
      return;
    }

    // Si el item ya está completado, no hacer nada
    if (item.kitchen_status === 1) {
      return;
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