import React from 'react';
import { X, ChefHat } from 'lucide-react';
import MainItem from './MainItem';
import { useOrderHandlers } from '../../../../../hooks/useOrderHandlers';
import { useSwipe } from '../../../../../hooks/useSwipe';

const OrderItems = ({ items,allorders, expandedItemId, setExpandedItemId, updateKitchenStatus, type_display, selectedItems, onToggleSelection }) => {
  const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
  // Usar el hook de swipe para scroll vertical
  const {
    containerRef,
    dragOffset,
    onTouchStart,
    onTouchEnd,
    onMouseDown,
    getTransform,
    isDragging
  } = useSwipe({
    direction: 'vertical',
    enabled: true,
    currentPage: 1,
    totalPages: 1,
  });
  // console.log(selectedItems);
  if (!items) return null;

  // Filtrar items si config.type == 2 y serving_status == 0
  const filteredItems = config.type == 2 ? items.filter(item => item.serving_status !== 1) : items;

  // Organizamos los items en una estructura jerárquica
  const organizedItems = filteredItems.reduce((acc, item) => {
    if (!item.pid) {
      // Es un item principal
      acc[item.uid] = {
        ...item,
        additionalItems: []
      };
    } else {
      // Es un item adicional
      if (acc[item.pid]) {
        acc[item.pid].additionalItems.push(item);
      }
    }
    return acc;
  }, {});

  // Usar el hook personalizado
  const {
    handleItemClick,
    handleConfirm,
    handleCancel,
    areAllAdditionalsComplete
  } = useOrderHandlers(organizedItems, expandedItemId, setExpandedItemId, updateKitchenStatus);


  // Función modificada para manejar clicks
  const handleItemClickWithDragCheck = (item, isAdditional = false, isConfirm = false, isCancel = false, isServing = false) => {
    if (!isDragging) {
      handleItemClick(item, isAdditional, isConfirm, isCancel, isServing);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {Object.values(organizedItems).map((item) => {
          const hasAdditionals = item.additionalItems.length > 0;
          const allAdditionalsComplete = hasAdditionals && areAllAdditionalsComplete(item.additionalItems);
          const isExpanded = expandedItemId === item.uid;

          return (
            <div key={item.uid} className="relative w-full">
              <MainItem
                item={item}
                allorders={allorders}
                onItemClick={handleItemClickWithDragCheck}
                allAdditionalsComplete={allAdditionalsComplete}
                hasAdditionals={hasAdditionals}
                isExpanded={() => { }}
                expandedItemId={expandedItemId}
                type_display={type_display}
                selectedItems={selectedItems}
                onToggleSelection={onToggleSelection}
              />

            </div>
          );
        })}
      </div >
    </>
  );
};

export default OrderItems;
