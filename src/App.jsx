import React from "react";
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom';
import MainLayout from './components/Main/MainLayout';


function App() {
  return (
    // <Router basename={process.env.BASE_URL}>
    //   <Routes>
    //     <Route path="/kitchen" element={<MainLayout content="kitchen" />} />
    //     <Route path="/kitchen_display/tablet/kitchen/:uid" element={<MainLayout content="kitchen" />} />
    //     <Route path="/config" element={<MainLayout content="config" />} />
    //   </Routes>
    // </Router>
    <BrowserRouter basename={process.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<MainLayout content="kitchen" />} />
        <Route path="/kitchen/:uid" element={<MainLayout content="kitchen" />} />
        <Route path="/config" element={<MainLayout content="config" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


