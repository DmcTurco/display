import React from "react";
import { AlertTriangle, ChefHat, Cog, Layout, LayoutTemplate, Monitor, PauseCircle, PlayCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useKitchenSetup } from "../../hooks/useKitchenSetup";

const KitchenHeader = ({ pendingCount, inProgressCount, urgentCount, isConfigPage, config }) => {

  const { initializeConfig, updateCustomSettings } = useKitchenSetup();
  const configlocal = JSON.parse(localStorage.getItem('kitchenConfig')) || {};

  // console.log(configlocal);

  const headerTitle = isConfigPage
    ? "設定"
    : (config?.terminal_name || "");

  // Determinar la ruta de navegación basada en si estamos en la página de configuración
  const navigationPath = isConfigPage ? `/kitchen/${config.uid}` : `/config/${config.uid}`;

  const handleRefresh = async () => {
    try {
      await initializeConfig();
      window.location.reload();
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
    }
  };

  const toggleServingLayout = () => {
    const newLayout = configlocal.layoutType === 'serving-timeline' ? 'serving-completed' : 'serving-timeline';
    updateCustomSettings({
      layoutType: newLayout
    });
    window.location.reload();
  };

  const toggleKitchenServingLayout = () => {
    const newLayout = configlocal.layoutType == "kitchenServing" ? "swipe" : "kitchenServing";
    // console.log(newLayout);
    updateCustomSettings({
      layoutType: newLayout
    });
    window.location.reload();
  };


  return (
    <header
      className={`${configlocal.layoutType === 'serving-completed' || configlocal.layoutType === 'kitchenServing'
        ? 'bg-gradient-to-t from-red-500 to-red-800'
        : 'bg-gradient-to-t from-blue-500 to-blue-800'
        } shadow-md rounded-lg p-4 flex justify-between items-center mb-4`}
    >
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold text-white">
          {headerTitle}
        </h1>
        {!isConfigPage && (
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full hover:bg-blue-700 transition-colors"
            title="設定更新"
          >
            <RefreshCw className="w-6 h-6 text-slate-100" />
          </button>
        )}
      </div>
      <div className="flex items-center space-x-6">
        {!isConfigPage && config.type == 1 && (
          <>
            <div className="flex items-center bg-gray-100 p-2 rounded-lg">
              <PauseCircle className="w-6 h-6 mr-2 text-gray-600" />
              <span className="text-gray-700 font-semibold">
                {pendingCount} 調理待ち
              </span>
            </div>

            <div className="flex items-center bg-yellow-100 p-2 rounded-lg">
              <PlayCircle className="w-6 h-6 mr-2 text-yellow-600" />
              <span className="text-gray-700 font-semibold">
                {inProgressCount} 調理済みあり
              </span>
            </div>

            <div className="flex items-center bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
              <span className="text-gray-700 font-semibold">
                {urgentCount} 調理待ち超過
              </span>
            </div>


          </>
        )}

      </div>



      <div className="flex items-center gap-4 justify-end">
        {!isConfigPage && config.type == 1 && (
          <div className="mr-20">
            <button
              onClick={toggleKitchenServingLayout}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg transition-colors shadow-lg"
            >
              <Layout className="w-5 h-5 mr-3 stroke-2" />
              <span className="font-medium">
                {configlocal.layoutType === 'kitchenServing' ? '調理待ち一覧へ' : '調理済み一覧へ'}
              </span>
            </button>
          </div>
        )}
        {!isConfigPage && config.type == 2 && (
          <button
            onClick={toggleServingLayout}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg transition-colors shadow-lg"
          >
            <Layout className="w-5 h-5 mr-3 stroke-2" />
            <span className="font-medium">
              {configlocal.layoutType === 'serving-timeline' ? '配膳済み一覧へ' : '配膳待ち一覧へ'}
            </span>
          </button>
        )}

        <Link
          to={navigationPath}
          className="flex items-center text-slate-100 hover:text-gray-200 transition-colors"
        >
          {isConfigPage ? (
            // Cuando estamos en la página de configuración, mostrar el ícono de monitor
            <>
              <Monitor className="w-6 h-6" />
              <span className="ml-2 font-semibold">{config?.terminal_name || ""}</span>
            </>
          ) : (
            // Cuando estamos en la cocina/serving, mostrar el ícono de configuración
            <>
              <Cog className="w-6 h-6" />
              <span className="ml-2 font-semibold">設定</span>
            </>
          )}
        </Link>
      </div>
    </header>
  );
};

export default KitchenHeader;