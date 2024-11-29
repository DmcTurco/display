import React from "react";
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom';
import MainLayout from './components/Main/MainLayout';


function App() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH}>
      <Routes>
        <Route path="/" element={<MainLayout content="kitchen" />} />
        <Route path="/kitchen/:uid" element={<MainLayout content="kitchen" />} />
        <Route path="/config" element={<MainLayout content="config" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


