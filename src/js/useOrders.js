import { useState, useEffect, useCallback, useRef } from 'react';
import { useSound } from '@/hooks/useSound';
import sound1 from '/assets/sound1.mp3';
import sound2 from '/assets/sound2.mp3';
import sound3 from '/assets/sound3.mp3';
import sound4 from '/assets/sound4.mp3';

const soundMap = {
    'sound1': sound1,
    'sound2': sound2,
    'sound3': sound3,
    'sound4': sound4
};

export function useOrders(config, API_URL) {  // Recibimos config y API_URL como parámetros
    const [orders, setOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]); // Nuevo estado para órdenes completadas
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [kitchenCode, setKitchenCode] = useState(null);
    const previousOrdersCount = useRef(0);
    const isFirstLoad = useRef(true);

    const configLocal = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
    const selectedSound = configLocal?.sound || 'sound2';
    const soundUrl = soundMap[selectedSound];
    const { isSoundEnabled, toggleSound, playSound } = useSound(soundUrl || soundMap['sound2'], 1);


    const checkNewOrders = useCallback((newOrders) => {
        if (!newOrders) return;

        let currentOrdersCount = 0;

        if (Array.isArray(newOrders)) {
            if (newOrders.length > 0 && newOrders[0].orders) {
                currentOrdersCount = newOrders.reduce((total, table) =>
                    total + table.orders.length, 0);
            } else {
                currentOrdersCount = newOrders.length;
            }
        }

        if (!isFirstLoad.current &&
            currentOrdersCount > previousOrdersCount.current) {
            playSound();
        }

        if (isFirstLoad.current) {
            isFirstLoad.current = false;
        }

        previousOrdersCount.current = currentOrdersCount;
    }, [playSound]);


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
        const elapsed_time = parseInt(config.elapsed_time || 15, 10);  // Convertir a entero

        if (type === 2) { // Serving
            if (servingStatus === 1) return 'servido';
            if (kitchenStatus === 1) return 'listo-para-servir';
            return 'en-cocina';
        } else { // Kitchen
            if (kitchenStatus === 1) return 'en-progreso';
            if (currentStatus === 'no-iniciado' && elapsedMinutes >= elapsed_time) return 'urgente';
            return currentStatus;
        }

    }

    const processOrders = (data) => {
        // Agrupar las órdenes por mesa
        const groupedOrders = data.reduce((acc, order) => {
            const tableId = order.table_name || 'Sin Mesa';

            // Inicializamos la estructura de la mesa si no existe
            if (!acc[tableId]) {
                acc[tableId] = {
                    orders: [],
                    type: order.type || 1,// Guardamos el type de la primera orden de la mesa
                    total_people: order.total_people
                };
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
                handwriteImage: detail.handwriteImage,
            }));

            // Insertar la orden en el grupo de la mesa correspondiente
            acc[tableId].orders.push({
                order_main_cd: order.order_main_cd,
                order_count: order.order_count,
                formatted_time: formatTime(order.record_date),
                formatted_time_update: formatTime(order.update_date),
                table_name: order.table_name || 'Sin Mesa',
                type_display: config.type || 1,
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

        // Primero creamos el array con los grupos de mesa
        const tableGroups = Object.entries(groupedOrders).map(([tableName, tableData]) => ({
            tableName,
            type: tableData.type,
            total_people: tableData.total_people,
            orders: tableData.orders.sort((a, b) => new Date(a.record_date) - new Date(b.record_date))
        }));

        // Luego ordenamos los grupos de mesa por el record_date de su primera orden
        return tableGroups.sort((a, b) => {
            const firstOrderA = a.orders[0]?.record_date;
            const firstOrderB = b.orders[0]?.record_date;
            return new Date(firstOrderA) - new Date(firstOrderB);
        });
    };
    const processOrdersTable = (data) => {
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
                serving_status: detail.serving_status,
                modification: detail.modification,
                handwriteImage: detail.handwriteImage,
            }));

            const hasInProgressItem = mappedItems.some(item => item.kitchen_status === 1);
            const allServed = mappedItems.every(item => item.serving_status === 1);

            acc[uniqueId] = {
                order_main_cd: order.order_main_cd,
                order_count: order.order_count,
                formatted_time: formatTime(order.record_date),
                formatted_time_update: formatTime(order.update_date),
                table_name: order.table_name || 'Sin mesa',
                type: order.type || 1,
                type_display: config.type || 1,
                status: determineStatus(
                    order.record_date,
                    'no-iniciado',
                    hasInProgressItem ? 1 : 0,
                    allServed ? 1 : 0
                ),
                elapsedTime: calculateElapsedTime(config.type == 2 ? order.update_date : order.record_date),
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
            setKitchenCode(kitchenCd);
            const response = await fetch(`${API_URL}?action=today_orders&kitchen_cd=${kitchenCd}&language=${configLocal?.selectedLanguage}&type=${config?.type || 1}`);
            if (!response.ok) throw new Error('Error al obtener los pedidos');

            const newData = await response.json();
            if (newData.status === 'error') throw new Error(newData.message);

            if (!newData.data) {
                setOrders([]);
                return;
            }

            let processedNewData;
            // const configLocal = JSON.parse(localStorage.getItem('kitchenConfig')) || {};
            if (configLocal.layoutType === "swipe" && configLocal.type == "1") {
                processedNewData = processOrders(newData.data);
            } else {
                processedNewData = processOrdersTable(newData.data);
            }

            // console.log(processedNewData);
            checkNewOrders(processedNewData);
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

            let response; // Declara la variable primero
            // console.log(config);
            if (config.layoutType === 'kitchenServing') {
                response = await fetch(`${API_URL}?action=ready_orders&kitchen_cd=${kitchenCd}&language=${configLocal?.selectedLanguage}`);
            } else {
                response = await fetch(`${API_URL}?action=completed_orders&kitchen_cd=${kitchenCd}&language=${configLocal?.selectedLanguage}`);
            }
            // console.log(response);

            if (!response.ok) throw new Error('Error al obtener los pedidos completados');

            const newData = await response.json();
            if (newData.status === 'error') throw new Error(newData.message);

            if (!newData.data) {
                setCompletedOrders([]); // Usar el nuevo estado
                return;
            }

            const processedNewData = processOrdersTable(newData.data);
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

            // console.log('typeDisplay:', typeDisplay);
            // console.log('updateKitchenStatus:', orderDetailId, newStatus, kitchen_cd, typeDisplay);
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
        updateKitchenStatus,
        enableSound: toggleSound,
        isSoundEnabled
    };
}
