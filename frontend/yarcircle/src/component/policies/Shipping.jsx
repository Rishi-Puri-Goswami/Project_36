import React from 'react'
import { useNavigate } from 'react-router-dom'

const Shipping = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shipping & Delivery Policy</h1>
          <p className="text-gray-600">Last updated: November 9, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-blue max-w-none space-y-6">
          <section>
            <div className="bg-blue-100 border-l-4 border-blue-600 p-6 rounded-r-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Digital Service Platform</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                YaarCircle is a <strong>digital service platform</strong> that connects clients with workers. We do not ship physical products. All our services are delivered digitally through our online platform.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Service Delivery</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">Instant Access</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account Creation:</strong> Immediate access upon registration</li>
              <li><strong>Subscription Activation:</strong> Instant activation after payment confirmation</li>
              <li><strong>Platform Features:</strong> Available immediately after account verification</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">Subscription Delivery Timeline</h3>
            <div className="bg-gray-100 p-4 rounded-lg mt-3">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold mr-3 flex-shrink-0">1</span>
                  <div>
                    <p className="font-semibold text-gray-900">Payment Processing</p>
                    <p className="text-gray-600 text-sm">Typically within 5-10 minutes</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-3 flex-shrink-0">2</span>
                  <div>
                    <p className="font-semibold text-gray-900">Subscription Activation</p>
                    <p className="text-gray-600 text-sm">Automatic after payment confirmation</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-semibold mr-3 flex-shrink-0">3</span>
                  <div>
                    <p className="font-semibold text-gray-900">Email Confirmation</p>
                    <p className="text-gray-600 text-sm">Sent within 15 minutes of activation</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">What You Receive</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-gray-900 mb-2">✓ For Clients</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Access to worker database</li>
                  <li>• Job posting capabilities</li>
                  <li>• Communication tools</li>
                  <li>• Dashboard features</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">✓ For Workers</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Profile visibility</li>
                  <li>• Job alerts</li>
                  <li>• Client connections</li>
                  <li>• Application tracking</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Delivery Method</h2>
            <p className="text-gray-700 leading-relaxed">
              All services are delivered electronically through:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
              <li><strong>Web Platform:</strong> Access via any modern web browser</li>
              <li><strong>Email Notifications:</strong> Confirmation and updates sent to registered email</li>
              <li><strong>Account Dashboard:</strong> Manage subscriptions and features online</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Service Interruptions</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
              <p className="text-gray-700 mb-2">
                While we strive for 99.9% uptime, service may be temporarily unavailable due to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Scheduled maintenance (announced 24 hours in advance)</li>
                <li>Emergency security updates</li>
                <li>Technical issues beyond our control</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Geographic Availability</h2>
            <p className="text-gray-700 leading-relaxed">
              YaarCircle services are primarily available in India. International access may be limited. All transactions are processed in Indian Rupees (INR).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">No Physical Shipping</h2>
            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <p className="text-gray-700">
                <strong>Important:</strong> We do not ship any physical products. If you receive an email claiming to ship physical items from YaarCircle, it may be fraudulent. Please report such communications to our support team immediately.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Access Issues</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you experience delays in accessing your subscription or features:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Check your payment confirmation email</li>
                <li>Verify your account email address</li>
                <li>Clear browser cache and cookies</li>
                <li>Try logging out and back in</li>
                <li>Contact our support team if issues persist</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Support & Contact</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              For any questions about service delivery or access:
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> support@yaarcircle.com</p>
              <p className="text-gray-700 mb-2"><strong>Phone:</strong> +91 1234567890</p>
              <p className="text-gray-700"><strong>Support Hours:</strong> Monday - Saturday, 9:00 AM - 6:00 PM IST</p>
            </div>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm italic">
              Since YaarCircle is a service-based digital platform, traditional shipping terms do not apply. This policy clarifies how our digital services are delivered and accessed.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Shipping
