import React from 'react'
import { useNavigate } from 'react-router-dom'

const CancellationRefund = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cancellation & Refund Policy</h1>
          <p className="text-gray-600">Last updated: November 9, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-blue max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              At YaarCircle, we strive to provide the best service to connect clients with skilled workers. 
              This policy outlines the terms for cancellations and refunds for our subscription plans and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Subscription Cancellation</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Monthly Plans:</strong> You can cancel your monthly subscription at any time. The cancellation will take effect at the end of your current billing cycle.</p>
              <p><strong>Annual Plans:</strong> Annual subscriptions can be cancelled, but no refunds will be provided for the unused portion of the subscription period.</p>
              <p><strong>Free Plan:</strong> You can switch back to the free plan at any time without any charges.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Refund Policy</h2>
            <div className="space-y-3 text-gray-700">
              <h3 className="text-xl font-semibold text-gray-800 mt-4">Eligible for Refunds:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Technical issues preventing access to the platform for more than 48 hours</li>
                <li>Duplicate charges or billing errors</li>
                <li>Cancellation within 24 hours of initial subscription purchase</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-4">Not Eligible for Refunds:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Change of mind after the 24-hour grace period</li>
                <li>Failure to use the service during the subscription period</li>
                <li>Partial refunds for unused subscription time (except in cases of service failure)</li>
                <li>Job posting credits that have already been used</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">How to Request a Cancellation or Refund</h2>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 my-4">
              <p className="text-gray-700">
                To request a cancellation or refund, please contact our support team at:
              </p>
              <ul className="mt-2 space-y-1 text-gray-700">
                <li><strong>Email:</strong> support@yaarcircle.com</li>
                <li><strong>Phone:</strong> +91 1234567890</li>
              </ul>
              <p className="mt-2 text-gray-700">
                Please include your account details and reason for the request. We will process your request within 5-7 business days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Refund Processing Time</h2>
            <p className="text-gray-700 leading-relaxed">
              Approved refunds will be processed within 7-10 business days. The refund will be credited to the original payment method used for the purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Service Credits</h2>
            <p className="text-gray-700 leading-relaxed">
              In certain cases, instead of a monetary refund, we may offer service credits that can be used for future subscriptions or job postings on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about our Cancellation & Refund Policy, please contact us at support@yaarcircle.com
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default CancellationRefund
