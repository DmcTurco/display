import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainLayout from './components/Main/MainLayout';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/kitchen" element={<MainLayout content="kitchen" />} />
        <Route path="/config" element={<MainLayout content="config" />} />
      </Routes>
    </Router>
  );
}

export default App;


