import React from 'react';

const OrderItems = ({ items }) => {
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

  return (
    <>
      <div className="space-y-4">
        {Object.values(organizedItems).map((item) => (
          <div
            key={item.uid}
            className="bg-white rounded-lg p-3 shadow-sm">
            {/* Item principal */}
            <div className="flex items-start gap-1">
              <span className="font-medium text-sm text-gray-700">{item.quantity}x</span>
              <span className="flex-1 text-sm">{item.name}</span>
            </div>

            {/* Items adicionales */}
            {item.additionalItems.length > 0 && (
              <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-2">
                {item.additionalItems.map((additionalItem) => (
                  <div
                    key={additionalItem.uid}
                    className="flex items-start gap-1 text-xs text-gray-600"
                  >
                    <span className="font-medium">{additionalItem.quantity}x</span>
                    <span className="flex-1">{additionalItem.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default OrderItems;