// src/hooks/useOrderHandlers.js
import { useState, useRef, useEffect } from 'react';
import { useOrders } from '../js/useOrders';


export const useOrderHandlers = (organizedItems, expandedItemId, setExpandedItemId) => {
  // const [expandedItemId, setExpandedItemId] = useState(null);
  const { updateKitchenStatus, orders, getTodayOrders } = useOrders();

  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
  const kitchen_cd = config.cd;

  useEffect(() => {
    if (kitchen_cd && (!orders || orders.length === 0)) {
      getTodayOrders(kitchen_cd);
    }
  }, [kitchen_cd, orders, getTodayOrders]);

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
        await updateKitchenStatus(parent.id, 1, kitchen_cd); // Pasar kitchen_cd
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

      console.log('Iniciando confirmación:', {
        item,
        ordersCount: orders.length,
        hasOrders: orders.length > 0
      });

      // Verificar si tenemos órdenes
      if (!orders || orders.length === 0) {
        console.log('Cargando órdenes antes de actualizar...');
        await getTodayOrders(kitchen_cd);
        // Verificar nuevamente después de cargar
        if (!orders || orders.length === 0) {
          console.error('No se pudieron cargar las órdenes');
          return;
        }
      }

      const success = await updateKitchenStatus(item.id, 1, kitchen_cd);
      if (success) {
        // Pequeño delay antes de cerrar el panel
        setTimeout(() => {
            setExpandedItemId(null);
        }, 300);

        if (isAdditional && item.pid) {
            await checkAndUpdateParent(item.pid);
        }
    }
    } catch (error) {
      console.error('Error al actualizar el estado en useOrderHandlers :', error);
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