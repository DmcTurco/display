// import React from "react";
// import KitchenDisplay from './pages/kitchenDisplay';

// function App() {
//   return (
//     <div className="App">
//       <div className="order-section">
//         <KitchenDisplay /> 
//       </div>
//     </div>
//   );
// }

// export default App;

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import KitchenDisplay from './pages/KitchenDisplay';
import ConfigView from './pages/ConfigView';
import MainLayout from './layouts/MainLayout';  // Importamos el layout

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <KitchenDisplay />
            </MainLayout>
          }
        />
        <Route
          path="/config"
          element={
            <MainLayout>
              <ConfigView />
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;


