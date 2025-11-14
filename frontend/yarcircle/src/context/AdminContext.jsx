import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  setAdminAuth, 
  getAdminToken, 
  getAdminData, 
  clearAdminAuth,
  isAdminAuthenticated as checkAdminAuth
} from '../utils/adminAuth';
import axios from 'axios';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Check authentication on mount
  useEffect(() => {
    const initAuth = () => {
      if (checkAdminAuth()) {
        const adminData = getAdminData();
        setAdmin(adminData);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Admin Login
   */
  const login = async (email, secretKey) => {
    try {
      const response = await axios.post(`${API_URL}/admin/auth/login`, {
        email,
        secretKey
      });

      const { token, admin: adminData } = response.data;

      // Store auth data
      setAdminAuth(token, adminData);
      setAdmin(adminData);
      setIsAuthenticated(true);

      return { success: true, admin: adminData };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed. Please try again.'
      };
    }
  };

  /**
   * Admin Logout
   */
  const logout = () => {
    clearAdminAuth();
    setAdmin(null);
    setIsAuthenticated(false);
  };

  /**
   * Verify Token
   */
  const verifyToken = async () => {
    try {
      const token = getAdminToken();
      if (!token) {
        logout();
        return false;
      }

      const response = await axios.get(`${API_URL}/admin/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data.admin;
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
      return false;
    }
  };

  /**
   * Get Admin Profile
   */
  const getProfile = async () => {
    try {
      const token = getAdminToken();
      const response = await axios.get(`${API_URL}/admin/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const adminData = response.data.admin;
      setAdmin(adminData);
      setAdminAuth(token, adminData);

      return { success: true, admin: adminData };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch profile'
      };
    }
  };

  const value = {
    admin,
    isAuthenticated,
    loading,
    login,
    logout,
    verifyToken,
    getProfile
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
