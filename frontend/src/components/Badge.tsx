import React from 'react';

interface BadgeProps {
  count?: number;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export const CountBadge: React.FC<BadgeProps> = ({ 
  count = 0, 
  variant = 'primary', 
  size = 'sm',
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full';
  
  const variantClasses = {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-500 text-white'
  };
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs min-w-[16px] h-4',
    sm: 'px-2 py-1 text-xs min-w-[20px] h-5',
    md: 'px-2.5 py-1 text-sm min-w-[24px] h-6',
    lg: 'px-3 py-1.5 text-sm min-w-[28px] h-7'
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {count}
    </span>
  );
};

export const Badge: React.FC<BadgeProps> = ({ 
  children,
  variant = 'primary', 
  size = 'sm',
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full';
  
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    success: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    error: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
  };
  
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-sm',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1 text-base'
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showText = false, 
  animated = false,
  className = '' 
}) => {
  const statusConfig = {
    online: { color: 'bg-green-500', text: 'Online' },
    offline: { color: 'bg-gray-500', text: 'Offline' },
    away: { color: 'bg-yellow-500', text: 'Away' },
    busy: { color: 'bg-red-500', text: 'Busy' }
  };

  const config = statusConfig[status];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${config.color} ${animated ? 'animate-pulse' : ''}`}
      />
      {showText && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {config.text}
        </span>
      )}
    </div>
  );
};
