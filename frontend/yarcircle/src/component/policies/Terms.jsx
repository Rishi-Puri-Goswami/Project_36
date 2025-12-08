import React from 'react'
import { useNavigate } from 'react-router-dom'

const Terms = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
          <p className="text-gray-600">Last updated: November 9, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-blue max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using YaarCircle ("Platform", "Service"), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Platform Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              YaarCircle is a platform that connects clients seeking services with skilled workers. We act as an intermediary and facilitate connections, but we are not a party to any agreements between clients and workers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">User Accounts</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">Registration</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You must be at least 18 years old to create an account</li>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must not share your account credentials</li>
              <li>One person may only maintain one account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">Account Termination</h3>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">User Responsibilities</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4">For Clients</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Post accurate and honest job listings</li>
              <li>Treat workers with respect and professionalism</li>
              <li>Pay agreed-upon rates for completed work</li>
              <li>Comply with all applicable labor laws</li>
              <li>Provide safe working conditions</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4">For Workers</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide accurate information about skills and experience</li>
              <li>Deliver work as promised and agreed upon</li>
              <li>Maintain professional conduct</li>
              <li>Honor commitments and deadlines</li>
              <li>Comply with all applicable regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Prohibited Activities</h2>
            <div className="bg-red-50 border-l-4 border-red-600 p-4">
              <p className="text-gray-700 font-semibold mb-2">Users must NOT:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Post false or misleading information</li>
                <li>Engage in fraudulent activities</li>
                <li>Harass, threaten, or discriminate against others</li>
                <li>Attempt to circumvent platform fees</li>
                <li>Scrape or collect user data without permission</li>
                <li>Upload viruses or malicious code</li>
                <li>Impersonate others or create fake profiles</li>
                <li>Spam or send unsolicited messages</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Subscriptions and Payments</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Subscription fees are charged in advance for each billing cycle</li>
              <li>Prices are subject to change with 30 days notice</li>
              <li>All payments are processed securely through third-party providers</li>
              <li>Taxes may apply based on your location</li>
              <li>Refunds are subject to our Cancellation & Refund Policy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All content on the platform, including logos, designs, text, and software, is owned by YaarCircle or licensed to us. Users retain ownership of content they post but grant us a license to use it for platform operations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>YaarCircle is not responsible for the quality of work performed by workers</li>
                <li>We do not guarantee job placements or successful hires</li>
                <li>We are not liable for disputes between clients and workers</li>
                <li>We do not conduct background checks unless explicitly stated</li>
                <li>Users interact at their own risk</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed">
              While we may provide mediation services, we are not responsible for resolving disputes between users. Legal disputes should be settled according to the laws of India, with jurisdiction in New Delhi courts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold YaarCircle harmless from any claims, damages, or expenses arising from your use of the platform or violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify users of significant changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms are governed by the laws of India. Any legal action must be brought in the courts of New Delhi, India.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms & Conditions, contact us at:
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mt-3">
              <p className="text-gray-700"><strong>Email:</strong> legal@yaarcircle.com</p>
              <p className="text-gray-700"><strong>Phone:</strong> +91 1234567890</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Terms
