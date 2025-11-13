import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_URL } from '../../config/api'

const WorkerProfileView = () => {
  const navigate = useNavigate()
  const { workerId } = useParams()
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showUnlockPopup, setShowUnlockPopup] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockInfo, setUnlockInfo] = useState(null)

  useEffect(() => {
    fetchWorkerProfile()
    fetchSubscription()
  }, [workerId])

  // Fetch subscription to show credit balance
  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      const response = await fetch(`${API_URL}/clients/subscription/status`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Calculate credits remaining if not already present
        if (data.subscription) {
          data.subscription.creditsRemaining = 
            (data.subscription.viewsAllowed || 0) - (data.subscription.viewsUsed || 0)
        }
        setSubscription(data.subscription)
        console.log('Subscription loaded:', data.subscription) // Debug log
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const fetchWorkerProfile = async () => {
    try {
      const token = localStorage.getItem('clientToken')
      
      // Check if worker is already unlocked (GET request, no credit deduction)
      const unlockedResponse = await fetch(`${API_URL}/clients/worker/unlocked`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (unlockedResponse.ok) {
        const unlockedData = await unlockedResponse.json()
        const unlockedWorker = unlockedData.unlockedWorkers?.find(
          u => u.worker._id === workerId && !u.isExpired
        )

        if (unlockedWorker) {
          // Worker is already unlocked - fetch full details
          const workerResponse = await fetch(`${API_URL}/workers/${workerId}`, {
            credentials: 'include'
          })

          if (workerResponse.ok) {
            const workerData = await workerResponse.json()
            setWorker(workerData)
            setIsUnlocked(true)
            setUnlockInfo({
              expiresAt: unlockedWorker.expiresAt,
              timeRemaining: unlockedWorker.timeRemaining
            })
            setLoading(false)
            return
          }
        }
      }

      // Worker not unlocked - fetch limited info
      const workerResponse = await fetch(`${API_URL}/workers/${workerId}`, {
        credentials: 'include'
      })

      if (workerResponse.ok) {
        const workerData = await workerResponse.json()
        setWorker(workerData)
        setIsUnlocked(false)
      } else {
        setError('Failed to fetch worker profile')
      }
    } catch (error) {
      console.error('Error fetching worker profile:', error)
      setError('Server error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockConfirm = async () => {
    setUnlocking(true)
    try {
      const token = localStorage.getItem('clientToken')
      const response = await fetch(`${API_URL}/clients/worker/unlock/${workerId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setWorker(data.worker)
        setIsUnlocked(true)
        
        // Calculate credits remaining
        if (data.subscription) {
          data.subscription.creditsRemaining = 
            (data.subscription.viewsAllowed || 0) - (data.subscription.viewsUsed || 0)
        }
        
        setSubscription(data.subscription)
        setUnlockInfo(data.unlockInfo)
        setShowUnlockPopup(false)
        
        if (data.creditDeducted) {
          alert(`✅ Worker unlocked!\n\n1 credit deducted.\nCredits remaining: ${data.subscription.creditsRemaining}`)
        }
      } else {
        alert(`❌ ${data.error}\n\n${data.message || ''}`)
        if (data.error === 'Insufficient credits') {
          navigate('/client/pricing')
        }
      }
    } catch (error) {
      console.error('Error unlocking worker:', error)
      alert('Failed to unlock worker profile')
    } finally {
      setUnlocking(false)
    }
  }

  const handleUnlockCancel = () => {
    setShowUnlockPopup(false)
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading worker profile...</p>
        </div>
      </div>
    )
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Profile</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* 🔓 Unlock Confirmation Popup */}
      {showUnlockPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            {/* Worker Preview */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-blue-100">
                <img 
                  src={worker.profilePicture || '/default-avatar.png'} 
                  alt={worker.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{worker.name}</h3>
              <p className="text-gray-600">{worker.workType}</p>
            </div>

            {/* Unlock Information */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700 font-medium">Cost to Unlock</span>
                <span className="text-2xl font-bold text-blue-600">1 Credit</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Your Credits</span>
                <span className="text-xl font-semibold text-gray-800">
                  {subscription?.creditsRemaining || 0} remaining
                </span>
              </div>
            </div>

            {/* Unlock Benefits */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">🔓 Unlocking this profile gives you:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Phone number & email address
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Full work portfolio & photos
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  24-hour access to this profile
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleUnlockCancel}
                disabled={unlocking}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlockConfirm}
                disabled={unlocking || (subscription?.creditsRemaining || 0) < 1}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {unlocking ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Unlocking...
                  </span>
                ) : 'Unlock Now'}
              </button>
            </div>

            {/* Insufficient Credits Warning */}
            {subscription && subscription.creditsRemaining < 1 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 text-center">
                  ⚠️ Insufficient credits. Please purchase more credits to unlock.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>

        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg h-32"></div>
        <div className="bg-white rounded-b-lg shadow-md p-6 -mt-16 relative mb-6">
          <div className="flex items-end gap-6">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {worker.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 mb-4">
              <h1 className="text-3xl font-bold text-gray-800 mb-1">{worker.name}</h1>
              <p className="text-gray-600 text-lg">{worker.workType}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {worker.location && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{worker.location}</span>
                  </div>
                )}
                {worker.yearsOfExperience !== undefined && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{worker.yearsOfExperience} years experience</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mb-4">
              {worker.otpVerified ? (
                <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-full flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              ) : (
                <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full">
                  Not Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Jobs Applied</h3>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-800">{worker.appliedJobs?.length || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Experience</h3>
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-800">{worker.yearsOfExperience || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Years</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Age</h3>
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-800">{worker.age || 'N/A'}</p>
            <p className="text-xs text-gray-500 mt-1">Years old</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Status</h3>
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-green-600 capitalize">{worker.status || 'Active'}</p>
            <p className="text-xs text-gray-500 mt-1">Account status</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
            <span>Profile Details</span>
            {isUnlocked && unlockInfo && (
              <span className="text-sm font-normal text-green-600 bg-green-50 px-4 py-2 rounded-full">
                ✅ Unlocked • {unlockInfo.timeRemaining || 'Available'}
              </span>
            )}
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="text-base font-semibold text-gray-800">{worker.name || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Work Type</p>
                  <p className="text-base font-semibold text-gray-800">{worker.workType || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Experience</p>
                  <p className="text-base font-semibold text-gray-800">{worker.yearsOfExperience || 0} years</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Age</p>
                  <p className="text-base font-semibold text-gray-800">{worker.age || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="text-base font-semibold text-gray-800">{worker.location || 'Not specified'}</p>
                </div>
                
                {/* 🔒 Contact Details - Only show if unlocked */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  {isUnlocked ? (
                    <p className="text-base font-semibold text-gray-800">{worker.phone || 'Not specified'}</p>
                  ) : (
                    <p className="text-base font-semibold text-gray-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Locked
                    </p>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  {isUnlocked ? (
                    <p className="text-base font-semibold text-gray-800">{worker.email || 'Not specified'}</p>
                  ) : (
                    <p className="text-base font-semibold text-gray-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Locked
                    </p>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Member Since</p>
                  <p className="text-base font-semibold text-gray-800">
                    {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {worker.bio && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Bio</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">{worker.bio}</p>
                </div>
              </div>
            )}

            {worker.skills && worker.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {worker.skills.map((skill, index) => (
                    <span key={index} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Worker</h2>
          
          {isUnlocked ? (
            <div className="space-y-4">
              <div className="flex gap-4">
                {worker.phone && (
                  <a
                    href={`tel:${worker.phone}`}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call {worker.phone}
                  </a>
                )}
                {worker.email && (
                  <a
                    href={`mailto:${worker.email}`}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email
                  </a>
                )}
              </div>
              
              {unlockInfo && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Full profile access • {unlockInfo.timeRemaining || 'Available for 24 hours'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-300">
                <div className="text-center mb-4">
                  <svg className="w-16 h-16 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Contact Details Locked</h3>
                  <p className="text-gray-600 mb-4">
                    Unlock this profile to view phone number, email address, and full portfolio
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUnlockPopup(true)}
                    disabled={(subscription?.creditsRemaining || 0) < 1}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Unlock Profile (1 Credit)
                  </button>
                </div>
                
                {subscription && subscription.creditsRemaining < 1 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 text-center">
                      ⚠️ No credits remaining. <a href="/client/pricing" className="underline font-semibold">Purchase credits</a> to unlock profiles.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Locked Contact Buttons Preview */}
              <div className="flex gap-4 opacity-50 pointer-events-none">
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call • • • • • •
                </button>
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkerProfileView
