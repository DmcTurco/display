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
    const japanTime = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });// Convierte la fecha del pedido a objeto Date
    const currentTime = new Date(japanTime); // Obtener la hora actual en Japón
    const orderTime = new Date(recordDate);// Convertir la fecha del pedido a objeto Date
    return Math.floor((currentTime - orderTime) / (1000 * 60));// Calcula la diferencia en minutos
};

const determineStatus = (recordDate, currentStatus, itemStatus = '') => {
    const elapsedMinutes = calculateElapsedTime(recordDate);

    if (itemStatus === 1) {
        return 'en-progreso';
    }

    // Para debug en desarrollo
    if (currentStatus === 'no-iniciado' && elapsedMinutes > 15) {
        return 'urgente';
        //si el pedido no esta iniciado lo que hace esta funcion es verificar si han pasado
        // 15 mnts y si es asi cambia el estado a urgente
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
                // const currentStatus = determineStatus(order.record_date, 'no-iniciado', order.items.kitchen_status);

                if (!acc[uniqueId]) {

                    // Primero mapeamos los items
                    const mappedItems = order.order_details.map(detail => ({
                        id: detail.cd,
                        name: detail.menu_name,
                        quantity: detail.quantity,
                        uid: detail.uid,
                        pid: detail.pid,
                        kitchen_status: detail.kitchen_status
                    }));
                    
                    // Verificamos si algún item tiene status 1
                    const hasInProgressItem = mappedItems.some(item => item.kitchen_status === 1);

                    // Determinamos el estado basado en los items
                    const currentStatus = determineStatus(
                        order.record_date,
                        'no-iniciado',
                        hasInProgressItem ? 1 : 0
                    );
                    acc[uniqueId] = {
                        order_main_cd: order.order_main_cd,
                        order_count: order.order_count,
                        formatted_time: formatTime(order.record_date),
                        table_name: order.table_name || 'Sin mesa',
                        type: order.type || 1,
                        status: currentStatus,
                        elapsedTime: elapsedTime,
                        items: mappedItems
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

    const updateKitchenStatus = async (orderDetailId, newStatus) => {
        try {
            console.log('Actualizando estado:', { orderDetailId, newStatus }); // Para debug
            const response = await fetch(`${API_URL}?action=update_kitchen_status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_detail_cd: orderDetailId,
                    kitchen_status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el estado');
            }

            const data = await response.json();
            if (data.status === 'error') {
                throw new Error(data.message);
            }

            // Actualizar el estado local después de una actualización exitosa
            await getTodayOrders();
            
            return data;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    return {
        orders,
        loading,
        error,
        getTodayOrders,
        updateKitchenStatus
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
