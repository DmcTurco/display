import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AdditionalItems from './AdditionalItems';

const MainItem = ({ item, onItemClick, allAdditionalsComplete, hasAdditionals, isExpanded, expandedItemId }) => {
  const isCompleted = item.kitchen_status === 1;
  const [isTouching, setIsTouching] = useState(false);

  return (
    <div
      onClick={(e) => {
        if (!isCompleted && (!hasAdditionals || allAdditionalsComplete)) {
          onItemClick(item, false);
        }
      }}
      onTouchStart={() => setIsTouching(true)}
      onTouchEnd={() => setIsTouching(false)}
      onTouchCancel={() => setIsTouching(false)}
      className={`
        rounded-lg p-3 shadow-sm
        transition-all duration-300
        ${isCompleted ? "bg-green-200" : "bg-white"}
        ${!isCompleted && (!hasAdditionals || allAdditionalsComplete) ? 
          "touch-none hover:bg-green-200 active:bg-green-200" : ""}
        ${isCompleted || (hasAdditionals && !allAdditionalsComplete) ? "" : "cursor-pointer"}
        ${isExpanded ? "rounded-b-none border-b border-gray-200" : ""}
      `}
    >
      {/* Item principal */}
      <div className="flex items-start justify-between">
        <div className="flex sm:gap-2 gap-1">
          <span className="font-medium text-sm sm:text-base text-gray-700 whitespace-nowrap">
            {item.quantity}
          </span>
          <span className="flex-1 text-sm sm:text-base break-words">{item.name}</span>
        </div>
        {(isCompleted || allAdditionalsComplete) && (
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-green-500" />
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
          />
        </div>
      )}
    </div>
  );
};

export default MainItem;