import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_URL } from '../../config/api'

const EditJob = () => {
  const navigate = useNavigate()
  const { jobId } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    // Base fields (match backend ClientPost schema)
    workType: '',
    numberOfWorkers: 1,
    location: '',
    salaryRange: '',
    description: '',
    contactNumber: '',
    validityDays: 15,
    // Additional fields
    department: '',
    employmentType: '',
    shift: '',
    experienceMinYears: '',
    education: '',
    degreeSpecialization: '',
    gender: '',
    companyName: '',
    companyAddress: '',
    companyWebsite: '',
    additionalInfo: ''
  })

  useEffect(() => {
    fetchJobDetails()
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/clients/jobs/${jobId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        // backend returns { jobPost }
        const job = data.jobPost || data.job || data.jobPost || null;
        if (!job) {
          setError('Malformed response from server')
        } else {
          setFormData({
            workType: job.workType || '',
            numberOfWorkers: job.numberOfWorkers || 1,
            location: job.location || '',
            salaryRange: job.salaryRange || '',
            description: job.description || '',
            contactNumber: job.contactNumber || '',
            validityDays: job.validityDays || 15,
            department: job.department || '',
            employmentType: job.employmentType || '',
            shift: job.shift || '',
            experienceMinYears: job.experienceMinYears || '',
            education: job.education || '',
            degreeSpecialization: job.degreeSpecialization || '',
            gender: job.gender || '',
            companyName: job.companyName || '',
            companyAddress: job.companyAddress || '',
            companyWebsite: job.companyWebsite || '',
            additionalInfo: job.additionalInfo || ''
          })
        }
      } else {
        setError(data.message || 'Failed to fetch job details')
      }
    } catch (error) {
      console.error('Error fetching job details:', error)
      setError('Server error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Ensure numeric fields are sent as numbers
      const payload = {
        ...formData,
        numberOfWorkers: Number(formData.numberOfWorkers) || 1,
        validityDays: Number(formData.validityDays) || 15,
        experienceMinYears: formData.experienceMinYears !== '' ? Number(formData.experienceMinYears) : undefined
      }

      const response = await fetch(`${API_URL}/clients/jobs/${jobId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Job updated successfully!')
        navigate(`/client/jobs/${jobId}`)
      } else {
        setError(data.message || 'Failed to update job')
      }
    } catch (error) {
      console.error('Error updating job:', error)
      setError('Server error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(`/client/jobs/${jobId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Job Details</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Edit Job</h1>
          <p className="text-gray-600 mt-1">Update your job posting details</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            {/* Work Type */}
            <div>
              <label htmlFor="workType" className="block text-sm font-semibold text-gray-700 mb-2">
                Work Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="workType"
                name="workType"
                value={formData.workType}
                onChange={handleChange}
                required
                placeholder="e.g., Construction, Plumbing, Electrical"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Number of Workers */}
            <div>
              <label htmlFor="numberOfWorkers" className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Workers Needed
              </label>
              <input
                type="number"
                id="numberOfWorkers"
                name="numberOfWorkers"
                value={formData.numberOfWorkers}
                onChange={handleChange}
                min="1"
                placeholder="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="e.g., Mumbai, Maharashtra"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Salary Range */}
            <div>
              <label htmlFor="salaryRange" className="block text-sm font-semibold text-gray-700 mb-2">
                Salary Range
              </label>
              <input
                type="text"
                id="salaryRange"
                name="salaryRange"
                value={formData.salaryRange}
                onChange={handleChange}
                placeholder="e.g., ₹15,000 - ₹25,000/month"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="e.g., +91 9876543210"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Describe the job requirements, responsibilities, and any other relevant details..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* --- Additional Job / Company Fields --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                <input
                  type="text"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Shift</label>
                <input
                  type="text"
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Experience (min years)</label>
                <input
                  type="number"
                  name="experienceMinYears"
                  value={formData.experienceMinYears}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Education</label>
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Degree / Specialization</label>
                <input
                  type="text"
                  name="degreeSpecialization"
                  value={formData.degreeSpecialization}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Gender</label>
                <input
                  type="text"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Company Address</label>
                <input
                  type="text"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Company Website</label>
                <input
                  type="text"
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Additional Info / Benefits</label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>
            </div>

            {/* Validity Days */}
            <div>
              <label htmlFor="validityDays" className="block text-sm font-semibold text-gray-700 mb-2">
                Job Validity Period
              </label>
              <select
                id="validityDays"
                name="validityDays"
                value={formData.validityDays}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value={7}>7 Days</option>
                <option value={15}>15 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                The job will be active for the selected period from today
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate(`/client/jobs/${jobId}`)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold transition-colors ${
                submitting 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700'
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update Job'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditJob
