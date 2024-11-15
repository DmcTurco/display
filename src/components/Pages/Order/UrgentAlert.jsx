import { AlertTriangle } from 'lucide-react'
import React from 'react'

const UrgentAlert =({ elapsedTime }) => {

    return (
        <div className="inline-flex items-center text-red-500">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm ml-1">{elapsedTime}</span>
        </div>
    )
}

export default UrgentAlert