import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const AdditionalItems = ({ items, onItemClick }) => {
  return (
    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-2">
      {items.map((additionalItem) => {
        const isAdditionalCompleted = additionalItem.kitchen_status === 1;
        return (
          <div
            key={additionalItem.uid}
            onClick={(e) => {
              e.stopPropagation();
              onItemClick(additionalItem, true);
            }}
            className={`
              flex items-start justify-between gap-1 text-xs text-gray-600
              transition-all duration-300
              ${isAdditionalCompleted ? "bg-green-200" : "hover:bg-gray-200"}
              ${isAdditionalCompleted ? "" : "cursor-pointer"}
            `}
          >
            <div className="flex gap-1">
              <span className="font-medium">
                {additionalItem.quantity}x
              </span>
              <span className="flex-1">{additionalItem.name}</span>
            </div>
            {isAdditionalCompleted && (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdditionalItems;