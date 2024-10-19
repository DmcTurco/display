import { ShoppingBag, Truck, Users } from 'lucide-react';
import React from 'react'


const OrderHeader = ({ time, type, number, customer }) => {
    const getTypeIcon = () => {
        switch (type) {
            case 'delivery':
                return <Truck className="w-5 h-5 text-blue-500" />;
            case 'takeout':
                return <ShoppingBag className="w-5 h-5 text-green-500" />;
            case 'dine-in':
                return <Users className="w-5 h-5 text-purple-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
                <span className="text-lg font-bold mr-2">{time}</span>
                {getTypeIcon()}
            </div>
            <div className="text-sm text-gray-500">#{number} {customer}</div>
        </div>
    )
}

export default OrderHeader