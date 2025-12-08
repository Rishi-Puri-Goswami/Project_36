import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../config/api'
import { useCredit } from '../../context/CreditContext'

const PricingPage = () => {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Use Credit Context for real-time updates
  const { addCredits, creditsRemaining } = useCredit()

  useEffect(() => {
    checkAuth()
    fetchPlans()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('clientToken')
    setIsAuthenticated(!!token)
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/clients/plans`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        // Filter out free trial, show only paid plans
        const paidPlans = data.plans.filter(plan => plan.planType === 'credit_pack')
        setPlans(paidPlans)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (plan) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      alert('Please login to purchase a plan')
      navigate('/client/login')
      return
    }

    setProcessingPayment(true)
    try {
      const token = localStorage.getItem('clientToken')

      // Step 1: Create Razorpay order
      const orderResponse = await fetch(`${API_URL}/clients/subscription/create-order`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId: plan._id })
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const orderData = await orderResponse.json()

      // Debug: Log order data to console
      console.log('=== RAZORPAY ORDER DATA ===')
      console.log('Amount:', orderData.order.amount, 'paise (₹' + (orderData.order.amount / 100) + ')')
      console.log('Currency:', orderData.order.currency)
      console.log('Order ID:', orderData.order.id)
      console.log('===========================')

      // Step 2: Initialize Razorpay with UPI/QR Code support
      const options = {
        key: 'rzp_live_ReY2CoiYp3SjRo', // Razorpay LIVE key (matches backend)
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'YarCircle',
        description: `${plan.planName} - ${plan.viewsAllowed} Profile Views`,
        order_id: orderData.order.id,
        
        // IMPORTANT: Explicitly enable UPI payment method
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          paylater: true
        },
        
        // Step 3: Payment success handler
        handler: async function (response) {
          try {
            const verifyResponse = await fetch(`${API_URL}/clients/subscription/verify-payment`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpayOrderId: orderData.order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId: plan._id
              })
            })

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json()
              
              // REAL-TIME CREDIT UPDATE - Update credits instantly!
              addCredits(plan.viewsAllowed)
              
              alert(`Payment successful! ${plan.viewsAllowed} credits added to your account.`)
              navigate('/client/dashboard')
            } else {
              throw new Error('Payment verification failed')
            }
          } catch (error) {
            alert('Payment verification failed. Please contact support.')
            console.error('Verification error:', error)
          } finally {
            setProcessingPayment(false)
          }
        },
        
        // Prefill customer details
        prefill: {
          name: orderData.clientName || '',
          email: orderData.clientEmail || '',
          contact: orderData.clientPhone || ''
        },
        
        // Theme customization
        theme: {
          color: '#3B82F6'
        },
        
        // Modal close handler
        modal: {
          ondismiss: function() {
            setProcessingPayment(false)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
      setProcessingPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(isAuthenticated ? '/client/dashboard' : '/client')}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <span className="text-2xl font-bold text-[#1e40af]">
                YarCircle Pricing
              </span>
            </div>
            
            {isAuthenticated && (
              <div className="flex items-center gap-4">
                <div className="bg-[#1e40af] text-white px-4 py-2 rounded-lg shadow-lg">
                  <span className="text-sm font-semibold">{creditsRemaining} Credits</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-[#1e40af]">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Unlock worker profiles and grow your business
          </p>
          <p className="text-lg text-gray-500">
            Secure payments • Instant activation • Credits never expire
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mb-16">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border rounded-2xl p-8 animate-pulse shadow-lg">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan, index) => {
                const isPopular = index === 2 // Make the 3rd plan popular
                // Backend returns plan.price as an object { amount, currency }
                const planAmount = plan.price && plan.price.amount ? Number(plan.price.amount) : 0
                const pricePerView = plan.viewsAllowed > 0 ? (planAmount / plan.viewsAllowed).toFixed(2) : '0.00'

                return (
                  <div
                    key={plan._id}
                    className={`relative bg-white border-2 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                      isPopular
                        ? 'border-[#1e40af] bg-[#1e40af]/5 shadow-xl scale-105'
                        : 'border-gray-200 hover:border-[#1e40af]/50'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-[#1e40af] text-white px-6 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                          Best Value
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className={`text-2xl font-bold mb-3 ${
                        isPopular ? 'text-[#1e40af]' : 'text-gray-700'
                      }`}>
                        {plan.planName}
                      </h3>

                      <div className="mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold text-gray-900">₹{planAmount}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Just ₹{pricePerView} per view
                        </p>
                      </div>

                      <div className="mb-8">
                        <div className="inline-block bg-[#1e40af] text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg">
                          {plan.viewsAllowed} Profile Views
                        </div>
                      </div>

                      <ul className="text-left space-y-3 mb-8 text-sm">
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700 font-medium">View {plan.viewsAllowed} worker profiles</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">Access full contact details</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">View complete portfolios</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">Credits never expire</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">Instant credit activation</span>
                        </li>
                      </ul>

                      <button
                        onClick={() => handlePurchase(plan)}
                        disabled={processingPayment}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          isPopular
                            ? 'bg-[#1e40af] text-white hover:bg-[#1e40af]/90 shadow-xl hover:shadow-2xl'
                            : 'bg-gray-800 text-white hover:bg-gray-900 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {processingPayment ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          'Buy Now'
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-xl p-12 mb-12">
          <h2 className="text-3xl font-bold text-center mb-10">Why Choose YarCircle?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-block p-4 bg-[#1e40af]/10 rounded-full mb-4">
                <svg className="w-8 h-8 text-[#1e40af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3">100% Secure Payments</h4>
              <p className="text-gray-600">Powered by Razorpay - India's most trusted payment gateway. Your data is encrypted and safe.</p>
            </div>
            <div className="text-center">
              <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3">Credits Never Expire</h4>
              <p className="text-gray-600">Use your credits whenever you need them. No pressure, no time limits. They're yours forever.</p>
            </div>
            <div className="text-center">
              <div className="inline-block p-4 bg-purple-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3">Instant Activation</h4>
              <p className="text-gray-600">Credits are added to your account immediately after successful payment. Start viewing profiles right away!</p>
            </div>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-[#1e40af] rounded-2xl shadow-2xl p-10 text-white text-center mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center justify-center gap-3">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Multiple Payment Options Available
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            {/* UPI Payment Badge */}
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
              <span className="text-lg font-bold">UPI / QR Code</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
              <span className="text-lg font-bold">Credit/Debit Cards</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
              <span className="text-lg font-bold">Net Banking</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
              <span className="text-lg font-bold">Digital Wallets</span>
            </div>
          </div>
          <p className="text-[#1e40af]/80 text-lg">
            Pay with PhonePe, Google Pay, Paytm, or scan QR code • Secure & Instant
          </p>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="border-b pb-6">
              <h4 className="text-lg font-semibold mb-2">Do credits expire?</h4>
              <p className="text-gray-600">No! Your credits never expire. Use them whenever you want, at your own pace.</p>
            </div>
            <div className="border-b pb-6">
              <h4 className="text-lg font-semibold mb-2">How do I use credits?</h4>
              <p className="text-gray-600">Each time you view a worker's full profile (contact details, portfolio), 1 credit is deducted from your account.</p>
            </div>
            <div className="border-b pb-6">
              <h4 className="text-lg font-semibold mb-2">Is payment secure?</h4>
              <p className="text-gray-600">Yes! We use Razorpay, India's leading payment gateway trusted by millions. All transactions are encrypted and secure.</p>
            </div>
            <div className="border-b pb-6">
              <h4 className="text-lg font-semibold mb-2">When will I get my credits?</h4>
              <p className="text-gray-600">Credits are added instantly after successful payment verification. You can start using them immediately!</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Can I get a refund?</h4>
              <p className="text-gray-600">Credits are non-refundable once purchased. However, since they never expire, you can use them anytime in the future.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="bg-white rounded-2xl p-10 text-center mt-12 border-2 border-gray-200">
            <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-gray-600 mb-6 text-lg">Create a free account to purchase credits and start viewing worker profiles</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/client/register')}
                className="bg-[#1e40af] text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-[#1e40af]/90 shadow-lg hover:shadow-xl transition-all"
              >
                Sign Up Free
              </button>
              <button
                onClick={() => navigate('/client/login')}
                className="bg-white text-gray-700 px-8 py-3 rounded-xl font-bold text-lg border-2 border-gray-300 hover:border-[#1e40af] hover:text-[#1e40af] shadow-lg hover:shadow-xl transition-all"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 YarCircle. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="/terms/terms" className="text-gray-400 hover:text-white transition-colors">Terms</a>
            <a href="/terms/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
            <a href="/terms/contact-us" className="text-gray-400 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingPage
