import React from 'react';

const KitchenFooter = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-white p-4 flex justify-between items-center shadow-lg border-t border-gray-200">
    <button className="text-green-600 font-semibold transition-transform transform hover:scale-105 hover:text-green-800 focus:outline-none">
      Pedidos activas
    </button>
    
    <button className="text-gray-600 font-semibold transition-transform transform hover:scale-105 hover:text-gray-800 focus:outline-none">
      En 30 min
    </button>
    
    <button className="text-gray-600 font-semibold transition-transform transform hover:scale-105 hover:text-gray-800 focus:outline-none">
      Historial
    </button>
  </div>
);

export default KitchenFooter;
