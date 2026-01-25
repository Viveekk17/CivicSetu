import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock, faTimesCircle, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';

const Submissions = () => {
  const submissions = [
    { id: 1, type: 'Garbage Cleanup', location: 'Central Park', date: '2023-10-15', status: 'verified', credits: 50, img: 'https://via.placeholder.com/150' },
    { id: 2, type: 'Water Conservation', location: 'Home', date: '2023-10-14', status: 'pending', credits: 30, img: 'https://via.placeholder.com/150' },
    { id: 3, type: 'Tree Planting', location: 'City Garden', date: '2023-10-10', status: 'verified', credits: 100, img: 'https://via.placeholder.com/150' },
    { id: 4, type: 'Methane Reduction', location: 'Farm A', date: '2023-10-09', status: 'rejected', credits: 0, img: 'https://via.placeholder.com/150' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'verified': return 'text-green-500 bg-green-100';
      case 'pending': return 'text-yellow-500 bg-yellow-100';
      case 'rejected': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'verified': return faCheckCircle;
      case 'pending': return faClock;
      case 'rejected': return faTimesCircle;
      default: return faClock;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">My Submissions</h1>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-500 w-full" 
            />
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-600">
            <FontAwesomeIcon icon={faFilter} />
            Filter
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Activity</th>
                <th className="p-4 font-semibold text-gray-600">Date</th>
                <th className="p-4 font-semibold text-gray-600">Location</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Credits</th>
                <th className="p-4 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0 overflow-hidden">
                        {/* Placeholder for image */}
                        <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-500 font-bold">
                          {item.type[0]}
                        </div>
                      </div>
                      <span className="font-medium">{item.type}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">{item.date}</td>
                  <td className="p-4 text-gray-500">{item.location}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                      <FontAwesomeIcon icon={getStatusIcon(item.status)} />
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-700">+{item.credits}</td>
                  <td className="p-4">
                    <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Submissions;
