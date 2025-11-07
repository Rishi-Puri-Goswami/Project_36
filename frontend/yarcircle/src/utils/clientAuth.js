// Utility to check if client is authenticated
export const isClientAuthenticated = () => {
  // Check both cookie and localStorage
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('clinttoken='));
  const localToken = localStorage.getItem('clientToken');
  
  return !!(cookieToken || localToken);
};

// Utility to get client token
export const getClientToken = () => {
  // Try cookie first, then localStorage
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('clinttoken='));
  
  if (cookieToken) {
    return cookieToken.split('=')[1];
  }
  
  return localStorage.getItem('clientToken');
};

// Utility to clear client token
export const clearClientToken = () => {
  document.cookie = 'clinttoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  localStorage.removeItem('clientToken');
};
