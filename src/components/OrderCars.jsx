import React, { useState,useEffect } from 'react'
import './OrderCars.css'

function OrderCars({order}) {

    const [time, setTime] = useState(order.time);
    const [status, setStatus] = useState(order.status);

    useEffect(() =>{
        let timer;
        if(status === 'in-progress'){
            const [minutes, seconds] = time.split(':').map(Number);

            timer = setInterval(() =>{
                let totalSeconds = minutes * 60 + seconds -1
                const newMinutes = Math.floor(totalSeconds / 60)
                const newSeconds = totalSeconds % 60;
                setTime(`${newMinutes}:${newSeconds < 10 ? '0':''}${newSeconds}`)
            },1000)
        }

        return ()=>clearInterval(timer)

    }, [time, status])

    const handleStart = () => setStatus('in-progress')
    const handleReady = () => setStatus('ready')
    const handleCancel = () => setStatus('cancelled')


  return (
    <div className={`order-card ${order.status}`}>
      <div className="order-header">
        <div className="order-time">{order.time}</div>
        <div className="order-id">#{order.id}</div>
      </div>
      <div className="order-body">
        <div className="order-items">
          <strong>PLATS:</strong>
          <ul>
            {order.plats.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="order-items">
          <strong>ENTRÉES:</strong>
          <ul>
            {order.entrees.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="order-items">
          <strong>DESSERTS:</strong>
          <ul>
            {order.desserts.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="order-actions">
        <button className="btn-green">Marquer comme prêt</button>
      </div>
    </div>
  )
}

export default OrderCars