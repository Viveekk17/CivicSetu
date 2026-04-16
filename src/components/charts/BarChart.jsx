import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ data, labels, title, color = '#14248a' }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Submissions',
        data,
        backgroundColor: `${color}30`,
        borderColor: color,
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 40,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#5a5760',
          stepSize: 1,
          font: {
            size: 12,
          },
        },
      },
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#5a5760',
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default BarChart;
