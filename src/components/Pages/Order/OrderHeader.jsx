import { ShoppingBag, Truck, Users } from "lucide-react";
import React from "react";
import UrgentAlert from './UrgentAlert';

const OrderHeader = ({ time, type, number, customer, status, elapsedTime }) => {
  const getTypeIcon = () => {
    switch (type) {
      case "delivery":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "takeout":
        return <ShoppingBag className="w-5 h-5 text-green-500" />;
      case 1:
        return <Users className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {/* Título con icono */}
      <div className="flex items-center justify-center gap-2">
        {getTypeIcon()}
        <h2 className="text-sm sm:text-base font-bold text-gray-800">
          mesa: {customer}
        </h2>
      </div>

      {/* Información en una sola fila */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 px-1">
        <div className="flex items-center">
          <span className="inline-flex items-center">
            {time}
            {status === 'urgente' && (
              <span className="ml-1 inline-flex items-center">
                <UrgentAlert elapsedTime={elapsedTime} />
              </span>
            )}
          </span>
        </div>
        <span>#{number}</span>
      </div>
    </div>
  );
};


export default OrderHeader;
