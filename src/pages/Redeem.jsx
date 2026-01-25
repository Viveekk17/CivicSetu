import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTree, faLayerGroup, faPaw, faGlobeAmericas, faCoins } from '@fortawesome/free-solid-svg-icons';

const Redeem = () => {
  const [activeTab, setActiveTab] = useState('trees');

  const tabs = [
    { id: 'trees', label: 'Trees', icon: faTree },
    { id: 'bundles', label: 'Bundles', icon: faLayerGroup },
    { id: 'wildlife', label: 'Wildlife', icon: faPaw },
    { id: 'offset', label: 'Carbon Offset', icon: faGlobeAmericas },
  ];

  const items = [
    { id: 1, category: 'trees', name: 'Oak Tree', cost: 500, description: 'Supports local biodiversity.', color: 'bg-green-100 text-green-600' },
    { id: 2, category: 'trees', name: 'Mangrove', cost: 1800, description: 'Coastal protection expert.', color: 'bg-teal-100 text-teal-600' },
    { id: 3, category: 'bundles', name: 'Forest Package', cost: 2000, description: '5 native trees bundle.', color: 'bg-emerald-100 text-emerald-600' },
    { id: 4, category: 'bundles', name: 'Urban Forest', cost: 3500, description: '10 trees for city parks.', color: 'bg-lime-100 text-lime-600' },
    { id: 5, category: 'wildlife', name: 'Bee Habitat', cost: 1200, description: 'Support pollinators.', color: 'bg-yellow-100 text-yellow-600' },
    { id: 6, category: 'offset', name: '1 Tonne CO2', cost: 1000, description: 'Certified offset credit.', color: 'bg-blue-100 text-blue-600' },
  ];

  const filteredItems = items.filter(item => item.category === activeTab);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center bg-emerald-900 text-white p-8 rounded-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Plant Trees & Restore Nature</h1>
          <p className="opacity-80 max-w-lg">Use your hard-earned credits to make a real-world impact. Every tree planted is tracked on the blockchain.</p>
        </div>
        <div className="mt-4 md:mt-0 relative z-10 text-right">
          <p className="text-sm opacity-70">Available Balance</p>
          <div className="text-4xl font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faCoins} className="text-yellow-400" />
            2,450
          </div>
        </div>
        {/* Decor */}
        <FontAwesomeIcon icon={faTree} className="absolute -bottom-10 -right-10 text-9xl opacity-10" />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-lg transform -translate-y-1' 
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 flex flex-col h-full hover:shadow-xl transition-shadow"
          >
            <div className={`h-40 rounded-xl mb-4 flex items-center justify-center text-6xl ${item.color}`}>
              <FontAwesomeIcon icon={faTree} />
            </div>
            <h3 className="text-xl font-bold mb-1">{item.name}</h3>
            <p className="text-gray-500 text-sm mb-4 flex-1">{item.description}</p>
            <div className="flex items-center justify-between mt-auto">
              <span className="font-bold text-lg flex items-center gap-1">
                <FontAwesomeIcon icon={faCoins} className="text-yellow-500" />
                {item.cost}
              </span>
              <button className="btn btn-primary px-4 py-2 text-sm">
                Redeem
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Redeem;
