import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isWorkerAuthenticated, clearWorkerToken } from '../../utils/workerAuth'
import { API_URL } from '../../config/api'
import LocationPermissionModal from '../common/LocationPermissionModal'

const WorkerDashboard = () => {
  const navigate = useNavigate()
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [applyingJobId, setApplyingJobId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [workTypeSearch, setWorkTypeSearch] = useState('')
  const [showSearchTips, setShowSearchTips] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [sortBy, setSortBy] = useState('latest')
  const [filters, setFilters] = useState({
    workType: [],
    location: '',
    salaryRange: '',
    searchQuery: ''
  })

  useEffect(() => {
    // Check authentication first
    if (!isWorkerAuthenticated()) {
      navigate('/worker/login')
      return
    }
    fetchWorkerData()
    fetchJobs()
    
    // Check if location permission should be requested
    const locationSkipped = localStorage.getItem('workerLocationSkipped')
    const savedLocation = localStorage.getItem('workerLocation')
    
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
    // Apply filters whenever jobs or filters change
    applyFilters()
  }, [jobs, filters])

  const fetchWorkerData = async () => {
    try {
      const token = localStorage.getItem('workerToken');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/workers/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: headers
      })

      if (response.ok) {
        const data = await response.json()
        setWorker(data.worker)
      } else {
        // If not authenticated, redirect to login
        clearWorkerToken()
        navigate('/worker/login')
      }
    } catch (error) {
      console.error('Error fetching worker data:', error)
      clearWorkerToken()
      navigate('/worker/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams()
      
      // Check if we should apply location filter
      const savedLocation = localStorage.getItem('workerLocation')
      const hasSearchQuery = filters.searchQuery.trim()
      
      // If there's a search query, fetch all jobs (no location filter)
      // If no search query, try location-based first, then fallback to all jobs
      const shouldApplyLocationFilter = !hasSearchQuery && savedLocation
      
      if (shouldApplyLocationFilter) {
        try {
          const location = JSON.parse(savedLocation)
          params.append('latitude', location.latitude)
          params.append('longitude', location.longitude)
          params.append('radius', '30') // 30km radius
          console.log('📍 Fetching jobs within 30km of worker location:', location)
        } catch (error) {
          console.error('Error parsing saved location:', error)
        }
      }
      
      if (filters.workType.length > 0) {
        params.append('workType', filters.workType[0]) // For now, use first selected type
      }
      
      if (filters.location.trim()) {
        params.append('location', filters.location)
      }
      
      if (filters.salaryRange && filters.salaryRange !== 'all') {
        params.append('salaryRange', filters.salaryRange)
      }
      
      if (filters.searchQuery.trim()) {
        params.append('search', filters.searchQuery)
      }

      const response = await fetch(`${API_URL}/clients/jobs/available?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        let jobsData = data.jobs || []
        
        // If no jobs found within 30km and no search query, fetch all jobs
        if (jobsData.length === 0 && shouldApplyLocationFilter && !hasSearchQuery) {
          console.log('📍 No jobs found within 30km, fetching all available jobs...')
          
          // Remove location parameters and fetch all jobs
          const allJobsParams = new URLSearchParams()
          
          if (filters.workType.length > 0) {
            allJobsParams.append('workType', filters.workType[0])
          }
          
          if (filters.location.trim()) {
            allJobsParams.append('location', filters.location)
          }
          
          if (filters.salaryRange && filters.salaryRange !== 'all') {
            allJobsParams.append('salaryRange', filters.salaryRange)
          }

          const allJobsResponse = await fetch(`${API_URL}/clients/jobs/available?${allJobsParams.toString()}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          })

          if (allJobsResponse.ok) {
            const allJobsData = await allJobsResponse.json()
            jobsData = allJobsData.jobs || []
            console.log('📍 Found', jobsData.length, 'jobs available globally')
          }
        }
        
        setJobs(jobsData)
        console.log("jobs data", jobsData);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    }
  }

  const applyFilters = () => {
    let filtered = [...jobs]

    // Filter by work type (case-insensitive)
    if (filters.workType.length > 0) {
      filtered = filtered.filter(job => 
        filters.workType.some(selectedType => 
          job.workType && job.workType.toLowerCase() === selectedType.toLowerCase()
        )
      )
    }

    // Filter by location (case-insensitive)
    if (filters.location.trim()) {
      const locationLower = filters.location.toLowerCase()
      filtered = filtered.filter(job => 
        job.location && job.location.toLowerCase().includes(locationLower)
      )
    }

    // Filter by salary range (case-insensitive)
    if (filters.salaryRange && filters.salaryRange !== 'all') {
      filtered = filtered.filter(job => 
        job.salaryRange && job.salaryRange.toLowerCase() === filters.salaryRange.toLowerCase()
      )
    }

    // Advanced search with fuzzy matching (case-insensitive, partial match, spelling tolerance)
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim()
      
      filtered = filtered.filter(job => {
        // Get searchable fields
        const description = (job.description || '').toLowerCase()
        const workType = (job.workType || '').toLowerCase()
        const location = (job.location || '').toLowerCase()
        const companyName = (job.clientId?.companyName || job.clientId?.name || '').toLowerCase()
        
        // Exact match or partial match
        if (description.includes(query) || 
            workType.includes(query) || 
            location.includes(query) ||
            companyName.includes(query)) {
          return true
        }
        
        // Split query into words for better matching
        const queryWords = query.split(/\s+/)
        
        // Check if any query word matches (partial)
        const matchesAnyWord = queryWords.some(word => 
          description.includes(word) || 
          workType.includes(word) || 
          location.includes(word) ||
          companyName.includes(word)
        )
        
        if (matchesAnyWord) {
          return true
        }
        
        // Fuzzy matching for spelling errors
        // Check if query is similar to workType (for misspellings like "plum" -> "plumber")
        if (isFuzzyMatch(query, workType) || 
            isFuzzyMatch(query, description) ||
            isFuzzyMatch(query, location)) {
          return true
        }
        
        // Check each word for fuzzy match
        const matchesFuzzyWord = queryWords.some(word => 
          isFuzzyMatch(word, workType) || 
          isFuzzyMatch(word, description.split(/\s+/).join(' ')) ||
          isFuzzyMatch(word, location)
        )
        
        return matchesFuzzyWord
      })
    }

    setFilteredJobs(filtered)
  }

  // Function to parse salary range and return a comparable number
  const parseSalaryRange = (salaryRange) => {
    if (!salaryRange) return 0
    
    // Handle different salary range formats
    if (salaryRange.includes('30000+')) return 30000
    if (salaryRange.includes('20000-30000')) return 25000 // midpoint
    if (salaryRange.includes('10000-20000')) return 15000 // midpoint
    if (salaryRange.includes('0-10000')) return 5000 // midpoint
    
    // Try to extract numbers from the string
    const numbers = salaryRange.match(/\d+/g)
    if (numbers && numbers.length > 0) {
      return parseInt(numbers[0])
    }
    
    return 0
  }

  // Function to apply sorting to filtered jobs
  const applySorting = (jobsToSort) => {
    let sorted = [...jobsToSort]

    switch (sortBy) {
      case 'salary-high':
        sorted.sort((a, b) => {
          const salaryA = parseSalaryRange(a.salaryRange)
          const salaryB = parseSalaryRange(b.salaryRange)
          return salaryB - salaryA // High to low
        })
        break
      case 'salary-low':
        sorted.sort((a, b) => {
          const salaryA = parseSalaryRange(a.salaryRange)
          const salaryB = parseSalaryRange(b.salaryRange)
          return salaryA - salaryB // Low to high
        })
        break
      case 'latest':
      default:
        sorted.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt) // Latest first
        })
        break
    }

    return sorted
  }

  // Apply filters and sorting whenever jobs or filters change
  useEffect(() => {
    let filtered = [...jobs]

    // Filter by work type (case-insensitive)
    if (filters.workType.length > 0) {
      filtered = filtered.filter(job => 
        filters.workType.some(selectedType => 
          job.workType && job.workType.toLowerCase() === selectedType.toLowerCase()
        )
      )
    }

    // Filter by location (case-insensitive)
    if (filters.location.trim()) {
      const locationLower = filters.location.toLowerCase()
      filtered = filtered.filter(job => 
        job.location && job.location.toLowerCase().includes(locationLower)
      )
    }

    // Filter by salary range (case-insensitive)
    if (filters.salaryRange && filters.salaryRange !== 'all') {
      filtered = filtered.filter(job => 
        job.salaryRange && job.salaryRange.toLowerCase() === filters.salaryRange.toLowerCase()
      )
    }

    // Advanced search with fuzzy matching (case-insensitive, partial match, spelling tolerance)
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim()
      
      filtered = filtered.filter(job => {
        // Get searchable fields
        const description = (job.description || '').toLowerCase()
        const workType = (job.workType || '').toLowerCase()
        const location = (job.location || '').toLowerCase()
        const companyName = (job.clientId?.companyName || job.clientId?.name || '').toLowerCase()
        
        // Exact match or partial match
        if (description.includes(query) || 
            workType.includes(query) || 
            location.includes(query) ||
            companyName.includes(query)) {
          return true
        }
        
        // Split query into words for better matching
        const queryWords = query.split(/\s+/)
        
        // Check if any query word matches (partial)
        const matchesAnyWord = queryWords.some(word => 
          description.includes(word) || 
          workType.includes(word) || 
          location.includes(word) ||
          companyName.includes(word)
        )
        
        if (matchesAnyWord) {
          return true
        }
        
        // Fuzzy matching for spelling errors
        // Check if query is similar to workType (for misspellings like "plum" -> "plumber")
        if (isFuzzyMatch(query, workType) || 
            isFuzzyMatch(query, description) ||
            isFuzzyMatch(query, location)) {
          return true
        }
        
        // Check each word for fuzzy match
        const matchesFuzzyWord = queryWords.some(word => 
          isFuzzyMatch(word, workType) || 
          isFuzzyMatch(word, description.split(/\s+/).join(' ')) ||
          isFuzzyMatch(word, location)
        )
        
        return matchesFuzzyWord
      })
    }

    // Apply sorting
    const sortedAndFiltered = applySorting(filtered)
    
    setFilteredJobs(sortedAndFiltered)
  }, [jobs, filters, sortBy])

  // Fuzzy matching function for search
  const isFuzzyMatch = (query, target) => {
    if (!query || !target) return false
    
    query = query.toLowerCase()
    target = target.toLowerCase()
    
    // If query is contained in target, it's a match
    if (target.includes(query)) {
      return true
    }
    
    // Check if query matches the beginning of any word in target
    const words = target.split(/\s+/)
    if (words.some(word => word.startsWith(query))) {
      return true
    }
    
    // Calculate similarity score (Levenshtein-like simple version)
    // Check if query is similar enough to target or any word in target
    for (const word of words) {
      if (word.length >= 3 && query.length >= 3) {
        const similarity = calculateSimilarity(query, word)
        // If similarity is high enough (70% or more), consider it a match
        if (similarity >= 0.7) {
          return true
        }
      }
    }
    
    return false
  }

  // Simple similarity calculation (based on common characters)
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    // Count matching characters in order
    let matches = 0
    let shorterIndex = 0
    
    for (let i = 0; i < longer.length && shorterIndex < shorter.length; i++) {
      if (longer[i] === shorter[shorterIndex]) {
        matches++
        shorterIndex++
      }
    }
    
    // Calculate similarity ratio
    return matches / longer.length
  }

  const handleApplyToJob = async (jobId) => {
    setApplyingJobId(jobId)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('workerToken')
      
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_URL}/workers/apply/${jobId}`, {
        method: 'POST',
        credentials: 'include',
        headers: headers
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Application submitted successfully!' })
        // Refresh jobs to update UI
        fetchJobs()
        
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      } else {
        setMessage({ type: 'error', text: data.error || data.message || 'Failed to apply' })
        
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      }
    } catch (error) {
      console.error('Error applying to job:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
      
      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 3000)
    } finally {
      setApplyingJobId(null)
    }
  }
  
  const handleViewJobDetails = (job) => {
    setSelectedJob(job)
    setShowJobDetailsModal(true)
  }
  
  const closeJobDetailsModal = () => {
    setShowJobDetailsModal(false)
    setSelectedJob(null)
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const handleWorkTypeToggle = (type) => {
    setFilters(prev => {
      // Check if the type is already selected (case-insensitive)
      const isSelected = prev.workType.some(t => t.toLowerCase() === type.toLowerCase())
      
      return {
        ...prev,
        workType: isSelected
          ? prev.workType.filter(t => t.toLowerCase() !== type.toLowerCase())
          : [...prev.workType, type]
      }
    })
  }

  const clearFilters = () => {
    setFilters({
      workType: [],
      location: '',
      salaryRange: '',
      searchQuery: ''
    })
    setWorkTypeSearch('')
  }

  const handleLogout = async () => {
    // Clear cookie and redirect
    clearWorkerToken()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const workTypes = ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mason', 'Welder', 'Driver', 'Helper', 'Cook', 'Cleaner', 'Other']

  return (
    <div className="min-h-screen rubik-regular bg-neutral-200 overflow-x-hidden">
      {/* Header */}
      <header className=" backdrop-blur-[8px] shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Left: App Name */}
            <div className="flex items-center gap-3 ">
            <div className="bg-black rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
              <div>
              <h1 className="text-sm sm:text-base font-bold text-gray-800">YaarCircle</h1>
              <p className="text-xs text-gray-500">Worker Dashboard</p>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-xl mx-4 hidden md:block relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search jobs... (Try: plum, paint, electric)"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                onFocus={() => setShowSearchTips(true)}
                onBlur={() => setTimeout(() => setShowSearchTips(false), 200)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => handleFilterChange('searchQuery', '')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Search Tips Tooltip */}
            {showSearchTips && !filters.searchQuery && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Smart Search Tips
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-900 mt-0.5">•</span>
                    <span><strong>Partial words:</strong> "plum" finds "Plumber"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-900 mt-0.5">•</span>
                    <span><strong>Case insensitive:</strong> "PAINT" = "paint" = "Painter"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-900 mt-0.5">•</span>
                    <span><strong>Spelling tolerant:</strong> "electrisian" finds "Electrician"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-900 mt-0.5">•</span>
                    <span><strong>Multi-field:</strong> Searches work type, location, description</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Right: Navigation & Profile */}
          <div className="flex items-center gap-3">
            {/* Home Button - Hidden on mobile */}
            <button 
              onClick={() => navigate('/worker/dashboard')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              title="Home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium hidden lg:inline text-sm">Home</span>
            </button>

            {/* Notifications removed for a cleaner navbar */}

            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-xs font-semibold text-gray-800">{worker?.name}</p>
                <p className="text-xs text-gray-500">{worker?.workType}</p>
              </div>
              
              {/* Profile Photo */}
              <div 
                className="relative cursor-pointer"
                onClick={() => navigate('/worker/profile')}
                title="View Profile"
              >
                <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md hover:shadow-lg transition-shadow">
                  {worker?.profilePicture ? (
                    <img 
                      src={worker.profilePicture} 
                      alt={worker.name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    worker?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              {/* Menu Button */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          {/* Menu Dropdown */}
          <div className="absolute right-4 top-20 w-64 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="py-2">
              {/* Profile Section */}
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-800">{worker?.name}</p>
                <p className="text-xs text-gray-500">{worker?.email || worker?.phone}</p>
              </div>

              {/* Menu Items */}
              <button 
                onClick={() => {
                  navigate('/worker/dashboard')
                  setIsMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm text-gray-700">Dashboard</span>
              </button>

              <button 
                onClick={() => {
                  navigate('/worker/profile')
                  setIsMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm text-gray-700">My Profile</span>
              </button>

              <button 
                onClick={() => {
                  // Navigate to applications
                  setIsMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-700">My Applications</span>
              </button>

              <button 
                onClick={() => {
                  navigate('/worker/settings')
                  setIsMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-gray-700">Settings</span>
              </button>

              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* Logout */}
              <button 
                onClick={() => {
                  handleLogout()
                  setIsMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors"
              >
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm text-red-600 font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="bg-blue-800 rounded-lg shadow-md p-4 sm:p-6 mb-6 text-white">
          <h2 className="text-lg sm:text-2xl font-bold mb-1">Welcome back, {worker?.name}! 👋</h2>
          <p className="text-sm sm:text-base text-green-100">Ready to find your next opportunity?</p>
        </div>

        {/* Mobile Search Bar */}
          <div className="md:hidden mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search jobs... (Try: plum, paint, electric)"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent bg-white shadow-sm"
            />
            {filters.searchQuery && (
              <button
                onClick={() => handleFilterChange('searchQuery', '')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filter Button */}
          <div className="md:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-blue-800 hover:bg-blue-900 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium">Filters</span>
            {(filters.workType.length > 0 || filters.location || filters.salaryRange) && (
              <span className="ml-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                {filters.workType.length + (filters.location ? 1 : 0) + (filters.salaryRange ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Layout with Sidebar and Jobs */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Filters</h3>
                <button 
                  onClick={clearFilters}
                  className="text-xs text-gray-900 hover:text-gray-700 font-semibold"
                >
                  Clear all
                </button>
              </div>

              {/* Work Type Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Work Type</h4>
                
                {/* Search bar for work types */}
                <div className="mb-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search work type..."
                      value={workTypeSearch}
                      onChange={(e) => setWorkTypeSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {workTypes
                    .filter(type => type.toLowerCase().includes(workTypeSearch.toLowerCase()))
                    .map(type => (
                      <label key={type} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={filters.workType.some(selected => selected.toLowerCase() === type.toLowerCase())}
                          onChange={() => handleWorkTypeToggle(type)}
                          className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  {workTypes.filter(type => type.toLowerCase().includes(workTypeSearch.toLowerCase())).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">No work types found</p>
                  )}
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Location</h4>
                <input
                  type="text"
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                />
              </div>

              {/* Salary Range Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Salary Range</h4>
                <select
                  value={filters.salaryRange}
                  onChange={(e) => handleFilterChange('salaryRange', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                >
                  <option value="">All Ranges</option>
                  <option value="0-10000">₹0 - ₹10,000</option>
                  <option value="10000-20000">₹10,000 - ₹20,000</option>
                  <option value="20000-30000">₹20,000 - ₹30,000</option>
                  <option value="30000+">₹30,000+</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Center - Job Listings */}
          <div className="flex-1">
            <div className="mb-4 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 text-center sm:text-left">
                {filteredJobs.length} Job{filteredJobs.length !== 1 ? 's' : ''} Available
              </h2>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="mt-2 sm:mt-0 w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
              >
                <option value="latest">Sort by: Latest</option>
                <option value="salary-high">Sort by: Salary (High to Low)</option>
                <option value="salary-low">Sort by: Salary (Low to High)</option>
              </select>
            </div>

            {/* Job Cards */}
            <div className="flex flex-col items-center gap-4 px-2 sm:px-0">
              {loading ? (
                <div className="text-center ">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading jobs...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs found</h3>
                  <p className="text-gray-500">Try adjusting your filters or check back later</p>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div key={job._id} className="w-full max-w-sm sm:max-w-md md:max-w-3xl lg:max-w-4xl bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 lg:p-8 border border-gray-100 mx-auto">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">{job.workType}</h3>
                        <p className="text-sm text-gray-500 mb-2">Posted by: {job.clientId?.companyName || job.clientId?.name || 'Company'}</p>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                        {job.numberOfWorkers} Position{job.numberOfWorkers > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{job.location || 'Location not specified'}</span>
                      </div>
                      {job.distance !== undefined && (
                        <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <span className="text-xs font-semibold">{job.distance.toFixed(1)}km away</span>
                        </div>
                      )}
                      {job.salaryRange && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{job.salaryRange}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {job.description || 'No description provided'}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewJobDetails(job)}
                          className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          View More
                        </button>
                        <button 
                          onClick={() => handleApplyToJob(job._id)}
                          disabled={applyingJobId === job._id || job.workerApplications?.includes(worker?._id)}
                          className={`px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm font-semibold rounded-lg transition-colors ${
                            job.workerApplications?.includes(worker?._id)
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : applyingJobId === job._id
                              ? 'bg-gray-400 text-white cursor-wait'
                              : 'bg-black text-white hover:bg-gray-900'
                          }`}
                        >
                          {job.workerApplications?.includes(worker?._id)
                            ? 'Applied ✓'
                            : applyingJobId === job._id
                            ? 'Applying...'
                            : 'Apply Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Job Details Modal */}
      {showJobDetailsModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
            {/* Modal Header - Polished */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white p-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                {/* Company Avatar / Logo (smaller) */}
                <div className="flex-shrink-0">
                  {selectedJob.clientId?.profilePicture ? (
                    <img src={selectedJob.clientId.profilePicture} alt={selectedJob.clientId?.companyName || 'Company'} className="w-12 h-12 md:w-16 md:h-16 rounded-md object-cover border-2 border-white shadow" />
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-md bg-white/10 flex items-center justify-center text-white font-bold text-lg md:text-xl border-2 border-white shadow">
                      {(selectedJob.clientId?.companyName || selectedJob.clientId?.name || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Title and compact meta */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold leading-tight truncate">{selectedJob.workType}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-white/90">{selectedJob.clientId?.companyName || selectedJob.clientId?.name || 'Company'}</span>
                    {selectedJob.location && (
                      <span className="inline-flex items-center gap-1 bg-white/10 text-white text-xs px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{selectedJob.location}</span>
                      </span>
                    )}

                    {selectedJob.salaryRange && (
                      <span className="inline-flex items-center gap-1 bg-white/10 text-white text-xs px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                        </svg>
                        <span className="truncate">{selectedJob.salaryRange}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Close button (compact) */}
                <div className="flex-shrink-0">
                  <button
                    onClick={closeJobDetailsModal}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    aria-label="Close details"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Job Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm text-gray-600 font-medium">Positions</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{selectedJob.numberOfWorkers}</p>
                </div>
                
                {selectedJob.salaryRange && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600 font-medium">Salary</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{selectedJob.salaryRange}</p>
                  </div>
                )}
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600 font-medium">Posted</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(selectedJob.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location
                </h3>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                  {selectedJob.location || 'Location not specified'}
                  {selectedJob.distance !== undefined && (
                    <span className="ml-3 text-gray-900 font-semibold">
                      • {selectedJob.distance.toFixed(1)}km away
                    </span>
                  )}
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Job Description
                </h3>
                <div className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                  {selectedJob.description || 'No description provided'}
                </div>
              </div>

              {/* Job Requirements (new fields) */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v4a1 1 0 001 1h3m10-6h3a1 1 0 011 1v10a1 1 0 01-1 1h-3M7 7h10M7 11h10M7 15h6" />
                  </svg>
                  Job Requirements
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 grid md:grid-cols-2 gap-4">
                  {selectedJob.department && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Department</p>
                      <p className="text-gray-800 font-semibold">{selectedJob.department}</p>
                    </div>
                  )}

                  {selectedJob.employmentType && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Employment Type</p>
                      <p className="text-gray-800 font-semibold">{selectedJob.employmentType}</p>
                    </div>
                  )}

                  {selectedJob.shift && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Shift</p>
                      <p className="text-gray-800 font-semibold">{selectedJob.shift}</p>
                    </div>
                  )}

                  {selectedJob.experienceMinYears !== undefined && selectedJob.experienceMinYears !== null && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Experience (min)</p>
                      <p className="text-gray-800 font-semibold">{selectedJob.experienceMinYears} years</p>
                    </div>
                  )}

                  {selectedJob.education && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Education</p>
                      <p className="text-gray-800 font-semibold">{selectedJob.education}</p>
                    </div>
                  )}

                  {selectedJob.degreeSpecialization && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Degree / Specialization</p>
                      <p className="text-gray-800 font-semibold">{selectedJob.degreeSpecialization}</p>
                    </div>
                  )}

                  {selectedJob.gender && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Preferred Gender</p>
                      <p className="text-gray-800 font-semibold">{selectedJob.gender}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* About Company (new fields) */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v4a1 1 0 001 1h3m10-6h3a1 1 0 011 1v10a1 1 0 01-1 1h-3M7 7h10M7 11h10M7 15h6" />
                  </svg>
                  About Company
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                  {selectedJob.companyName && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Company:</span>
                      <span className="text-gray-800 font-semibold">{selectedJob.companyName}</span>
                    </div>
                  )}

                  {selectedJob.companyAddress && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Address:</span>
                      <span className="text-gray-800 font-semibold">{selectedJob.companyAddress}</span>
                    </div>
                  )}

                  {selectedJob.companyWebsite && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Website:</span>
                      <a href={selectedJob.companyWebsite} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{selectedJob.companyWebsite}</a>
                    </div>
                  )}

                  {selectedJob.additionalInfo && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Additional Info / Benefits</p>
                      <p className="text-gray-800">{selectedJob.additionalInfo}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Contact Info */}
              {selectedJob.clientId && (
                <div className="mb-6 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Client Information
                  </h3>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 space-y-2 border border-gray-200">
                    {selectedJob.clientId.companyName && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-medium text-gray-700">Company:</span>
                        <span className="text-gray-800">{selectedJob.clientId.companyName}</span>
                      </div>
                    )}
                    {selectedJob.clientId.name && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-gray-700">Contact:</span>
                        <span className="text-gray-800">{selectedJob.clientId.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={closeJobDetailsModal}
                  className="flex-1 px-4 py-2 sm:px-6 sm:py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleApplyToJob(selectedJob._id)
                    closeJobDetailsModal()
                  }}
                  disabled={selectedJob.workerApplications?.includes(worker?._id)}
                  className={`flex-1 px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors ${
                    selectedJob.workerApplications?.includes(worker?._id)
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-900'
                  }`}
                >
                  {selectedJob.workerApplications?.includes(worker?._id)
                    ? 'Already Applied ✓'
                    : 'Apply for This Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 md:hidden">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {/* Clear All Button */}
              <div className="mb-4">
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-gray-900 hover:text-gray-700 font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>

              {/* Work Type Filter */}
              <div className="mb-6">
                <h4 className="text-base font-semibold text-gray-700 mb-3">Work Type</h4>

                {/* Search bar for work types */}
                <div className="mb-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search work type..."
                      value={workTypeSearch}
                      onChange={(e) => setWorkTypeSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {workTypes
                    .filter(type => type.toLowerCase().includes(workTypeSearch.toLowerCase()))
                    .map(type => (
                      <label key={type} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                        <input
                          type="checkbox"
                          checked={filters.workType.some(selected => selected.toLowerCase() === type.toLowerCase())}
                          onChange={() => handleWorkTypeToggle(type)}
                          className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  {workTypes.filter(type => type.toLowerCase().includes(workTypeSearch.toLowerCase())).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No work types found</p>
                  )}
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <h4 className="text-base font-semibold text-gray-700 mb-3">Location</h4>
                <input
                  type="text"
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                />
              </div>

              {/* Salary Range Filter */}
              <div className="mb-6">
                <h4 className="text-base font-semibold text-gray-700 mb-3">Salary Range</h4>
                <select
                  value={filters.salaryRange}
                  onChange={(e) => handleFilterChange('salaryRange', e.target.value)}
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                >
                  <option value="">All Ranges</option>
                  <option value="0-10000">₹0 - ₹10,000</option>
                  <option value="10000-20000">₹10,000 - ₹20,000</option>
                  <option value="20000-30000">₹20,000 - ₹30,000</option>
                  <option value="30000+">₹30,000+</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 px-4 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Permission Modal */}
      <LocationPermissionModal 
        isOpen={showLocationModal}
        userType="worker"
        onClose={() => setShowLocationModal(false)}
        onLocationSet={(location) => {
          setUserLocation(location)
          setShowLocationModal(false)
          // Refresh jobs with new location
          fetchJobs()
        }}
      />
    </div>
  )
}

export default WorkerDashboard
