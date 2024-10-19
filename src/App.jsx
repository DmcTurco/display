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

import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

 // Importamos el layout
import KitchenDisplay from './components/Pages/Kitchen/kitchenDisplay';
import ConfigView from './components/Pages/Config/ConfigView';
import MainLayout from './components/Main/MainLayout';


function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/" element={
            <MainLayout content = "kitchen">
              {/* <KitchenDisplay /> */}
            </MainLayout>
          }
        />
        <Route
          path="/config" element={
            <MainLayout content = "config">
              {/* <ConfigView /> */}
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;


