import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

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

    const processOrders = (data) => {
        const groupedOrders = data.reduce((acc, order) => {
            const uniqueId = `${order.order_main_cd}_${order.order_count}`;
            const elapsedTime = calculateElapsedTime(order.record_date);

            if (!acc[uniqueId]) {
                const mappedItems = order.order_details.map((detail) => ({
                    id: detail.cd,
                    name: detail.menu_name,
                    quantity: detail.quantity,
                    uid: detail.uid,
                    pid: detail.pid,
                    group_id: detail.group_id || null,
                    kitchen_status: detail.kitchen_status,
                }));

                const hasInProgressItem = mappedItems.some(
                    (item) => item.kitchen_status === 1
                );

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
                    items: mappedItems,
                };
            }
            return acc;
        }, {});
        return Object.values(groupedOrders).sort(
            (a, b) => new Date(a.record_date) - new Date(b.record_date)
        );
    };

    const getTodayOrders = async (kitchenCd) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}?action=today_orders&kitchen_cd=${kitchenCd}`);
            if (!response.ok) throw new Error('Error al obtener los pedidos');

            const newData = await response.json();
            if (newData.status === 'error') throw new Error(newData.message);

            if (!newData.data) {
                setOrders([]);
                return;
            }
            // Actualizar las órdenes solo si es necesario
            setOrders((prevOrders) => {
                const needsUpdate = newData.data.some((newOrder) => {
                    const existingOrder = prevOrders.find(
                        (po) =>
                            po.order_main_cd === newOrder.order_main_cd &&
                            po.order_count === newOrder.order_count
                    );
                    // Si no existe el pedido actual en prevOrders, necesitamos actualizar
                    if (!existingOrder) return true;
                    // Comparar el estado de los artículos
                    return existingOrder.items.some((item) => {
                        const newItem = newOrder.order_details.find((ni) => ni.cd === item.id);
                        return newItem && newItem.kitchen_status !== item.kitchen_status;
                    });
                });

                return needsUpdate ? processOrders(newData.data) : prevOrders;
            });
            setError(null);
        } catch (err) {
            setError(err.message);
            setOrders([]); // En caso de error, establecer array vacío
        } finally {
            setLoading(false);
        }
    };

    const updateKitchenStatus = async (orderDetailId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}?action=update_kitchen_status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_detail_cd: orderDetailId,
                    kitchen_status: newStatus,
                }),
            });

            if (!response.ok) throw new Error('Error al actualizar el estado');
            const data = await response.json();

            if (data.status === 'error') throw new Error(data.message);

            setOrders((prevOrders) =>
                prevOrders.map((order) => {
                    const updatedItems = order.items.map((item) => {
                        // Actualiza el estado del ítem principal
                        if (item.id === orderDetailId) {
                            return { ...item, kitchen_status: newStatus };
                        }

                        // Actualiza ítems relacionados (mismo pid o grupo)
                        if (
                            item.pid === order.items.find((i) => i.id === orderDetailId)?.pid ||
                            item.group_id === order.items.find((i) => i.id === orderDetailId)?.group_id
                        ) {
                            if (item.kitchen_status !== newStatus) {
                                return { ...item, kitchen_status: newStatus };
                            }
                        }

                        return item;
                    });

                    return {
                        ...order,
                        items: updatedItems,
                        status: determineStatus(
                            order.record_date,
                            order.status,
                            updatedItems.some((i) => i.kitchen_status === 1) ? 1 : 0
                        ),
                    };
                })
            );

            return data;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    return {
        orders,
        setOrders,
        loading,
        error,
        getTodayOrders,
        updateKitchenStatus
    };
}
