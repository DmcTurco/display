import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import KitchenFooter from "../Footer/KitchenFooter";

import KitchenHeader from "../Header/KitchenHeader";
import ConfigView from "../Pages/Config/ConfigView";
import KitchenDisplay from "../Pages/Kitchen/kitchenDisplay";

const MainLayout = ({ content }) => {
  
  const [pendingCount, setPendingCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const isConfigPage = content === 'config';


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
