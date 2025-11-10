import React, { useState } from 'react'
import { getCurrentLocation } from '../../utils/location'
import { API_URL } from '../../config/api'

const LocationPermissionModal = ({ isOpen, userType, onClose, onLocationSet }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Don't render if not open
  if (!isOpen) return null

  const handleAllowLocation = async () => {
    setLoading(true)
    setError('')

    try {
      // Get current location
      const { latitude, longitude } = await getCurrentLocation()
      
      console.log(`📍 Location obtained: ${latitude}, ${longitude}`)

      // Send to backend
      const token = localStorage.getItem(`${userType}Token`)
      const endpoint = userType === 'client' 
        ? `${API_URL}/clients/update-location`
        : `${API_URL}/workers/update-location`

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude, longitude })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Location saved to database:', data)
        
        // Store in localStorage for future use
        localStorage.setItem(`${userType}Location`, JSON.stringify({ latitude, longitude }))
        
        // Notify parent component
        if (onLocationSet) {
          onLocationSet({ latitude, longitude })
        }
        
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save location')
      }
    } catch (err) {
      console.error('Location error:', err)
      setError(err.message || 'Failed to get location. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    // Mark as skipped
    localStorage.setItem(`${userType}LocationSkipped`, 'true')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Enable Location Access
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          We need your location to show you {userType === 'client' ? 'nearby workers' : 'nearby jobs'} within 30km radius. 
          Your location will only be used to find matches near you.
        </p>

        {/* Benefits */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Benefits:
          </h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• See {userType === 'client' ? 'workers' : 'jobs'} within 30km</li>
            <li>• Sorted by distance (nearest first)</li>
            <li>• Save time and travel costs</li>
            <li>• {userType === 'client' ? 'Hire local workers faster' : 'Find local jobs easier'}</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleAllowLocation}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Getting Location...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Allow Location Access
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            disabled={loading}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Skip for Now
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          🔒 Your location is private and secure. We only use it to show nearby matches.
        </p>
      </div>
    </div>
  )
}

export default LocationPermissionModal
