import React, { useState, useEffect } from "react";
import { FaClipboardList, FaSpinner, FaWifi, FaServer } from "react-icons/fa";
import { buildApiUrl } from "../../../hooks/useKitchenSetup";
import { useOrders } from "../../../js/useOrders";
import OrderSwipe from "../Order/KitchenLayout/SwipeLayout/OrderSwipe";
import OrderGrid from "../Order/KitchenLayout/GridLayout/OrderGrid";
import OrderTablet from "../Order/KitchenLayout/TabletLayout/OrderTablet";
import OrderTimeline from "../Order/KitchenLayout/TimelineLayout/OrderTimeline";
import ServingTimeline from "../Order/ServingLayout/ServingTimelineLayout/ServiceTimeline";
import ServingCompleted from "../Order/ServingLayout/ServingCompletedLayout/ServingCompleted";

const KitchenDisplay = ({ setPendingCount, setInProgressCount, setUrgentCount, config }) => {
  const [expandedItemId, setExpandedItemId] = useState(null);
  const API_URL = buildApiUrl();
  const { orders, completedOrders, loading, error, getTodayOrders, getTodayCompletedOrders, updateKitchenStatus } = useOrders(config, API_URL);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const localConfig = JSON.parse(localStorage.getItem('kitchenConfig')) || {};

  const layoutType = (localConfig?.layoutType || 'swipe');

  // Manejar conexión y obtener órdenes
  useEffect(() => {
    if (config) {  // Solo si hay config
      const handleOnline = () => {
        setIsOnline(true);
        // if (config?.cd) {
        getTodayOrders(config.cd);
        if (layoutType == 'serving-completed') {
          getTodayCompletedOrders(config.cd);
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
    }
  }, [config, isOnline]);

  // Actualizar contadores
  if (layoutType == 'swipe') {
    useEffect(() => {
      if (orders && config?.type != 2) {
        const counts = orders.reduce((acc, tableGroup) => {
          // Contar órdenes por estado en cada grupo
          const tableCounts = tableGroup.orders.reduce((tableAcc, order) => {
            switch (order.status) {
              case 'no-iniciado':
                tableAcc.pending++;
                break;
              case 'en-progreso':
                tableAcc.inProgress++;
                break;
              case 'urgente':
                tableAcc.urgent++;
                break;
            }
            return tableAcc;
          }, { pending: 0, inProgress: 0, urgent: 0 });

          // Sumar los contadores de la mesa actual a los acumulados
          return {
            pending: acc.pending + tableCounts.pending,
            inProgress: acc.inProgress + tableCounts.inProgress,
            urgent: acc.urgent + tableCounts.urgent
          };
        }, { pending: 0, inProgress: 0, urgent: 0 });

        // Actualizar los estados
        setPendingCount(counts.pending);
        setInProgressCount(counts.inProgress);
        setUrgentCount(counts.urgent);
      } else if (config?.type === 'serving') {
        setPendingCount(0);
        setInProgressCount(0);
        setUrgentCount(0);
      }
    }, [orders, config?.type]);
  } else {
    useEffect(() => {

      if (orders && config?.type != 2) {

        const pendingOrders = orders.filter(order => order.status == 'no-iniciado').length;
        const inProgressOrders = orders.filter(order => order.status === 'en-progreso').length;
        const urgentOrders = orders.filter(order => order.status === 'urgente').length;

        setPendingCount(pendingOrders);
        setInProgressCount(inProgressOrders);
        setUrgentCount(urgentOrders);

      } else if (config?.type === 'serving') {
        // Si es serving, establecer contadores en 0
        setPendingCount(0);
        setInProgressCount(0);
        setUrgentCount(0);
      }

    }, [orders, config?.type]);
  }

  const renderOrderLayout = () => {
    const layoutProps = {
      orders,
      completedOrders,
      expandedItemId,
      setExpandedItemId,
      updateKitchenStatus
    };

    switch (layoutType) {
      case 'grid':
        return <OrderGrid {...layoutProps} />;
      case 'table':
        return <OrderTablet {...layoutProps} />;
      case 'timeline':
        return <OrderTimeline {...layoutProps} />;
      // Nuevos casos para Serving
      case 'serving-timeline':
        return <ServingTimeline {...layoutProps} />;
      case 'serving-completed':
        return <ServingCompleted {...layoutProps} />;
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
            <p className="text-2xl font-semibold text-gray-700">インターネット接続がありません</p>
            <p className="text-sm text-gray-500">接続を確認してください。</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center animate-pulse">
            <FaServer className="text-yellow-500 text-6xl mx-auto mb-4" />
            <p className="text-2xl font-semibold text-gray-700">サーバー接続エラー</p>
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
            <p className="text-2xl font-semibold text-gray-700">読み込み中</p>
            <p className="text-sm text-gray-500">お待ちください</p>
          </div>
        </div>
      );
    }

    if (!Array.isArray(orders) || orders.length === 0 && layoutType !== 'serving-completed') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center animate-bounce">
            <FaClipboardList className="text-blue-500 text-6xl mx-auto mb-4" />
            <p className="text-2xl font-semibold text-gray-700">注文データがありません</p>
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
