import React, { useState } from 'react';
import OrderCard from './components/OrderCard';
import { Clock, Truck, ShoppingBag, Users, AlertTriangle } from 'lucide-react';

// const OrderCard = ({ time, type, number, customer, items, status, elapsedTime }) => {
//   const getTypeIcon = () => {
//     switch (type) {
//       case 'delivery':
//         return <Truck className="w-5 h-5 text-blue-500" />;
//       case 'takeout':
//         return <ShoppingBag className="w-5 h-5 text-green-500" />;
//       case 'dine-in':
//         return <Users className="w-5 h-5 text-purple-500" />;
//       default:
//         return null;
//     }
//   };

//   const getStatusColor = () => {
//     switch (status) {
//       case 'urgente':
//         return 'bg-red-100 border-l-4 border-red-500';
//       case 'en-progreso':
//         return 'bg-yellow-100 border-l-4 border-yellow-500';
//       case 'listo':
//         return 'bg-green-100 border-l-4 border-green-500';
//       default:
//         return 'bg-white';
//     }
//   };

//   return (
//     <div className={`rounded-lg shadow-md p-4 mb-4 flex-shrink-0 w-80 ${getStatusColor()}`}>
//       <div className="flex justify-between items-center mb-2">
//         <div className="flex items-center">
//           <span className="text-lg font-bold mr-2">{time}</span>
//           {getTypeIcon()}
//         </div>
//         <div className="text-sm text-gray-500">#{number} {customer}</div>
//       </div>
//       {status === 'urgente' && (
//         <div className="flex items-center text-red-500 mb-2">
//           <AlertTriangle className="w-4 h-4 mr-1" />
//           <span className="text-sm">{elapsedTime}</span>
//         </div>
//       )}
//       {Object.entries(items).map(([category, dishes]) => (
//         <div key={category} className="mb-2">
//           <h3 className="font-semibold uppercase text-sm text-gray-700">{category}</h3>
//           <ul>
//             {dishes.map((dish, index) => (
//               <li key={index} className="text-sm">{dish}</li>
//             ))}
//           </ul>
//         </div>
//       ))}
//       <button className="w-full bg-green-500 text-white py-2 rounded-md mt-2 hover:bg-green-600 transition-colors">
//         {status === 'listo' ? 'Marcar como listo' : 'Comenzar'}
//       </button>
//     </div>
//   );
// };

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([
    {
      time: '12:25',
      type: 'delivery',
      number: '0431',
      customer: 'Tomás R.',
      items: {
        PLATOS: ['1 Pizza Vegetariana', '1 Pizza Margarita', '2 Hamburguesa Triple'],
        POSTRES: ['1 Tiramisú', '2 Ensalada de frutas']
      },
      status: 'urgente',
      elapsedTime: '00:05:35'
    },
    {
      time: '12:40',
      type: 'takeout',
      number: '0432',
      customer: 'María J.',
      items: {
        ENTRANTES: ['1 Ensalada César', '2 Ensalada de Queso de Cabra'],
        PLATOS: ['1 Pizza Vegetariana', '2 Pizza India'],
        POSTRES: ['1 Ensalada de frutas']
      },
      status: 'en-progreso',
    },
    {
      time: '12:45',
      type: 'dine-in',
      number: '0433',
      customer: 'Mesa 6',
      items: {
        ENTRANTES: ['2 Ensalada Auvernia', '1 Ensalada Verde'],
        PLATOS: ['1 Hamburguesa con Queso', '2 Pizza Calzone', '1 Bruschetta Provenzal'],
        POSTRES: ['2 Mousse de Chocolate', '1 Crema Caramelo']
      },
      status: 'listo',
    },
    {
      time: '12:46',
      type: 'dine-in',
      number: '0434',
      customer: 'Mesa 12',
      items: {
        PLATOS: ['1 Pizza Vegetariana', '1 Hamburguesa del Mes', '1 Tostadas'],
        POSTRES: ['1 Tiramisú', '2 Ensalada de frutas']
      },
      status: 'no-iniciado',
    }
  ]);

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">COCINA</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-1 text-yellow-500" />
            <span>4 en espera</span>
          </div>
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-1 text-red-500" />
            <span>3 en curso</span>
          </div>
        </div>
      </div>
      <div className="flex overflow-x-auto space-x-4 pb-4">
        {orders.map((order, index) => (
          <OrderCard key={index} {...order} />
        ))}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 flex justify-between border-t border-gray-200">
        <button className="text-green-500 font-semibold">Pedidos activos</button>
        <button className="text-gray-500">En 30 min</button>
        <button className="text-gray-500">Historial</button>
      </div>
    </div>
  );
};

export default KitchenDisplay;

// import React from "react";
// import KitchenDisplay from "./pages/KitchenDisplay";  // Importamos KitchenDisplay

// function App() {
//   return (
//     <div className="App">
//       {/* Navbar */}
//       <nav className="navbar">
//         <div className="navbar-left">
//           <div className="navbar-title">COCINA</div>
//           {/* La información de "en espera" y "en curso" ahora se calcula dentro del componente KitchenDisplay */}
//         </div>
//         <div className="navbar-right">
//           <button className="navbar-button">Configuración</button>
//         </div>
//       </nav>

//       {/* Sección de órdenes */}
//       <div className="order-section">
//         <KitchenDisplay /> {/* Muestra todas las órdenes */}
//       </div>
//     </div>
//   );
// }

// export default App;
