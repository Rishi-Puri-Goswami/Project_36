import React from 'react'
import { useNavigate } from 'react-router-dom'

const LoginPromptModal = ({ isOpen, onClose, userType = 'client' }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleLogin = () => {
    onClose()
    if (userType === 'client') {
      navigate('/client/login')
    } else if (userType === 'business') {
      navigate('/business/login')
    }
  }

  const handleRegister = () => {
    onClose()
    if (userType === 'client') {
      navigate('/client/register')
    } else if (userType === 'business') {
      navigate('/business/register')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#1e40af]/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#1e40af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Login Required
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          Please login or create an account to access this feature
        </p>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-[#1e40af] text-white rounded-lg font-semibold hover:bg-[#1e40af]/90 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login to Your Account
          </button>

          <button
            onClick={handleRegister}
            className="w-full py-3 px-4 bg-white text-[#1e40af] border-2 border-[#1e40af] rounded-lg font-semibold hover:bg-[#1e40af]/5 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Create New Account
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 text-sm transition-colors"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPromptModal
