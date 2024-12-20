import React, { useState, useEffect } from "react";
import { FaClipboardList, FaSpinner, FaWifi, FaServer } from "react-icons/fa";
import { useKitchenSetup } from "../../../hooks/useKitchenSetup";
import { useOrders } from "../../../js/useOrders";
import OrderSwipe from "../Order/SwipeLayout/OrderSwipe";
import OrderGrid from "../Order/GridLayout/OrderGrid";

const KitchenDisplay = ({ setPendingCount, setInProgressCount, setUrgentCount }) => {
  const [expandedItemId, setExpandedItemId] = useState(null);
  const { orders, loading, error, getTodayOrders, updateKitchenStatus} =  useOrders();
  const { config, initializeConfig } = useKitchenSetup();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Obtener el tipo de layout de la configuración
  const layoutType = (config?.layoutType || 'swipe');

  // Inicializar configuración
  useEffect(() => {
    console.log("Use Effect of initialize")
    initializeConfig();
  }, []);

  // Manejar conexión y obtener órdenes
  useEffect(() => {
    console.log("Use Effect of checking connection")
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
        console.log("setting load from 2 if")
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
    console.log("Use Effect of update counters")
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


  const renderOrderLayout = () => {
    const layoutProps = {
      orders,
      expandedItemId,
      setExpandedItemId,
      updateKitchenStatus
    };

    switch (layoutType) {
      case 'grid':
        return <OrderGrid {...layoutProps} />;
      case 'swipe':
      default:
        return <OrderSwipe {...layoutProps} />;
    }
  };

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

    return renderOrderLayout();
  };

  return (
    <div className="bg-gray-100 flex flex-col h-full">
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
};

export default KitchenDisplay;
