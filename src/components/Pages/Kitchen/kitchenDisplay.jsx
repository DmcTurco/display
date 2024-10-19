import React, { useState, useEffect } from 'react';
import KitchenHeader from '../../Header/KitchenHeader';
import OrderList from '../Order/OrderList';
import KitchenFooter from '../../Footer/KitchenFooter';
import useOrders from '../../../js/useOrders';

const KitchenDisplay = ({setPendingCount,setInProgressCount}) => {

  const { orders,loading, error, getOrders } = useOrders()  

  useEffect(()=>{
    getOrders().then(() => {
      console.log( orders)
      const pendingCount = orders.filter( (order) => order.status === "no-iniciado").length;
      const inProgressCount = orders.filter((order) => order.status === "en-progreso").length;
      setPendingCount(pendingCount)
      setInProgressCount(inProgressCount)
    }) ;

  },[])

  if (loading) {
    return <div>Cargando pedidos...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <OrderList orders={orders} />
    </div>
  );
};

export default KitchenDisplay;
