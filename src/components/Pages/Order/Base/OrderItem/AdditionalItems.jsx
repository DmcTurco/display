import React, { useRef } from 'react';
import { CheckCircle2, X, ChefHat } from 'lucide-react';
import _ from "lodash";

const AdditionalItems = ({ items, onItemClick, expandedItemId, type_display, getFontSizeClass, getQuantityFontSizeClass, selectedItems, onToggleSelection }) => {
  // Referencias para el doble toque para cada item
  const lastTapsRef = useRef({});
  const tapTimeoutsRef = useRef({});
  const isServing = type_display == 2;

  const handleToggleSelection = (additionalItem) => {
    onToggleSelection(additionalItem);
  };

  return (
    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-2">
      {items.map((additionalItem) => {
        const isAdditionalCompleted = isServing
          ? additionalItem.serving_status === 1
          : additionalItem.kitchen_status === 1;
        const isItemExpanded = expandedItemId === additionalItem.uid;
        const isSelected = selectedItems.has(additionalItem.id);

        return (
          <div key={additionalItem.uid} className="relative">
            {/* Contenedor principal del ítem adicional */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSelection(additionalItem); // Manejar selección
              }}
              className={`
                flex items-start justify-between gap-1 text-gray-600
                transition-all duration-300 p-1 rounded
                ${isSelected ? "bg-yellow-200" : ""}

                ${isAdditionalCompleted ? "" : "cursor-pointer"}
                ${isItemExpanded ? "rounded-b-none border-b border-gray-200" : ""}
              `}
            >
              {/* Detalles del ítem */}
              <div className="flex items-center gap-4">
                <span className="font-medium text-3xl text-gray-700 whitespace-nowrap">
                  {additionalItem.quantity}
                </span>
                {additionalItem.modification && additionalItem.modification !== "　" && (
                  <span
                    className={`${getFontSizeClass()} bg-gray-100 px-1 py-0.5 rounded text-gray-600 self-center`}
                  >
                    {additionalItem.modification}
                  </span>
                )}
                <span className="flex-1 text-2xl text-gray-700">{additionalItem.name}</span>
              </div>

              {/* Ícono de completado */}
              {isAdditionalCompleted && (
                <CheckCircle2
                  className={`h-3 w-3 ${isServing ? "text-blue-500" : "text-green-500"}`}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdditionalItems;