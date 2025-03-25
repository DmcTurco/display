import React, { useRef } from 'react';
import { CheckCircle2,Image, X, ChefHat } from 'lucide-react';
import _ from "lodash";

const AdditionalItems = ({ items, onItemClick, expandedItemId, type_display, getFontSizeClass, getQuantityFontSizeClass, selectedItems, onToggleSelection,onImageClick }) => {
  // Referencias para el doble toque para cada item
  const lastTapsRef = useRef({});
  const tapTimeoutsRef = useRef({});
  const isServing = type_display == 2;
  const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
  const selectionMode = config.selectionMode || "1";

  const handleClick = (additionalItem, isAdditionalCompleted) => {

    if (selectionMode === "1") {
      if (!isServing && !isAdditionalCompleted) {
        onToggleSelection(additionalItem);
      }
    } else {
      // Modo 2: Solo doble toque para marcar como completado
      if (isServing) {
        onItemClick(additionalItem, true, true, false, true);
      } else {
        onItemClick(additionalItem, true, true);
      }
    }
    //   const now = Date.now();
    //   const DOUBLE_TAP_DELAY = 300;
    //   const itemId = additionalItem.uid;

    //   if (now - (lastTapsRef.current[itemId] || 0) < DOUBLE_TAP_DELAY) {
    //     // Doble toque detectado - Marcar como completado
    //     clearTimeout(tapTimeoutsRef.current[itemId]);
    //     if (isServing) {
    //       onItemClick(additionalItem, true, true, false, true);
    //     } else {
    //       onItemClick(additionalItem, true, true);
    //     }
    //   }
    //   lastTapsRef.current[itemId] = now;
    // }

  };

  return (
    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-2">
      {items.map((additionalItem) => {
        const isAdditionalCompleted = isServing
          ? additionalItem.serving_status === 1
          : additionalItem.kitchen_status === 1;

        const isItemExpanded = expandedItemId === additionalItem.uid;
        const isSelected = selectedItems.has(additionalItem.id);
        // console.log(isSelected);
        const itemClasses = `
          flex items-start justify-between gap-1 text-gray-600
          transition-all duration-300 p-1 rounded
          ${isSelected ? "bg-yellow-300" : ""}
          ${isAdditionalCompleted ? "bg-green-200" : "cursor-pointer"}
          ${isItemExpanded ? "bg-yellow-300" : ""}
        `;


        return (
          <div key={additionalItem.uid} className="relative">
            {/* Contenedor principal del ítem adicional */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (!isAdditionalCompleted) handleClick(additionalItem, isAdditionalCompleted);

              }}
              className={itemClasses}
            >
              {/* Detalles del ítem */}
              <div className="flex items-center gap-4">
                <span className="font-medium text-3xl text-gray-700 whitespace-nowrap">
                  {additionalItem.quantity}
                </span>
                {additionalItem.modification && additionalItem.modification !== "　" && (
                  <span
                    className={`${getFontSizeClass()} bg-gray-100 px-1 py-0.5 rounded text-red-600 self-center`}
                  >
                    {additionalItem.modification}
                  </span>
                )}
                <span className="flex-1 text-2xl text-gray-700">{additionalItem.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Indicador de imagen manuscrita */}
                {additionalItem.handwriteImage !== null && (
                  <div
                    className="flex-shrink-0 cursor-pointer hover:bg-indigo-100 p-1 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar que el clic afecte al elemento padre
                      if (onImageClick) {
                        onImageClick(additionalItem);
                      }
                    }}
                  >
                    <Image className="h-5 w-5 text-indigo-500" />
                  </div>
                )}

                {/* Ícono de completado */}
                {isAdditionalCompleted && (
                  <CheckCircle2
                    className={`h-4 w-4 sm:h-5 sm:w-5  ${isServing ? "text-blue-500" : "text-green-500"}`}
                  />
                )}

              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdditionalItems;