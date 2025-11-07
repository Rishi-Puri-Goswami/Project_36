import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isClientAuthenticated } from '../../utils/clientAuth'

const ClintPage = () => {
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isClientAuthenticated()) {
      navigate('/client/dashboard')
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">YarCircle - Client</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/client/login')}
              className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/client/register')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Register
            </button>
            <button 
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome to Client Dashboard
          </h2>
          <p className="text-gray-600 mb-6">
            Manage your job posts, find workers, and grow your business.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Post a Job</h3>
              <p className="text-gray-600">Create new job postings to find workers</p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">My Jobs</h3>
              <p className="text-gray-600">View and manage your active job postings</p>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Applications</h3>
              <p className="text-gray-600">Review worker applications for your jobs</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ClintPage;
