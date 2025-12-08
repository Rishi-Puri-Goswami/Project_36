// Utility to check if worker is authenticated
export const isWorkerAuthenticated = () => {
  // Check both cookie and localStorage
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('workertoken='));
  const localToken = localStorage.getItem('workerToken');
  
  return !!(cookieToken || localToken);
};

// Utility to get worker token
export const getWorkerToken = () => {
  // Try cookie first, then localStorage
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('workertoken='));
  
  if (cookieToken) {
    return cookieToken.split('=')[1];
  }
  
  return localStorage.getItem('workerToken');
};

// Utility to clear worker token
export const clearWorkerToken = () => {
  document.cookie = 'workertoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  localStorage.removeItem('workerToken');
};
