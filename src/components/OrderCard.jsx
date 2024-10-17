import React, { useState } from 'react'
import { Clock, Truck, ShoppingBag, Users, AlertTriangle } from 'lucide-react'

function OrderCard({ time, type, number, customer, items, status, elapsedTime }) {

  const getTypeIcon = () => {
    switch (type) {
      case 'delivery':
        return <Truck className='w-5 h-5 text-blue-500' />
      case 'takeout':
        return <ShoppingBag className='w-5 h-5 text-green-500' />
      case 'dine-in':
        return <Users className='w-5 h-5 text-purple-500' />
      default:
        return null
    }
  }

  const getStatusColor = () => {

    switch (status) {
      case 'urgente':
        return 'bg-red-100 border-1-4 border-red-500'
      case 'en-progreso':
        return 'bg-yellow-100 border-1-4 border-yellow-500'
      case 'listo':
        return 'bg-green-100 border-1-4 border-green-500'
      default:
        return 'bg-white'
    }
  }

  return (
    <div className={`rounded-lg shadow-md p-4 mb-4 flex-shrink-0 w-80 ${getStatusColor()}`}>
      <div className="flex justify-between items-center mb-2">

        <div className="flex items-center">
          <span className="text-lg font-bold mr-2">{time}</span>
          {getTypeIcon()}
        </div>
        <div className="text-sm text-gray-500">#{number} {customer}</div>
      </div>
    </div>
  )



}

export default OrderCard











// import React from 'react';
// import { Truck, UserCheck, Users } from 'lucide-react';

// const OrderCard = ({ time, type, number, customer, items, status }) => (
//   <div className="bg-white rounded-lg shadow-md p-4 mb-4 w-64"> {/* Ancho fijo */}
//     <div className="flex justify-between items-center mb-2">
//       <div className="flex items-center">
//         <span className="text-lg font-bold mr-2">{time}</span>
//         {type === 'delivery' && <Truck className="w-5 h-5 text-blue-500" />}
//         {type === 'takeout' && <UserCheck className="w-5 h-5 text-green-500" />}
//         {type === 'dine-in' && <Users className="w-5 h-5 text-purple-500" />}
//       </div>
//       <div className="text-sm text-gray-500">#{number} {customer}</div>
//     </div>
//     {Object.entries(items).map(([category, dishes]) => (
//       <div key={category} className="mb-2">
//         <h3 className="font-semibold uppercase text-sm text-gray-700">{category}</h3>
//         <ul>
//           {dishes.map((dish, index) => (
//             <li key={index} className="text-sm">{dish}</li>
//           ))}
//         </ul>
//       </div>
//     ))}
//     <button className="w-full bg-green-500 text-white py-2 rounded-md mt-2">
//       {status === 'ready' ? 'Marcar como lista' : 'Comenzar'}
//     </button>
//   </div>
// );

// export default OrderCard;
