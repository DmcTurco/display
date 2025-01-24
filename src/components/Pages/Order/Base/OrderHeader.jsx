import { ShoppingBag, Truck, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import UrgentAlert from './UrgentAlert';

const OrderHeader = ({ time, type, number, customer, status, elapsedTime }) => {
  const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('kitchenConfig')) || {});

  // useEffect(() => {
  //   const savedConfig = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
  //   setConfig(savedConfig);
  // }, []);

  const getFontSizeClass = () => {
    switch (config.fontSize) {
      case 'small':
        return 'text-xs sm:text-sm';
      case 'large':
        return 'text-base sm:text-lg';
      default: // normal
        return 'text-sm sm:text-base';
    }
  };

  const getQuantityFontSizeClass = () => {
    switch (config.fontSize) {
      case 'small':
        return 'text-xs sm:text-sm';
      case 'large':
        return 'text-base sm:text-lg';
      default: // normal
        return 'text-sm sm:text-base';
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
      {/* Título con icono */}
      <div className="flex items-center justify-center gap-2">
        {getTypeIcon()}
        <h2 className={`${getFontSizeClass()} font-bold text-gray-800`}>
          テーブル : {customer}
        </h2>
      </div>

      {/* Información en una sola fila */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 px-1">
        <div className="flex items-center">
          <span className={`${getQuantityFontSizeClass()} inline-flex items-center`}>
            {time}
            {status === 'urgente' && (
              <span className="ml-1 inline-flex items-center">
                <UrgentAlert elapsedTime={elapsedTime} />
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
