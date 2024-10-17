import React, { useState, useEffect } from 'react';
import KitchenHeader from '../components/KitchenHeader';
import OrderList from '../components/OrderList';
import KitchenFooter from '../components/KitchenFooter';
import useOrders from '../js/useOrders';

const KitchenDisplay = () => {

  const { orders,loading, error, getOrders } = useOrders()  // opcional ya que cuando se abusa del useEffect

  useEffect(()=>{
    getOrders();
  },[])


  if (loading) {
    return <div>Cargando pedidos...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const pendingCount = orders.filter(order => order.status === 'not-started').length;
  const inProgressCount = orders.filter(order => order.status === 'in-progress').length;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <KitchenHeader pendingCount={pendingCount} inProgressCount={inProgressCount} />
      <OrderList orders={orders} />
      <KitchenFooter />
    </div>
  );
};

export default KitchenDisplay;
