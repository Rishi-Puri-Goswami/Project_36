import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../utils/auth'
import { isClientAuthenticated, clearClientToken } from '../../utils/clientAuth'

const ClintDashboard = () => {
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
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
      
      const response = await fetch('http://localhost:5000/api/clients/profile', {
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
      const response = await fetch('http://localhost:5000/api/clients/workers/available', {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="w-full sm:px-6 lg:px-8 py-4 flex  justify-between gap-8">
          {/* Left: App Name */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
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
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    <li>✓ Find workers even with partial words ("plum" finds "Plumber")</li>
                    <li>✓ Case doesn't matter ("DELHI" = "delhi")</li>
                    <li>✓ Spelling tolerant ("electrisian" finds "Electrician")</li>
                    <li>✓ Searches name, skills, work type, and location</li>
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
              className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Home</span>
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="font-medium">Notifications</span>
              {/* Notification Badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button 
              onClick={() => navigate('/client/pricing')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Pricing</span>
            </button>
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
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
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filters
              </h3>

              {/* Work Type Filter with Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Type
                </label>
                
                {/* Work Type Search */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Search work type..."
                    value={workTypeSearch}
                    onChange={(e) => setWorkTypeSearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  <button
                    onClick={() => handleFilterChange('workType', 'all')}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      filters.workType === 'all' || !filters.workType ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    All Types
                  </button>
                  {getFilteredWorkTypes().map((type, index) => (
                    <button
                      key={index}
                      onClick={() => handleFilterChange('workType', type)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors border-t ${
                        filters.workType === type ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter city..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Clear All Filters */}
              <button
                onClick={() => {
                  setFilters({ workType: '', location: '' })
                  setSearchQuery('')
                  setWorkTypeSearch('')
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Workers Grid */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Available Workers ({filteredWorkers.length})
              </h2>
            </div>

            {filteredWorkers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Workers Found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredWorkers.map((worker) => (
                  <div key={worker._id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {worker.name?.charAt(0).toUpperCase()}
                      </div>

                      {/* Worker Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{worker.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{worker.workType}</span>
                        </div>
                        
                        {/* Location */}
                        {worker.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{worker.location}</span>
                          </div>
                        )}

                        {/* Experience */}
                        {worker.experience && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{worker.experience} years experience</span>
                          </div>
                        )}

                        {/* Skills */}
                        {worker.skills && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            <span className="font-medium">Skills:</span> {worker.skills}
                          </p>
                        )}

                        {/* Contact Buttons */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => navigate(`/client/worker-profile/${worker._id}`)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                          >
                            View Profile
                          </button>
                          {worker.phone && (
                            <a
                              href={`tel:${worker.phone}`}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

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
                    className="w-full flex items-center gap-4 p-4 hover:bg-blue-50 rounded-lg transition-colors group"
                  >
                    <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-full flex items-center gap-4 p-4 hover:bg-green-50 rounded-lg transition-colors group"
                  >
                    <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-full flex items-center gap-4 p-4 hover:bg-purple-50 rounded-lg transition-colors group"
                  >
                    <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-full flex items-center gap-4 p-4 hover:bg-orange-50 rounded-lg transition-colors group"
                  >
                    <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
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
    </div>
  )
}

export default ClintDashboard
