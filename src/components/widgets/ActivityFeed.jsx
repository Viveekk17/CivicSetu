import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faWater, faTree, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const ActivityFeed = () => {
  const activities = [
    { id: 1, type: 'cleanup', title: 'Beach Cleanup', time: '2 mins ago', impact: '+50 Credits', icon: faTrash, color: 'text-blue-500' },
    { id: 2, type: 'plant', title: 'Planted Oak Tree', time: '1 hour ago', impact: '-500 Credits', icon: faTree, color: 'text-green-500' },
    { id: 3, type: 'water', title: 'Rainwater Harvesting', time: '5 hours ago', impact: '+30 Credits', icon: faWater, color: 'text-cyan-500' },
  ];

  return (
    <div className="card p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
        <button className="text-sm text-primary font-medium hover:underline" style={{ color: 'var(--primary)' }}>View All</button>
      </div>

      <div className="space-y-6">
        {activities.map((item, index) => (
          <div key={item.id} className="flex gap-4 relative">
            {/* Timeline connector */}
            {index !== activities.length - 1 && (
              <div className="absolute left-5 top-10 bottom-[-1.5rem] w-0.5 bg-gray-100 dark:bg-gray-700"></div>
            )}
            
            <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 ${item.color}`}>
              <FontAwesomeIcon icon={item.icon} />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                <span className={`text-xs font-bold ${item.impact.startsWith('+') ? 'text-green-500' : 'text-orange-500'}`}>
                  {item.impact}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
