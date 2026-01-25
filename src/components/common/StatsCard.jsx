import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const StatsCard = ({ title, value, icon, color, trend }) => {
  return (
    <div className="card p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</h3>
        </div>
        <div 
          className="p-3 rounded-xl bg-opacity-20"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          <FontAwesomeIcon icon={icon} className="text-xl" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-sm z-10">
          <span className={`font-bold ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-gray-400">vs last month</span>
        </div>
      )}

      {/* Decorative Blob */}
      <div 
        className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500 ease-in-out"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

export default StatsCard;
