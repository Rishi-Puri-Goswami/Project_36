// Admin Authentication Helper Functions

const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_DATA_KEY = 'adminData';

/**
 * Store admin token and data in localStorage
 */
export const setAdminAuth = (token, adminData) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(adminData));
};

/**
 * Get admin token from localStorage
 */
export const getAdminToken = () => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

/**
 * Get admin data from localStorage
 */
export const getAdminData = () => {
  const data = localStorage.getItem(ADMIN_DATA_KEY);
  return data ? JSON.parse(data) : null;
};

/**
 * Remove admin auth data (logout)
 */
export const clearAdminAuth = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_DATA_KEY);
};

/**
 * Check if admin is authenticated
 */
export const isAdminAuthenticated = () => {
  return !!getAdminToken();
};

/**
 * Get admin authorization header
 */
export const getAdminAuthHeader = () => {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Check if admin is super admin
 */
export const isSuperAdmin = () => {
  const adminData = getAdminData();
  return adminData?.role === 'super-admin';
};
