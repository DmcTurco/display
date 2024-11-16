import React, { useState } from 'react';
import { useOrders } from '../../../js/useOrders';
import { CheckCircle2, Clock } from 'lucide-react';

const OrderItems = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { updateKitchenStatus } = useOrders();

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

  const handleItemClick = async (item, isAdditionalItem = false) => {
    console.log('Item clickeado:', item);
    if (item.kitchen_status !== 1) {
      try {
        if (isAdditionalItem) {
          // Cuando haces click en un hijo (plato individual del combo)
          await updateKitchenStatus(item.id, 1); // Este hijo se pintará de verde
          // Al hacer la llamada a la API y actualizarse el estado,
          // el componente se re-renderizará mostrando este item en verde
        } else {
          // Cuando intentas hacer click en el padre (el combo completo)
          const hasAdditionalItems =
            item.additionalItems && item.additionalItems.length > 0;
          if (!hasAdditionalItems) {
            // Si no tiene items adicionales, actualizamos directamente
            console.log("Actualizando item principal sin hijos:", item.id);
            await updateKitchenStatus(item.id, 1);
          } else {
            // Lógica para items con adicionales
            const allAdditionalsComplete = item.additionalItems.every(
              (additionalItem) => additionalItem.kitchen_status === 1
            );

            if (allAdditionalsComplete) {
              await updateKitchenStatus(item.id, 1);
            }
          }
        }
      } catch (error) {
        console.error('Error al actualizar el estado:', error);
      }
    }
  };

  const areAllAdditionalsComplete = (additionalItems) => {
    return additionalItems.every((item) => item.kitchen_status === 1);
  };

  return (
    <div className="space-y-4">
      {Object.values(organizedItems).map((item) => {
        const hasAdditionals = item.additionalItems.length > 0;
        const allAdditionalsComplete = hasAdditionals && areAllAdditionalsComplete(item.additionalItems);
        const isCompleted = item.kitchen_status === 1; // Para mejor legibilidad

        return (
          <div
            key={item.uid}
            onClick={() => handleItemClick(item)}
            className={`
              rounded-lg p-3 shadow-sm
              transition-all duration-300
              ${isCompleted ? "bg-green-200" : "bg-white hover:bg-green-200"}
              ${isCompleted || hasAdditionals ? "" : "cursor-pointer"}
            `}
          >
            {/* Item principal */}
            <div className="flex items-start justify-between">
              <div className="flex gap-1">
                <span className="font-medium text-sm text-gray-700">
                  {item.quantity}x
                </span>
                <span className="flex-1 text-sm">{item.name}</span>
              </div>
              {(isCompleted || allAdditionalsComplete) && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>

            {/* Items adicionales */}
            {hasAdditionals && (
              <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-2">
                {item.additionalItems.map((additionalItem) => {
                  const isAdditionalCompleted = additionalItem.kitchen_status === 1;
                  return (
                    <div
                      key={additionalItem.uid}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(additionalItem, true);
                      }}
                      className={`
                        flex items-start justify-between gap-1 text-xs text-gray-600
                        transition-all duration-300
                        ${isAdditionalCompleted ? "bg-green-200" : "hover:bg-gray-200"}
                        ${isAdditionalCompleted ? "" : "cursor-pointer"}
                      `}
                    >
                      <div className="flex gap-1">
                        <span className="font-medium">
                          {additionalItem.quantity}x
                        </span>
                        <span className="flex-1">{additionalItem.name}</span>
                      </div>
                      {isAdditionalCompleted && (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderItems;
