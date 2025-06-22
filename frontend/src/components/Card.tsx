import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

interface StatsCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md', 
  hover = false 
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow duration-200' : '';
  
  return (
    <div className={`${baseClasses} ${paddingClasses[padding]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

export const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  label,
  value,
  color = 'text-primary-600',
  trend,
  className = ''
}) => {
  return (
    <Card className={`text-center p-6 hover:shadow-lg transition-shadow ${className}`}>
      <Icon className={`w-8 h-8 mx-auto mb-3 ${color}`} />
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {typeof value === 'number' && value > 1000 
          ? `${(value / 1000).toFixed(1)}k` 
          : value
        }
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</div>
      {trend && (
        <div className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
        </div>
      )}
    </Card>
  );
};
