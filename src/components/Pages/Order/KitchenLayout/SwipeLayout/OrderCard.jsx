import React from 'react'
import OrderHeader from '../../Base/OrderHeader';
import OrderItems from '../../Base/OrderItem/OrderItems';
import ActionButton from '../../Base/ActionButton';

function OrderCard({ time, type, type_display, number, customer, items, status, elapsedTime, expandedItemId, setExpandedItemId, updateKitchenStatus }) {
  const getStatusColor = () => {
    if (type_display == 2) {
      switch (status) {
        case 'listo-para-servir':
          return 'bg-green-100 border-l-4 border-green-500';
        case 'servido':
          return 'bg-blue-100 border-l-4 border-blue-500';
        case 'en-cocina':
          return 'bg-yellow-100 border-l-4 border-yellow-500';
        default:
          return 'bg-gray-200';
      }
    } else {
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
    }
  };

  return (
    <div className={`rounded-lg shadow-md flex-shrink-0 w-full h-[calc(90vh-6rem)] flex flex-col ${getStatusColor()}`}>
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
      <div className="p-2 sm:p-2 flex-1 overflow-hidden">
        <div className="h-full overflow-auto scrollbar-container">
          <OrderItems
            items={items}
            expandedItemId={expandedItemId}
            setExpandedItemId={setExpandedItemId}
            updateKitchenStatus={updateKitchenStatus}
            type_display={type_display}
          />
        </div>
      </div>

      <style>{`
        .scrollbar-container {
          scrollbar-width: thin;
          scrollbar-color: #9CA3AF #F3F4F6;
          -webkit-overflow-scrolling: touch;
        }

        .scrollbar-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .scrollbar-container::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 4px;
        }

        .scrollbar-container::-webkit-scrollbar-thumb {
          background-color: #9CA3AF;
          border-radius: 4px;
          border: 2px solid #F3F4F6;
        }

        .scrollbar-container::-webkit-scrollbar-thumb:hover {
          background-color: #6B7280;
        }

        /* Estilos específicos para dispositivos táctiles */
        @media (hover: none) and (pointer: coarse) {
          .scrollbar-container::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
          
          .scrollbar-container::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.8);
            border: none;
          }
        }
      `}</style>
    </div>
  );
}

export default OrderCard;