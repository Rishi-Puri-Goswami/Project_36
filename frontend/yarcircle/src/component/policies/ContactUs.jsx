import React from 'react'
import { useNavigate } from 'react-router-dom'

const ContactUs = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
          <p className="text-gray-600">We're here to help! Get in touch with us</p>
        </div>

        {/* Contact Information */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Email */}
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-600 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                <p className="text-gray-600">Send us an email anytime</p>
              </div>
            </div>
            <a href="mailto:support@yaarcircle.com" className="text-blue-600 hover:text-blue-700 font-medium">
              support@yaarcircle.com
            </a>
          </div>

          {/* Phone */}
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-600 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Phone</h3>
                <p className="text-gray-600">Mon-Fri 9am-6pm IST</p>
              </div>
            </div>
            <a href="tel:+911234567890" className="text-green-600 hover:text-green-700 font-medium">
              +91 1234567890
            </a>
          </div>

          {/* Address */}
          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-purple-600 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Office Address</h3>
                <p className="text-gray-600">Visit our office</p>
              </div>
            </div>
            <p className="text-gray-700">
              123, Business Plaza<br />
              Connaught Place<br />
              New Delhi - 110001<br />
              India
            </p>
          </div>

          {/* Support Hours */}
          <div className="bg-orange-50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-600 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Support Hours</h3>
                <p className="text-gray-600">We're available</p>
              </div>
            </div>
            <div className="text-gray-700 space-y-1">
              <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM IST</p>
              <p><strong>Saturday:</strong> 10:00 AM - 4:00 PM IST</p>
              <p><strong>Sunday:</strong> Closed</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-600 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">How quickly will I receive a response?</h3>
              <p className="text-gray-700">We typically respond to all inquiries within 24 hours during business days.</p>
            </div>
            <div className="border-l-4 border-green-600 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Can I schedule a call with support?</h3>
              <p className="text-gray-700">Yes! Email us with your preferred time and we'll arrange a call back.</p>
            </div>
            <div className="border-l-4 border-purple-600 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Do you have live chat support?</h3>
              <p className="text-gray-700">Live chat support is available for premium subscribers during business hours.</p>
            </div>
          </div>
        </section>

        {/* Additional Info */}
        <div className="bg-blue-600 text-white rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">Need immediate assistance?</h3>
          <p className="mb-4">For urgent matters, please call our support line or send an email with "URGENT" in the subject line.</p>
          <div className="flex gap-4">
            <a href="mailto:support@yaarcircle.com" className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Email Us
            </a>
            <a href="tel:+911234567890" className="border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Call Now
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactUs
