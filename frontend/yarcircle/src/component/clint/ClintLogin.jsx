import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isClientAuthenticated } from '../../utils/clientAuth'
import { API_URL } from '../../config/api'

const ClintLogin = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [fpPhone, setFpPhone] = useState('')
  const [fpOtp, setFpOtp] = useState('')
  const [fpStep, setFpStep] = useState('phone') // phone, otp, reset
  const [fpError, setFpError] = useState('')
  const [fpLoading, setFpLoading] = useState(false)
  const [fpNewPassword, setFpNewPassword] = useState('')
  const [fpConfirmPassword, setFpConfirmPassword] = useState('')

  // Check if user is already logged in
  useEffect(() => {
    if (isClientAuthenticated()) {
      navigate('/client/dashboard')
    }
  }, [navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/clients/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage
        if (data.token) {
          localStorage.setItem('clientToken', data.token)
        }
        
        // Wait a bit for cookie to be set, then redirect
        setTimeout(() => {
          navigate('/client/dashboard')
        }, 100)
      } else {
        setError(data.message || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/client')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Client Login</h2>
            <p className="text-gray-600 mt-2">Welcome back! Please login to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => { setShowForgotModal(true); setFpPhone(''); setFpStep('phone'); setFpOtp(''); setFpError('') }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/client/register')}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowForgotModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-50">
              <h3 className="text-lg font-semibold mb-4">Reset Password</h3>
              {fpError && <div className="mb-3 text-sm text-red-600">{fpError}</div>}

              {fpStep === 'phone' && (
                <div className="space-y-4">
                  <label className="block text-sm text-gray-700">Phone Number</label>
                  <input type="tel" value={fpPhone} onChange={e => setFpPhone(e.target.value)} placeholder="+91 9876543210" className="w-full px-3 py-2 border rounded" />
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      setFpError(''); setFpLoading(true);
                      try {
                        const resp = await fetch(`${API_URL}/clients/forgot-password/send-otp`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: fpPhone })
                        });
                        const data = await resp.json();
                        if (resp.ok) {
                          setFpStep('otp');
                        } else {
                          setFpError(data.message || 'Failed to send OTP');
                        }
                      } catch (err) { console.error(err); setFpError('Server error'); }
                      setFpLoading(false);
                    }} className="px-4 py-2 bg-[#1e40af] text-white rounded">Send OTP</button>
                    <button onClick={() => setShowForgotModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  </div>
                </div>
              )}

              {fpStep === 'otp' && (
                <div className="space-y-4">
                  <label className="block text-sm text-gray-700">Enter OTP</label>
                  <input type="text" value={fpOtp} onChange={e => setFpOtp(e.target.value)} placeholder="6-digit code" className="w-full px-3 py-2 border rounded" />
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      setFpError(''); setFpLoading(true);
                      try {
                        const resp = await fetch(`${API_URL}/clients/forgot-password/verify-otp`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: fpPhone, otp: fpOtp })
                        });
                        const data = await resp.json();
                        if (resp.ok) {
                          setFpStep('reset');
                        } else {
                          setFpError(data.message || 'Invalid OTP');
                        }
                      } catch (err) { console.error(err); setFpError('Server error'); }
                      setFpLoading(false);
                    }} className="px-4 py-2 bg-[#1e40af] text-white rounded">Verify OTP</button>
                    <button onClick={async () => {
                      // resend
                      setFpError(''); setFpLoading(true);
                      try {
                        const resp = await fetch(`${API_URL}/clients/forgot-password/send-otp`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: fpPhone })
                        });
                        const data = await resp.json();
                        if (!resp.ok) setFpError(data.message || 'Failed to resend OTP');
                      } catch (err) { console.error(err); setFpError('Server error'); }
                      setFpLoading(false);
                    }} className="px-4 py-2 border rounded">Resend OTP</button>
                    <button onClick={() => setShowForgotModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  </div>
                </div>
              )}

              {fpStep === 'reset' && (
                <div className="space-y-4">
                  <label className="block text-sm text-gray-700">New Password</label>
                  <input type="password" value={fpNewPassword} onChange={e => setFpNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <label className="block text-sm text-gray-700">Confirm Password</label>
                  <input type="password" value={fpConfirmPassword} onChange={e => setFpConfirmPassword(e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      setFpError(''); setFpLoading(true);
                      if (!fpNewPassword || !fpConfirmPassword) { setFpError('Enter and confirm your new password'); setFpLoading(false); return }
                      try {
                        const resp = await fetch(`${API_URL}/clients/forgot-password/reset`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: fpPhone, otp: fpOtp, newPassword: fpNewPassword, confirmPassword: fpConfirmPassword })
                        });
                        const data = await resp.json();
                        if (resp.ok) {
                          // success
                          setShowForgotModal(false);
                          setFpPhone(''); setFpOtp(''); setFpNewPassword(''); setFpConfirmPassword(''); setFpStep('phone');
                          setError('Password reset successful. Please login with your new password.');
                        } else {
                          setFpError(data.message || 'Failed to reset password');
                        }
                      } catch (err) { console.error(err); setFpError('Server error'); }
                      setFpLoading(false);
                    }} className="px-4 py-2 bg-[#1e40af] text-white rounded">Reset Password</button>
                    <button onClick={() => setShowForgotModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClintLogin
