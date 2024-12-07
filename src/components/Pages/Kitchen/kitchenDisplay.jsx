import React, { useState, useEffect } from "react";
import OrderList from "../Order/OrderList";
import { useOrders } from "../../../js/useOrders";
import { FaClipboardList, FaSpinner, FaWifi, FaServer } from "react-icons/fa";
import { useKitchenSetup } from "../../../hooks/useKitchenSetup";

const KitchenDisplay = ({ setPendingCount, setInProgressCount, setUrgentCount }) => {
  const [expandedItemId, setExpandedItemId] = useState(null);
  const { orders, loading, error, getTodayOrders } = useOrders();
  const { config, initializeConfig } = useKitchenSetup();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Inicializar configuración
  useEffect(() => {
    initializeConfig();
  }, []);

  // Manejar conexión y obtener órdenes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (config?.cd) {
        getTodayOrders(config.cd);
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (config?.cd && isOnline) {
      getTodayOrders(config.cd).finally(() => {
        setIsInitialLoad(false);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [config?.cd, isOnline]);


  // Actualizar contadores
  useEffect(() => {
    if (!Array.isArray(orders) || orders.length === 0) {
      setPendingCount(0);
      setInProgressCount(0);
      setUrgentCount(0);
      return;
    }

    const counts = orders.reduce((acc, order) => {
      switch (order.status) {
        case 'no-iniciado':
          acc.pending += 1;
          break;
        case 'en-progreso':
          acc.inProgress += 1;
          break;
        case 'urgente':
          acc.urgent += 1;
          break;
      }
      return acc;
    }, { pending: 0, inProgress: 0, urgent: 0 });

    setPendingCount(counts.pending);
    setInProgressCount(counts.inProgress);
    setUrgentCount(counts.urgent);
  }, [orders, setPendingCount, setInProgressCount, setUrgentCount]);

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

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center animate-pulse">
            <FaServer className="text-yellow-500 text-6xl mx-auto mb-4" />
            <p className="text-2xl font-semibold text-gray-700">Error de conexión con el servidor</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      );
    }

    // Solo mostrar la pantalla de carga durante la carga inicial
    if (isInitialLoad && loading) {
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

    if (!Array.isArray(orders) || orders.length === 0) {
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

    return (
      <OrderList
        orders={orders}
        expandedItemId={expandedItemId}
        setExpandedItemId={setExpandedItemId}
      />
    );
  };

  return (
    <div className="bg-gray-100 flex flex-col h-full">
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
};

export default KitchenDisplay;
