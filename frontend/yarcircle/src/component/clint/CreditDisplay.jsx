import React, { useEffect } from 'react'
import { useCredit } from '../../context/CreditContext'

const CreditDisplay = () => {
  const { creditsRemaining, subscription } = useCredit()

  if (!subscription) return null

  const isLowCredits = creditsRemaining <= 3 && creditsRemaining > 0
  const isOutOfCredits = creditsRemaining === 0

  return (
    <div className={`fixed top-20 right-6 z-40 ${
      isOutOfCredits 
        ? 'bg-red-500' 
        : isLowCredits 
        ? 'bg-yellow-500' 
        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
    } text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center gap-3">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <div>
          <p className="text-xs font-medium opacity-90">Credits</p>
          <p className="text-2xl font-bold leading-none">
            {creditsRemaining}
          </p>
        </div>
      </div>
      
      {isOutOfCredits && (
        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-red-700 animate-pulse rounded-full"></div>
      )}
    </div>
  )
}

export default CreditDisplay
