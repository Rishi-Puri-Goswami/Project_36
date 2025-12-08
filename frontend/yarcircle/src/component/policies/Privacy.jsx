import React from 'react'
import { useNavigate } from 'react-router-dom'

const Privacy = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: November 9, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-blue max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              YaarCircle ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Name, email address, and phone number</li>
              <li>Company name and business information (for clients)</li>
              <li>Work type, skills, and experience (for workers)</li>
              <li>Location and contact details</li>
              <li>Profile picture and bio</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">Usage Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Job postings and applications</li>
              <li>Search queries and platform interactions</li>
              <li>Device information and IP address</li>
              <li>Browser type and operating system</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">Payment Information</h3>
            <p className="text-gray-700">
              Payment information is processed securely through third-party payment processors (Razorpay). We do not store complete credit card details on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>To provide and maintain our services</li>
              <li>To match workers with clients and facilitate connections</li>
              <li>To process subscriptions and payments</li>
              <li>To send important updates and notifications</li>
              <li>To improve our platform and user experience</li>
              <li>To prevent fraud and ensure platform security</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Information Sharing</h2>
            <p className="text-gray-700 mb-3">We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Other Users:</strong> Your profile information is visible to other users when you apply for jobs or post job listings</li>
              <li><strong>Service Providers:</strong> Payment processors, hosting services, and analytics providers</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In case of merger, sale, or acquisition</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 mt-4">
              <p className="text-gray-700"><strong>Note:</strong> We never sell your personal information to third parties for marketing purposes.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
              <li>SSL/TLS encryption for data transmission</li>
              <li>Secure password hashing</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Data backup and recovery procedures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Your Rights</h2>
            <p className="text-gray-700 mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Object:</strong> Object to certain types of data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar technologies to enhance your experience. You can control cookie preferences through your browser settings. However, disabling cookies may limit some platform features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide services. When you delete your account, we will delete or anonymize your data within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform is not intended for users under 18 years of age. We do not knowingly collect information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or platform notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mt-3">
              <p className="text-gray-700"><strong>Email:</strong> privacy@yaarcircle.com</p>
              <p className="text-gray-700"><strong>Phone:</strong> +91 1234567890</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Privacy
