import React, { useState, useEffect } from 'react';
import OrderList from '../Order/OrderList';
import { useOrders } from '../../../js/useOrders';
import { FaExclamationCircle, FaClipboardList, FaSpinner, FaWifi, FaServer } from 'react-icons/fa';

const KitchenDisplay = ({ setPendingCount, setInProgressCount, setUrgentCount }) => {

  const { orders, loading, error, getTodayOrders } = useOrders()
  const [refreshInterval, setRefreshInterval] = useState(30000);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerError, setIsServerError] = useState(false);
  const [showReconnectBanner, setShowReconnectBanner] = useState(false);



  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectBanner(true);
      setTimeout(() => setShowReconnectBanner(false), 3000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);



  useEffect(() => {
    const fetchOrders = async () => {
      try {
        await getTodayOrders();
        setIsServerError(false);
      } catch (err) {
        setIsServerError(true);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);



  useEffect(() => {
    if (orders?.length > 0) {
      const pendingCount = orders.filter((order) => order.status == "no-iniciado").length
      const inProgressCount = orders.filter((order) => order.status === "en-progreso").length;
      const urgentCount = orders.filter((order) => order.status == "urgente").length;
      // const inProgressCount = orders.filter((order) => order.status === "en-progreso").length;
      setUrgentCount(urgentCount);
      setPendingCount(pendingCount)
      setInProgressCount(inProgressCount)
    }
  }, [orders, setPendingCount, setInProgressCount]);


  const renderContent = () => {
    if (!isOnline) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center animate-pulse">
            <FaWifi className="text-red-500 text-6xl mx-auto mb-4" />
            <p className="text-2xl font-semibold text-gray-700">Sin conexión a Internet</p>
            <p className="text-sm text-gray-500">Por favor, verifica tu conexión.</p>
          </div>
        </div>
      );
    }

    if (isServerError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center animate-pulse">
            <FaServer className="text-yellow-500 text-6xl mx-auto mb-4" />
            <p className="text-2xl font-semibold text-gray-700">Error de conexión con el servidor</p>
            <p className="text-sm text-gray-500">El servidor de órdenes no responde. Intenta nuevamente más tarde.</p>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <FaSpinner className="text-blue-500 text-6xl animate-spin mx-auto mb-4" />
            <p className="text-2xl font-semibold text-gray-700">Cargando pedidos...</p>
            <p className="text-sm text-gray-500">Por favor, espere un momento.</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <FaExclamationCircle className="text-red-500 text-6xl mx-auto mb-4 animate-bounce" />
            <p className="text-2xl font-semibold text-red-700">Error al cargar las Ordenes</p>
            <p className="text-sm text-gray-500">Por favor, inténtalo de nuevo más tarde.</p>
          </div>
        </div>
      );
    }

    if (orders?.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center animate-bounce">
            <FaClipboardList className="text-blue-500 text-6xl mx-auto mb-4" />
            <p className="text-2xl font-semibold text-gray-700">No hay órdenes disponibles</p>
            <p className="text-sm text-gray-500">Por favor, inténtalo más tarde.</p>
          </div>
        </div>
      );
    }

    return <OrderList orders={orders} />;
  };


  return (
    <div className="bg-gray-100 flex flex-col h-full">
      {showReconnectBanner && (
        <div className="absolute top-0 left-0 w-full bg-green-500 text-white text-center py-2 animate-slideDown z-50">
          Reconectado exitosamente
        </div>
      )}
      {/* Container principal con altura fija */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default KitchenDisplay;
