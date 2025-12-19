import React, { useState, useEffect, useMemo } from "react";
import { FaClipboardList, FaSpinner, FaWifi, FaServer, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { buildApiUrl } from "../../../hooks/useKitchenSetup";
import { useOrders } from "../../../js/useOrders";
import OrderSwipe from "../Order/KitchenLayout/SwipeLayout/OrderSwipe";
import OrderGrid from "../Order/KitchenLayout/GridLayout/OrderGrid";
import OrderTablet from "../Order/KitchenLayout/TabletLayout/OrderTablet";
import OrderTimeline from "../Order/KitchenLayout/TimelineLayout/OrderTimeline";
import ServingTimeline from "../Order/ServingLayout/ServingTimelineLayout/ServiceTimeline";
import ServingCompleted from "../Order/ServingLayout/ServingCompletedLayout/ServingCompleted";
import OrderServing from "../Order/KitchenLayout/viewServingLayout/OrderServing";

const KitchenDisplay = ({ setPendingCount, setInProgressCount, setUrgentCount, config }) => {
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const API_URL = buildApiUrl();
  const localConfig = useMemo(() =>
    JSON.parse(localStorage.getItem('kitchenConfig')) || {},
    []
  );
  const layoutType = localConfig?.layoutType || 'swipe';

  const {
    orders,
    completedOrders,
    loading,
    error,
    getTodayOrders,
    getTodayCompletedOrders,
    updateKitchenStatus,
    enableSound,
    isSoundEnabled
  } = useOrders(config, API_URL);

  // Constantes para comparaciones
  const SERVING_TYPE = 2;
  const isServingType = Number(config?.type) === SERVING_TYPE;
  const isSwipeLayout = layoutType === 'swipe';
  const needsCompletedOrders = layoutType === 'serving-completed';
  const showsEmptyState = layoutType !== 'serving-completed' && layoutType !== 'kitchenServing';

  // Manejar conexión y obtener órdenes
  useEffect(() => {
    if (!config?.cd) return;

    const handleOnline = () => {
      setIsOnline(true);
      getTodayOrders(config.cd);
      if (needsCompletedOrders) {
        getTodayCompletedOrders(config.cd);
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (isOnline) {
      getTodayOrders(config.cd).finally(() => {
        setIsInitialLoad(false);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [config?.cd, isOnline, needsCompletedOrders]);

  // Calcular contadores basado en el layout
  const calculateCounters = useMemo(() => {
    if (isServingType || !orders || !Array.isArray(orders)) {
      return { pending: 0, inProgress: 0, urgent: 0 };
    }

    if (isSwipeLayout) {
      // Para swipe: orders es un array de grupos de mesa
      return orders.reduce((acc, tableGroup) => {
        const tableCounts = tableGroup.orders.reduce((tableAcc, order) => {
          switch (order.status) {
            case "no-iniciado":
              tableAcc.pending++;
              break;
            case "en-progreso":
              tableAcc.inProgress++;
              break;
            case "urgente":
              tableAcc.urgent++;
              break;
          }
          return tableAcc;
        }, { pending: 0, inProgress: 0, urgent: 0 });

        return {
          pending: acc.pending + tableCounts.pending,
          inProgress: acc.inProgress + tableCounts.inProgress,
          urgent: acc.urgent + tableCounts.urgent,
        };
      }, { pending: 0, inProgress: 0, urgent: 0 });
    } else {
      // Para otros layouts: orders es un array plano de órdenes
      return {
        pending: orders.filter(order => order.status === "no-iniciado").length,
        inProgress: orders.filter(order => order.status === "en-progreso").length,
        urgent: orders.filter(order => order.status === "urgente").length,
      };
    }
  }, [orders, isServingType, isSwipeLayout]);

  // Actualizar contadores
  useEffect(() => {
    setPendingCount(calculateCounters.pending);
    setInProgressCount(calculateCounters.inProgress);
    setUrgentCount(calculateCounters.urgent);
  }, [calculateCounters, setPendingCount, setInProgressCount, setUrgentCount]);

  const renderOrderLayout = () => {
    const layoutProps = {
      orders,
      completedOrders,
      expandedItemId,
      setExpandedItemId,
      updateKitchenStatus,
      enableSound,
      isSoundEnabled
    };

    const layoutComponents = {
      "grid": OrderGrid,
      "table": OrderTablet,
      "timeline": OrderTimeline,
      "kitchenServing": OrderServing,
      "serving-timeline": ServingTimeline,
      "serving-completed": ServingCompleted,
      "swipe": OrderSwipe,
    };

    const LayoutComponent = layoutComponents[layoutType] || OrderSwipe;
    return <LayoutComponent {...layoutProps} />;
  };

  const renderContent = () => {
    if (!isOnline) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center animate-pulse">
            <FaWifi className="text-red-500 text-6xl mx-auto mb-4" />
            <p className="text-2xl font-semibold text-gray-700">
              インターネット接続がありません
            </p>
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
            <p className="text-2xl font-semibold text-gray-700">
              サーバー接続エラー
            </p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      );
    }

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

    if (!Array.isArray(orders) || (orders.length === 0 && showsEmptyState)) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center animate-bounce">
            <FaClipboardList className="text-blue-500 text-6xl mx-auto mb-4" />
            <p className="text-2xl font-semibold text-gray-700">
              注文データがありません
            </p>
          </div>
        </div>
      );
    }

    return renderOrderLayout();
  };

  const showSoundButton = Number(config?.type) === 1 || Number(config?.type) === 2;
  const soundButtonRight = Number(config?.type) === 1 ? 420 : 320;

  return (
    <div className="bg-gray-50 flex flex-col h-full relative">
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {showSoundButton && (
        <button
          style={{ right: soundButtonRight, top: 23 }}
          onClick={enableSound}
          className={`
            fixed z-40 p-3 rounded-full shadow-lg 
            transition-all duration-300 
            ${isSoundEnabled ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}
          `}
          title={isSoundEnabled ? "通知音オン" : "通知音オフ"}
          aria-label={isSoundEnabled ? "Deshabilitar sonido" : "Habilitar sonido"}
        >
          {isSoundEnabled ? (
            <FaVolumeUp className="text-white text-xl" />
          ) : (
            <FaVolumeMute className="text-white text-xl" />
          )}
        </button>
      )}
    </div>
  );
};

export default KitchenDisplay;