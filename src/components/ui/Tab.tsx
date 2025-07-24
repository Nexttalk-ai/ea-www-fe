import React from 'react';

interface TabProps {
  label: string;
  isActive: boolean;
  tabActiveColor?: string;
  onClick: () => void;
  className?: string;
}

const Tab: React.FC<TabProps> = ({ label, isActive, tabActiveColor = 'bg-primary', onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 text-sm font-medium
        transition-colors duration-200
        flex flex-1 justify-center items-center
        ${isActive 
          ? `${tabActiveColor} text-white` 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
        ${className}
      `}
    >
      {label}
    </button>
  );
};

export default Tab;