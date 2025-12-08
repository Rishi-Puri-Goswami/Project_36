import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAdminAuthHeader } from '../../utils/adminAuth';
import { API_URL } from '../../config/api';
import {
  User,
  Lock,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Key,
  X,
  Check
} from 'lucide-react';

const AdminSettings = () => {
  const { admin, logout, getProfile } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Toast notification state
  const [toast, setToast] = useState({ show: false, type: '', message: '', icon: null });

  // Profile Update State
  const [profileData, setProfileData] = useState({
    name: admin?.name || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileChanged, setProfileChanged] = useState(false);

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentSecretKey: '',
    newSecretKey: '',
    confirmSecretKey: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength indicator
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Update profile data when admin changes
  useEffect(() => {
    if (admin?.name) {
      setProfileData({ name: admin.name });
    }
  }, [admin]);

  // Calculate password strength
  useEffect(() => {
    const password = passwordData.newSecretKey;
    let strength = 0;

    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;

    setPasswordStrength(strength);
  }, [passwordData.newSecretKey]);

  // Toast notification function
  const showToast = (type, message, icon = null) => {
    setToast({ show: true, type, message, icon });
    setTimeout(() => {
      setToast({ show: false, type: '', message: '', icon: null });
    }, 4000);
  };

  const handleProfileChange = (e) => {
    const newName = e.target.value;
    setProfileData({ name: newName });
    setProfileChanged(newName !== admin?.name);
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const updateProfile = async (e) => {
    e.preventDefault();

    if (!profileData.name.trim()) {
      showToast('error', 'Name is required', <AlertCircle className="w-5 h-5" />);
      return;
    }

    if (profileData.name.trim().length < 2) {
      showToast('error', 'Name must be at least 2 characters long', <AlertCircle className="w-5 h-5" />);
      return;
    }

    if (profileData.name.trim() === admin?.name) {
      showToast('info', 'No changes detected', <AlertCircle className="w-5 h-5" />);
      return;
    }

    try {
      setProfileLoading(true);

      await axios.put(
        `${API_URL}/admin/auth/profile`,
        { name: profileData.name.trim() },
        { headers: getAdminAuthHeader() }
      );

      // Update admin context
      await getProfile();

      setProfileChanged(false);
      showToast('success', 'Profile updated successfully!', <CheckCircle className="w-5 h-5" />);

    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      showToast('error', errorMessage, <AlertCircle className="w-5 h-5" />);

      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!passwordData.currentSecretKey) {
      showToast('error', 'Current secret key is required', <AlertCircle className="w-5 h-5" />);
      return;
    }

    if (!passwordData.newSecretKey) {
      showToast('error', 'New secret key is required', <AlertCircle className="w-5 h-5" />);
      return;
    }

    if (passwordData.newSecretKey.length < 6) {
      showToast('error', 'New secret key must be at least 6 characters long', <AlertCircle className="w-5 h-5" />);
      return;
    }

    if (passwordData.newSecretKey !== passwordData.confirmSecretKey) {
      showToast('error', 'New secret keys do not match', <AlertCircle className="w-5 h-5" />);
      return;
    }

    if (passwordData.currentSecretKey === passwordData.newSecretKey) {
      showToast('error', 'New secret key must be different from current secret key', <AlertCircle className="w-5 h-5" />);
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await axios.put(
        `${API_URL}/admin/auth/change-password`,
        {
          currentSecretKey: passwordData.currentSecretKey,
          newSecretKey: passwordData.newSecretKey
        },
        { headers: getAdminAuthHeader() }
      );

      showToast('success', 'Password changed successfully!', <CheckCircle className="w-5 h-5" />);

      // Clear the form
      setPasswordData({
        currentSecretKey: '',
        newSecretKey: '',
        confirmSecretKey: ''
      });

      // Reset password visibility
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      showToast('error', errorMessage, <AlertCircle className="w-5 h-5" />);

      if (error.response?.status === 401) {
        logout();
        navigate('/admin/login');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-blue-100">Manage your admin profile and security settings</p>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        } border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out`}>
          <div className="flex items-center gap-3">
            {toast.icon}
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToast({ show: false, type: '', message: '', icon: null })}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-8 py-4 text-sm font-semibold transition-all duration-200 flex items-center gap-3 ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5" />
              Profile Settings
              {activeTab === 'profile' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-8 py-4 text-sm font-semibold transition-all duration-200 flex items-center gap-3 ${
                activeTab === 'password'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Lock className="w-5 h-5" />
              Security Settings
              {activeTab === 'password' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Profile Settings Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Update Profile</h2>
                  <p className="text-gray-600">Keep your profile information up to date</p>
                </div>
              </div>

              {/* Current Info Display */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Current Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="font-semibold text-gray-900">{admin?.name}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Email Address</p>
                    <p className="font-semibold text-gray-900">{admin?.email}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Role</p>
                    <p className="font-semibold text-gray-900 capitalize">{admin?.role}</p>
                  </div>
                </div>
              </div>

              {/* Profile Update Form */}
              <form onSubmit={updateProfile} className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your full name"
                    required
                  />
                  {profileChanged && (
                    <p className="mt-2 text-sm text-orange-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Changes detected - click save to update
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={profileLoading || !profileChanged}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 shadow-lg"
                >
                  {profileLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {profileLoading ? 'Updating Profile...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Password Change Tab */}
          {activeTab === 'password' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Key className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
                  <p className="text-gray-600">Update your secret key to keep your account secure</p>
                </div>
              </div>

              {/* Security Tips */}
              <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Security Tips</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Use at least 8 characters with numbers and uppercase letters</li>
                      <li>• Avoid using the same password across multiple accounts</li>
                      <li>• Change your password regularly for better security</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <form onSubmit={changePassword} className="space-y-6">
                {/* Current Password */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <label htmlFor="currentSecretKey" className="block text-sm font-semibold text-gray-700 mb-3">
                    Current Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentSecretKey"
                      name="currentSecretKey"
                      value={passwordData.currentSecretKey}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Enter your current secret key"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <label htmlFor="newSecretKey" className="block text-sm font-semibold text-gray-700 mb-3">
                    New Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newSecretKey"
                      name="newSecretKey"
                      value={passwordData.newSecretKey}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Enter your new secret key"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.newSecretKey && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Password Strength</span>
                        <span className={`text-sm font-medium ${
                          passwordStrength < 25 ? 'text-red-600' :
                          passwordStrength < 50 ? 'text-orange-600' :
                          passwordStrength < 75 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <label htmlFor="confirmSecretKey" className="block text-sm font-semibold text-gray-700 mb-3">
                    Confirm New Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmSecretKey"
                      name="confirmSecretKey"
                      value={passwordData.confirmSecretKey}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Confirm your new secret key"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Match Indicator */}
                  {passwordData.confirmSecretKey && (
                    <div className="mt-2 flex items-center gap-2">
                      {passwordData.newSecretKey === passwordData.confirmSecretKey ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 focus:ring-4 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-600 disabled:hover:to-red-700 shadow-lg"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
