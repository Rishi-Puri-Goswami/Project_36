import React, { useState, useEffect } from 'react'
import { API_URL } from '../../config/api'
import { useCredit } from '../../context/CreditContext'

const WorkersList = ({ onUpgradeNeeded, refreshTrigger, navbarSearchQuery = '', navbarFilters = {} }) => {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingWorker, setViewingWorker] = useState(null)
  const [viewingWorkerPosts, setViewingWorkerPosts] = useState([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [loadingWorkerDetails, setLoadingWorkerDetails] = useState(false)
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkType, setSelectedWorkType] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [sortBy, setSortBy] = useState('newest') // newest, distance, posts
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [workersPerPage] = useState(9) // 3x3 grid
  
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
  
  // Sync navbar search with local search
  useEffect(() => {
    if (navbarSearchQuery !== undefined && navbarSearchQuery !== searchQuery) {
      setSearchQuery(navbarSearchQuery)
    }
  }, [navbarSearchQuery])
  
  // Sync navbar filters with local filters
  useEffect(() => {
    if (navbarFilters.workType !== undefined && navbarFilters.workType !== selectedWorkType) {
      setSelectedWorkType(navbarFilters.workType || 'all')
    }
    if (navbarFilters.location !== undefined && navbarFilters.location !== selectedLocation) {
      setSelectedLocation(navbarFilters.location || '')
    }
  }, [navbarFilters])
  
  // Debounced search - fetch workers when search/filter changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchWorkers()
    }, 500) // 500ms debounce
    
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, selectedWorkType, selectedLocation, sortBy])
  
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
      setLoading(true)
      const token = localStorage.getItem('clientToken')
      
      // Build query parameters
      const params = new URLSearchParams()
      
      // Get user location if available
      const savedLocation = localStorage.getItem('clientLocation')
      if (savedLocation) {
        const { latitude, longitude } = JSON.parse(savedLocation)
        params.append('latitude', latitude)
        params.append('longitude', longitude)
        params.append('radius', '30')
        console.log(`📍 Fetching workers within 30km of location: ${latitude}, ${longitude}`)
      }
      
      // Add search query
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      // Add work type filter
      if (selectedWorkType && selectedWorkType !== 'all') {
        params.append('workType', selectedWorkType)
      }
      
      // Add location filter
      if (selectedLocation.trim()) {
        params.append('location', selectedLocation.trim())
      }
      
      const queryString = params.toString()
      const url = `${API_URL}/clients/workers/available${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        let fetchedWorkers = data.workers || []
        
        // Apply client-side sorting
        fetchedWorkers = applySorting(fetchedWorkers)
        
        setWorkers(fetchedWorkers)
        setCurrentPage(1) // Reset to first page when filters change
        
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
  
  // Apply sorting to workers
  const applySorting = (workersList) => {
    const sorted = [...workersList]
    
    switch (sortBy) {
      case 'distance':
        // Sort by distance (closest first)
        return sorted.sort((a, b) => {
          if (a.distance === undefined) return 1
          if (b.distance === undefined) return -1
          return a.distance - b.distance
        })
      
      case 'posts':
        // Sort by post count (most posts first)
        return sorted.sort((a, b) => {
          const aCount = a.postCount || 0
          const bCount = b.postCount || 0
          return bCount - aCount
        })
      
      case 'experience':
        // Sort by experience (most experienced first)
        return sorted.sort((a, b) => {
          const aExp = parseInt(a.experience) || 0
          const bExp = parseInt(b.experience) || 0
          return bExp - aExp
        })
      
      case 'newest':
      default:
        // Sort by creation date (newest first)
        return sorted.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
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
        setViewingWorkerPosts(data.posts || [])
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
    setViewingWorkerPosts([])
  }
  
  // Pagination Logic
  const indexOfLastWorker = currentPage * workersPerPage
  const indexOfFirstWorker = indexOfLastWorker - workersPerPage
  const currentWorkers = workers.slice(indexOfFirstWorker, indexOfLastWorker)
  const totalPages = Math.ceil(workers.length / workersPerPage)
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }
  
  const handleWorkTypeChange = (e) => {
    setSelectedWorkType(e.target.value)
  }
  
  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value)
  }
  
  const handleSortChange = (e) => {
    setSortBy(e.target.value)
  }
  
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedWorkType('all')
    setSelectedLocation('')
    setSortBy('newest')
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

  if (workers.length === 0 && !loading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          {searchQuery || selectedWorkType !== 'all' || selectedLocation 
            ? 'No Workers Found' 
            : 'No Workers Available'}
        </h3>
        <p className="text-gray-500 mb-4">
          {searchQuery || selectedWorkType !== 'all' || selectedLocation
            ? 'Try adjusting your filters or search query'
            : 'Check back later for available workers'}
        </p>
        {(searchQuery || selectedWorkType !== 'all' || selectedLocation) && (
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear All Filters
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, skills..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Work Type Filter */}
          <div>
            <select
              value={selectedWorkType}
              onChange={handleWorkTypeChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="Plumber">Plumber</option>
              <option value="Electrician">Electrician</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Painter">Painter</option>
              <option value="Mechanic">Mechanic</option>
              <option value="Cleaner">Cleaner</option>
              <option value="Driver">Driver</option>
              <option value="Cook">Cook</option>
              <option value="Gardener">Gardener</option>
              <option value="Security Guard">Security Guard</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Location Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by location..."
              value={selectedLocation}
              onChange={handleLocationChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="distance">Closest First</option>
              <option value="posts">Most Posts</option>
              <option value="experience">Most Experienced</option>
            </select>
          </div>
        </div>
        
        {/* Filter Info and Clear Button */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Showing <span className="font-semibold text-blue-600">{currentWorkers.length}</span> of <span className="font-semibold">{workers.length}</span> workers
            {searchQuery && <span className="ml-2">• Searching for: <span className="font-semibold">"{searchQuery}"</span></span>}
            {selectedWorkType !== 'all' && <span className="ml-2">• Category: <span className="font-semibold">{selectedWorkType}</span></span>}
            {selectedLocation && <span className="ml-2">• Location: <span className="font-semibold">"{selectedLocation}"</span></span>}
          </div>
          
          {(searchQuery || selectedWorkType !== 'all' || selectedLocation) && (
            <button
              onClick={clearFilters}
              className="px-4 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentWorkers.map(worker => {
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
                  
                  {/* Post Count Badge */}
                  {worker.postCount !== undefined && worker.postCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      <span className="text-indigo-600 font-semibold">{worker.postCount} {worker.postCount === 1 ? 'Post' : 'Posts'}</span>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          {/* Page Numbers */}
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => {
              // Show first page, last page, current page, and pages around current
              const showPage = 
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              
              // Show ellipsis
              const showEllipsis = 
                (pageNumber === 2 && currentPage > 3) ||
                (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
              
              if (showEllipsis) {
                return (
                  <span key={pageNumber} className="px-3 py-2 text-gray-400">
                    ...
                  </span>
                )
              }
              
              if (!showPage) return null
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === pageNumber
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })}
          </div>
          
          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
            }`}
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Worker Details Modal */}
      {showDetailsModal && viewingWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {/* Profile Picture */}
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 bg-white/20">
                    {viewingWorker.profilePicture ? (
                      <img 
                        src={viewingWorker.profilePicture} 
                        alt={viewingWorker.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                        {viewingWorker.name?.charAt(0).toUpperCase() || 'W'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{viewingWorker.name}</h2>
                    <p className="text-blue-100">{viewingWorker.workType}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {viewingWorker.status === 'approved' && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
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
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Contact Information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">📞 Phone:</span>
                    <a href={`tel:${viewingWorker.phone}`} className="text-blue-600 hover:underline font-semibold">
                      {viewingWorker.phone}
                    </a>
                  </div>
                  {viewingWorker.email && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="font-medium">✉️ Email:</span>
                      <a href={`mailto:${viewingWorker.email}`} className="text-blue-600 hover:underline">
                        {viewingWorker.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Worker Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-blue-600 font-medium">Location</p>
                  </div>
                  <p className="font-semibold text-gray-800">{viewingWorker.location || 'Not specified'}</p>
                </div>

                {(viewingWorker.yearsOfExperience !== undefined || viewingWorker.experience !== undefined) && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-purple-600 font-medium">Experience</p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {viewingWorker.yearsOfExperience || viewingWorker.experience} years
                    </p>
                  </div>
                )}

                {viewingWorker.age && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-sm text-green-600 font-medium">Age</p>
                    </div>
                    <p className="font-semibold text-gray-800">{viewingWorker.age} years old</p>
                  </div>
                )}
              </div>

              {/* Skills */}
              {viewingWorker.skills && viewingWorker.skills.length > 0 && (
                <div className="border-2 border-indigo-200 rounded-lg p-4 bg-gradient-to-br from-indigo-50 to-white">
                  <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Skills & Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingWorker.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {viewingWorker.bio && (
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{viewingWorker.bio}</p>
                </div>
              )}

              {/* Work Photos (Portfolio) */}
              {viewingWorker.workPhotos && viewingWorker.workPhotos.length > 0 && (
                <div className="border-2 border-yellow-200 rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-white">
                  <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Work Portfolio ({viewingWorker.workPhotos.length} {viewingWorker.workPhotos.length === 1 ? 'photo' : 'photos'})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {viewingWorker.workPhotos.map((photoUrl, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-shadow">
                        <img 
                          src={photoUrl} 
                          alt={`Work sample ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                          onClick={() => window.open(photoUrl, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ID Proof */}
              {viewingWorker.idProof && (
                <div className="border-2 border-red-200 rounded-lg p-4 bg-gradient-to-br from-red-50 to-white">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    ID Proof Document
                  </h4>
                  <div className="max-w-sm">
                    <img 
                      src={viewingWorker.idProof} 
                      alt="ID Proof"
                      className="w-full rounded-lg shadow-lg hover:shadow-2xl transition-shadow cursor-pointer border-2 border-gray-200"
                      onClick={() => window.open(viewingWorker.idProof, '_blank')}
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">Click to view full size</p>
                  </div>
                </div>
              )}

              {/* Worker Posts */}
              {viewingWorkerPosts && viewingWorkerPosts.length > 0 && (
                <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    Worker Posts ({viewingWorkerPosts.length})
                  </h4>
                  <div className="space-y-4">
                    {viewingWorkerPosts.map((post, index) => (
                      <div key={post._id || index} className="bg-white border border-indigo-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="mb-3">
                          <h5 className="text-lg font-semibold text-gray-800 mb-2">{post.title}</h5>
                          <p className="text-gray-600 text-sm">{post.description}</p>
                        </div>
                        
                        {/* Post Images */}
                        {post.images && post.images.length > 0 && (
                          <div className="mb-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                              {post.images.map((imageUrl, imgIndex) => (
                                <div key={imgIndex} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                                  <img
                                    src={imageUrl}
                                    alt={`Post image ${imgIndex + 1}`}
                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {post.images.length > 1 && (
                              <p className="text-xs text-gray-500 mt-2">
                                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {post.images.length} images • Click to view full size
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Post Details */}
                        <div className="grid md:grid-cols-3 gap-3 text-xs border-t border-gray-200 pt-3">
                          {post.skills && (
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <span className="text-gray-500 font-medium">Skills:</span>
                                <span className="text-gray-700 ml-1">{post.skills}</span>
                              </div>
                            </div>
                          )}
                          {post.availability && (
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <span className="text-gray-500 font-medium">Available:</span>
                                <span className="text-gray-700 ml-1">{post.availability}</span>
                              </div>
                            </div>
                          )}
                          {post.expectedSalary && (
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <span className="text-gray-500 font-medium">Salary:</span>
                                <span className="text-gray-700 ml-1">{post.expectedSalary}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Posted on {new Date(post.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {(viewingWorker.otpVerified !== undefined || viewingWorker.createdAt || viewingWorker.updatedAt) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-800 mb-3">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {viewingWorker.otpVerified !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Phone Verified:</span>
                        <span className={`font-semibold ${viewingWorker.otpVerified ? 'text-green-600' : 'text-red-600'}`}>
                          {viewingWorker.otpVerified ? '✅ Yes' : '❌ No'}
                        </span>
                      </div>
                    )}
                    {viewingWorker.createdAt && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Member Since:</span>
                        <span className="font-semibold text-gray-800">
                          {new Date(viewingWorker.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Credits Used Notice */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-700 font-semibold">
                  ✅ 1 credit has been used to view this complete profile
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Remaining credits: <span className="font-bold">{creditsRemaining}</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  This profile is unlocked for 24 hours - you can view it again for free during this period
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
