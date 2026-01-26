// Geolocation utility functions

export const isGeolocationAvailable = () => {
  return 'geolocation' in navigator;
};

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

export const reverseGeocode = async (lat, lng) => {
  try {
    // Using OpenStreetMap Nominatim (free, no API key needed)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    // Debug: Log raw API response
    console.log('📍 Location Coordinates:', data.lat," ", data.lon);
    
    // Extract readable location
    const address = data.address || {};
    
    const locationParts = [];
    
    // 1. Specific (Street/Building/Neighborhood)
    const specific = address.building || address.road || address.neighbourhood || address.residential || address.hamlet;
    if (specific) locationParts.push(specific);
    
    // 2. Locality (Suburb/Village/Town)
    // "Alandi", "Lohegaon", etc usually appear here
    const locality = address.suburb || address.village || address.town;
    if (locality) locationParts.push(locality);

    // 3. City/District (Pune)
    // If we have a locality, we also want the city/district context
    const cityOrDistrict = address.city || address.city_district || address.district || address.county || address.state_district;
    
    // Avoid duplicating if locality name is same as city (rare but possible, e.g. "Pune" suburb in "Pune" city)
    if (cityOrDistrict && cityOrDistrict !== locality) {
      locationParts.push(cityOrDistrict);
    }
    
    // 4. State
    if (address.state) locationParts.push(address.state);
    
    // Filter distinct parts roughly
    const distinctParts = [...new Set(locationParts)];
    
    return distinctParts.join(', ') || data.display_name;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; // Fallback to coordinates
  }
};
