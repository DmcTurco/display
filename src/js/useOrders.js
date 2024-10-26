import { useState, useEffect } from 'react';

const API_URL = 'http://localhost/kitchen_display/get_order.php';

const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        // second: '2-digit',
        hour12: false // Esto asegura el formato de 24 horas
    });
};


const calculateElapsedTime = (recordDate) => {
    const orderTime = new Date(recordDate);
    const now = new Date();
    return Math.floor((now - orderTime) / (1000 * 60));
};

const determineStatus = (recordDate, currentStatus) => {
    const elapsedMinutes = calculateElapsedTime(recordDate);
    if (currentStatus === 'no-iniciado' && elapsedMinutes > 15) {
        return 'urgente';
    }
    return currentStatus;
};

export function useOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getTodayOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}?action=today_orders`);

            if (!response.ok) {
                throw new Error('Error al obtener los pedidos');
            }

            const data = await response.json();
            if (data.status === 'error') {
                throw new Error(data.message);
            }

            // Procesamos y agrupamos los datos en un solo lugar
            const groupedOrders = data.data.reduce((acc, order) => {
                const uniqueId = `${order.order_main_cd}_${order.order_count}`;
                const elapsedTime = calculateElapsedTime(order.record_date);
                const currentStatus = determineStatus(order.record_date, 'no-iniciado');

                if (!acc[uniqueId]) {
                    acc[uniqueId] = {
                        order_main_cd: order.order_main_cd,
                        order_count: order.order_count,
                        formatted_time: formatTime(order.record_date),
                        table_name: order.table_name || 'Sin mesa',
                        type: order.type || 'dine-in',
                        status: currentStatus,
                        elapsedTime: elapsedTime,
                        items: order.order_details.map(detail => ({
                            id: detail.cd,
                            name: detail.menu_name,
                            quantity: detail.quantity,
                            uid: detail.uid,
                            pid: detail.pid,
                            kitchen_status: detail.kitchen_status || 1
                        }))
                    };
                }
                return acc;
            }, {});

            // Convertir a array y ordenar por fecha
            const sortedOrders = Object.values(groupedOrders).sort((a, b) =>
                new Date(a.record_date) - new Date(b.record_date)
            );

            setOrders(sortedOrders);
            setError(null);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        orders,
        loading,
        error,
        getTodayOrders
    };
}

export function useCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}?action=categories`);

            if (!response.ok) {
                throw new Error('Error al obtener las categorías');
            }

            const data = await response.json();
            if (data.status === 'error') {
                throw new Error(data.message);
            }

            setCategories(data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { categories, loading, error, getCategories };
}

export function useProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getProductsByCategory = async (categoryId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}?action=products_by_category&category_id=${categoryId}`);

            if (!response.ok) {
                throw new Error('Error al obtener los productos');
            }

            const data = await response.json();
            if (data.status === 'error') {
                throw new Error(data.message);
            }

            setProducts(data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { products, loading, error, getProductsByCategory };
}

// import React, { useState } from 'react'

// function useOrders() {

//     const [orders, setOrders] = useState([])
//     const [loading, setLoading] = useState(true)
//     const [error, setError] = useState(null)

//     const getOrders = async () => {

//         try {

//             setLoading(true);
//             // const url = process.env.REACT_APP_API_URL || 'http://localhost:5000/orders';
//             const url = 'http://localhost:5000/orders'
//             const reponse = await fetch(url)

//             if (!reponse.ok) {
//                 throw new Error('Error al obtener los pedidos');
//             }
//             const data = await reponse.json()
//             setOrders(data)
//         } catch (err) {
//             setError(err.message)
//         }
//         finally {
//             setLoading(false)
//         }
//     }



//     return { orders, loading, error, getOrders }
// }

// export default useOrders