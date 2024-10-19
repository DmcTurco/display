import React, { useEffect,useState } from "react";
import { Link, useLocation } from "react-router-dom";
import KitchenFooter from "../Footer/KitchenFooter";
import { Cog } from "lucide-react";
import useOrders from "../../js/useOrders";
import KitchenHeader from "../Header/KitchenHeader";
import ConfigView from "../Pages/Config/ConfigView";
import KitchenDisplay from "../Pages/Kitchen/kitchenDisplay";

const MainLayout = ({ content }) => {
  
  const location = useLocation(); // Saber la ruta actual
  const [pendingCount, setPendingCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  // Saber si estamos en la página de configuración
  const isConfigPage = content == "config";//location.pathname === "/config";

  // const { orders, loading, error, getOrders } = useOrders(); // opcional ya que cuando se abusa del useEffect

  // useEffect(() => {
  //   getOrders();
  // }, []);

  // if (loading) {
  //   return <div>Cargando pedidos...</div>;
  // }

  // if (error) {
  //   return <div>Error: {error}</div>;
  // }

  // const pendingCount = orders.filter( (order) => order.status === "not-started").length;
  // const inProgressCount = orders.filter((order) => order.status === "in-progress").length;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <KitchenHeader
            pendingCount={pendingCount}
            inProgressCount={inProgressCount}
            isConfigPage = {isConfigPage}
          />

      <main className="flex-grow">

        {isConfigPage ? <ConfigView/> : <KitchenDisplay setPendingCount = {setPendingCount} setInProgressCount = {setInProgressCount}/>}

      </main>

      <KitchenFooter />

    </div>
  );
};

export default MainLayout;
