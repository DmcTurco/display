import { useState, useRef } from 'react';



export const useOrderHandlers = (organizedItems, expandedItemId, setExpandedItemId,updateKitchenStatus) => {

  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);
  const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
  const kitchen_cd = config.cd; 


  const areAllAdditionalsComplete = (additionalItems) => {
    return additionalItems.every((item) => item.kitchen_status === 1);
  };

  const checkAndUpdateParent = async (parentId) => {
    const parent = organizedItems[parentId];
    if (parent && areAllAdditionalsComplete(parent.additionalItems)) {
      try {
        await updateKitchenStatus(parent.id, 1, kitchen_cd);
      } catch (error) {
        console.error('Error al actualizar el estado del padre:', error);
      }
    }
  };

  const handleConfirm = async (item, isAdditional) => {
    try {

      await updateKitchenStatus(item.id, 1, kitchen_cd);
      setExpandedItemId(null);

      if (isAdditional && item.pid) {
        await checkAndUpdateParent(item.pid);
      }
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

    }else{
      //Para items adicionales
      if(expandedItemId && expandedItemId !== item.uid){
        setExpandedItemId(item.uid);// Cambia al nuevo item
      }else{
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