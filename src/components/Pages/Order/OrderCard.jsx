import React, { useState,useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import OrderHeader from './OrderHeader';
import OrderItems from './OrderItems';
import UrgentAlert from './UrgentAlert';
import ActionButton from './ActionButton';

function OrderCard({ time, type, number, customer, items, status, elapsedTime }) {

  const getStatusColor = () => {
    switch (status) {
      case 'urgente':
        return 'bg-red-100 border-l-4 border-red-500';
      case 'en-progreso':
        return 'bg-yellow-100 border-l-4 border-yellow-500';
      case 'listo':
        return 'bg-green-100 border-l-4 border-green-500';
      default:
        return 'bg-gray-200';
    }
  };
  
  return (
    <div className={`rounded-lg shadow-md flex-shrink-0 w-full h-[calc(80vh-4rem)] flex flex-col ${getStatusColor()}`}>
      <div className="p-2 sm:p-4">
        <OrderHeader time={time} type={type} number={number} customer={customer} status = {status} elapsedTime = {elapsedTime} />
      </div>
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 custom-scrollbar">
        <OrderItems items={items} />
      </div>
      <div className="p-2 sm:p-4 border-t mt-auto">
        <ActionButton status={status} />
      </div>
      
    </div>

    
  );

}

export default OrderCard
