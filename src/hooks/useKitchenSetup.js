import { useState } from 'react';
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

    const getStoredConfig = () => {
        const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    };

    const fetchConfig = async (uid) => {
        try {
            if (!uid) throw new Error('UID no encontrado');

            const response = await fetch(`${FULL_API_URL}?action=get_kitchen_config&uid=${uid}`);
            const data = await response.json();

            if (data.status !== 'ok') throw new Error(data.message);

            // Guardar config y uid
            const configData = data.data;
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configData));
            localStorage.setItem(LAST_UID_KEY, uid);

            setConfig(configData);
            setIsConfigured(true);
            return configData;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const initializeConfig = async () => {
        setLoading(true);
        try {
            const storedConfig = getStoredConfig();
            const lastUID = localStorage.getItem(LAST_UID_KEY);

            if (uid !== lastUID || !storedConfig) {
                await fetchConfig(uid);
            } else {
                setConfig(storedConfig);
                setIsConfigured(true);
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
        setConfig(null);
        setIsConfigured(false);
    };

    return {
        config,
        loading,
        error,
        isConfigured,
        initializeConfig,
        clearConfig
    };
}