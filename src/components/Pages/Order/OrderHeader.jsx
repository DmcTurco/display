import { ShoppingBag, Truck, Users } from "lucide-react";
import React from "react";

const OrderHeader = ({ time, type, number, customer }) => {
  const getTypeIcon = () => {
    switch (type) {
      case "delivery":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "takeout":
        return <ShoppingBag className="w-5 h-5 text-green-500" />;
      case "dine-in":
        return <Users className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-4">
      {/* Título (Mesa o nombre de mesa) */}
      <h2 className="text-ls font-bold text-gray-800 mb-2 text-center">
        mesa: {customer}
      </h2>
      
      {/* Información secundaria en una fila */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center">
          <span className="mr-1">{time}</span>
          {getTypeIcon()}
        </div>
        <div>#{number}</div>
      </div>
    </div>
  );
};


export default OrderHeader;
