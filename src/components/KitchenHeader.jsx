import React from 'react';

const KitchenHeader = ({ pendingCount, inProgressCount }) => (
  <div className="flex justify-between items-center mb-4">
    <h1 className="text-2xl font-bold">COCINA</h1>
    <div className="flex items-center">
      <span className="mr-4">{pendingCount} en espera</span>
      <span>{inProgressCount} en curso</span>
    </div>
  </div>
);

export default KitchenHeader;
