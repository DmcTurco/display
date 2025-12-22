import React from "react";
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom';
import MainLayout from './components/Main/MainLayout';


function App() {
  return (
    <BrowserRouter basename="/kitchen_display/tablet/" future={{ v7_startTransition: true, v7_relativeSplatPath: true }} >
      <Routes>
        <Route path="/kitchen/:uid" element={<MainLayout content="kitchen" />} />
        <Route path="/config/:uid" element={<MainLayout content="config" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


