import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import orders from "./data/OrdeCars";
import OrderCars from "./components/OrderCars";

function App() {
  const OrderList = orders.map((ord) => <OrderCars key={ord.id} order={ord} />);
  // const OrderList = orders.map((ord) => {
  //   return <OrderCars key={ord.id} order={ord} />
  // });

  return (
    <div className="App">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="navbar-title">CUISINE</div>
          <div className="order-stats">
            <span>4 en attente</span> | <span>3 en cours</span>
          </div>
        </div>
        <div className="navbar-right">
          <button className="navbar-button">Configuración</button>
        </div>
      </nav>

      {/* Sección de órdenes */}
      <div className="order-section">
        <div className="order-grid">
          {orders.map((order) => (
            <OrderCars key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
