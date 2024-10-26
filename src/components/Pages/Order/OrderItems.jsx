// import React from 'react'

// const OrderItems = ({ items }) => {

//   // Verificamos que items exista
//   if (!items || !Array.isArray(items)) {
//     return <div>No hay items para mostrar</div>;
//   }

//   return (
//     <ul className="space-y-2">
//       {items.map((item) => (
//         <li key={item.cd} className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm">
//           <span className="font-bold text-xl">{item.num}x</span>
//           <span className="text-lg">{item.name}</span>
//         </li>
//       ))}
//     </ul>
//   );


//   // return (
//   //   <>
//   //     {Object.entries(items).map(([category, dishes]) => (
//   //       <div key={category} className="mb-2">
//   //         <h3 className="font-semibold uppercase text-sm text-gray-700">{category}</h3>
//   //         <ul>
//   //           {dishes.map((dish, index) => (
//   //             <li key={index} className="text-sm">{dish}</li>
//   //           ))}
//   //         </ul>
//   //       </div>
//   //     ))}
//   //   </>
//   // )
// };

// export default OrderItems

import React from 'react';

const OrderItems = ({ items }) => {
  if (!items || !items.length) return null;

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
      {items.map((item) => (
        <div key={item.uid} className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
          <span className="font-bold text-sm">{item.quantity}x</span>
            <span className="text-gray-800 font-medium">{item.name}</span>
            {/* {item.kitchen_status === 1 && (
              <span className="px-2 py-1 text-sm bg-green-100 text-yellow-800 rounded">
                *
              </span>
            )} */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderItems;