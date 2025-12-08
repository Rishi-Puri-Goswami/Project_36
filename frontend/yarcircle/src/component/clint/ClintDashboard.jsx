import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../utils/auth'
import { isClientAuthenticated, clearClientToken } from '../../utils/clientAuth'
import { API_URL } from '../../config/api'
import SubscriptionStatus from './SubscriptionStatus'
import PricingModal from './PricingModal'
import WorkersList from './WorkersList'
import CreditDisplay from './CreditDisplay'
import LocationPermissionModal from '../common/LocationPermissionModal'

const ClintDashboard = () => {
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [workers, setWorkers] = useState([])
  const [filteredWorkers, setFilteredWorkers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchTips, setShowSearchTips] = useState(false)
  const [filters, setFilters] = useState({
    workType: '',
    location: ''
  })
  const [workTypeSearch, setWorkTypeSearch] = useState('')
  const [availableWorkTypes, setAvailableWorkTypes] = useState([])

  useEffect(() => {
    // Check authentication first
    if (!isClientAuthenticated()) {
      navigate('/client/login')
      return
    }
    fetchClientData()
    fetchWorkers()
    
    // Check if location permission should be requested
    const locationSkipped = localStorage.getItem('clientLocationSkipped')
    const savedLocation = localStorage.getItem('clientLocation')
    
    if (!locationSkipped && !savedLocation) {
      // Show location modal after a short delay
      setTimeout(() => {
        setShowLocationModal(true)
      }, 1500)
    } else if (savedLocation) {
      // Load saved location
      setUserLocation(JSON.parse(savedLocation))
    }
  }, [navigate])

  useEffect(() => {
    applyFilters()
  }, [workers, searchQuery, filters])

  const fetchClientData = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/clients/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: headers
      })

      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
      } else {
        // If not authenticated, redirect to login
        clearClientToken()
        navigate('/client/login')
      }
    } catch (error) {
      console.error('Error fetching client data:', error)
      clearClientToken()
      navigate('/client/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${API_URL}/clients/workers/available`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setWorkers(data.workers || [])
        
        // Extract unique work types
        const workTypes = [...new Set(data.workers.map(w => w.workType).filter(Boolean))]
        setAvailableWorkTypes(workTypes)
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
    }
  }

  // Fuzzy matching function
  const isFuzzyMatch = (query, target) => {
    if (!query || !target) return false
    
    // Ensure target is a string
    const targetStr = String(target)
    
    const q = query.toLowerCase()
    const t = targetStr.toLowerCase()
    
    // Exact match
    if (t === q) return true
    
    // Starts with
    if (t.startsWith(q)) return true
    
    // Contains
    if (t.includes(q)) return true
    
    // Word-by-word matching
    const words = t.split(/\s+/)
    if (words.some(word => word.startsWith(q))) return true
    
    // Fuzzy similarity for spelling tolerance
    for (const word of words) {
      if (calculateSimilarity(q, word) >= 0.7) {
        return true
      }
    }
    
    return false
  }

  // Calculate similarity between two strings (0 to 1)
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    let matches = 0
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) {
        matches++
      }
    }
    
    return matches / longer.length
  }

  const applyFilters = () => {
    let filtered = [...workers]

    // Apply work type filter
    if (filters.workType && filters.workType !== 'all') {
      filtered = filtered.filter(worker => 
        worker.workType?.toLowerCase() === filters.workType.toLowerCase()
      )
    }

    // Apply location filter
    if (filters.location) {
      const locationQuery = filters.location.toLowerCase()
      filtered = filtered.filter(worker => 
        worker.location?.toLowerCase().includes(locationQuery)
      )
    }

    // Apply search query with fuzzy matching
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      
      filtered = filtered.filter(worker => {
        // Search in name
        if (worker.name && isFuzzyMatch(query, worker.name)) return true
        
        // Search in work type
        if (worker.workType && isFuzzyMatch(query, worker.workType)) return true
        
        // Search in location
        if (worker.location && isFuzzyMatch(query, worker.location)) return true
        
        // Search in skills
        if (worker.skills && isFuzzyMatch(query, worker.skills)) return true
        
        // Multi-word search
        const queryWords = query.split(/\s+/)
        return queryWords.some(word => 
          (worker.name && isFuzzyMatch(word, worker.name)) ||
          (worker.workType && isFuzzyMatch(word, worker.workType)) ||
          (worker.location && isFuzzyMatch(word, worker.location)) ||
          (worker.skills && isFuzzyMatch(word, worker.skills))
        )
      })
    }

    setFilteredWorkers(filtered)
  }

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const getFilteredWorkTypes = () => {
    if (!workTypeSearch.trim()) return availableWorkTypes
    
    const query = workTypeSearch.toLowerCase()
    return availableWorkTypes.filter(type => 
      type.toLowerCase().includes(query)
    )
  }

  const handleLogout = async () => {
    const success = await logout()
    if (success) {
      navigate('/')
    }
  }

  const handleUpgradeClick = () => {
    setShowPricingModal(true)
  }

  const handlePurchaseSuccess = () => {
    // Refresh subscription status and workers list
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-200">
      {/* Real-time Credit Display - Floating Badge */}
      <CreditDisplay />
      
      {/* Header */}
      <header className="backdrop-blur-2xl shadow-sm">
        <div className="w-full sm:px-6 lg:px-8 py-4 flex  justify-between gap-8">
          {/* Left: App Name */}
          <div className="flex items-center gap-3">
            <div className="bg-black rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">YaarCircle</h1>
              <p className="text-xs text-gray-500">Client Dashboard</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-4 hidden lg:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search workers by name, skills, location (e.g. 'plumber', 'delhi')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchTips(true)}
                onBlur={() => setTimeout(() => setShowSearchTips(false), 200)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e40af] focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Search Tips Tooltip */}
              {showSearchTips && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Smart Search Features:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>Find workers even with partial words ("plum" finds "Plumber")</li>
                    <li>Case doesn't matter ("DELHI" = "delhi")</li>
                    <li>Spelling tolerant ("electrisian" finds "Electrician")</li>
                    <li>Searches name, skills, work type, and location</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

<div className='flex justify-between gap-9 '>
          {/* Center: Navigation */}
          <div className="hidden md:flex  gap-6">
            <button 
              onClick={() => navigate('/client/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-[#1e40af] bg-[#1e40af]/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Home</span>
            </button>

            <button 
              onClick={() => navigate('/client/worker-posts')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#1e40af] hover:bg-[#1e40af]/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="font-medium">Worker Posts</span>
            </button>
            
            {/* <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#1e40af] hover:bg-[#1e40af]/10 rounded-lg transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="font-medium">Notifications</span>
              {/* Notification Badge */}
              {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
            {/* </button> */} 

            <button 
              onClick={() => navigate('/client/pricing')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#1e40af] hover:bg-[#1e40af]/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Pricing</span>
            </button>
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#1e40af] hover:bg-[#1e40af]/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Settings</span>
            </button>
          </div>

          {/* Right: Profile */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-gray-800">{client?.name}</p>
              <p className="text-xs text-gray-500">{client?.email}</p>
            </div>
            
            {/* Profile Photo Circle */}
            <div className="relative">
              <div 
                onClick={() => navigate('/client/profile')}
                className="w-12 h-12 rounded-full bg-[#1e40af] flex items-center justify-center text-white font-bold text-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              >
                {client?.profilePicture ? (
                  <img 
                    src={client.profilePicture} 
                    alt={client.name} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  client?.name?.charAt(0).toUpperCase()
                )}
              </div>
              {/* Active Status Indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            {/* Logout Button - Commented for future use */}
            {/* <button 
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Logout
            </button> */}
          </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Subscription Status Bar */}
        <div className="mb-6">
          <SubscriptionStatus onUpgradeClick={handleUpgradeClick} />
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Workers List Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Available Workers
          </h2>
          <WorkersList 
            onUpgradeNeeded={handleUpgradeClick}
            refreshTrigger={refreshTrigger}
            navbarSearchQuery={searchQuery}
            navbarFilters={filters}
          />
        </div>
      </main>

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onPurchaseSuccess={handlePurchaseSuccess}
      />

      {/* Settings Side Menu */}
      {isSettingsOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setIsSettingsOpen(false)}
          ></div>
          
          {/* Side Menu */}
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {/* Edit Profile */}
                  <button 
                    onClick={() => {
                      setIsSettingsOpen(false)
                      // Add navigation or action here
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[#1e40af]/10 rounded-lg transition-colors group"
                  >
                    <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-gray-200 transition-colors">
                      <svg className="w-6 h-6 text-[#1e40af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">Edit Profile</h3>
                      <p className="text-sm text-gray-500">Update your personal information</p>
                    </div>
                  </button>

                  {/* Change Password */}
                  <button 
                    onClick={() => {
                      setIsSettingsOpen(false)
                      // Add navigation or action here
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[#1e40af]/10 rounded-lg transition-colors group"
                  >
                    <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-gray-200 transition-colors">
                      <svg className="w-6 h-6 text-[#1e40af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">Change Password</h3>
                      <p className="text-sm text-gray-500">Update your security credentials</p>
                    </div>
                  </button>

                  {/* Privacy Settings */}
                  <button 
                    onClick={() => {
                      setIsSettingsOpen(false)
                      // Add navigation or action here
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[#1e40af]/10 rounded-lg transition-colors group"
                  >
                    <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-gray-200 transition-colors">
                      <svg className="w-6 h-6 text-[#1e40af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">Privacy Settings</h3>
                      <p className="text-sm text-gray-500">Manage your privacy preferences</p>
                    </div>
                  </button>

                  {/* Notification Preferences */}
                  <button 
                    onClick={() => {
                      setIsSettingsOpen(false)
                      // Add navigation or action here
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[#1e40af]/10 rounded-lg transition-colors group"
                  >
                    <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-gray-200 transition-colors">
                      <svg className="w-6 h-6 text-[#1e40af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">Notification Preferences</h3>
                      <p className="text-sm text-gray-500">Control notification settings</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Location Permission Modal */}
      {showLocationModal && (
        <LocationPermissionModal
          userType="client"
          onClose={() => setShowLocationModal(false)}
          onLocationSet={(location) => {
            setUserLocation(location)
            // Refresh workers list with new location
            setRefreshTrigger(prev => prev + 1)
          }}
        />
      )}
    </div>
  )
}

export default ClintDashboard
