import React, { useState, useEffect } from 'react'
import { API_URL } from '../../config/api'
import { useCredit } from '../../context/CreditContext'

const WorkersList = ({ onUpgradeNeeded, refreshTrigger }) => {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingWorker, setViewingWorker] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [loadingWorkerDetails, setLoadingWorkerDetails] = useState(false)
  
  // Use Credit Context for real-time credit updates
  const { subscription, creditsRemaining, consumeCredit, fetchCredits } = useCredit()
  
  // ✨ Force re-render every minute to update timers
  const [, forceUpdate] = useState(0)
  
  // ✨ Track which workers have been unlocked with timestamps (24-hour access)
  // Load from localStorage on mount
  const [unlockedWorkers, setUnlockedWorkers] = useState(() => {
    try {
      const stored = localStorage.getItem('unlockedWorkers')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert array of [key, value] pairs back to Map
        return new Map(parsed)
      }
    } catch (error) {
      console.error('Error loading unlocked workers from localStorage:', error)
    }
    return new Map()
  })
  
  // Save to localStorage whenever unlockedWorkers changes
  useEffect(() => {
    try {
      // Convert Map to array for JSON serialization
      const serialized = JSON.stringify(Array.from(unlockedWorkers.entries()))
      localStorage.setItem('unlockedWorkers', serialized)
    } catch (error) {
      console.error('Error saving unlocked workers to localStorage:', error)
    }
  }, [unlockedWorkers])
  
  // Helper function to check if unlock has expired (24 hours)
  const isUnlockValid = (workerId) => {
    const unlockTime = unlockedWorkers.get(workerId)
    if (!unlockTime) return false
    
    const now = Date.now()
    const hoursPassed = (now - unlockTime) / (1000 * 60 * 60)
    return hoursPassed < 24 // Valid if less than 24 hours
  }
  
  // Helper function to get remaining time for unlock
  const getRemainingTime = (workerId) => {
    const unlockTime = unlockedWorkers.get(workerId)
    if (!unlockTime) return null
    
    const now = Date.now()
    const hoursRemaining = 24 - ((now - unlockTime) / (1000 * 60 * 60))
    
    if (hoursRemaining <= 0) return null
    
    if (hoursRemaining < 1) {
      const minutesRemaining = Math.floor(hoursRemaining * 60)
      return `${minutesRemaining}m`
    }
    return `${Math.floor(hoursRemaining)}h`
  }

  useEffect(() => {
    fetchWorkers()
    fetchCredits() // Load credits when component mounts
  }, [refreshTrigger])
  
  // ✨ Check for expired unlocks every minute
  useEffect(() => {
    const checkExpiredUnlocks = () => {
      setUnlockedWorkers(prev => {
        const newMap = new Map(prev)
        let hasChanges = false
        
        for (const [workerId, timestamp] of newMap.entries()) {
          const hoursPassed = (Date.now() - timestamp) / (1000 * 60 * 60)
          if (hoursPassed >= 24) {
            newMap.delete(workerId)
            hasChanges = true
            console.log(`⏰ Worker ${workerId} unlock expired after 24 hours`)
          }
        }
        
        return hasChanges ? newMap : prev
      })
      
      // Force re-render to update timer displays
      forceUpdate(prev => prev + 1)
    }
    
    // Check immediately
    checkExpiredUnlocks()
    
    // Then check every minute
    const interval = setInterval(checkExpiredUnlocks, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      
      // Get user location if available
      const savedLocation = localStorage.getItem('clientLocation')
      let queryParams = ''
      
      if (savedLocation) {
        const { latitude, longitude } = JSON.parse(savedLocation)
        queryParams = `?latitude=${latitude}&longitude=${longitude}&radius=30`
        console.log(`📍 Fetching workers within 30km of location: ${latitude}, ${longitude}`)
      }
      
      const response = await fetch(`${API_URL}/clients/workers/available${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWorkers(data.workers || [])
        
        if (data.searchRadius) {
          console.log(`✅ Found ${data.total} workers within ${data.searchRadius}`)
        }
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (worker) => {
    // Check if this worker's unlock has expired
    const wasUnlocked = unlockedWorkers.has(worker._id)
    const unlockStillValid = isUnlockValid(worker._id)
    
    if (wasUnlocked && !unlockStillValid) {
      // Unlock expired - remove from map so backend will charge again
      setUnlockedWorkers(prev => {
        const newMap = new Map(prev)
        newMap.delete(worker._id)
        return newMap
      })
      console.log('⏰ 24-hour unlock expired - Will consume credit again')
    }
    
    // Check if user has credits (only if worker is locked or expired)
    if (!unlockStillValid && !subscription) {
      alert('❌ Unable to check subscription status. Please refresh the page.')
      return
    }

    if (!unlockStillValid && creditsRemaining <= 0) {
      // Show upgrade modal
      onUpgradeNeeded()
      return
    }

    // Fetch worker details (this will consume 1 credit)
    setLoadingWorkerDetails(true)
    try {
      const token = localStorage.getItem('clientToken')
      const response = await fetch(`${API_URL}/clients/worker/view/${worker._id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setViewingWorker(data.worker)
        setShowDetailsModal(true)
        
        // ✨ Mark worker as unlocked with timestamp (24-hour access)
        if (!data.alreadyViewed) {
          // New unlock - store timestamp
          setUnlockedWorkers(prev => {
            const newMap = new Map(prev)
            newMap.set(worker._id, Date.now())
            return newMap
          })
          console.log(`🔓 Worker unlocked for 24 hours! Credits remaining: ${data.creditsRemaining}`)
        } else if (!unlockedWorkers.has(worker._id)) {
          // Backend says already viewed but we don't have timestamp (page refresh case)
          // Set timestamp to now so they get full 24 hours from this session
          setUnlockedWorkers(prev => {
            const newMap = new Map(prev)
            newMap.set(worker._id, Date.now())
            return newMap
          })
          console.log('✅ Viewing already unlocked profile - No credit consumed')
        }
        
        // ✨ REAL-TIME CREDIT UPDATE - Update credits instantly!
        consumeCredit(data.alreadyViewed)
        
        // Show notification
        if (!data.alreadyViewed) {
          alert(`✅ Profile unlocked for 24 hours! ${data.creditsRemaining} credits remaining`)
        }
      } else if (response.status === 403) {
        const errorData = await response.json()
        alert(`❌ ${errorData.error || errorData.message}`)
        onUpgradeNeeded()
      } else {
        alert('❌ Failed to load worker details')
      }
    } catch (error) {
      console.error('Error viewing worker:', error)
      alert('❌ Error loading worker details')
    } finally {
      setLoadingWorkerDetails(false)
    }
  }

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setViewingWorker(null)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (workers.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Workers Available</h3>
        <p className="text-gray-500">Check back later for available workers</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map(worker => {
          const isUnlocked = isUnlockValid(worker._id)
          const remainingTime = getRemainingTime(worker._id)
          
          return (
            <div 
              key={worker._id} 
              className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden ${
                isUnlocked ? 'border-2 border-green-400' : ''
              }`}
            >
              <div className="p-6">
                {/* Unlocked Badge with Timer */}
                {isUnlocked && (
                  <div className="mb-3 flex items-center justify-between bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Unlocked
                    </div>
                    {remainingTime && (
                      <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded-full text-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {remainingTime}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Worker Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {worker.name?.charAt(0).toUpperCase() || 'W'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{worker.name}</h3>
                    <p className="text-sm text-gray-500">{worker.workType}</p>
                  </div>
                </div>

                {/* Worker Info (Limited) */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600">{worker.location || 'Location not specified'}</span>
                  </div>
                  
                  {/* Distance Badge (if available) */}
                  {worker.distance !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span className="text-green-600 font-semibold">{worker.distance}km away</span>
                    </div>
                  )}
                  
                  {worker.experience && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600">{worker.experience} years experience</span>
                    </div>
                  )}

                  {/* Contact Info - Blurred if locked, visible if unlocked */}
                  <div className={`bg-gray-50 rounded-lg p-3 relative mt-4 ${!isUnlocked ? 'blur-sm' : ''}`}>
                    {isUnlocked ? (
                      // Unlocked - Show real contact info
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 flex items-center gap-2">
                          <span className="font-medium">📞</span>
                          <span>{worker.phoneNumber || '+91 XXXXX XXXXX'}</span>
                        </p>
                        <p className="text-sm text-gray-700 flex items-center gap-2">
                          <span className="font-medium">✉️</span>
                          <span>{worker.email || 'Not provided'}</span>
                        </p>
                      </div>
                    ) : (
                      // Locked - Show placeholder
                      <div className="select-none">
                        <p className="text-xs text-gray-500">📞 +91 XXXXX XXXXX</p>
                        <p className="text-xs text-gray-500 mt-1">✉️ xxxxx@email.com</p>
                      </div>
                    )}
                    
                    {/* Lock/Unlock indicator overlay */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                          🔒 Locked
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => handleViewDetails(worker)}
                  disabled={loadingWorkerDetails}
                  className={`w-full py-2.5 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    isUnlocked 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                  }`}
                >
                  {loadingWorkerDetails ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : isUnlocked ? (
                    // Unlocked state - Free to view again
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      View Again
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                        Free
                      </span>
                    </>
                  ) : (
                    // Locked state - Costs 1 credit
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Unlock Full Details
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                        1 credit
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Worker Details Modal */}
      {showDetailsModal && viewingWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                    {viewingWorker.name?.charAt(0).toUpperCase() || 'W'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{viewingWorker.name}</h2>
                    <p className="text-blue-100">{viewingWorker.workType}</p>
                  </div>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Information
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700 flex items-center gap-2">
                    <span className="font-medium">📞 Phone:</span>
                    <a href={`tel:${viewingWorker.phone}`} className="text-blue-600 hover:underline">
                      {viewingWorker.phone}
                    </a>
                  </p>
                  {viewingWorker.email && (
                    <p className="text-gray-700 flex items-center gap-2">
                      <span className="font-medium">✉️ Email:</span>
                      <a href={`mailto:${viewingWorker.email}`} className="text-blue-600 hover:underline">
                        {viewingWorker.email}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Worker Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="font-semibold text-gray-800">{viewingWorker.location || 'Not specified'}</p>
                </div>
                {viewingWorker.experience && (
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Experience</p>
                    <p className="font-semibold text-gray-800">{viewingWorker.experience} years</p>
                  </div>
                )}
                {viewingWorker.age && (
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Age</p>
                    <p className="font-semibold text-gray-800">{viewingWorker.age} years</p>
                  </div>
                )}
                {viewingWorker.gender && (
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Gender</p>
                    <p className="font-semibold text-gray-800 capitalize">{viewingWorker.gender}</p>
                  </div>
                )}
              </div>

              {/* Skills/Bio */}
              {viewingWorker.bio && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">About</h4>
                  <p className="text-gray-600">{viewingWorker.bio}</p>
                </div>
              )}

              {/* Worker Posts/Portfolio */}
              {viewingWorker.posts && viewingWorker.posts.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Portfolio</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {viewingWorker.posts.map((post, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={post.imageUrl} 
                          alt={`Work ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Credits Used Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-700">
                  ✅ 1 credit has been used to view this profile
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Remaining credits: {creditsRemaining}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default WorkersList
