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
    <div className="space-y-4">
      {Object.values(organizedItems).map((item) => (
        <div
          key={item.uid}
          className="bg-white rounded-lg p-8 shadow-sm">
          {/* Item principal */}
          <div className="flex items-start gap-2">
            <span className="font-medium text-gray-700">{item.quantity}x</span>
            <span className="flex-1">{item.name}</span>
          </div>

          {/* Items adicionales */}
          {item.additionalItems.length > 0 && (
            <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-2">
              {item.additionalItems.map((additionalItem) => (
                <div
                  key={additionalItem.uid}
                  className="flex items-start gap-2 text-sm text-gray-600"
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
  );

  // return (
  //   <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
  //     {items.map((item) => (
  //       <div key={item.uid} className="bg-gray-50 p-3 rounded-lg">
  //         <div className="flex items-center justify-between">
  //           <span className="font-bold text-sm">{item.quantity}x</span>
  //           <span className="text-gray-800 font-medium">{item.name}</span>
  //           {/* {item.kitchen_status === 1 && (
  //             <span className="px-2 py-1 text-sm bg-green-100 text-yellow-800 rounded">
  //               *
  //             </span>
  //           )} */}
  //         </div>
  //       </div>
  //     ))}
  //   </div>
  // );
};

export default OrderItems;