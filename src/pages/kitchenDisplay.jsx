import React, { useState, useEffect } from 'react';
import KitchenHeader from '../components/KitchenHeader';
import OrderList from '../components/OrderList';
import KitchenFooter from '../components/KitchenFooter';

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:5000/orders');
        if (!response.ok) {
          throw new Error('Error al obtener los pedidos');
        }
        const data = await response.json();
        setOrders(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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
