import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  colorClass?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, colorClass = 'text-blue-400', className }) => {
  return (
    <div className={`bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-6 ${className}`}>
      <div className={`p-4 bg-gray-900/50 rounded-lg ${colorClass}`}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;