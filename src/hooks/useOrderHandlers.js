// src/hooks/useOrderHandlers.js
import { useState, useRef } from 'react';
import { useOrders } from '../js/useOrders';


export const useOrderHandlers = (organizedItems, expandedItemId, setExpandedItemId) => {
  // const [expandedItemId, setExpandedItemId] = useState(null);
  const { updateKitchenStatus } = useOrders();

  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  //Verifica si todos los Items adicionales (hijos ) esten completados
  //retorna true solo si todos los items tiene kitchen_status === 1
  // se usa para saber si se puede completar el Item Padre
  const areAllAdditionalsComplete = (additionalItems) => {
    return additionalItems.every((item) => item.kitchen_status === 1);
  };

  //verifica y actualiza el estado del item padre
  //solo actualizara el padre si todos sus items adicionales estan completados 
  // se llama despues de completar un item adicional
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

  //Marca un Item como completado
  //cierra el panel expandido
  //si es un item adicional, verifica si el padre pueder ser completado
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

  //simplemente cierra el panel expandido
  const handleCancel = () => {
    setExpandedItemId(null);
  };

  //Maneja toda la lógica de clicks/toques
  //Diferencia entre Items principales y adicionales
  //Maneja doble toque y toque simple
  //controla la expansion/colapso de los paneles
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
            setExpandedItemId(expandedItemId === item.uid ? null : item.uid);// Toggle
          }
        }, 150);
      }
      lastTapRef.current = now;

    }else{
      //Para items adicionales
      if(expandedItemId && expandedItemId !== item.uid){
        setExpandedItemId(item.uid);// Cambia al nuevo item
      }else{
        setExpandedItemId(expandedItemId === item.uid ? null : item.uid); Toggle
      }
    }

  };

  // const handleItemClick = (item, isAdditional = false, isDoubleTap = false, isCancel = false) => {
  //   // No procesar si es un item principal con hijos
  //   if (!isAdditional && organizedItems[item.uid]?.additionalItems.length > 0) {
  //     return;
  //   }

  //   // Si el item ya está completado, no hacer nada
  //   if (item.kitchen_status === 1) {
  //     return;
  //   }

  //   // Manejar cancelación
  //   if (isCancel) {
  //     setExpandedItemId(null);
  //     return;
  //   }

  //   // Manejar doble toque
  //   if (isDoubleTap) {
  //     handleConfirm(item, isAdditional);
  //     return;
  //   }

  //   // Manejar toque simple
  //   if (isAdditional) {
  //     // Para items adicionales
  //     if (expandedItemId && expandedItemId !== item.uid) {
  //       // Si hay otro item expandido, cerrarlo y abrir este
  //       setExpandedItemId(item.uid);
  //     } else {
  //       // Si no hay otro item expandido o es el mismo, toggle
  //       setExpandedItemId(expandedItemId === item.uid ? null : item.uid);
  //     }
  //   } else {
  //     // Para items principales
  //     const now = Date.now();
  //     if (now - lastTapRef.current < 300) {
  //       // Doble toque detectado
  //       clearTimeout(tapTimeoutRef.current);
  //       handleConfirm(item, false);
  //     } else {
  //       // Toque simple
  //       tapTimeoutRef.current = setTimeout(() => {
  //         if (expandedItemId && expandedItemId !== item.uid) {
  //           // Si hay otro item expandido, cerrarlo y abrir este
  //           setExpandedItemId(item.uid);
  //         } else {
  //           // Si no hay otro item expandido o es el mismo, toggle
  //           setExpandedItemId(expandedItemId === item.uid ? null : item.uid);
  //         }
  //       }, 150);
  //     }
  //     lastTapRef.current = now;
  //   }
  // };

  return {
    expandedItemId,
    handleItemClick,
    handleConfirm,
    handleCancel,
    areAllAdditionalsComplete
  };
};