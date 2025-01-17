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
            const lastUID = localStorage.getItem(LAST_UID_KEY);
            const storedConfig = getStoredConfig();

            // Guardar configuraciones personalizadas antes de cualquier operación
            const customSettings = storedConfig ? {
                layoutType: storedConfig.layoutType,
                fontSize: storedConfig.fontSize
            } : {};

            if (uid !== lastUID) {
                console.log('UID diferente, limpiando configuración');
                clearConfig();
                await fetchConfig(uid);
            } else if (!storedConfig) {
                await fetchConfig(uid);
            } else {
                // Verificar si el tipo cambió
                const newConfigResponse = await fetch(`${FULL_API_URL}?action=get_kitchen_config&uid=${uid}`);
                const newConfigData = await newConfigResponse.json();

                if (newConfigData.status === 'ok' && newConfigData.data.type !== storedConfig.type) {
                    console.log('Tipo diferente, actualizando config');
                    clearConfig();
                    await fetchConfig(uid);
                } else {
                    console.log('Usando config almacenada');
                    setConfig(storedConfig);
                    setIsConfigured(true);
                }
            }

            // Restaurar configuraciones personalizadas después de cualquier actualización
            const currentConfig = getStoredConfig();
            if (currentConfig) {
                const mergedConfig = {
                    ...currentConfig,
                    ...customSettings
                };
                localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(mergedConfig));
                setConfig(mergedConfig);
            }

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

    // Nuevo método para actualizar solo configuraciones personalizadas
    const updateCustomSettings = (newSettings) => {
        const currentConfig = getStoredConfig();
        if (currentConfig) {
            const updatedConfig = {
                ...currentConfig,
                ...newSettings
            };
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));
            setConfig(updatedConfig);
        }
    };

    return {
        config,
        loading,
        error,
        isConfigured,
        initializeConfig,
        clearConfig,
        updateCustomSettings
    };
}