import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKitchenSetup } from '../../../hooks/useKitchenSetup';

const ConfigView = () => {
    const navigate = useNavigate();
    // const [config, setConfig] = useState(JSON.parse(localStorage.getItem('kitchenConfig')) || {});
    const { updateCustomSettings } = useKitchenSetup();

    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    // const handleLayoutChange = (event) => {
    //     const updatedConfig = {
    //         ...config,
    //         layoutType: event.target.value
    //     };
    //     setConfig(updatedConfig);
    //     localStorage.setItem('kitchenConfig', JSON.stringify(updatedConfig));
    // };
    const handleLayoutChange = (event) => {
        updateCustomSettings({
            layoutType: event.target.value
        });
    };


    // const handleBack = () => {
    //     if (config.uid) {
    //         navigate(`/kitchen/${config.uid}`);
    //     } else {
    //         navigate('/kitchen');
    //     }
    // };

    const handleFontSizeChange = (event) => {
        updateCustomSettings({
            fontSize: event.target.value
        });
    };

    // const handleFontSizeChange = (event) => {
    //     const updatedConfig = {
    //         ...config,
    //         fontSize: event.target.value
    //     };
    //     setConfig(updatedConfig);
    //     localStorage.setItem('kitchenConfig', JSON.stringify(updatedConfig));
    // }

    const typeLabels = {
        1: '調理',
        2: '配膳'
    }

    return (
        <div className="p-4">
            {/* <h2 className="text-2xl font-bold mb-6">Configuración de Cocina</h2> */}

            <div className="bg-white rounded-lg shadow-md p-6">
                <dl className="grid gap-4">
                    {/* Configuración existente */}
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">CD:</dt>
                        <dd>{config.cd}</dd>
                    </div>
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">ターミナル:</dt>
                        <dd>{config.terminal_name}</dd>
                    </div>
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">タイプ:</dt>
                        <dd>{typeLabels[config.type] || config.type}</dd>
                    </div>
                    {/* <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">ステータス:</dt>
                        <dd>{config.status}</dd>
                    </div> */}
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">Uid:</dt>
                        <dd>{config.uid}</dd>
                    </div>

                    {/* Selector de tamaño de fuente */}
                    <div className="grid grid-cols-2 items-center py-2">
                        <span className="font-medium text-gray-700">
                            文字サイズ:
                        </span>
                        <select
                            value={config.fontSize || 'normal'}
                            onChange={handleFontSizeChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                        >
                            <option value="small">小</option>
                            <option value="normal">中</option>
                            <option value="large">大</option>
                        </select>
                    </div>

                    {/* Layout Selector */}
                    <div className="grid grid-cols-2 items-center py-2">
                        <span className="font-medium text-gray-700">
                            表示種別:
                        </span>
                        <select
                            value={config.layoutType || 'swipe'}
                            onChange={handleLayoutChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                        >
                            <option value="swipe">Orden de Pedido</option>
                            <option value="table">Orden por Menu</option>
                            {/* <option value="grid">Orden por Mesa</option> */}
                            <option value="timeline">Orden por Hora</option>
                        </select>
                    </div>
                </dl>
            </div>

            {/* <button
                onClick={handleBack}
                className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
                Regresar a la Cocina
            </button> */}
        </div>
    );
};

export default ConfigView;