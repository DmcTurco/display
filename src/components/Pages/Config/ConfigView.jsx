import React from 'react';
import { useNavigate } from 'react-router-dom';

const ConfigView = () => {
    const navigate = useNavigate();
    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};

    const handleLayoutChange = (event) => {
        // Guardar la configuración actualizada
        const updatedConfig = {
            ...config,
            layoutType: event.target.value
        };
        localStorage.setItem('kitchenConfig', JSON.stringify(updatedConfig));
    };

    const handleBack = () => {
        if (config.uid) {
            navigate(`/kitchen/${config.uid}`);
        } else {
            navigate('/kitchen');
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6">Configuración de Cocina</h2>

            <div className="bg-white rounded-lg shadow-md p-6">
                <dl className="grid gap-4">
                    {/* Configuración existente */}
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">CD:</dt>
                        <dd>{config.cd}</dd>
                    </div>
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">Terminal:</dt>
                        <dd>{config.terminal_name}</dd>
                    </div>
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">Tipo:</dt>
                        <dd>{config.type}</dd>
                    </div>
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">Estado:</dt>
                        <dd>{config.status}</dd>
                    </div>
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">Uid:</dt>
                        <dd>{config.uid}</dd>
                    </div>

                    {/* Selector de Layout */}
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">Tipo de Vista:</dt>
                        <dd>
                            <select
                                value={config.layoutType || 'swipe'} // Valor predeterminado
                                onChange={handleLayoutChange}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="swipe">Vista Deslizable</option>
                                <option value="grid">Vista Cuadrícula (4x2)</option>
                            </select>
                        </dd>
                    </div>
                </dl>
            </div>

            <button
                onClick={handleBack}
                className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
                Regresar a la Cocina
            </button>
        </div>
    );
};

export default ConfigView;