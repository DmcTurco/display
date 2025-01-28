import { useState, useEffect, useCallback } from 'react';

export function useOrders(config, API_URL) {  // Recibimos config y API_URL como parámetros
    const [orders, setOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]); // Nuevo estado para órdenes completadas
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [kitchenCode, setKitchenCode] = useState(null);

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const calculateElapsedTime = (recordDate) => {
        const japanTime = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
        const currentTime = new Date(japanTime);
        const orderTime = new Date(recordDate);
        return Math.floor((currentTime - orderTime) / (1000 * 60));
    };

    const determineStatus = (recordDate, currentStatus, kitchenStatus = 0, servingStatus = 0) => {
        const elapsedMinutes = calculateElapsedTime(recordDate);
        const type = config.type || 1;

        if (type === 2) { // Serving
            if (servingStatus === 1) return 'servido';
            if (kitchenStatus === 1) return 'listo-para-servir';
            return 'en-cocina';
        } else { // Kitchen
            if (kitchenStatus === 1) return 'en-progreso';
            if (currentStatus === 'no-iniciado' && elapsedMinutes > 15) return 'urgente';
            return currentStatus;
        }

    }

    const processOrders = (data) => {
        // Agrupar las órdenes por mesa
        const groupedOrders = data.reduce((acc, order) => {
            const tableId = order.table_name || 'Sin Mesa'; // 'Sin Mesa' para órdenes no asignadas
            if (!acc[tableId]) {
                acc[tableId] = [];
            }
    
            // Mapear los detalles de la orden
            const mappedItems = order.order_details.map(detail => ({
                id: detail.cd,
                name: detail.menu_name,
                quantity: detail.quantity,
                uid: detail.uid,
                pid: detail.pid,
                group_id: detail.group_id || null,
                kitchen_status: detail.kitchen_status,
                serving_status: detail.serving_status,
                modification: detail.modification,
            }));
    
            // Insertar la orden en el grupo de la mesa correspondiente
            acc[tableId].push({
                order_main_cd: order.order_main_cd,
                order_count: order.order_count,
                formatted_time: formatTime(order.record_date),
                formatted_time_update: formatTime(order.update_date),
                table_name: order.table_name || 'Sin Mesa',
                type: order.type || 1,
                status: determineStatus(
                    order.record_date,
                    'no-iniciado',
                    mappedItems.some(item => item.kitchen_status === 1) ? 1 : 0,
                    mappedItems.every(item => item.serving_status === 1) ? 1 : 0
                ),
                elapsedTime: calculateElapsedTime(config.type == 2 ? order.update_date : order.record_date),
                items: mappedItems,
                record_date: order.record_date,
            });
    
            return acc;
        }, {});
    
        // Ordenar las mesas y las órdenes dentro de cada mesa por fecha de registro
        return Object.entries(groupedOrders).map(([tableName, orders]) => ({
            tableName,
            orders: orders.sort((a, b) => new Date(a.record_date) - new Date(b.record_date)),
        }));
    };
    

    const getTodayOrders = useCallback(async (kitchenCd) => {
        try {

            if (!kitchenCd) {
                throw new Error('kitchen_cd es requerido');
            }

            setLoading(true);
            setKitchenCode(kitchenCd);

            const response = await fetch(`${API_URL}?action=today_orders&kitchen_cd=${kitchenCd}&type=${config?.type || 1}`);
            if (!response.ok) throw new Error('Error al obtener los pedidos');

            const newData = await response.json();
            if (newData.status === 'error') throw new Error(newData.message);

            if (!newData.data) {
                setOrders([]);
                return;
            }

            const processedNewData = processOrders(newData.data);
            console.log(processedNewData);
            setOrders(processedNewData);

            setError(null);

        } catch (err) {
            console.error('Error en getTodayOrders:', err);
            setError(err.message);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [config, API_URL]);

    const getTodayCompletedOrders = useCallback(async (kitchenCd) => {
        try {
            if (!kitchenCd) {
                throw new Error('kitchen_cd es requerido');
            }

            setLoading(true);
            setKitchenCode(kitchenCd);

            const response = await fetch(`${API_URL}?action=completed_orders&kitchen_cd=${kitchenCd}`);
            if (!response.ok) throw new Error('Error al obtener los pedidos completados');

            const newData = await response.json();
            if (newData.status === 'error') throw new Error(newData.message);

            if (!newData.data) {
                setCompletedOrders([]); // Usar el nuevo estado
                return;
            }

            const processedNewData = processOrders(newData.data);
            setCompletedOrders(processedNewData); // Usar el nuevo estado
            setError(null);

        } catch (err) {
            console.error('Error en getTodayCompletedOrders:', err);
            setError(err.message);
            setCompletedOrders([]); // Usar el nuevo estado
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    const updateKitchenStatus = async (orderDetailId, newStatus, kitchen_cd, type = null) => {
        try {

            let typeDisplay = config?.type || 1;

            if (config.layoutType === 'serving-timeline' && type !== null) {
                typeDisplay = type;
            }

            console.log('typeDisplay:', typeDisplay);
            console.log('updateKitchenStatus:', orderDetailId, newStatus, kitchen_cd, typeDisplay);
            const response = await fetch(`${API_URL}?action=update_kitchen_status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_detail_cd: orderDetailId,
                    kitchen_status: newStatus,
                    type: typeDisplay
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response:', errorData); // Para debugging
                throw new Error(JSON.stringify(errorData));
            }
            const data = await response.json();
            if (data.status === 'error') throw new Error(data.message);

            if (kitchen_cd) {
                await getTodayOrders(kitchen_cd);
                await getTodayCompletedOrders(kitchen_cd);
            }

        } catch (error) {
            console.error('Error completo:', error);
            console.error('Request data:', { orderDetailId, newStatus, type: config.type }); // Para debugging
            setError(error.message);
            throw error;
        }
    };


    useEffect(() => {
        let isMounted = true;
        let intervalId = null;

        const fetchData = async () => {
            if (!isMounted) return;
            await Promise.all([
                getTodayOrders(kitchenCode),
                getTodayCompletedOrders(kitchenCode)
            ]);
        };

        if (kitchenCode) {
            fetchData();
            intervalId = setInterval(fetchData, 10000);
        }

        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, [kitchenCode, getTodayOrders, getTodayCompletedOrders]);

    return {
        orders,
        completedOrders,
        loading,
        error,
        getTodayOrders,
        getTodayCompletedOrders,
        updateKitchenStatus
    };
}
