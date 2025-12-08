// Utility to check if business owner is authenticated
export const isBusinessAuthenticated = () => {
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('businesstoken='));
  const localToken = localStorage.getItem('businessToken');
  
  return !!(cookieToken || localToken);
};

// Utility to get business token
export const getBusinessToken = () => {
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('businesstoken='));
  
  if (cookieToken) {
    return cookieToken.split('=')[1];
  }
  
  return localStorage.getItem('businessToken');
};

// Utility to set business token
export const setBusinessToken = (token) => {
  localStorage.setItem('businessToken', token);
  document.cookie = `businesstoken=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
};

// Utility to clear business token
export const clearBusinessToken = () => {
  document.cookie = 'businesstoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  localStorage.removeItem('businessToken');
};

// Get stored business user
export const getStoredBusinessUser = () => {
  const user = localStorage.getItem('businessUser');
  return user ? JSON.parse(user) : null;
};

// Set stored business user
export const setStoredBusinessUser = (user) => {
  localStorage.setItem('businessUser', JSON.stringify(user));
};

// Clear stored business user
export const clearStoredBusinessUser = () => {
  localStorage.removeItem('businessUser');
};
