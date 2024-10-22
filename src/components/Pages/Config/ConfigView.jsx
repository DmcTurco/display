import React from 'react';
import { useNavigate } from 'react-router-dom';  // Importar useNavigate para redireccionar

const ConfigView = () => {
    const navigate = useNavigate();

    const handleBackToKitchen = () => {
        navigate('/kitchen');  // Navegar a la ruta principal
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold">Configuración</h2>
            <p>Aquí puedes ajustar las configuraciones de la cocina.</p>
            
            {/* Botón para regresar a KitchenDisplay */}
            <button 
                onClick={handleBackToKitchen} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
            >
                Regresar a la Cocina
            </button>
        </div>
    );
};

export default ConfigView;
