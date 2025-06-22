import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const NoParticipantsEmpty: React.FC<EmptyStateProps> = ({
  title = "No participants yet",
  description = "Waiting for users to join the debate...",
  icon,
  action,
  className = ""
}) => {
  return (
    <div className={`text-center py-8 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        {description}
      </p>
      {action && action}
    </div>
  );
};

export const NoDebatesEmpty: React.FC<EmptyStateProps> = ({
  title = "No debates available",
  description = "Start a new debate or check back later for new topics.",
  icon,
  action,
  className = ""
}) => {
  return (
    <div className={`text-center py-16 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {description}
      </p>
      {action && action}
    </div>
  );
};
