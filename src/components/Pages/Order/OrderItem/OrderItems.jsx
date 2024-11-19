import React, { useState } from 'react';
import { useOrders } from '../../../../js/useOrders';
import { CheckCircle2, Clock, X } from 'lucide-react';
import Modal from './modal';
import MainItem from './MainItem';
import { useSwipe } from '../../../../js/useSwipe';



const OrderItems = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { updateKitchenStatus } = useOrders();

  // Usar el hook de swipe para scroll vertical
  const {
    containerRef,
    dragOffset,
    onTouchStart,
    onTouchEnd,
    onMouseDown,
    getTransform
  } = useSwipe({
    direction: 'vertical',
    enabled: true,
    currentPage: 1, // para scroll vertical esto no importa tanto
    totalPages: 1,
  });

  if (!items) return null;
  // Organizamos los items en una estructura jerárquica
  const organizedItems = items.reduce((acc, item) => {
    if (!item.pid) {
      // Es un item principal
      acc[item.uid] = {
        ...item,
        additionalItems: []
      };
    } else {
      // Es un item adicional
      if (acc[item.pid]) {
        acc[item.pid].additionalItems.push(item);
      }
    }
    return acc;
  }, {});

  const getStatusStyle = (status) => {
    switch (status) {
      case 0:
        return 'hover:bg-gray-50';
      case 1:
        return 'bg-yellow-200 hover:bg-yellow-100';
      case 2:
        return 'bg-green-200';
      default:
        return 'hover:bg-gray-50';
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 1:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  }

  const handleItemClick = (item, isAdditionalItem = false) => {
    if (item.kitchen_status !== 1) {
      setSelectedItem(item);
      setShowModal(true);
    }
  };

  const handleConfirm = async () => {
    if (!selectedItem) return;

    try {
      if (selectedItem) {
        await updateKitchenStatus(selectedItem.id, 1);
      }
      setShowModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
    }
  };

  const areAllAdditionalsComplete = (additionalItems) => {
    return additionalItems.every((item) => item.kitchen_status === 1);
  };

  return (
    <>
      <div 
        ref={containerRef}
        className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{
          transform: getTransform(),
          transition: 'transform 0.1s ease-out'
        }}
      >
        {Object.values(organizedItems).map((item) => {
          const hasAdditionals = item.additionalItems.length > 0;
          const allAdditionalsComplete = hasAdditionals && areAllAdditionalsComplete(item.additionalItems);
          
          return (
            <MainItem
              key={item.uid}
              item={item}
              onItemClick={handleItemClick}
              allAdditionalsComplete={allAdditionalsComplete}
              hasAdditionals={hasAdditionals}
            />
          );
        })}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="text-center w-96">
          <div className="mx-auto my-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Confirmar cambio de estado
            </h3>
            <p className="text-sm text-gray-500">
              ¿Deseas marcar {selectedItem?.quantity}x {selectedItem?.name} como en progreso?
            </p>
          </div>
          <div className="flex gap-4 justify-end mt-6">
            <button
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
              onClick={handleConfirm}
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default OrderItems;
