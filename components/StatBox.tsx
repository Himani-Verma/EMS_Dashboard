import React from 'react';

interface StatBoxProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  change?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatBox({ title, value, icon, color, change }: StatBoxProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          border: 'hover:border-blue-200'
        };
      case 'green':
        return {
          bg: 'bg-green-100',
          text: 'text-green-600',
          border: 'hover:border-green-200'
        };
      case 'orange':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-600',
          border: 'hover:border-orange-200'
        };
      case 'red':
        return {
          bg: 'bg-red-100',
          text: 'text-red-600',
          border: 'hover:border-red-200'
        };
      case 'purple':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-600',
          border: 'hover:border-purple-200'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          border: 'hover:border-gray-200'
        };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className={`bg-card border border-border rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 p-6 h-full group ${colorClasses.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${colorClasses.bg}`}>
            <span className={`text-xl ${colorClasses.text}`}>{icon}</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">{title}</h3>
            <p className="text-2xl font-bold text-foreground">{(value || 0).toLocaleString()}</p>
          </div>
        </div>
        
        {change && (
          <div className="flex flex-col items-end">
            <div className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all duration-200 ${
              change.isPositive 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {change.isPositive ? '↗' : '↘'} {Math.abs(change.value)}%
            </div>
            <span className="text-xs text-muted-foreground mt-1">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
