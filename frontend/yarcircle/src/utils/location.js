// 📍 Location Utility Functions

/**
 * Request user's current location
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser. Please use a modern browser.'));
      return;
    }

    // Check if running on localhost or HTTPS
    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext) {
      console.warn('⚠️ Geolocation requires HTTPS or localhost');
      // For development, we'll still try but warn the user
    }

    console.log('📍 Requesting geolocation permission...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Location obtained successfully:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location permission denied. Please allow location access in your browser settings.';
            console.log('💡 To fix: Click the location icon in your browser address bar and allow location access.');
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location information is unavailable. Please check your device GPS settings.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = `Location error: ${error.message || 'Unknown error'}. Make sure location services are enabled.`;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: false, // Changed to false for better compatibility
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param {number} distance in kilometers
 * @returns {string} Formatted distance
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  }
  return `${distance}km away`;
};

/**
 * Check if location permission is granted
 * @returns {Promise<boolean>}
 */
export const checkLocationPermission = async () => {
  if (!navigator.permissions) {
    return false;
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};
