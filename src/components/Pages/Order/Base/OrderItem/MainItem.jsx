import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AdditionalItems from './AdditionalItems';

const MainItem = ({ item, onItemClick, allAdditionalsComplete, hasAdditionals, isExpanded, expandedItemId, type_display }) => {
  const isCompleted = item.kitchen_status === 1;
  const isServed = item.serving_status === 1;
  const [isTouching, setIsTouching] = useState(false);
  const isServing = type_display == 2;
  // Para serving, el item está disponible si está completado en cocina pero no servido
  const isClickable = isServing ? (isCompleted && !isServed) : (!isCompleted && (!hasAdditionals || allAdditionalsComplete));
  // handleItemClick(item, isAdditional, isConfirm, isCancel, isServing);
  return (
    <div
      onClick={() => {
        if (isClickable) {
          if (isServing) {
            onItemClick(item, false, false, false, true);
          } else {
            onItemClick(item, false);
          }
        }
      }}
      onTouchStart={() => setIsTouching(true)}
      onTouchEnd={() => setIsTouching(false)}
      onTouchCancel={() => setIsTouching(false)}
      className={`
        rounded-lg p-3 shadow-sm
        transition-all duration-300
        ${isServing
          ? (isServed ? "bg-blue-200" : "bg-white") // En serving: azul si está servido, blanco si no
          : (isCompleted ? "bg-green-200" : "bg-white") // En kitchen: verde si está completado, blanco si no
        }
        ${isClickable ? "touch-none hover:bg-gray-200 active:bg-gray-200 cursor-pointer" : ""}
        ${isExpanded ? "rounded-b-none border-b border-gray-200" : ""}
        ${isTouching ? "bg-white" : ""}
      `}
    >
      {/* Item principal */}
      <div className="flex items-start justify-between">
        <div className="flex sm:gap-2 gap-1">
          <span className="font-medium text-sm sm:text-base text-gray-700 whitespace-nowrap">
            {item.quantity}
          </span>
          {item.modification && item.modification !== "　" && (
            <span className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-600 self-center">
              {item.modification}
            </span>
          )}
          <span className="flex-1 text-sm sm:text-base break-words">{item.name}</span>
        </div>
        {isServing ? (isServed && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-blue-500" />) : ((isCompleted || allAdditionalsComplete) && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-green-500" />)
        }
      </div>

      {/* Items adicionales */}
      {hasAdditionals && (
        <div className="mt-2">
          <AdditionalItems
            items={item.additionalItems}
            onItemClick={onItemClick}
            expandedItemId={expandedItemId}
            allAdditionalsComplete={allAdditionalsComplete}
            type_display={type_display}
          />
        </div>
      )}
    </div>
  );
};

export default MainItem;