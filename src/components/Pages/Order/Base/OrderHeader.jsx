import { ShoppingBag, Timer, Truck, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import UrgentAlert from './UrgentAlert';

const OrderHeader = ({ time, type, number, customer, status, elapsedTime }) => {
  const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('kitchenConfig')) || {});

  const getFontSizeClass = () => {
    switch (config.fontSize) {
      case 'small':
        return 'text-sm sm:text-base'; // Aumentado desde text-xs
      case 'large':
        return 'text-xl sm:text-2xl'; // Aumentado desde text-base
      default: // normal
        return 'text-base sm:text-lg'; // Aumentado desde text-sm
    }
  };

  const getQuantityFontSizeClass = () => {
    switch (config.fontSize) {
      case 'small':
        return 'text-sm sm:text-base'; // Aumentado desde text-xs
      case 'large':
        return 'text-xl sm:text-2xl'; // Aumentado desde text-base
      default: // normal
        return 'text-base sm:text-lg'; // Aumentado desde text-sm
    }
  };

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
      <div className="flex items-center justify-between">
        {/* Título con icono - lado izquierdo */}
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <h2 className={`${getFontSizeClass()} font-bold text-gray-800`}>
            テーブル : {customer}
          </h2>
        </div>

        {/* Cantidad de personas - lado derecho */}
        <div className="flex items-center gap-2">
          <h2 className={`${getFontSizeClass()} font-bold text-gray-800`}>
            １２人
          </h2>
        </div>
      </div>

      {/* Información en una sola fila */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 px-1">
        <div className="flex items-center">
          <span className={`${getQuantityFontSizeClass()} inline-flex items-center gap-4`}>
            {time}
            {status === 'urgente' ? (
              <span className="ml-1 inline-flex items-center text-red-500">
                <UrgentAlert className="w-5 h-5" />
                <span>{elapsedTime}分</span>
              </span>
            ) : (
              <span className="ml-1 inline-flex items-center text-blue-500">
                <Timer className="w-5 h-5" />
                <span>{elapsedTime}分</span>
              </span>
            )}
          </span>
        </div>
        <span className={`${getQuantityFontSizeClass()}`}>#{number}</span>
      </div>
    </div>
  );
};


export default OrderHeader;
