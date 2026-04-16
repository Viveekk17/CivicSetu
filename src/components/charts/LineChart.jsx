import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = ({ data, labels, title, color = '#998fc7' }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
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
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} credits`;
          }
        }
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
          autoSkip: true,
          maxTicksLimit: 12, // Limit to ~12 labels for readability
        },
      },
    },
  };

  return (
    <div className="h-full">
      {title && (
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <div style={{ height: title ? '300px' : '100%' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default LineChart;
