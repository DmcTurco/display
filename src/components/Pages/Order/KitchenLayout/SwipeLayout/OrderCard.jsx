import React from 'react'
import OrderHeader from '../../Base/OrderHeader';
import OrderItems from '../../Base/OrderItem/OrderItems';
import ActionButton from '../../Base/ActionButton';
import { useSwipe } from '../../../../../hooks/useSwipe';
import UrgentAlert from '../../Base/UrgentAlert';
import { Timer } from 'lucide-react';
import '../../../../../assets/styles/scrollingText.css';

function OrderCard({ orders = [], allorders, tableName, total_people, type, customer, expandedItemId, setExpandedItemId, updateKitchenStatus, selectedItems, onToggleSelection, onImageClick }) {
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

  const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
  const selectionMode = config.selectionMode || "1";
  // Función para verificar si todos los items de una mesa están seleccionados
  const areAllTableItemsSelected = () => {
    return orders.every(order =>
      order.items.every(item => {
        const isMainItemSelected = selectedItems.has(item.id);
        const areChildrenSelected = item.additionalItems ?
          item.additionalItems.every(child => selectedItems.has(child.id)) :
          true;
        return isMainItemSelected && areChildrenSelected;
      })
    );
  };

  // Función para verificar si todos los items de una orden están seleccionados
  const areAllOrderItemsSelected = (order) => {
    return order.items.every(item => {
      const isMainItemSelected = selectedItems.has(item.id);
      const areChildrenSelected = item.additionalItems ?
        item.additionalItems.every(child => selectedItems.has(child.id)) :
        true;
      return isMainItemSelected && areChildrenSelected;
    });
  };


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

  // Renderizado condicional para el header de la tabla
  const renderTableHeader = () => {
    if (selectionMode == 1) {
      return (
        <div
          className="p-2 sm:p-2 cursor-pointer hover:bg-gray-300 transition-colors"
          onClick={() => onToggleSelection(null, 'table', { orders }, null)}
          role="button"
          aria-pressed={areAllTableItemsSelected()}
        >
          <OrderHeader
            type={type}
            customer={customer}
            total_people={total_people}
            isSelected={areAllTableItemsSelected()}
          />
        </div>
      );
    } else {
      return (
        <div className="p-2 sm:p-2">
          <OrderHeader
            type={type}
            customer={customer}
            total_people={total_people}
          />
        </div>
      );
    }
  };

  // Renderizado condicional para el header de cada orden
  const renderOrderHeader = (order) => {
    if (selectionMode == 1) {
      return (
        <div
          className="flex justify-between items-center mb-2 cursor-pointer hover:bg-gray-50 rounded p-1"
          onClick={() => onToggleSelection(null, 'order', null, order)}
        >
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
      );
    } else {
      return (
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
      );
    }
  };


  return (
    <div className="rounded-lg shadow-md flex-shrink-0 w-full h-[calc(90vh-6rem)] flex flex-col bg-gray-200">
      {renderTableHeader()}
      {/* Contenedor de órdenes con scroll */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto scrollbar-container p-1"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        <div className="p-1 sm:p-1 flex-1 overflow-hidden">
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
                className={`mb-2 p-2 rounded-lg ${getStatusColor(order.status, order.type_display)}`}
              >
                {/* Header de cada orden con renderizado condicional */}
                {renderOrderHeader(order)}

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
                  isOrderSelected={areAllOrderItemsSelected(order)}
                  onImageClick={onImageClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderCard;