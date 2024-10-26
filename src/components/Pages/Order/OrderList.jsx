// // OrderList.js
// import React from 'react';
// import OrderCard from './OrderCard';

// const OrderList = ({ orders }) => {
//   if (!orders || orders.length === 0) return null;

//   return (
//     <div className="flex flex-wrap gap-4 p-4">
//       {orders.map((order) => {
//         // Formatear la hora
//         const date = new Date(order.record_date);
//         const timeString = date.toLocaleTimeString('es-ES', {
//           hour: '2-digit',
//           minute: '2-digit',
//           second: '2-digit',
//           hour12: true
//         }).toLowerCase();
//         const status = 'en-progreso';

//         return (
//           <OrderCard
//             key={`${order.order_main_cd}_${order.order_count}`}
//             time={timeString}
//             status={status}
//             number={`${order.order_main_cd}-${order.order_count}`}
//             order_details={order.order_details} // Pasamos los detalles directamente
//           />
//         );
//       })}
//     </div>
//   );
// };

// export default OrderList;
// OrderList.js
import React from 'react';
import OrderCard from './OrderCard';

const OrderList = ({ orders }) => {
    return (
        <div className="flex flex-nowrap overflow-x-auto p-4 space-x-4">
            {orders.map((order) => (
                <OrderCard
                    key={`${order.order_main_cd}_${order.order_count}`}
                    time={order.formatted_time}
                    type={order.type}
                    number={`${order.order_main_cd}-${order.order_count}`}
                    customer={order.table_name}
                    items={order.items}
                    status={order.status}
                    elapsedTime={order.elapsedTime}
                />
            ))}
        </div>
    );
};

export default OrderList;