// Check if user is authenticated by verifying token with backend
export const checkAuth = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/clients/verify-auth', {
      method: 'GET',
      credentials: 'include', // Important for sending cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { isAuthenticated: true, user: data.client };
    }
    return { isAuthenticated: false, user: null };
  } catch (error) {
    console.error('Auth check error:', error);
    return { isAuthenticated: false, user: null };
  }
};

// Get cookie by name (fallback method)
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Logout function
export const logout = async () => {
  try {
    await fetch('http://localhost:5000/api/clients/logout', {
      method: 'POST',
      credentials: 'include'
    });
    localStorage.removeItem('clientToken');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};
