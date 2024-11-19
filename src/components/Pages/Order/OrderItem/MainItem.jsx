import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import AdditionalItems from './AdditionalItems';

const MainItem = ({ item, onItemClick, allAdditionalsComplete, hasAdditionals }) => {
  const isCompleted = item.kitchen_status === 1;

  return (
    <div
      onClick={() => onItemClick(item)}
      className={`
        rounded-lg p-3 shadow-sm
        transition-all duration-300
        ${isCompleted ? "bg-green-200" : "bg-white hover:bg-green-200"}
        ${isCompleted || hasAdditionals ? "" : "cursor-pointer"}
      `}
    >
      {/* Item principal */}
      <div className="flex items-start justify-between">
        <div className="flex gap-1">
          <span className="font-medium text-sm text-gray-700">
            {item.quantity}x
          </span>
          <span className="flex-1 text-sm">{item.name}</span>
        </div>
        {(isCompleted || allAdditionalsComplete) && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
      </div>

      {/* Items adicionales */}
      {hasAdditionals && (
        <AdditionalItems 
          items={item.additionalItems} 
          onItemClick={onItemClick}
        />
      )}
    </div>
  );
};

export default MainItem;