import React, { useState, useEffect, useMemo } from "react";
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
      const apiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

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

  // ---------- Atmospheric particles ----------
  // Visualizes air "thickness". Density and movement scale with AQI severity:
  // good air → few, slow, translucent dots; hazardous → many, faster, hazy.
  const Particles = ({ aqi, accent }) => {
    const profile = useMemo(() => {
      const a = aqi || 0;
      if (a <= 50)  return { count: 8,  speed: 9, blur: 0,   maxOp: 0.32, sway: 6  };
      if (a <= 100) return { count: 14, speed: 8, blur: 0,   maxOp: 0.38, sway: 10 };
      if (a <= 150) return { count: 22, speed: 7, blur: 0.5, maxOp: 0.45, sway: 14 };
      if (a <= 200) return { count: 32, speed: 6, blur: 1,   maxOp: 0.52, sway: 18 };
      if (a <= 300) return { count: 44, speed: 5, blur: 1.5, maxOp: 0.6,  sway: 22 };
      return         { count: 56, speed: 4, blur: 2,   maxOp: 0.7,  sway: 28 };
    }, [aqi]);

    // Stable seeds — regenerate only when severity bucket changes.
    const dots = useMemo(() => (
      Array.from({ length: profile.count }, (_, i) => ({
        id: i,
        size: 2 + Math.random() * 6,
        left: Math.random() * 100,
        delay: Math.random() * profile.speed,
        duration: profile.speed + Math.random() * profile.speed,
        op: profile.maxOp * (0.5 + Math.random() * 0.5),
        sway: (Math.random() * 2 - 1) * profile.sway,
      }))
    ), [profile]);

    return (
      <div
        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
        aria-hidden
      >
        {/* Soft accent haze — pulses gently */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 70%, ${accent}33 0%, transparent 60%)`,
            animation: 'aqi-haze-pulse 6s ease-in-out infinite',
            mixBlendMode: 'multiply',
          }}
        />
        {dots.map((d) => (
          <span
            key={d.id}
            className="absolute rounded-full"
            style={{
              width: d.size,
              height: d.size,
              left: `${d.left}%`,
              bottom: '-8%',
              backgroundColor: accent,
              filter: d.blur ? `blur(${profile.blur}px)` : undefined,
              ['--p-op']: d.op,
              ['--p-sway']: `${d.sway}px`,
              animation: `aqi-particle-rise ${d.duration}s ease-in-out ${d.delay}s infinite`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>
    );
  };

  // ---------- Neomorphic gauge ----------
  // Single hero ring, thick arc starting at 6 o'clock and sweeping clockwise
  // proportionally to the actual AQI (out of 500). Center disc shows raw AQI.
  const Gauge = ({ pct, displayValue, accent = '#f97316', aqi = 0 }) => {
    const size = 220;
    const stroke = 22;
    const cx = size / 2;
    const cy = size / 2;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const safe = Math.max(0, Math.min(100, pct || 0));
    const dash = (safe / 100) * circ;

    // Arc starts at 6 o'clock (rotate 90deg) and sweeps clockwise.
    // Knob angle from 12 o'clock, measured clockwise.
    const knobDeg = (180 + (safe / 100) * 360) % 360;
    const rad = (knobDeg * Math.PI) / 180;
    const knobX = cx + r * Math.sin(rad);
    const knobY = cy - r * Math.cos(rad);

    return (
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: size + 28,
          height: size + 28,
          background: '#f4f5f7',
          boxShadow:
            '10px 10px 24px rgba(20,36,138,0.10), -10px -10px 24px rgba(255,255,255,0.95), inset 1px 1px 2px rgba(255,255,255,0.6)',
        }}
      >
        {/* Animated air particles — density/blur scale with AQI severity */}
        <Particles aqi={aqi} accent={accent} />

        <svg width={size} height={size} className="relative">
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e6e8ec"
            strokeWidth={stroke}
          />
          {/* Progress arc — start at 6 o'clock, sweep clockwise */}
          <g transform={`rotate(90 ${cx} ${cy})`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={accent}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ - dash}`}
              style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </g>
          {/* Knob at arc terminus */}
          <circle
            cx={knobX}
            cy={knobY}
            r={stroke / 2 - 2}
            fill="#ffffff"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))' }}
          />
        </svg>

        {/* Raised center disc */}
        <div
          className="absolute rounded-full flex flex-col items-center justify-center"
          style={{
            width: size * 0.58,
            height: size * 0.58,
            background: '#ffffff',
            boxShadow:
              '0 10px 28px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
            zIndex: 2,
          }}
        >
          <span
            className="font-black tabular-nums leading-none tracking-tight"
            style={{ color: '#2b2b2b', fontSize: 38, fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {displayValue}
          </span>
          <span
            className="font-bold uppercase tracking-[0.2em] mt-1"
            style={{ color: '#8a8f99', fontSize: 9 }}
          >
            AQI
          </span>
        </div>
      </div>
    );
  };

  // Shared shell — clean neutral surface
  const Shell = ({ children, refreshDisabled }) => (
    <div className="card p-0 h-full flex flex-col overflow-hidden relative">
      <div className="relative z-10 flex-1 flex flex-col p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#fff5e6', color: '#f97316' }}
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-tertiary)' }}>
                Air Quality
              </p>
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {locationName !== 'Detecting location...' ? locationName.split(',')[0] : 'Locating…'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchLocationAndAQI}
            disabled={refreshDisabled}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              backgroundColor: 'var(--bg-hover)',
              color: '#f97316',
            }}
            title="Refresh"
          >
            <FontAwesomeIcon icon={faSyncAlt} className={`text-xs ${refreshDisabled ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Shell refreshDisabled>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
          <div
            className="animate-spin rounded-full h-9 w-9 border-2 border-t-transparent"
            style={{ borderColor: '#f97316', borderTopColor: 'transparent' }}
          />
          <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
            {locationName === 'Detecting location...' ? 'Locating you…' : 'Analyzing air…'}
          </p>
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
          <FontAwesomeIcon icon={faLocationArrow} className="text-2xl" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-xs max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
            {error || 'No data available'}
          </p>
          <button
            onClick={fetchLocationAndAQI}
            className="text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
            style={{ backgroundColor: '#f97316', color: '#fff' }}
          >
            <FontAwesomeIcon icon={faSyncAlt} className="text-[10px]" /> Try again
          </button>
        </div>
      </Shell>
    );
  }

  const { aqi, components } = data;
  const aqiInfo = getAQIColor(aqi);
  const arcPct = Math.min(100, ((aqi || 0) / 500) * 100);

  return (
    <Shell>
      {/* Central neomorphic gauge — arc reflects actual AQI / 500 */}
      <div className="flex-1 flex items-center justify-center py-2">
        <Gauge pct={arcPct} displayValue={aqi ?? '--'} accent={aqiInfo.hex} aqi={aqi} />
      </div>

      {/* Status + raw concentration */}
      <div className="flex flex-col items-center gap-1.5 mt-2">
        <span
          className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: `${aqiInfo.hex}1A`, color: aqiInfo.hex }}
        >
          {aqiInfo.label}
        </span>
        <span className="text-[10px] font-semibold tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
          PM2.5 {components?.pm2_5 ? Math.round(components.pm2_5) : '--'} µg/m³ · PM10 {components?.pm10 ? Math.round(components.pm10) : '--'} µg/m³
        </span>
      </div>
    </Shell>
  );
};

export default AQIWidget;
