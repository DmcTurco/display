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

  // Verificar si todos los hijos están completos
  const areAllAdditionalsComplete = (additionalItems) => {
    if (isServing) {
      return additionalItems.every((item) => item.serving_status === 1);
    }
    return additionalItems.every((item) => item.kitchen_status === 1);
  };

  // Actualizar un ítem y todos sus hijos
  const updateParentAndChildren = async (parentId, status) => {
    try {
      const parent = organizedItems[parentId];
      if (!parent) return;
      
      // Actualizar el padre
      const updates = [updateKitchenStatus(parent.id, status, kitchen_cd)];

      // Actualizar todos los hijos que no estén completos
      parent.additionalItems.forEach((child) => {
        if (
          (isServing && child.serving_status !== status) ||
          (!isServing && child.kitchen_status !== status)
        ) {
          updates.push(updateKitchenStatus(child.id, status, kitchen_cd));
        }
      });

      // Ejecutar todas las actualizaciones simultáneamente
      await Promise.all(updates);
    } catch (error) {
      console.error('Error al actualizar el padre y sus hijos:', error);
    }
  };

  // Confirmar un ítem (padre o adicional)
  const handleConfirm = async (item, isAdditional = false) => {
    try {
      if (isServing) {
        // Lógica para serving
        if (isAdditional && item.pid) {
          const parent = organizedItems[item.pid];
          const otherServed = parent.additionalItems
            .filter((siblingItem) => siblingItem.id !== item.id)
            .every((siblingItem) => siblingItem.serving_status === 1);

          if (otherServed) {
            await Promise.all([
              updateKitchenStatus(item.id, 1, kitchen_cd), // Actualiza serving_status
              updateKitchenStatus(parent.id, 1, kitchen_cd),
            ]);
          } else {
            await updateKitchenStatus(item.id, 1, kitchen_cd);
          }
        } else {
          // await updateKitchenStatus(item.id, 1, kitchen_cd);
          // Si es un padre, actualizarlo junto con todos sus hijos
          await updateParentAndChildren(item.uid, 1);
        }
      } else {
        // Lógica original para kitchen
        if (isAdditional && item.pid) {
          const parent = organizedItems[item.pid];
          const otherComplete = parent.additionalItems
            .filter((siblingItem) => siblingItem.id !== item.id)
            .every((siblingItem) => siblingItem.kitchen_status === 1);

          if (otherComplete) {
            await Promise.all([
              updateKitchenStatus(item.id, 1, kitchen_cd),
              updateKitchenStatus(parent.id, 1, kitchen_cd),
            ]);
          } else {
            await updateKitchenStatus(item.id, 1, kitchen_cd);
          }
        } else {
          // await updateKitchenStatus(item.id, 1, kitchen_cd);
          // Si es un padre, actualizarlo junto con todos sus hijos
          await updateParentAndChildren(item.uid, 1);
        }
      }
      setExpandedItemId(null);
    } catch (error) {
      console.error('Error al actualizar el estado en useOrderHandlers:', error);
    }
  };

  // Cancelar la expansión
  const handleCancel = () => {
    setExpandedItemId(null);
  };

  // Manejar clics en los ítems
  const handleItemClick = (item, isAdditional = false, isDoubleTap = false, isCancel = false) => {
    // Manejar cancelación
    if (isCancel) {
      handleCancel();
      return;
    }

    // Manejar doble toque
    if (isDoubleTap) {
      handleConfirm(item, isAdditional);
      return;
    }

    // Para ítems principales con hijos: expandir/colapsar
    // if (!isAdditional && organizedItems[item.uid]?.additionalItems.length > 0) {
    //   setExpandedItemId(expandedItemId === item.uid ? null : item.uid);
    //   return;
    // }

    // Si el ítem ya está completado, no hacer nada
    if (item.kitchen_status === 1 || (isServing && item.serving_status === 1)) {
      return;
    }

    // Manejar toques simples
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Doble toque detectado
      clearTimeout(tapTimeoutRef.current);
      handleConfirm(item, isAdditional);
    } else {
      // Toque simple
      tapTimeoutRef.current = setTimeout(() => {
        if (expandedItemId && expandedItemId !== item.uid) {
          setExpandedItemId(item.uid); // Cambia al nuevo ítem
        } else {
          setExpandedItemId(expandedItemId === item.uid ? null : item.uid);
        }
      }, 150);
    }
    lastTapRef.current = now;
  };


  return {
    expandedItemId,
    handleItemClick,
    handleConfirm,
    handleCancel,
    areAllAdditionalsComplete
  };
};