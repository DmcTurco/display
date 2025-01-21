import React, { useEffect, useState } from "react";
import KitchenHeader from "../Header/KitchenHeader";
import ConfigView from "../Pages/Config/ConfigView";
import KitchenDisplay from "../Pages/Kitchen/kitchenDisplay";
import { useKitchenSetup } from "../../hooks/useKitchenSetup";

const MainLayout = ({ content }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const { config, loading, error, initializeConfig } = useKitchenSetup();
  const isConfigPage = content === 'config';

  // Inicializar configuración una sola vez aquí
  useEffect(() => {
    const init = async () => {
      await initializeConfig();

      const API_URL = localStorage.getItem('apiUrl');
      if (!API_URL) {
        const newApiUrl = buildApiUrl();
        localStorage.setItem('apiUrl', newApiUrl);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center p-8 rounded-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            設定を取得しています。
          </h2>
          <p className="text-gray-500">お待ちください。</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-red-50 to-white">
        <div className="text-center p-8 rounded-lg border border-red-200 bg-white shadow-lg max-w-md mx-4">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-red-500 mx-auto animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            設定の取得に失敗しました。
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200"
          >
            リトライする
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="p-4">
        <KitchenHeader
          pendingCount={pendingCount}
          inProgressCount={inProgressCount}
          urgentCount={urgentCount}
          isConfigPage={isConfigPage}
          config={config}
        />
      </div>

      <div className="flex-1 overflow-hidden px-4">
        {isConfigPage ? <ConfigView config={config} /> : <KitchenDisplay setPendingCount={setPendingCount} setInProgressCount={setInProgressCount} setUrgentCount={setUrgentCount} config={config} />}

      </div>

      {/* <div className="p-3">
        <KitchenFooter />
      </div> */}

    </div>
  );
};

export default MainLayout;
