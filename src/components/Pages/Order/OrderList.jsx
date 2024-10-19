import React from 'react';
import OrderCard from './OrderCard';

const OrderList = ({ orders }) => (
  <div className="flex flex-nowrap overflow-x-auto p-4 space-x-4">
    {orders.map((order, index) => (
      <OrderCard key={index} {...order} />
    ))}
  </div>
);

export default OrderList;
