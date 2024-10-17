import React, { useState } from 'react'

function useOrders() {

    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const getOrders = async () => {

        try {
            const url = 'http://localhost:5000/orders'
            const reponse = await fetch(url)

            if (!reponse.ok) {
                throw new Error('Error al obtener los pedidos');
            }
            const data = await reponse.json()
            setOrders(data)
            setLoading(false)
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }



    return { orders, loading, error, getOrders }
}

export default useOrders