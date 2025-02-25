import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKitchenSetup } from '../../../hooks/useKitchenSetup';
import { FaPlay } from 'react-icons/fa';
import sound1 from '/assets/sound1.mp3';
import sound2 from '/assets/sound2.mp3';
import sound3 from '/assets/sound3.mp3';
import sound4 from '/assets/sound4.mp3';

const soundPaths = {
    sound1,
    sound2,
    sound3,
    sound4
};
// Calcular el número máximo de tarjetas basado en el ancho de la pantalla
const getMaxCards = () => {
    const screenWidth = window.innerWidth;
    const maxCards = Math.floor(screenWidth / 220);
    return maxCards;
};
const ConfigView = () => {
    const navigate = useNavigate();
    const { updateCustomSettings } = useKitchenSetup();
    const [maxAllowedCards, setMaxAllowedCards] = useState(getMaxCards());
    const config = JSON.parse(localStorage.getItem('kitchenConfig')) || {};

    const handleLanguageChange = (event) => {
        updateCustomSettings({
            selectedLanguage: event.target.value
        });
    };

    const handleSoundChange = (event) => {
        updateCustomSettings({
            sound: event.target.value
        });
    };

    const playSound = (soundType) => {
        const audio = new Audio(soundPaths[soundType]);
        audio.play();
    };
    // const handleLayoutChange = (event) => {
    //     const updatedConfig = {
    //         ...config,
    //         layoutType: event.target.value
    //     };
    //     setConfig(updatedConfig);
    //     localStorage.setItem('kitchenConfig', JSON.stringify(updatedConfig));
    // };
    const handleLayoutChange = (event) => {
        updateCustomSettings({
            layoutType: event.target.value
        });
    };

    // const handleBack = () => {
    //     if (config.uid) {
    //         navigate(`/kitchen/${config.uid}`);
    //     } else {
    //         navigate('/kitchen');
    //     }
    // };

    const handleFontSizeChange = (event) => {
        updateCustomSettings({
            fontSize: event.target.value
        });
    };
    const handleCardQuantityChange = (event) => {
        updateCustomSettings({
            cardQuantity: event.target.value
        });
    };


    // const handleFontSizeChange = (event) => {
    //     const updatedConfig = {
    //         ...config,
    //         fontSize: event.target.value
    //     };
    //     setConfig(updatedConfig);
    //     localStorage.setItem('kitchenConfig', JSON.stringify(updatedConfig));
    // }

    const typeLabels = {
        1: '調理',
        2: '配膳'
    }

    // Layout options based on type
    const getLayoutOptions = () => {
        if (config.type == "1") {
            return [
                { value: "swipe", label: "テーブル表示" },
                { value: "table", label: "メニュー一覧表示" },
                { value: "timeline", label: "オーダー順表示" },
            ];
        } else if (config.type == "2") {
            return [
                // { value: "swipe", label: "Vista de Servicio" },
                { value: "serving-timeline", label: "配膳待ち一覧表示" },
                { value: "serving-completed", label: "配膳済み一覧表示" },
                // { value: "grid", label: "Vista por Mesa" }
            ];
        }
        return [];
    };

    useEffect(() => {
        const handleResize = () => {
            setMaxAllowedCards(getMaxCards());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    let cardOptions = [];
    for (var i = 4; i <= maxAllowedCards; i++) {
        cardOptions.push(
            { value: i, label: i + '枚' }
        )
    }


    return (
        <div className="p-4">
            {/* <h2 className="text-2xl font-bold mb-6">Configuración de Cocina</h2> */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <dl className="grid gap-4">
                    {/* Configuración existente */}
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">CD:</dt>
                        <dd>{config.cd}</dd>
                    </div>
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">ターミナル:</dt>
                        <dd>{config.terminal_name}</dd>
                    </div>

                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">調理待ち超過までの時間:</dt>
                        <dd>{config.elapsed_time}</dd>
                    </div>

                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">タイプ:</dt>
                        <dd>{typeLabels[config.type] || config.type}</dd>
                    </div>
                    {/* <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">ステータス:</dt>
                        <dd>{config.status}</dd>
                    </div> */}
                    <div className="grid grid-cols-2">
                        <dt className="font-medium text-gray-600">Uid:</dt>
                        <dd>{config.uid}</dd>
                    </div>

                    {/* Selector de cantidad de cards */}
                    {config.layoutType === 'swipe' && (
                        <div className="grid grid-cols-2 items-center py-2">
                            <span className="font-medium text-gray-700">
                                表示数:
                            </span>
                            <select
                                value={config.cardQuantity || '4'}
                                onChange={handleCardQuantityChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                            >
                                {cardOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Selector de tamaño de fuente */}
                    <div className="grid grid-cols-2 items-center py-2">
                        <span className="font-medium text-gray-700">
                            文字サイズ:
                        </span>
                        <select
                            value={config.fontSize || 'normal'}
                            onChange={handleFontSizeChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                        >
                            <option value="small">小</option>
                            <option value="normal">中</option>
                            <option value="large">大</option>
                        </select>
                    </div>

                    {/* Layout Selector */}
                    <div className="grid grid-cols-2 items-center py-2">
                        <span className="font-medium text-gray-700">
                            表示種別:
                        </span>
                        <select
                            value={config.layoutType || 'swipe'}
                            onChange={handleLayoutChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                        >
                            {getLayoutOptions().map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Agregar el selector de sonido */}
                    <div className="grid grid-cols-2 items-center py-2">
                        <span className="font-medium text-gray-700">
                            通知音:
                        </span>
                        <div className="flex items-center gap-2">
                            <select
                                value={config.sound || 'sound2'}
                                onChange={handleSoundChange}
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                            >
                                <option value="sound1">音声 1</option>
                                <option value="sound2">音声 2</option>
                                <option value="sound3">音声 3</option>
                                <option value="sound4">音声 4</option>
                            </select>
                            <button
                                onClick={() => playSound(config.sound || 'sound2')}
                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                title="音声を再生"
                            >
                                <FaPlay className="text-lg" />
                            </button>
                        </div>
                    </div>

                    {/* Selector de Lenguaje */}
                    <div className="grid grid-cols-2 items-center py-2">
                        <span className="font-medium text-gray-700">
                            言語:
                        </span>
                        <select
                            value={config.selectedLanguage ?? ''} // Usando el operador nullish para manejar undefined
                            onChange={handleLanguageChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                        >
                            <option value="">日本語</option>
                            {config.languages?.map((lang) => (
                                <option key={lang.language_cd} value={lang.language_cd}>
                                    {lang.language_title}
                                </option>
                            ))}
                        </select>
                    </div>

                </dl>
            </div>

            {/* <button
                onClick={handleBack}
                className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
                Regresar a la Cocina
            </button> */}
        </div>
    );
};

export default ConfigView;