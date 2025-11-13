import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../utils/auth'
import { isClientAuthenticated, clearClientToken } from '../../utils/clientAuth'
import { API_URL } from '../../config/api'

const ClintProfile = () => {
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    location: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    // Check authentication first
    if (!isClientAuthenticated()) {
      navigate('/client/login')
      return
    }
    fetchClientData()
  }, [navigate])

  const fetchClientData = async () => {
    try {
      const response = await fetch(`${API_URL}/clients/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
        // Initialize edit form with client data
        setEditFormData({
          name: data.client.name || '',
          email: data.client.email || '',
          phone: data.client.phone || '',
          companyName: data.client.companyName || '',
          location: data.client.location || ''
        })
      } else {
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

  const handleLogout = async () => {
    const success = await logout()
    if (success) {
      navigate('/')
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      setSelectedFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
      
      setShowPhotoUploadModal(true)
    }
  }

  const handleUploadPhoto = async () => {
    if (!selectedFile) return

    setUploadingPhoto(true)
    try {
      const token = localStorage.getItem('clientToken')
      const formData = new FormData()
      formData.append('profilePicture', selectedFile)

      const response = await fetch(`${API_URL}/clients/upload-profile-picture`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
        setShowPhotoUploadModal(false)
        setSelectedFile(null)
        setPreviewUrl(null)
        alert('✅ Profile picture updated successfully!')
      } else {
        const errorData = await response.json()
        alert(`❌ ${errorData.error || 'Failed to upload profile picture'}`)
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      alert('❌ Error uploading profile picture')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const cancelPhotoUpload = () => {
    setShowPhotoUploadModal(false)
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleEditProfile = () => {
    setShowEditProfileModal(true)
    setIsSettingsOpen(false)
  }

  const handleEditFormChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const token = localStorage.getItem('clientToken')
      const response = await fetch(`${API_URL}/clients/update-profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      })

      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
        setShowEditProfileModal(false)
        alert('✅ Profile updated successfully!')
      } else {
        const errorData = await response.json()
        alert(`❌ ${errorData.error || 'Failed to update profile'}`)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('❌ Error updating profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = () => {
    setShowChangePasswordModal(true)
    setIsSettingsOpen(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handleSavePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('❌ Please fill in all fields')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('❌ New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert('❌ New password must be at least 6 characters')
      return
    }

    setChangingPassword(true)
    try {
      const token = localStorage.getItem('clientToken')
      const response = await fetch(`${API_URL}/clients/change-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        setShowChangePasswordModal(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        alert('✅ Password changed successfully!')
      } else {
        const errorData = await response.json()
        alert(`❌ ${errorData.error || 'Failed to change password'}`)
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('❌ Error changing password')
    } finally {
      setChangingPassword(false)
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
        <div className="w-full sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-8">
          {/* Left: App Name */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">YaarCircle</h1>
              <p className="text-xs text-gray-500">Client Profile</p>
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
                placeholder="Search workers by name, skills, or location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

<div className='flex - justify-between gap-7'>
          {/* Center: Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => navigate('/client/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Home</span>
            </button>
            
            {/* <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="font-medium">Notifications</span>
              {/* Notification Badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            {/* </button> */} */

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
            
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-500">
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
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </div>

</div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/client/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </button>

        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-16">
              <div className="flex items-end gap-6">
                {/* Profile Picture with Upload Button */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-5xl shadow-xl border-4 border-white overflow-hidden">
                    {client?.profilePicture ? (
                      <img 
                        src={client.profilePicture} 
                        alt={client.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      client?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  {/* Camera Icon Overlay */}
                  <label 
                    htmlFor="profile-photo-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg cursor-pointer transition-all transform hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      id="profile-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="mb-4">
                  <h2 className="text-3xl font-bold text-gray-800">{client?.name}</h2>
                  {client?.companyName && (
                    <p className="text-lg text-gray-600">{client.companyName}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${client?.otpVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {client?.otpVerified ? '✓ Verified' : 'Not Verified'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {client?.role}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="mb-4 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Section - HIGHLIGHTED */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-xl p-8 mb-6 border-4 border-blue-400">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white rounded-lg p-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">
              Quick Actions
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div 
              onClick={() => navigate('/client/post-job')}
              className="bg-white rounded-lg p-6 hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-yellow-400"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Post a Job</h3>
              <p className="text-gray-600">Create new job postings to find workers</p>
              <div className="mt-4 flex items-center text-blue-600 font-semibold">
                <span>Get Started</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div 
              onClick={() => navigate('/client/my-jobs')}
              className="bg-white rounded-lg p-6 hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-yellow-400"
            >
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">My Jobs</h3>
              <p className="text-gray-600">View and manage your active job postings</p>
              <div className="mt-4 flex items-center text-green-600 font-semibold">
                <span>View Jobs</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div 
              onClick={() => navigate('/client/pricing')}
              className="bg-white rounded-lg p-6 hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-yellow-400"
            >
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Pricing</h3>
              <p className="text-gray-600">View subscription plans</p>
              <div className="mt-4 flex items-center text-purple-600 font-semibold">
                <span>View Plans</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Full Name</p>
                <p className="text-gray-800 font-semibold text-lg">{client?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Email Address</p>
                <p className="text-gray-800">{client?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Phone Number</p>
                <p className="text-gray-800">{client?.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Role</p>
                <p className="text-gray-800 capitalize">{client?.role}</p>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Company Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Company Name</p>
                <p className="text-gray-800 font-semibold text-lg">{client?.companyName || 'Not Provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Industry</p>
                <p className="text-gray-800">{client?.industry || 'Not Specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Company Size</p>
                <p className="text-gray-800">{client?.companySize || 'Not Specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Location</p>
                <p className="text-gray-800">{client?.location || 'Not Specified'}</p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Account Status</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Verification Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {client?.otpVerified ? (
                    <>
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-600 font-semibold">Verified</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-yellow-600 font-semibold">Not Verified</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Account Created</p>
                <p className="text-gray-800">{client?.createdAt ? new Date(client.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Last Updated</p>
                <p className="text-gray-800">{client?.updatedAt ? new Date(client.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Account ID</p>
                <p className="text-gray-600 text-sm font-mono">{client?._id}</p>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-yellow-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Subscription</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Current Plan</p>
                <p className="text-gray-800 font-semibold text-lg">{client?.subscription?.plan || 'Free'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Plan Status</p>
                <p className="text-gray-800">{client?.subscription?.status || 'Active'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Jobs Posted</p>
                <p className="text-gray-800">{client?.jobsPosted || 0} / {client?.subscription?.jobLimit || '∞'}</p>
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Account Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleEditProfile}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
            <button 
              onClick={handleChangePassword}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Change Password
            </button>
            <button className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
              Privacy Settings
            </button>
            <button className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors">
              Notification Preferences
            </button>
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
                    onClick={handleEditProfile}
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
                    onClick={handleChangePassword}
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

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Upload Profile Picture</h2>
              <p className="text-blue-100 text-sm mt-1">Choose your best photo</p>
            </div>

            <div className="p-6">
              {/* Preview */}
              {previewUrl && (
                <div className="mb-6 flex justify-center">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* File Info */}
              {selectedFile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">File:</span> {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Size:</span> {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={cancelPhotoUpload}
                  disabled={uploadingPhoto}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadPhoto}
                  disabled={uploadingPhoto}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadingPhoto ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Edit Profile</h2>
              <p className="text-blue-100 text-sm mt-1">Update your personal information</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={editFormData.companyName}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={editFormData.location}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your location"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  disabled={savingProfile}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Change Password</h2>
              <p className="text-green-100 text-sm mt-1">Update your account password</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password *</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password *</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowChangePasswordModal(false)}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePassword}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Changing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClintProfile
