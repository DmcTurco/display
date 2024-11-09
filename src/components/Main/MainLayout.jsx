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
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="p-4">
        <KitchenHeader
          pendingCount={pendingCount}
          inProgressCount={inProgressCount}
          isConfigPage={isConfigPage}
        />
      </div>

      <div className="flex-1 overflow-hidden px-20">
        {isConfigPage ? <ConfigView /> : <KitchenDisplay setPendingCount={setPendingCount} setInProgressCount={setInProgressCount} />}
      </div>

      {/* <div className="p-3">
        <KitchenFooter />
      </div> */}

    </div>
  );
};

export default MainLayout;
