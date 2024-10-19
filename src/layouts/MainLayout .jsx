import React from 'react';
import { useLocation } from 'react-router-dom';

const MainLayout = ({ children }) => {
  const location = useLocation();  // Saber la ruta actual

  // Saber si estamos en la página de configuración
  const isConfigPage = location.pathname === '/config';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header dinámico */}
      <header className="bg-white shadow-md p-4">
        <h1 className="text-3xl font-bold">
          {isConfigPage ? 'Configuración' : 'Cocina'}
        </h1>
        <div className="flex space-x-4 mt-2">
          {isConfigPage ? (
            <p>Opciones de configuración</p>
          ) : (
            <>
              <span className="text-yellow-500">Pedidos pendientes</span>
              <span className="text-red-500">Pedidos en curso</span>
            </>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-grow">
        {children} {/* Aquí se renderiza la vista específica */}
      </main>

      {/* Footer dinámico */}
      <footer className="bg-gray-200 p-4 text-center">
        {isConfigPage ? (
          <p>Configuración - Ajustes del sistema</p>
        ) : (
          <div className="flex justify-around">
            <button className="text-green-500">Pedidos Activos</button>
            <button className="text-gray-500">En 30 min</button>
            <button className="text-gray-500">Historial</button>
          </div>
        )}
      </footer>
    </div>
  );
};

export default MainLayout;
