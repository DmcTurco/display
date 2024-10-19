import { AlertTriangle } from 'lucide-react'
import React from 'react'

const UrgentAlert =({ elapsedTime }) => {

    return (
        <div className="flex items-center text-red-500 mb-2">
            <AlertTriangle className="w-4 h-4 mr-1" />
            <span className="text-sm">{elapsedTime}</span>
        </div>
    )
}

export default UrgentAlert