import React, { createContext, useState, useContext, useCallback } from 'react'
import { API_URL } from '../config/api'

const CreditContext = createContext()

export const useCredit = () => {
  const context = useContext(CreditContext)
  if (!context) {
    throw new Error('useCredit must be used within a CreditProvider')
  }
  return context
}

export const CreditProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch subscription status
  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('clientToken')
      const response = await fetch(`${API_URL}/clients/subscription/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
        return data.subscription
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update credits after viewing a worker (optimistic update)
  const consumeCredit = useCallback((alreadyViewed = false) => {
    if (!alreadyViewed && subscription) {
      // Optimistic update - instantly update UI
      setSubscription(prev => ({
        ...prev,
        viewsUsed: prev.viewsUsed + 1
      }))
    }
    // Fetch fresh data to ensure sync
    setTimeout(fetchCredits, 500)
  }, [subscription, fetchCredits])

  // Add credits after purchase (optimistic update)
  const addCredits = useCallback((newCredits) => {
    if (subscription) {
      setSubscription(prev => ({
        ...prev,
        viewsAllowed: prev.viewsAllowed + newCredits
      }))
    }
    // Fetch fresh data to ensure sync
    setTimeout(fetchCredits, 500)
  }, [subscription, fetchCredits])

  const creditsRemaining = subscription 
    ? subscription.viewsAllowed - subscription.viewsUsed 
    : 0

  const value = {
    subscription,
    loading,
    creditsRemaining,
    fetchCredits,
    consumeCredit,
    addCredits
  }

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  )
}
