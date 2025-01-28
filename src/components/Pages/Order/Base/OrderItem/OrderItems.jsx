import React from 'react';
import { X, ChefHat } from 'lucide-react';
import MainItem from './MainItem';
import { useOrderHandlers } from '../../../../../hooks/useOrderHandlers';
import { useSwipe } from '../../../../../hooks/useSwipe';

const OrderItems = ({ items, expandedItemId, setExpandedItemId, updateKitchenStatus, type_display }) => {
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

  if (!items) return null;

  // Filtrar items si config.type == 2 y serving_status == 0
  const filteredItems = config.type == 2 ? items.filter(item => item.serving_status !== 1) : items;

  // const groupedByTable = filteredItems.reduce((acc, item) => {
  //   const tableId = item.table || 'sin Mesa';
  //   if(!acc[tableId]){
  //     acc[tableId] = [];
  //   }

  //   acc[tableId].push(item);
  //   return acc;
  // },{});

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
      <div
        ref={containerRef}
        className="space-y-2 sm:space-y-3 md:space-y-2 w-full max-w-2xl mx-auto px-1 sm:px-1 max-h-[calc(100vh-260px)] overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{
          transform: getTransform(),
          transition: 'transform 0.1s ease-out'
        }}
      >
        {Object.values(organizedItems).map((item) => {
          const hasAdditionals = item.additionalItems.length > 0;
          const allAdditionalsComplete = hasAdditionals && areAllAdditionalsComplete(item.additionalItems);
          const isExpanded = expandedItemId === item.uid;

          return (
            <div key={item.uid} className="relative w-full">
              <MainItem
                item={item}
                onItemClick={handleItemClickWithDragCheck}
                allAdditionalsComplete={allAdditionalsComplete}
                hasAdditionals={hasAdditionals}
                expandedItemId={expandedItemId}
                isExpanded={isExpanded}
                type_display={type_display}
              />
              {isExpanded && !hasAdditionals && (
                <div className="bg-gray-50 rounded-b-lg p-2 sm:p-3 shadow-sm border-x border-b animate-slideDown">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDragging) {
                            handleCancel();
                          }
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-white rounded border hover:bg-gray-50">
                        <X className="h-4 w-10" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDragging) {
                            handleConfirm(item);
                          }
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        <ChefHat className="h-4 w-4" />
                        <span>完了</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div >
    </>
  );
};

export default OrderItems;
