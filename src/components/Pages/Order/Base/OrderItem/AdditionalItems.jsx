import React, { useRef } from 'react';
import { CheckCircle2, X, ChefHat } from 'lucide-react';

const AdditionalItems = ({ items, onItemClick, expandedItemId }) => {
  // Referencias para el doble toque para cada item
  const lastTapsRef = useRef({});
  const tapTimeoutsRef = useRef({});

  const handleItemClick = (additionalItem, e) => {
    if (additionalItem.kitchen_status === 1) return;
  
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const itemId = additionalItem.uid;
  
    if (now - (lastTapsRef.current[itemId] || 0) < DOUBLE_TAP_DELAY) {
      // Doble toque detectado
      clearTimeout(tapTimeoutsRef.current[itemId]);
      onItemClick(additionalItem, true, true);
    } else {
      // Toque simple
      tapTimeoutsRef.current[itemId] = setTimeout(() => {
        onItemClick(additionalItem, true, false);
      }, 150);
    }
    lastTapsRef.current[itemId] = now;
  };

  return (
    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-2">
      {items.map((additionalItem) => {
        const isAdditionalCompleted = additionalItem.kitchen_status === 1;
        const isItemExpanded = expandedItemId === additionalItem.uid;

        return (
          <div key={additionalItem.uid} className="relative">
            <div
              onClick={(e) => handleItemClick(additionalItem, e)}
              className={`
                flex items-start justify-between gap-1 text-xs text-gray-600
                transition-all duration-300 p-1 rounded
                ${isAdditionalCompleted ? "bg-green-200" : "hover:bg-gray-200"}
                ${isAdditionalCompleted ? "" : "cursor-pointer"}
                ${isItemExpanded ? "rounded-b-none border-b border-gray-200" : ""}
              `}
            >
              <div className="flex gap-1">
                <span className="font-medium text-sm sm:text-base text-gray-700 whitespace-nowrap">
                  {additionalItem.quantity}
                </span>
                <span className="flex-1 text-sm sm:text-base">{additionalItem.name}</span>
              </div>
              {isAdditionalCompleted && (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              )}
            </div>

            {isItemExpanded && (
               <div className="bg-gray-50 rounded-b-lg p-2 shadow-sm border-x border-b animate-slideDown">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(additionalItem, true, false, true);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-1 text-xs bg-white rounded border hover:bg-gray-50"
                  >
                    <X className="h-4 w-10" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(additionalItem, true, true);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    <ChefHat className="h-3 w-3" />
                    <span>完了</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdditionalItems;