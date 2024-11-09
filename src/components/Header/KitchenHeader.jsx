import React from "react";
import { Clock, AlertTriangle, Cog } from "lucide-react";
import { Link } from "react-router-dom";

const KitchenHeader = ({ pendingCount, inProgressCount, isConfigPage }) => (
  <>
    <header className="bg-gradient-to-t from-blue-500 to-blue-800 shadow-md rounded-lg p-4 flex justify-between items-center mb-4">
      <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
        {isConfigPage ? "Configuración" : "Cocina"}
      </h1>
        {isConfigPage ? (
          <p></p>
        ) : (
          <div className="flex items-center space-x-6">
            <div className="flex items-center bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-6 h-6 mr-2 text-yellow-600" />
              <span className="text-gray-700 font-semibold">
                {pendingCount} en espera
              </span>
            </div>

            <div className="flex items-center bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
              <span className="text-gray-700 font-semibold">
                {inProgressCount} en curso
              </span>
            </div>
          </div>
        )}
   

      <Link
        to="/config"
        className="flex items-center text-slate-100 hover:text-gray-700 transition-colors"
      >
        <Cog className="w-6 h-6" />
        <span className="ml-2 font-semibold text-slate-100">Configuración</span>
      </Link>
    </header>

  </>
);

export default KitchenHeader;
