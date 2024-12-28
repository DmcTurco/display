import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ConfigView = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState(JSON.parse(localStorage.getItem('kitchenConfig')) || {});

    const handleLayoutChange = (event) => {
        const updatedConfig = {
            ...config,
            layoutType: event.target.value
        };
        setConfig(updatedConfig);
        localStorage.setItem('kitchenConfig', JSON.stringify(updatedConfig));
    };

    // const handleBack = () => {
    //     if (config.uid) {
    //         navigate(`/kitchen/${config.uid}`);
    //     } else {
    //         navigate('/kitchen');
    //     }
    // };

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

                    {/* Layout Selector */}
                    {/* <div className="grid grid-cols-2 items-center py-2">
                        <span className="font-medium text-gray-700">
                            表示種別:
                        </span>
                        <select
                            value={config.layoutType || 'swipe'}
                            onChange={handleLayoutChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                        >
                            <option value="swipe">Vista Deslizable</option>
                            <option value="grid">Vista Cuadrícula (4x2)</option>
                        </select>
                    </div> */}
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