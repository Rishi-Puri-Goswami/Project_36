import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { 
  getBusinessToken, 
  setBusinessToken, 
  clearBusinessToken,
  getStoredBusinessUser,
  setStoredBusinessUser,
  clearStoredBusinessUser
} from '../utils/businessAuth';

const BusinessContext = createContext(null);

export const BusinessProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredBusinessUser());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verify auth on mount
  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    const token = getBusinessToken();
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/business/verify-auth`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setStoredBusinessUser(data.user);
        setIsAuthenticated(true);
      } else {
        clearBusinessToken();
        clearStoredBusinessUser();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    const response = await fetch(`${API_URL}/business/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });

    const data = await response.json();

    if (response.ok) {
      setBusinessToken(data.token);
      setStoredBusinessUser(data.user);
      setUser(data.user);
      setIsAuthenticated(true);
    }

    return data;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/business/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getBusinessToken()}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    clearBusinessToken();
    clearStoredBusinessUser();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    setStoredBusinessUser(updatedUser);
  };

  return (
    <BusinessContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      updateUser,
      verifyAuth
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

export default BusinessContext;
