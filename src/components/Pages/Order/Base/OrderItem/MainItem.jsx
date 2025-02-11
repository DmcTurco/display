import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AdditionalItems from './AdditionalItems';
import { use } from 'react';

const MainItem = ({ item, onItemClick, allAdditionalsComplete, hasAdditionals, isExpanded, expandedItemId, type_display }) => {
  const isCompleted = item.kitchen_status === 1;
  const isServed = item.serving_status === 1;
  const [isTouching, setIsTouching] = useState(false);
  const isServing = type_display == 2;
  const [config, setConfig] = useState({});

  useEffect(() => {
    const savedConfig = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    setConfig(savedConfig);
  }, []);

  const getFontSizeClass = () => {
    switch (config.fontSize) {
      case 'small':
        return 'text-xs sm:text-sm';
      case 'large':
        return 'text-base sm:text-lg';
      default: // normal
        return 'text-sm sm:text-base';
    }
  };

  const getQuantityFontSizeClass = () => {
    switch (config.fontSize) {
      case 'small':
        return 'text-xs sm:text-sm';
      case 'large':
        return 'text-base sm:text-lg';
      default: // normal
        return 'text-sm sm:text-base';
    }
  };

  // Para serving, el item está disponible si está completado en cocina pero no servido
  const isClickable = isServing ? (isCompleted && !isServed) : (!isCompleted && (!hasAdditionals || allAdditionalsComplete));


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
        <div className="flex  gap-4">
          {/* <span className={`font-medium ${getQuantityFontSizeClass()} text-gray-700 whitespace-nowrap`}> */}
          <span className='text-4xl text-gray-700 whitespace-nowrap font-medium'>
            {item.quantity}
          </span>
          {item.modification && item.modification !== "　" && (
            <span className={`${getFontSizeClass()} bg-gray-100 px-1 py-0.5 rounded text-gray-600 self-center`}>
              {item.modification}
            </span>
          )}
          {/* <span className={`flex-1 ${getFontSizeClass()} break-words`}>{item.name}</span> */}
          <span className='text-3xl flex-1 break-words'>{item.name}</span>
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
            getFontSizeClass={getFontSizeClass}
            getQuantityFontSizeClass={getQuantityFontSizeClass}
          />
        </div>
      )}
    </div>
  );
};

export default MainItem;