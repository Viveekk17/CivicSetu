import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWind, faMapMarkedAlt, faTemperatureHigh, faSmog } from '@fortawesome/free-solid-svg-icons';

const AQIWidget = () => {
  // Mock Data
  const aqi = 42;
  const status = 'Good';
  const statusColor = '#10B981'; // Green

  return (
    <div className="card p-6 relative overflow-hidden text-white"
         style={{ background: 'var(--gradient-primary)' }}>
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <FontAwesomeIcon icon={faWind} size="6x" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-semibold opacity-90">Air Quality Index</h3>
            <p className="text-sm opacity-75">New York, USA</p>
          </div>
          <button className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm hover:bg-opacity-30 transition-all backdrop-blur-sm">
            <FontAwesomeIcon icon={faMapMarkedAlt} className="mr-2" />
            Heatmap
          </button>
        </div>

        <div className="flex items-end gap-4 mb-6">
          <span className="text-5xl font-bold">{aqi}</span>
          <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
            {status}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-10 p-3 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1 opacity-75 text-xs">
              <FontAwesomeIcon icon={faSmog} />
              PM2.5
            </div>
            <span className="font-bold">12</span> <span className="text-xs">µg/m³</span>
          </div>
          <div className="bg-white bg-opacity-10 p-3 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1 opacity-75 text-xs">
              <FontAwesomeIcon icon={faTemperatureHigh} />
              PM10
            </div>
            <span className="font-bold">28</span> <span className="text-xs">µg/m³</span>
          </div>
          <div className="bg-white bg-opacity-10 p-3 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1 opacity-75 text-xs">
              <FontAwesomeIcon icon={faWind} />
              O3
            </div>
            <span className="font-bold">45</span> <span className="text-xs">ppb</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AQIWidget;
