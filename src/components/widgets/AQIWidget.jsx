import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faSyncAlt,
  faLocationArrow,
} from "@fortawesome/free-solid-svg-icons";

const AQIWidget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState("Detecting location...");

  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

  useEffect(() => {
    fetchLocationAndAQI();
  }, []);

  // EPA AQI Breakpoints based on the provided images
  const AQI_BREAKPOINTS = {
    pm25: [
      // PM2.5 (24-hr avg) in µg/m³
      { aqi_low: 0, aqi_high: 50, conc_low: 0.0, conc_high: 12.0 },
      { aqi_low: 51, aqi_high: 100, conc_low: 12.1, conc_high: 35.4 },
      { aqi_low: 101, aqi_high: 150, conc_low: 35.5, conc_high: 55.4 },
      { aqi_low: 151, aqi_high: 200, conc_low: 55.5, conc_high: 150.4 },
      { aqi_low: 201, aqi_high: 300, conc_low: 150.5, conc_high: 250.4 },
      { aqi_low: 301, aqi_high: 400, conc_low: 250.5, conc_high: 350.4 },
      { aqi_low: 401, aqi_high: 500, conc_low: 350.5, conc_high: 500.4 },
    ],
    pm10: [
      // PM10 (24-hr avg) in µg/m³
      { aqi_low: 0, aqi_high: 50, conc_low: 0, conc_high: 54 },
      { aqi_low: 51, aqi_high: 100, conc_low: 55, conc_high: 154 },
      { aqi_low: 101, aqi_high: 150, conc_low: 155, conc_high: 254 },
      { aqi_low: 151, aqi_high: 200, conc_low: 255, conc_high: 354 },
      { aqi_low: 201, aqi_high: 300, conc_low: 355, conc_high: 424 },
      { aqi_low: 301, aqi_high: 400, conc_low: 425, conc_high: 504 },
      { aqi_low: 401, aqi_high: 500, conc_low: 505, conc_high: 604 },
    ],
    o3: [
      { aqi_low: 0, aqi_high: 50, conc_low: 0, conc_high: 0 }, // Not defined by EPA
      { aqi_low: 51, aqi_high: 100, conc_low: 0, conc_high: 0 }, // Not defined
      { aqi_low: 101, aqi_high: 150, conc_low: 125, conc_high: 164 },
      { aqi_low: 151, aqi_high: 200, conc_low: 165, conc_high: 204 },
      { aqi_low: 201, aqi_high: 300, conc_low: 205, conc_high: 404 },
      { aqi_low: 301, aqi_high: 400, conc_low: 405, conc_high: 504 },
      { aqi_low: 401, aqi_high: 500, conc_low: 505, conc_high: 604 },
    ],
    co: [
      // CO (8-hr avg) in ppm
      { aqi_low: 0, aqi_high: 50, conc_low: 0.0, conc_high: 4.4 },
      { aqi_low: 51, aqi_high: 100, conc_low: 4.5, conc_high: 9.4 },
      { aqi_low: 101, aqi_high: 150, conc_low: 9.5, conc_high: 12.4 },
      { aqi_low: 151, aqi_high: 200, conc_low: 12.5, conc_high: 15.4 },
      { aqi_low: 201, aqi_high: 300, conc_low: 15.5, conc_high: 30.4 },
      { aqi_low: 301, aqi_high: 400, conc_low: 30.5, conc_high: 40.4 },
      { aqi_low: 401, aqi_high: 500, conc_low: 40.5, conc_high: 50.4 },
    ],
    so2: [
      // SO2 (1-hr avg) in ppb
      { aqi_low: 0, aqi_high: 50, conc_low: 0, conc_high: 35 },
      { aqi_low: 51, aqi_high: 100, conc_low: 36, conc_high: 75 },
      { aqi_low: 101, aqi_high: 150, conc_low: 76, conc_high: 185 },
      { aqi_low: 151, aqi_high: 200, conc_low: 186, conc_high: 304 },
      { aqi_low: 201, aqi_high: 300, conc_low: 305, conc_high: 604 },
      { aqi_low: 301, aqi_high: 400, conc_low: 605, conc_high: 804 },
      { aqi_low: 401, aqi_high: 500, conc_low: 805, conc_high: 1004 },
    ],
    no2: [
      // NO2 (1-hr avg) in ppb
      { aqi_low: 0, aqi_high: 50, conc_low: 0, conc_high: 53 },
      { aqi_low: 51, aqi_high: 100, conc_low: 54, conc_high: 100 },
      { aqi_low: 101, aqi_high: 150, conc_low: 101, conc_high: 360 },
      { aqi_low: 151, aqi_high: 200, conc_low: 361, conc_high: 649 },
      { aqi_low: 201, aqi_high: 300, conc_low: 650, conc_high: 1249 },
      { aqi_low: 301, aqi_high: 400, conc_low: 1250, conc_high: 1649 },
      { aqi_low: 401, aqi_high: 500, conc_low: 1650, conc_high: 2049 },
    ],
  };

  // Linear Interpolation Formula: I = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
  const calculateAQI = (concentration, breakpoints) => {
    if (concentration === null || concentration === undefined) return null;

    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i];
      if (concentration >= bp.conc_low && concentration <= bp.conc_high) {
        const aqi =
          ((bp.aqi_high - bp.aqi_low) / (bp.conc_high - bp.conc_low)) *
            (concentration - bp.conc_low) +
          bp.aqi_low;
        return Math.round(aqi);
      }
    }

    // If concentration is beyond the highest breakpoint
    if (concentration > breakpoints[breakpoints.length - 1].conc_high) {
      return 500; // Max AQI
    }

    return 0;
  };

  const fetchLocationAndAQI = () => {
    setLoading(true);
    setError(null);
    setLocationName("Detecting location...");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchData(latitude, longitude);
      },
      (err) => {
        console.error("Geolocation Error:", err);
        setError(
          "Unable to retrieve your location. Please allow location access.",
        );
        setLoading(false);
      },
    );
  };

  const fetchData = async (lat, lon) => {
    try {
      // 1. Get Location Details
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const geoResponse = await axios.get(geoUrl);

      const city = geoResponse.data.city || geoResponse.data.locality;
      const country = geoResponse.data.countryName;

      setLocationName(`${city || "Unknown"}, ${country || ""}`);

      // 2. Get Air Pollution Data from OpenWeatherMap
      const apiUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

      console.log("Fetching from OpenWeatherMap:", apiUrl);

      const response = await axios.get(apiUrl);

      console.log("OpenWeatherMap Response:", response.data);

      if (
        response.data &&
        response.data.list &&
        response.data.list.length > 0
      ) {
        const pollutionData = response.data.list[0];
        const components = pollutionData.components;

        // Calculate individual AQI for each pollutant
        // Note: OpenWeatherMap returns CO in μg/m³, need to convert to ppm (CO ppm = CO μg/m³ / 1145)
        const aqi_pm25 = calculateAQI(components.pm2_5, AQI_BREAKPOINTS.pm25);
        const aqi_pm10 = calculateAQI(components.pm10, AQI_BREAKPOINTS.pm10);
        const aqi_o3 = calculateAQI(components.o3, AQI_BREAKPOINTS.o3); // O3 already in μg/m³, convert to ppb (O3 ppb ≈ O3 μg/m³ / 2)
        const aqi_co = calculateAQI(components.co / 1145, AQI_BREAKPOINTS.co); // Convert CO from μg/m³ to ppm
        const aqi_so2 = calculateAQI(components.so2, AQI_BREAKPOINTS.so2); // SO2 ppb ≈ SO2 μg/m³ / 2.62
        const aqi_no2 = calculateAQI(components.no2, AQI_BREAKPOINTS.no2); // NO2 ppb ≈ NO2 μg/m³ / 1.88

        // Final AQI is the maximum of all individual AQIs
        const aqis = [
          aqi_pm25,
          aqi_pm10,
          aqi_o3,
          aqi_co,
          aqi_so2,
          aqi_no2,
        ].filter((v) => v !== null);

        console.log("aqis for each component: ", aqis);
        const finalAQI = aqis.length > 0 ? Math.max(...aqis) : null;

        setData({
          aqi: finalAQI,
          components,
          individual_aqis: {
            pm25: aqi_pm25,
            pm10: aqi_pm10,
            o3: aqi_o3,
            co: aqi_co,
            so2: aqi_so2,
            no2: aqi_no2,
          },
        });
      } else {
        setError("No air quality data available for this location.");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.response) {
        console.error("API Error Data:", err.response.data);
        if (err.response.status === 401) {
          setError("Invalid OpenWeatherMap API Key.");
        } else {
          setError("Failed to fetch air quality data.");
        }
      } else {
        setError("Network error. Check connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine color based on AQI value (US EPA Standard)
  const getAQIColor = (aqi) => {
    if (aqi <= 50) return { hex: "#009966", label: "Good" };
    if (aqi <= 100) return { hex: "#ffde33", label: "Moderate" };
    if (aqi <= 150) return { hex: "#ff9933", label: "Unhealthy for SG" };
    if (aqi <= 200) return { hex: "#cc0033", label: "Unhealthy" };
    if (aqi <= 300) return { hex: "#660099", label: "Very Unhealthy" };
    return { hex: "#7e0023", label: "Hazardous" };
  };

  if (loading) {
    return (
      <div className="card p-8 min-h-[300px] flex flex-col items-center justify-center bg-gray-900 text-white gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-sm text-gray-400 animate-pulse">
          {locationName === "Detecting location..."
            ? "Locating you..."
            : "Analyzing air quality..."}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 min-h-[300px] flex flex-col items-center justify-center bg-gray-900 text-white text-center">
        <FontAwesomeIcon
          icon={faLocationArrow}
          className="text-gray-600 text-4xl mb-4"
        />
        <p className="text-red-400 mb-6 max-w-xs">
          {error || "No data available"}
        </p>
        <button
          onClick={fetchLocationAndAQI}
          className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all flex items-center gap-2 font-medium"
        >
          <FontAwesomeIcon icon={faSyncAlt} /> Try Again
        </button>
      </div>
    );
  }

  const { aqi, components } = data;
  const aqiInfo = getAQIColor(aqi);



  /* Theme-aware styles */
  const cardBg = "var(--bg-surface)";
  const textColor = "var(--text-primary)";
  const subTextColor = "var(--text-secondary)";

  // Extract city/locality only
  const cityOnly = locationName.split(',')[0];

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[220px]">
      {/* Large Circle Container */}
      <div 
        className="relative w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-2xl"
        style={{
          background: `conic-gradient(from 180deg, 
            #22c55e 0deg, 
            #eab308 60deg, 
            #f97316 120deg, 
            #ef4444 180deg, 
            #c026d3 240deg, 
            #7e0023 300deg, 
            #22c55e 360deg
          )`,
          padding: '3px' // Thicker border for better visibility
        }}
      >
        {/* Inner Circle (The actual card content) */}
        <div 
          className="w-full h-full rounded-full flex flex-col items-center justify-center relative z-10 px-4"
          style={{ 
            backgroundColor: cardBg,
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' 
          }}
        >
          {/* 1. Location (City Only) */}
          <div className="flex items-center gap-1 mb-2">
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              className="text-[10px]"
              style={{ color: subTextColor }}
            />
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: subTextColor }}>
              {cityOnly !== "Detecting location..." ? cityOnly : "Locating..."}
            </span>
          </div>

          {/* 2. PM2.5 and PM10 */}
          <div className="flex gap-3 mb-1">
            <div className="text-center">
              <div className="text-[9px] font-bold uppercase tracking-wider opacity-60">PM2.5</div>
              <div className="text-sm font-bold">
                {components?.pm2_5 ? Math.round(components.pm2_5) : '--'}
              </div>
            </div>
            <div className="w-px bg-gray-300 dark:bg-gray-700 h-6 self-center"></div>
            <div className="text-center">
              <div className="text-[9px] font-bold uppercase tracking-wider opacity-60">PM10</div>
              <div className="text-sm font-bold">
                {components?.pm10 ? Math.round(components.pm10) : '--'}
              </div>
            </div>
          </div>

          {/* 3. AQI Value */}
          <div className="text-center relative my-1 leading-none">
            <span 
              className="text-4xl font-black block tracking-tighter"
              style={{ 
                background: `linear-gradient(135deg, ${aqiInfo.hex}, ${aqiInfo.hex}cc)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
            >
              {aqi !== null ? aqi : '--'}
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] opacity-50 font-semibold block mt-1">AQI</span>
          </div>

          {/* 4. Condition */}
          <div 
            className="mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
            style={{ 
              backgroundColor: `${aqiInfo.hex}15`, 
              color: aqiInfo.hex,
            }}
          >
            {aqiInfo.label}
          </div>

          {/* 5. Refresh Button */}
          <button
            onClick={fetchLocationAndAQI}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110 active:scale-95"
            style={{ color: subTextColor, opacity: 0.7 }}
            title="Refresh Data"
          >
            <FontAwesomeIcon icon={faSyncAlt} className="text-[12px]" />
          </button>
        </div>
        
        {/* Decorative Glow based on AQI color - behind circle */}
        <div 
          className="absolute inset-0 rounded-full opacity-30 blur-2xl z-0 transition-colors duration-500"
          style={{ backgroundColor: aqiInfo.hex }}
        ></div>
      </div>
    </div>
  );
};

export default AQIWidget;
