import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VisitorTrendsChartProps {
  data: Array<{
    date: string;
    visitors: number;
  }>;
  height?: number;
}

export default function VisitorTrendsChart({ data, height = 300 }: VisitorTrendsChartProps) {
  // Process data similar to Analytics page
  const labels = data.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  });
  
  const chartData = data.map(item => item.visitors);

  const hasData = chartData.length > 0 && chartData.some(value => value > 0);

  if (!hasData) {
    return (
      <div className="w-full flex items-center justify-center text-gray-500 dark:text-gray-400" style={{ height: `${height}px` }}>
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm font-medium">No visitor activity in last 7 days</p>
          <p className="text-xs text-gray-400 mt-1">Data will appear here once visitors start using the system</p>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f3f4f6',
        bodyColor: '#93c5fd',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const date = new Date(data[dataIndex].date);
            return date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            });
          },
          label: function(context: any) {
            return `Visitors: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          },
          callback: function(value: any) {
            return Number.isInteger(value) ? value : '';
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  };

  const chartConfig = {
    labels,
    datasets: [{
      label: 'Visitors',
      data: chartData,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <Line data={chartConfig} options={chartOptions} />
    </div>
  );
}
