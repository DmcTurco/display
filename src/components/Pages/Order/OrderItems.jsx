import React from 'react'

const OrderItems = ({ items }) => {
  return (
    <>
      {Object.entries(items).map(([category, dishes]) => (
        <div key={category} className="mb-2">
          <h3 className="font-semibold uppercase text-sm text-gray-700">{category}</h3>
          <ul>
            {dishes.map((dish, index) => (
              <li key={index} className="text-sm">{dish}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
};

export default OrderItems