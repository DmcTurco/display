import React from 'react';

const KitchenFooter = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-white p-4 flex justify-between">
    <button className="text-green-500">Órdenes activas</button>
    <button className="text-gray-500">En 30 minutos</button>
    <button className="text-gray-500">Historial</button>
  </div>
);

export default KitchenFooter;
