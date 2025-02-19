import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AdditionalItems from './AdditionalItems';
import { use } from 'react';
import _ from "lodash";

const MainItem = ({ item, onItemClick, allAdditionalsComplete, hasAdditionals, isExpanded, expandedItemId, type_display, selectedItems, onToggleSelection }) => {
  const isCompleted = item.kitchen_status === 1;
  const isServed = item.serving_status === 1;
  const [isTouching, setIsTouching] = useState(false);
  const isServing = type_display == 2;
  const [config, setConfig] = useState({});
  // const isSelected = selectedItems?.has(item.uid);

  useEffect(() => {
    const savedConfig = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    setConfig(savedConfig);
  }, []);

  const getFontSizeClass = () => {
    switch (config.fontSize) {
      case 'small':
        return 'text-1xl';
      case 'large':
        return 'text-3xl';
      default: // normal
        return 'text-2xl';
    }
  };

  const getQuantityFontSizeClass = () => {
    switch (config.fontSize) {
      case 'small':
        return 'text-2xl';
      case 'large':
        return 'text-4xl';
      default: // normal
        return 'text-3xl';
    }
  };

  // Para serving, el item está disponible si está completado en cocina pero no servido
  const isClickable = isServing ? (isCompleted && !isServed) : !isCompleted;
  const isSelected = selectedItems.has(item.id);

  const getBackgroundColor = () => {

    if (isSelected) return "bg-yellow-200";
    if (!isServing) {

      return isCompleted ? "bg-green-200" : "bg-white";
    }
    return isServed ? "bg-blue-200" : "bg-white";
  };

  const handleClick = () => {
    if (!isServing && !isCompleted) {
      onToggleSelection(item);
    }
  };


  return (
    <div
      onClick={handleClick}
      onTouchStart={() => setIsTouching(true)}
      onTouchEnd={() => setIsTouching(false)}
      onTouchCancel={() => setIsTouching(false)}
      className={`
        rounded-lg p-2 shadow-sm
        transition-all duration-300
        ${getBackgroundColor()}
        ${isClickable ? "cursor-pointer" : ""}
        ${isExpanded ? "border-b border-gray-200" : ""}
        ${isTouching ? "bg-white" : ""}
      `}
    >
      {/* Item principal */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className={`${getQuantityFontSizeClass()} text-gray-700 whitespace-nowrap font-medium`}>
            {item.quantity}
          </span>
          {item.modification && item.modification !== "　" && (
            <span className={`${getFontSizeClass()} bg-gray-100  rounded text-red-600 `}>
              {item.modification}
            </span>
          )}
          <span className={`${getFontSizeClass()} text-left flex-1 break-words`}>{item.name}</span>
        </div>
        {isServing ? (
          isServed && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-blue-500" />
        ) : (
          (isCompleted || allAdditionalsComplete) && (
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-green-500" />
          )
        )}
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
            getFontSizeClass={getFontSizeClass}
            getQuantityFontSizeClass={getQuantityFontSizeClass}
            selectedItems={selectedItems}
            onToggleSelection={onToggleSelection}

          />
        </div>
      )}
    </div>
  );
};

export default MainItem;