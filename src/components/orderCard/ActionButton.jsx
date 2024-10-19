import React from 'react'

const ActionButton = ({ status }) => {

    return (
        <button className="w-full bg-green-500 text-white py-2 rounded-md mt-2 hover:bg-green-600 transition-colors">
            {status === 'listo' ? 'Marcar como listo' : 'Comenzar'}
        </button>
    )

};
export default ActionButton