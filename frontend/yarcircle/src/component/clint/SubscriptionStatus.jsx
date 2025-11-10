import React, { useEffect } from 'react'
import { useCredit } from '../../context/CreditContext'

const SubscriptionStatus = ({ onUpgradeClick }) => {
  const { subscription, loading, creditsRemaining, fetchCredits } = useCredit()

  useEffect(() => {
    fetchCredits()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  const isLowCredits = creditsRemaining <= 3 && creditsRemaining > 0
  const isOutOfCredits = creditsRemaining === 0

  return (
    <div className={`rounded-lg shadow-sm p-4 ${
      isOutOfCredits 
        ? 'bg-red-50 border-2 border-red-300' 
        : isLowCredits 
        ? 'bg-yellow-50 border-2 border-yellow-300' 
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <svg 
              className={`w-5 h-5 ${
                isOutOfCredits ? 'text-red-500' : isLowCredits ? 'text-yellow-500' : 'text-blue-500'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <h3 className={`font-semibold ${
              isOutOfCredits ? 'text-red-700' : isLowCredits ? 'text-yellow-700' : 'text-gray-700'
            }`}>
              Profile Views Remaining
            </h3>
          </div>
          
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${
              isOutOfCredits ? 'text-red-600' : isLowCredits ? 'text-yellow-600' : 'text-blue-600'
            }`}>
              {creditsRemaining}
            </span>
            <span className="text-gray-500 text-sm">
              out of {subscription?.viewsAllowed || 0} views
            </span>
          </div>

          {subscription && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isOutOfCredits 
                    ? 'bg-red-500' 
                    : isLowCredits 
                    ? 'bg-yellow-500' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ 
                  width: `${Math.max(5, (creditsRemaining / subscription.viewsAllowed) * 100)}%` 
                }}
              ></div>
            </div>
          )}

          {isOutOfCredits && (
            <p className="mt-2 text-sm text-red-600 font-medium">
              ⚠️ No credits remaining! Upgrade to view worker profiles.
            </p>
          )}
          {isLowCredits && (
            <p className="mt-2 text-sm text-yellow-700 font-medium">
              ⚡ Low credits! Consider upgrading soon.
            </p>
          )}
        </div>

        <div className="ml-4">
          <button
            onClick={onUpgradeClick}
            className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all ${
              isOutOfCredits
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 animate-pulse'
                : isLowCredits
                ? 'bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-500/50'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/50'
            }`}
          >
            {isOutOfCredits ? '⚡ Upgrade Now' : '📦 Buy More Credits'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionStatus
