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
              onClick={() => navigate('/client/pricing')}
              className="px-6 py-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pricing
            </button>
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
              <h3 className="text-xl font-semibold mb-2">View Workers</h3>
              <p className="text-gray-600">Browse and contact skilled workers</p>
            </div>
            <div 
              onClick={() => navigate('/client/pricing')}
              className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-blue-600">💎 Buy Credits</h3>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">View our pricing plans</p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/client/register')}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Free →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ClintPage;
