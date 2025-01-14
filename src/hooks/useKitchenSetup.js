import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';


const CONFIG_STORAGE_KEY = 'kitchenConfig';
const LAST_UID_KEY = 'lastKitchenUID';
const API_URL_KEY = 'apiUrl';

export const buildApiUrl = () => {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    const baseUrl = `${url.protocol}//${url.hostname}`;
    const apiPath = '/kitchen_display/api/get_order.php';
    return baseUrl + apiPath;
};

const FULL_API_URL = buildApiUrl();

export function useKitchenSetup() {
    const { uid } = useParams();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConfigured, setIsConfigured] = useState(false);

    const getStoredConfig = () => {  // Obtiene config del localStorage
        const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    };

    const fetchConfig = async (uid) => {
        try {
            if (!uid) throw new Error('UID no encontrado');

            const response = await fetch(`${FULL_API_URL}?action=get_kitchen_config&uid=${uid}`);
            const data = await response.json();

            if (data.status !== 'ok') throw new Error(data.message);

            const configData = data.data;
            // console.log('Nueva configuración recibida:', configData);

            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configData));
            localStorage.setItem(LAST_UID_KEY, uid);
            localStorage.setItem('apiUrl', buildApiUrl());

            setConfig(configData);
            setIsConfigured(true);
            return configData;
        } catch (err) {
            console.error('Error en fetchConfig:', err);
            setError(err.message);
            throw err;
        }
    };


    const initializeConfig = async () => {
        setLoading(true);
        try {
            // Siempre limpiamos la configuración anterior
            clearConfig();
            // Obtenemos nueva configuración
            await fetchConfig(uid);
            
            // Primero limpiar todo si el UID cambió
            // const lastUID = localStorage.getItem(LAST_UID_KEY);
            // if (uid !== lastUID) {
            //     console.log('UID diferente, limpiando configuración');
            //     clearConfig();
            // }

            // const storedConfig = getStoredConfig();
            
            // // Si no hay config o UID es diferente, obtener nueva
            // if (!storedConfig || uid !== lastUID) {
            //     await fetchConfig(uid);
            //     return;
            // }

            // // Verificar si el tipo cambió
            // const newConfigResponse = await fetch(`${FULL_API_URL}?action=get_kitchen_config&uid=${uid}`);
            // const newConfigData = await newConfigResponse.json();

            // if (newConfigData.status === 'ok' && newConfigData.data.type !== storedConfig.type) {
            //     console.log('Tipo diferente, actualizando config');
            //     clearConfig();
            //     await fetchConfig(uid);
            // } else {
            //     console.log('Usando config almacenada');
            //     setConfig(storedConfig);
            //     setIsConfigured(true);
            // }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const clearConfig = () => {
        localStorage.removeItem(CONFIG_STORAGE_KEY);
        localStorage.removeItem(LAST_UID_KEY);
        localStorage.removeItem('apiUrl');
        setConfig(null);
        setIsConfigured(false);
        
    };

    // // Efecto para detectar cambios de UID
    // useEffect(() => {
    //     if (uid) {
    //         initializeConfig();
    //     }
    //     // Función de limpieza
    //     return () => {
    //         console.log('Limpiando efecto de UID');
    //     };
    // }, [uid]);

    return {
        config,
        loading,
        error,
        isConfigured,
        initializeConfig,
        clearConfig
    };
}