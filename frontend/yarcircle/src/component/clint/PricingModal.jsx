import React, { useState, useEffect } from 'react'
import { API_URL } from '../../config/api'
import { useCredit } from '../../context/CreditContext'

const PricingModal = ({ isOpen, onClose, onPurchaseSuccess }) => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  
  // Use Credit Context for real-time updates
  const { addCredits } = useCredit()

  useEffect(() => {
    if (isOpen) {
      fetchPlans()
    }
  }, [isOpen])

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
              onPurchaseSuccess()
              onClose()
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
          color: '#1e40af'
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1e40af] text-white p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">Choose Your Plan</h2>
              <p className="mt-2 text-gray-200">Select a plan to view worker profiles</p>
            </div>
            <button
              onClick={onClose}
              disabled={processingPayment}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="border rounded-xl p-6 animate-pulse">
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
                    className={`relative border-2 rounded-xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 ${
                      isPopular
                        ? 'border-[#1e40af] bg-[#1e40af]/5 shadow-lg'
                        : 'border-gray-200 hover:border-[#1e40af]/50'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-[#1e40af] text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className={`text-xl font-bold mb-2 ${
                        isPopular ? 'text-[#1e40af]' : 'text-gray-700'
                      }`}>
                        {plan.planName}
                      </h3>

                      <div className="mb-4">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-2xl font-bold text-gray-900">₹{planAmount}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          ₹{pricePerView} per view
                        </p>
                      </div>

                      <div className="mb-6">
                        <div className="inline-block bg-[#1e40af] text-white px-4 py-2 rounded-lg font-semibold">
                          {plan.viewsAllowed} Profile Views
                        </div>
                      </div>

                      <ul className="text-left space-y-2 mb-6 text-sm">
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600">View {plan.viewsAllowed} worker profiles</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600">Access full contact details</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600">View worker portfolios</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600">Credits never expire</span>
                        </li>
                      </ul>

                      <button
                        onClick={() => handlePurchase(plan)}
                        disabled={processingPayment}
                        className={`w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          isPopular
                            ? 'bg-[#1e40af] text-white hover:bg-[#1e40af]/90 shadow-lg'
                            : 'bg-gray-800 text-white hover:bg-gray-900'
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

          {/* Features Section */}
          <div className="mt-12 border-t pt-8">
            <h3 className="text-xl font-bold text-center mb-6">Why Choose Our Plans?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-block p-3 bg-[#1e40af]/10 rounded-full mb-3">
                  <svg className="w-6 h-6 text-[#1e40af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Secure Payments</h4>
                <p className="text-sm text-gray-600">Powered by Razorpay - India's trusted payment gateway</p>
              </div>
              <div className="text-center">
                <div className="inline-block p-3 bg-green-100 rounded-full mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">No Expiry</h4>
                <p className="text-sm text-gray-600">Your credits never expire - use them anytime</p>
              </div>
              <div className="text-center">
                <div className="inline-block p-3 bg-purple-100 rounded-full mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Instant Activation</h4>
                <p className="text-sm text-gray-600">Credits added immediately after payment</p>
              </div>
            </div>
          </div>

          {/* Payment Methods Banner */}
          <div className="mt-8 bg-neutral-50 rounded-xl p-6 border border-gray-200">
            <div className="text-center">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-[#1e40af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Multiple Payment Options Available
              </h4>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {/* UPI Payment Badge */}
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-300">
                  <span className="text-sm font-semibold text-[#1e40af]">UPI / QR Code</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                  <span className="text-sm font-semibold text-gray-700">Credit/Debit Cards</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                  <span className="text-sm font-semibold text-gray-700">Net Banking</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                  <span className="text-sm font-semibold text-gray-700">Digital Wallets</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Pay with PhonePe, Google Pay, Paytm, or scan QR code • Secure & Instant
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingModal
