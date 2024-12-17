import React from 'react';
import OrderHeader from '../Base/OrderHeader';
import OrderItems from '../Base/OrderItem/OrderItems';
import ActionButton from '../Base/ActionButton';

function OrderGridCard({ time, type, number, customer, items, status, elapsedTime, expandedItemId, setExpandedItemId }) {
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
    <div className={`rounded-lg shadow-md h-full flex flex-col ${getStatusColor()}`}>
       <div className="p-2 sm:p-2">
        <OrderHeader
          time={time}
          type={type}
          number={number}
          customer={customer}
          status={status}
          elapsedTime={elapsedTime}
        />
      </div>
      <div className="p-2 flex-1 overflow-y-auto">
        <OrderItems 
          items={items} 
          expandedItemId={expandedItemId} 
          setExpandedItemId={setExpandedItemId} 
        />
      </div>
      <div className="p-1 sm:p-1 mt-auto">
        <ActionButton status={status} />
      </div>
    </div>
  );
}

export default OrderGridCard;