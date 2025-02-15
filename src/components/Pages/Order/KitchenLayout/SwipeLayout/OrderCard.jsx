import React from 'react'
import OrderHeader from '../../Base/OrderHeader';
import OrderItems from '../../Base/OrderItem/OrderItems';
import ActionButton from '../../Base/ActionButton';
import { useSwipe } from '../../../../../hooks/useSwipe';
import UrgentAlert from '../../Base/UrgentAlert';
import { Timer } from 'lucide-react';

function OrderCard({ orders = [],allorders, tableName, total_people, type, customer, expandedItemId, setExpandedItemId, updateKitchenStatus, selectedItems, onToggleSelection }) {
  const {
    containerRef,
    dragOffset,
    onTouchStart,
    onTouchEnd,
    onMouseDown,
    getTransform,
    isDragging
  } = useSwipe({
    direction: 'vertical',
    enabled: true,
    currentPage: 1,
    totalPages: 1,
  });
  // console.log(selectedItems);
  const getStatusColor = (status, type_display) => {
    if (type_display == 2) {
      switch (status) {
        case 'listo-para-servir':
          return 'bg-green-100 border-l-4 border-green-500';
        case 'servido':
          return 'bg-blue-100 border-l-4 border-blue-500';
        case 'en-cocina':
          return 'bg-yellow-100 border-l-4 border-yellow-500';
        default:
          return 'bg-gray-300';
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
          return 'bg-gray-300';
      }
    }
  };
  // console.log(selectedItems);
  return (
    <div className="rounded-lg shadow-md flex-shrink-0 w-full h-[calc(90vh-6rem)] flex flex-col bg-gray-200">
      <div className="p-2 sm:p-2">
        <OrderHeader
          type={type}
          customer={customer}
          total_people={total_people}
        />
      </div>

      {/* Contenedor de órdenes con scroll */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto scrollbar-container p-2"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        <div className="p-2 sm:p-2 flex-1 overflow-hidden">
          <div
            className="h-full overflow-auto scrollbar-container"
            style={{
              transform: getTransform(),
              transition: 'transform 0.1s ease-out'
            }}
          >
            {orders?.map(order => (
              <div
                key={`${order.order_main_cd}_${order.order_count}`}
                className={`mb-3 p-3 rounded-lg ${getStatusColor(order.status, order.type_display)}`}
              >
                {/* Header de cada orden */}
                <div className="flex justify-between items-center mb-2">
                  <span className="inline-flex items-center gap-4 text-sm font-medium">
                    {order.formatted_time}
                    {order.status === 'urgente' ? (
                      <span className="ml-1 inline-flex items-center text-red-500">
                        <UrgentAlert className="w-5 h-5" />
                        <span>{order.elapsedTime}分経過 </span>
                      </span>
                    ) : (
                      <span className="ml-1 inline-flex items-center text-blue-700">
                        <Timer className="w-5 h-5" />
                        <span>{order.elapsedTime}分経過 </span>
                      </span>
                    )}
                  </span>

                  <span className="text-sm">
                    #{`${order.order_main_cd}-${order.order_count}`}
                  </span>
                </div>

                {/* Usar OrderItems para los items de la orden */}
                <OrderItems
                  items={order.items}
                  allorders={allorders}
                  expandedItemId={expandedItemId}
                  setExpandedItemId={setExpandedItemId}
                  updateKitchenStatus={updateKitchenStatus}
                  type_display={order.type_display}  // Aquí está el error
                  selectedItems={selectedItems}
                  onToggleSelection={onToggleSelection}
                />
              </div>
            ))}
          </div>
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