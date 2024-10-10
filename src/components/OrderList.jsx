import React from 'react';
import OrderCard from './OrderCard';

const OrderList = ({ orders }) => (
  <div className="flex space-x-4 overflow-x-auto py-4">
    {orders.map((order, index) => (
      <OrderCard key={index} {...order} />
    ))}
  </div>
);

export default OrderList;
