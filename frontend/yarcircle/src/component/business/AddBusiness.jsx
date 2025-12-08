import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, X, Loader } from 'lucide-react';
import { isBusinessAuthenticated, getBusinessToken } from '../../utils/businessAuth';
import { API_URL } from '../../config/api';

const AddBusiness = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [businessImages, setBusinessImages] = useState([]);
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    whatsappNumber: '',
    shopAddress: '',
    village: '',
    district: '',
    state: '',
    pincode: '',
    landmark: '',
    openingTime: '09:00',
    closingTime: '21:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    tags: ''
  });

  useEffect(() => {
    if (!isBusinessAuthenticated()) {
      navigate('/business/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleDayToggle = (day) => {
    if (formData.workingDays.includes(day)) {
      setFormData({
        ...formData,
        workingDays: formData.workingDays.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        workingDays: [...formData.workingDays, day]
      });
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (businessImages.length + files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    setUploadingImages(true);
    setError('');

    try {
      const formDataObj = new FormData();
      files.forEach(file => formDataObj.append('images', file));

      const response = await fetch(`${API_URL}/business/upload-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getBusinessToken()}`
        },
        body: formDataObj
      });

      const data = await response.json();

      if (response.ok) {
        setBusinessImages([...businessImages, ...data.images]);
      } else {
        setError(data.message || 'Failed to upload images');
      }
    } catch (err) {
      setError('Error uploading images');
      console.error(err);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setBusinessImages(businessImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.businessName || !formData.businessType || !formData.description || 
        !formData.contactPhone || !formData.shopAddress || !formData.village || 
        !formData.district || !formData.state || !formData.pincode) {
      setError('Please fill all required fields');
      return;
    }

    if (formData.contactPhone.length !== 10) {
      setError('Phone number must be 10 digits');
      return;
    }

    setLoading(true);

    try {
      const tagsArray = formData.tags 
        ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
        : [];

      // First create the business
      const response = await fetch(`${API_URL}/business/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getBusinessToken()}`
        },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
          businessImages: businessImages
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Business listed successfully!');
        setTimeout(() => navigate('/business/my-listings'), 1500);
      } else {
        setError(data.message || 'Failed to create business');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = [
    'Retail Store', 'Restaurant', 'Grocery Store', 'Electronics Shop',
    'Clothing Store', 'Hardware Store', 'Medical Store/Pharmacy',
    'Beauty Salon/Parlour', 'Mobile Shop', 'Furniture Store', 'Bakery',
    'Stationery Shop', 'Jewellery Store', 'Auto Parts Shop', 'Sports Shop',
    'Book Store', 'Pet Shop', 'Flower Shop', 'General Store', 'Service Center', 'Other'
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/business/dashboard')}
            className="text-purple-600 hover:text-purple-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">List Your Business</h2>
            <p className="text-gray-600 mt-1">Fill in the details to list your shop or business</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Business Name *</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Business Type *</label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select Business Type</option>
                    {businessTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe your business, products, or services..."
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="10-digit phone"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="10-digit WhatsApp number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="business@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Shop Address</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Shop Address *</label>
                  <input
                    type="text"
                    name="shopAddress"
                    value={formData.shopAddress}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Street address, building name, etc."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Near temple, opposite bank, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Village/Town/City *</label>
                    <input
                      type="text"
                      name="village"
                      value={formData.village}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter village/town/city"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">District *</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter district"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select State</option>
                      {indianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="6-digit pincode"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Timing */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Hours</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Opening Time</label>
                  <input
                    type="time"
                    name="openingTime"
                    value={formData.openingTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Closing Time</label>
                  <input
                    type="time"
                    name="closingTime"
                    value={formData.closingTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        formData.workingDays.includes(day)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Business Images */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Photos</h3>
              <p className="text-sm text-gray-600 mb-4">Upload photos of your shop, products, or services (Max 10 images)</p>
              
              {businessImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {businessImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Business ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {businessImages.length < 10 && (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors bg-gray-50">
                  <div className="text-center">
                    {uploadingImages ? (
                      <>
                        <Loader className="animate-spin mx-auto mb-2 text-purple-600" size={40} />
                        <span className="text-sm text-gray-600">Uploading images...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="mx-auto mb-2 text-gray-400" size={40} />
                        <span className="text-sm text-gray-600 font-medium">Click to upload business photos</span>
                        <span className="text-xs text-gray-500 block mt-1">PNG, JPG up to 5MB each</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImages || businessImages.length >= 10}
                  />
                </label>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Tags (for better search)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., organic, local, wholesale (comma separated)"
              />
              <p className="text-sm text-gray-500 mt-1">Add keywords to help customers find your business</p>
            </div>

            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Creating...
                </>
              ) : (
                'List My Business'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBusiness;
