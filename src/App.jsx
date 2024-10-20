import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainLayout from './components/Main/MainLayout';


function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/" element={
            <MainLayout content = "kitchen">
            </MainLayout>
          }
        />
        <Route
          path="/config" element={
            <MainLayout content = "config">
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;


