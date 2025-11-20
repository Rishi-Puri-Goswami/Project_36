import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isWorkerAuthenticated, clearWorkerToken } from '../../utils/workerAuth'
import { API_URL } from '../../config/api'

const WorkerProfile = () => {
  const navigate = useNavigate()
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [posts, setPosts] = useState([])
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploadingCoverPhoto, setUploadingCoverPhoto] = useState(false)
  const [showCoverPhotoUploadModal, setShowCoverPhotoUploadModal] = useState(false)
  const [selectedCoverFile, setSelectedCoverFile] = useState(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null)
  const [postImages, setPostImages] = useState([])
  const [postImagePreviews, setPostImagePreviews] = useState([])
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    skills: '',
    availability: '',
    expectedSalary: ''
  })
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    workType: '',
    location: '',
    yearsOfExperience: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!isWorkerAuthenticated()) {
      navigate('/worker/login')
      return
    }
    fetchWorkerData()
    fetchWorkerPosts()
  }, [navigate])

  const fetchWorkerData = async () => {
    try {
      const token = localStorage.getItem('workerToken')
      
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_URL}/workers/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: headers
      })

      if (response.ok) {
        const data = await response.json()
        setWorker(data.worker)
        // Initialize edit form with worker data
        setEditForm({
          name: data.worker.name || '',
          email: data.worker.email || '',
          phone: data.worker.phone || '',
          age: data.worker.age || '',
          workType: data.worker.workType || '',
          location: data.worker.location || '',
          yearsOfExperience: data.worker.yearsOfExperience || ''
        })
      } else {
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

  const fetchWorkerPosts = async () => {
    try {
      const token = localStorage.getItem('workerToken')
      
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_URL}/workers/my-posts`, {
        method: 'GET',
        credentials: 'include',
        headers: headers
      })

      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  const handlePostInputChange = (e) => {
    const { name, value } = e.target
    setNewPost(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.description) {
      setMessage({ type: 'error', text: 'Title and description are required' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('workerToken')
      
      // Create FormData to handle file uploads
      const formData = new FormData()
      formData.append('title', newPost.title)
      formData.append('description', newPost.description)
      formData.append('skills', newPost.skills || '')
      formData.append('availability', newPost.availability || '')
      formData.append('expectedSalary', newPost.expectedSalary || '')
      
      // Append all selected images
      postImages.forEach((image) => {
        formData.append('postImages', image)
      })

      const response = await fetch(`${API_URL}/workers/create-post`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Post created successfully!' })
        setShowCreatePost(false)
        setNewPost({
          title: '',
          description: '',
          skills: '',
          availability: '',
          expectedSalary: ''
        })
        setPostImages([])
        setPostImagePreviews([])
        fetchWorkerPosts() // Refresh posts list
        
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create post' })
      }
    } catch (error) {
      console.error('Error creating post:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const token = localStorage.getItem('workerToken')
      
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_URL}/workers/delete-post/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: headers
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Post deleted successfully!' })
        fetchWorkerPosts()
        
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.message || 'Failed to delete post' })
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    }
  }

  const handleLogout = () => {
    clearWorkerToken()
    navigate('/')
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
      const token = localStorage.getItem('workerToken')
      const formData = new FormData()
      formData.append('profilePicture', selectedFile)

      const response = await fetch(`${API_URL}/workers/upload-profile-picture`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setWorker(data.worker)
        setShowPhotoUploadModal(false)
        setSelectedFile(null)
        setPreviewUrl(null)
        setMessage({ type: 'success', text: '✅ Profile picture updated successfully!' })
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: `❌ ${errorData.error || 'Failed to upload profile picture'}` })
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      setMessage({ type: 'error', text: '❌ Error uploading profile picture' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const cancelPhotoUpload = () => {
    setShowPhotoUploadModal(false)
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleCoverPhotoSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      setSelectedCoverFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
      
      setShowCoverPhotoUploadModal(true)
    }
  }

  const handleUploadCoverPhoto = async () => {
    if (!selectedCoverFile) return

    setUploadingCoverPhoto(true)
    try {
      const token = localStorage.getItem('workerToken')
      const formData = new FormData()
      formData.append('coverPhoto', selectedCoverFile)

      const response = await fetch(`${API_URL}/workers/upload-cover-photo`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setWorker(data.worker)
        setShowCoverPhotoUploadModal(false)
        setSelectedCoverFile(null)
        setCoverPreviewUrl(null)
        setMessage({ type: 'success', text: '✅ Cover photo updated successfully!' })
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: `❌ ${errorData.error || 'Failed to upload cover photo'}` })
      }
    } catch (error) {
      console.error('Error uploading cover photo:', error)
      setMessage({ type: 'error', text: '❌ Error uploading cover photo' })
    } finally {
      setUploadingCoverPhoto(false)
    }
  }

  const cancelCoverPhotoUpload = () => {
    setShowCoverPhotoUploadModal(false)
    setSelectedCoverFile(null)
    setCoverPreviewUrl(null)
  }

  const handlePostImageSelect = (event) => {
    const files = Array.from(event.target.files)
    
    if (files.length === 0) return
    
    // Validate max 5 images
    if (files.length > 5) {
      alert('You can upload maximum 5 images per post')
      return
    }
    
    // Validate file types and sizes
    const validFiles = []
    const previews = []
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        continue
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB`)
        continue
      }
      
      validFiles.push(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result)
        if (previews.length === validFiles.length) {
          setPostImagePreviews(previews)
        }
      }
      reader.readAsDataURL(file)
    }
    
    setPostImages(validFiles)
  }

  const removePostImage = (index) => {
    setPostImages(prev => prev.filter((_, i) => i !== index))
    setPostImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setActiveTab('details') // Switch to Personal Details tab
    setMessage({ type: '', text: '' })
    
    // Scroll to the tabs section smoothly
    setTimeout(() => {
      const tabsSection = document.getElementById('profile-tabs')
      if (tabsSection) {
        tabsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset form to original worker data
    setEditForm({
      name: worker.name || '',
      email: worker.email || '',
      phone: worker.phone || '',
      age: worker.age || '',
      workType: worker.workType || '',
      location: worker.location || '',
      yearsOfExperience: worker.yearsOfExperience || ''
    })
    setMessage({ type: '', text: '' })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('workerToken')
      
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_URL}/workers/update-profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: headers,
        body: JSON.stringify(editForm)
      })

      const data = await response.json()

      if (response.ok) {
        setWorker(data.worker)
        setIsEditing(false)
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen rubik-regular bg-neutral-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen rubik-regular bg-neutral-200">
      {/* Header */}
      <header className=" backdrop-blur-2xl  shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/worker/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="bg-black rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
              <p className="text-xs text-gray-500">View and manage your profile</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {/* Cover Photo */}
          <div 
            className="h-32 bg-blue-800 bg-cover bg-center bg-no-repeat relative group"
            style={worker?.coverPhoto ? { backgroundImage: `linear-gradient(rgba(30, 64, 175, 0.3), rgba(30, 64, 175, 0.3)), url(${worker.coverPhoto})` } : {}}
          >
            {/* Upload Cover Photo Icon */}
            <label 
              htmlFor="worker-cover-photo-upload"
              className="absolute bottom-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 shadow-lg cursor-pointer transition-all opacity-0 group-hover:opacity-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                id="worker-cover-photo-upload"
                type="file"
                accept="image/*"
                onChange={handleCoverPhotoSelect}
                className="hidden"
              />
            </label>
          </div>
          
          {/* Profile Info */}
          <div className="px-4 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 -mt-16">
              {/* Profile Picture */}
              <div className="relative group flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white p-2 shadow-lg">
                  {worker?.profilePicture ? (
                    <img 
                      src={worker.profilePicture} 
                      alt={worker.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-2xl sm:text-4xl font-bold">
                      {worker?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Camera Icon Overlay */}
                <label 
                  htmlFor="worker-profile-photo-upload"
                  className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black hover:bg-gray-900 text-white rounded-full p-1.5 sm:p-2 shadow-lg cursor-pointer transition-all transform hover:scale-110"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    id="worker-profile-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* Name and Work Type */}
              <div className="flex-1 pt-16 min-w-0">
                <h2 className="text-3xl font-bold text-gray-800 truncate">{worker?.name}</h2>
                <p className="text-lg text-gray-600 truncate">{worker?.workType}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{worker?.location || 'Location not set'}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="whitespace-nowrap">{worker?.yearsOfExperience || 0} years experience</span>
                  </div>
                </div>
              </div>

              {/* Edit Profile Button - Always visible */}
              <div className="flex-shrink-0 pt-16">
                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition-colors text-sm whitespace-nowrap"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors text-sm whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:bg-gray-300 text-sm whitespace-nowrap"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-gray-100 border border-gray-400 text-gray-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-semibold">{message.text}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Jobs Applied</h3>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-800">{worker?.appliedJobs?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Total applications</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Experience</h3>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-800">{worker?.yearsOfExperience || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Years of experience</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Age</h3>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-800">{worker?.age || 'N/A'}</p>
            <p className="text-xs text-gray-500 mt-1">Years old</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Status</h3>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-600 capitalize">{worker?.status || 'Active'}</p>
            <p className="text-xs text-gray-500 mt-1">Account status</p>
          </div>
        </div>

        {/* Tabs */}
        <div id="profile-tabs" className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-800 text-blue-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'applications'
                    ? 'border-blue-800 text-blue-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Applications
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'posts'
                    ? 'border-blue-800 text-blue-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Posts
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-blue-800 text-blue-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Personal Details
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Overview</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Work Type</p>
                      <p className="text-base font-semibold text-gray-800">{worker?.workType || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Location</p>
                      <p className="text-base font-semibold text-gray-800">{worker?.location || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="text-base font-semibold text-gray-800">{worker?.phone || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="text-base font-semibold text-gray-800">{worker?.email || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Account Verified</p>
                      <p className="text-base font-semibold text-gray-600">
                        {worker?.otpVerified ? 'Yes ✓' : 'No'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">Member Since</p>
                      <p className="text-base font-semibold text-gray-800">
                        {worker?.createdAt ? new Date(worker.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">My Applications</h3>
                {worker?.appliedJobs && worker.appliedJobs.length > 0 ? (
                  <div className="space-y-4">
                    {worker.appliedJobs.map((job, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-800">Job Application #{index + 1}</h4>
                            <p className="text-sm text-gray-500 mt-1">Applied on: {new Date().toLocaleDateString()}</p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                            Pending
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">No applications yet</p>
                    <button 
                      onClick={() => navigate('/worker/dashboard')}
                      className="mt-4 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
                    >
                      Browse Jobs
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">My Posts</h3>
                  <button
                    onClick={() => setShowCreatePost(!showCreatePost)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {showCreatePost ? 'Cancel' : 'Create Post'}
                  </button>
                </div>

                {showCreatePost && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-gray-200">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Create New Post</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          name="title"
                          value={newPost.title}
                          onChange={handlePostInputChange}
                          placeholder="e.g., Experienced Plumber Available"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                          name="description"
                          value={newPost.description}
                          onChange={handlePostInputChange}
                          placeholder="Describe your services, experience, and what makes you stand out..."
                          rows="4"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                          <input
                            type="text"
                            name="skills"
                            value={newPost.skills}
                            onChange={handlePostInputChange}
                            placeholder="e.g., Plumbing, Carpentry, Electrical"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                          <input
                            type="text"
                            name="availability"
                            value={newPost.availability}
                            onChange={handlePostInputChange}
                            placeholder="e.g., Full-time, Part-time, Weekends"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expected Salary</label>
                        <input
                          type="text"
                          name="expectedSalary"
                          value={newPost.expectedSalary}
                          onChange={handlePostInputChange}
                          placeholder="e.g., ₹25,000 - ₹35,000 per month"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                        />
                      </div>
                      
                      {/* Image Upload Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Post Images (Optional - Max 5)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                          <input
                            type="file"
                            id="post-images"
                            accept="image/*"
                            multiple
                            onChange={handlePostImageSelect}
                            className="hidden"
                          />
                          <label
                            htmlFor="post-images"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-600">Click to upload images</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
                          </label>
                        </div>
                        
                        {/* Image Previews */}
                        {postImagePreviews.length > 0 && (
                          <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-3">
                            {postImagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                                />
                                <button
                                  onClick={() => removePostImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleCreatePost}
                          disabled={saving}
                          className="px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Creating...' : 'Create Post'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCreatePost(false)
                            setNewPost({
                              title: '',
                              description: '',
                              skills: '',
                              availability: '',
                              expectedSalary: ''
                            })
                            setPostImages([])
                            setPostImagePreviews([])
                          }}
                          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">{post.title}</h4>
                            <p className="text-gray-600 mb-3">{post.description}</p>
                          </div>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete post"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Post Images */}
                        {post.images && post.images.length > 0 && (
                          <div className="mb-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                              {post.images.map((imageUrl, index) => (
                                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                                  <img
                                    src={imageUrl}
                                    alt={`Post image ${index + 1}`}
                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
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
                        
                        <div className="grid md:grid-cols-3 gap-3 text-sm">
                          {post.skills && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-600"><strong>Skills:</strong> {post.skills}</span>
                            </div>
                          )}
                          {post.availability && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-600"><strong>Availability:</strong> {post.availability}</span>
                            </div>
                          )}
                          {post.expectedSalary && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-600"><strong>Salary:</strong> {post.expectedSalary}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Posted on {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <p className="text-gray-500 mb-2">No posts yet</p>
                    <p className="text-sm text-gray-400">Create a post to showcase your skills and availability</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Details</h3>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                        <input
                          type="number"
                          name="age"
                          value={editForm.age}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                          placeholder="Enter your age"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={editForm.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent bg-gray-100"
                          placeholder="Enter your phone number"
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Type *</label>
                        <select
                          name="workType"
                          value={editForm.workType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                        >
                          <option value="">Select work type</option>
                          <option value="Plumber">Plumber</option>
                          <option value="Electrician">Electrician</option>
                          <option value="Carpenter">Carpenter</option>
                          <option value="Painter">Painter</option>
                          <option value="Mason">Mason</option>
                          <option value="Welder">Welder</option>
                          <option value="Driver">Driver</option>
                          <option value="Helper">Helper</option>
                          <option value="Cook">Cook</option>
                          <option value="Cleaner">Cleaner</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                        <input
                          type="number"
                          name="yearsOfExperience"
                          value={editForm.yearsOfExperience}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                          placeholder="Enter years of experience"
                          min="0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          name="location"
                          value={editForm.location}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                          placeholder="Enter your location (City, State)"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition-colors disabled:bg-gray-300"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <p className="text-base text-gray-900">{worker?.name || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                        <p className="text-base text-gray-900">{worker?.age || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <p className="text-base text-gray-900">{worker?.phone || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <p className="text-base text-gray-900">{worker?.email || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Type</label>
                        <p className="text-base text-gray-900">{worker?.workType || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                        <p className="text-base text-gray-900">{worker?.yearsOfExperience || 0} years</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <p className="text-base text-gray-900">{worker?.location || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-blue-800 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Upload Profile Picture</h2>
              <p className="text-gray-100 text-sm mt-1">Choose your best photo</p>
            </div>

            <div className="p-6">
              {/* Preview */}
              {previewUrl && (
                <div className="mb-6 flex justify-center">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-500 shadow-lg">
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
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
                  className="flex-1 px-4 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

      {/* Cover Photo Upload Modal */}
      {showCoverPhotoUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-blue-800 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Upload Cover Photo</h2>
              <p className="text-gray-100 text-sm mt-1">Choose a banner image for your profile</p>
            </div>

            <div className="p-6">
              {/* Preview */}
              {coverPreviewUrl && (
                <div className="mb-6">
                  <div className="w-full h-48 rounded-lg overflow-hidden border-4 border-gray-300 shadow-lg">
                    <img 
                      src={coverPreviewUrl} 
                      alt="Cover Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* File Info */}
              {selectedCoverFile && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">File:</span> {selectedCoverFile.name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Size:</span> {(selectedCoverFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={cancelCoverPhotoUpload}
                  disabled={uploadingCoverPhoto}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadCoverPhoto}
                  disabled={uploadingCoverPhoto}
                  className="flex-1 px-4 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadingCoverPhoto ? (
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
    </div>
  )
}

export default WorkerProfile
