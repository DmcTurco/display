import { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '../hooks/useKitchenSetup';


let API_URL = localStorage.getItem('apiUrl');
if (!API_URL) {
    API_URL = buildApiUrl();
    localStorage.setItem('apiUrl', API_URL);
}

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
    const [kitchenCode, setKitchenCode] = useState(null);

    const processOrders = (data) => {
        const processedOrders = data.reduce((acc, order) => {
            const uniqueId = `${order.order_main_cd}_${order.order_count}`;

            const mappedItems = order.order_details.map(detail => ({
                id: detail.cd,
                name: detail.menu_name,
                quantity: detail.quantity,
                uid: detail.uid,
                pid: detail.pid,
                group_id: detail.group_id || null,
                kitchen_status: detail.kitchen_status,
            }));

            const hasInProgressItem = mappedItems.some(item => item.kitchen_status === 1);

            acc[uniqueId] = {
                order_main_cd: order.order_main_cd,
                order_count: order.order_count,
                formatted_time: formatTime(order.record_date),
                table_name: order.table_name || 'Sin mesa',
                type: order.type || 1,
                status: determineStatus(
                    order.record_date,
                    'no-iniciado',
                    hasInProgressItem ? 1 : 0
                ),
                elapsedTime: calculateElapsedTime(order.record_date),
                items: mappedItems,
                record_date: order.record_date
            };

            return acc;
        }, {});

        return Object.values(processedOrders)
            .sort((a, b) => new Date(a.record_date) - new Date(b.record_date));
    };


    const getTodayOrders = useCallback(async (kitchenCd) => {
        try {

            if (!kitchenCd) {
                throw new Error('kitchen_cd es requerido');
            }

            setLoading(true);
            setKitchenCode(kitchenCd); // Guardamos el código de cocina

            const response = await fetch(`${API_URL}?action=today_orders&kitchen_cd=${kitchenCd}`);
            if (!response.ok) throw new Error('Error al obtener los pedidos');

            const newData = await response.json();
            if (newData.status === 'error') throw new Error(newData.message);

            if (!newData.data) {
                setOrders([]);
                return;
            }

            const processedNewData = processOrders(newData.data);
            setOrders(processedNewData);
            setError(null);

        } catch (err) {
            console.error('Error en getTodayOrders:', err);
            setError(err.message);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateKitchenStatus = async (orderDetailId, newStatus, kitchen_cd) => {
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
            if (data.status !== 'ok') throw new Error(data.message);

            // Actualización local inmediata
            setOrders(prevOrders => {
                if (!prevOrders.length) return prevOrders;
                return prevOrders.map(order => ({
                    ...order,
                    items: order.items.map(item =>
                        item.id === orderDetailId ? { ...item, kitchen_status: newStatus } : item
                    )
                }));
            });

            // Re-sincronizar desde el servidor (opcional)
            if (kitchen_cd) {
                const serverData = await getTodayOrders(kitchen_cd);
                setOrders(processOrders(serverData.data));
            }
    
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };


    // Efecto para actualización automática cada 30 segundos
    useEffect(() => {
        let interval;

        if (kitchenCode) {
            interval = setInterval(() => {
                getTodayOrders(kitchenCode);
            }, 10000); // 30 segundos
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [kitchenCode, getTodayOrders]);

    return {
        orders,
        loading,
        error,
        getTodayOrders,
        updateKitchenStatus
    };
}
