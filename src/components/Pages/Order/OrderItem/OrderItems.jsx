import React from 'react';
import { X, ChefHat } from 'lucide-react';
import MainItem from './MainItem';
import { useOrderHandlers } from '../../../../hooks/useOrderHandlers';
import { useSwipe } from '../../../../hooks/useSwipe';


const OrderItems = ({ items, expandedItemId, setExpandedItemId }) => {

  // Usar el hook de swipe para scroll vertical
  const {
    containerRef,
    dragOffset,
    onTouchStart,
    onTouchEnd,
    onMouseDown,
    getTransform
  } = useSwipe({
    direction: 'vertical',
    enabled: true,
    currentPage: 1,
    totalPages: 1,
  });

  if (!items) return null;
  // Organizamos los items en una estructura jerárquica
  const organizedItems = items.reduce((acc, item) => {
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
  } = useOrderHandlers(organizedItems, expandedItemId, setExpandedItemId);

  return (
    <>
      <div
        ref={containerRef}
        className="space-y-2 sm:space-y-3 md:space-y-4 w-full max-w-2xl mx-auto px-2 sm:px-4 max-h-[calc(100vh-350px)] overflow-y-auto"
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
                onItemClick={handleItemClick}
                allAdditionalsComplete={allAdditionalsComplete}
                hasAdditionals={hasAdditionals}
                expandedItemId={expandedItemId}
              />

              {isExpanded && !hasAdditionals && (
                <div className="bg-gray-50 rounded-b-lg p-2 sm:p-3 shadow-sm border-x border-b animate-slideDown">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel();
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-white rounded border hover:bg-gray-50"
                      >
                        <X className="h-4 w-4" />
                        <span>No</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirm(item);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        <ChefHat className="h-4 w-4" />
                        <span>¡Listo!</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default OrderItems;
