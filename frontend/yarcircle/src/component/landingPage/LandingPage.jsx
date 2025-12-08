import React from 'react'
import { useNavigate } from 'react-router-dom'
import { checkAuth } from '../../utils/auth'
import { isBusinessAuthenticated } from '../../utils/businessAuth'

const LandingPage = () => {
  const navigate = useNavigate()

  const handleClientClick = async () => {
    const { isAuthenticated } = await checkAuth()
    
    if (isAuthenticated) {
      // User is logged in, go to dashboard
      navigate('/client/dashboard')
    } else {
      // User is not logged in, go to login page
      navigate('/client/login')
    }
  }

  const handleWorkerClick = async () => {
    // Similar logic for worker (to be implemented)
    navigate('/worker')
  }

  const handleBusinessClick = () => {
    if (isBusinessAuthenticated()) {
      navigate('/business/dashboard')
    } else {
      navigate('/business/register')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to YaarCircle
          </h1>
          <p className="text-xl text-gray-600">
            Choose your role to get started
          </p>
        </div>

        {/* Options Container */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Client Option */}
          <div
            onClick={handleClientClick}
            className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-50 rounded-full p-5 mb-5 group-hover:bg-blue-100 transition-colors">
                <svg
                  className="w-12 h-12 text-blue-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                  />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                I'm a Client
              </h2>
              
              <p className="text-gray-600 mb-4 text-sm">
                Post jobs and hire skilled workers for your projects
              </p>
              
              <ul className="text-left text-gray-600 space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Post job requirements
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Find skilled workers
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Manage your projects
                </li>
              </ul>
              
              <button className="bg-blue-800 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition-colors w-full">
                Continue as Client
              </button>
            </div>
          </div>

          {/* Worker Option */}
          <div
            onClick={handleWorkerClick}
            className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-50 rounded-full p-5 mb-5 group-hover:bg-green-100 transition-colors">
                <svg
                  className="w-12 h-12 text-green-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                  />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                I'm a Worker
              </h2>
              
              <p className="text-gray-600 mb-4 text-sm">
                Find job opportunities and apply to projects
              </p>
              
              <ul className="text-left text-gray-600 space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Browse available jobs
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Apply to projects
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Build your profile
                </li>
              </ul>
              
              <button className="bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-800 transition-colors w-full">
                Continue as Worker
              </button>
            </div>
          </div>

          {/* Business Option */}
          <div
            onClick={handleBusinessClick}
            className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-50 rounded-full p-5 mb-5 group-hover:bg-purple-100 transition-colors">
                <svg
                  className="w-12 h-12 text-purple-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                  />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                List Your Business
              </h2>
              
              <p className="text-gray-600 mb-4 text-sm">
                Register your shop or business to reach customers
              </p>
              
              <ul className="text-left text-gray-600 space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  List your shop/store
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Reach local customers
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Grow your business
                </li>
              </ul>
              
              <button className="bg-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-purple-800 transition-colors w-full">
                List Your Business
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default LandingPage;