import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faCloudArrowDown, faRecycle } from '@fortawesome/free-solid-svg-icons';

const ImpactMetric = ({ icon, label, value, unit, color, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Animated counter effect
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center p-6 rounded-2xl"
      style={{ 
        background: `${color}10`,
        border: `2px solid ${color}30`
      }}
    >
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}20`, color: color }}
      >
        <FontAwesomeIcon icon={icon} className="text-2xl" />
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold mb-1" style={{ color: color }}>
          {displayValue.toLocaleString()}
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {unit}
        </div>
        <div className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
};

const ImpactMetrics = ({ co2Saved = 0, treesEquivalent = 0, wasteCollected = 0 }) => {
  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        🌍 Environmental Impact
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ImpactMetric
          icon={faCloudArrowDown}
          label="CO₂ Saved"
          value={co2Saved}
          unit="kg CO₂"
          color="#3B82F6"
          delay={0}
        />
        <ImpactMetric
          icon={faLeaf}
          label="Trees Equivalent"
          value={treesEquivalent}
          unit="trees/year"
          color="#10B981"
          delay={0.1}
        />
        <ImpactMetric
          icon={faRecycle}
          label="Waste Collected"
          value={wasteCollected}
          unit="kg"
          color="#F59E0B"
          delay={0.2}
        />
      </div>
    </div>
  );
};

export default ImpactMetrics;
