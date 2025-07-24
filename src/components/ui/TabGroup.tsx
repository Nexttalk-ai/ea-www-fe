import React from 'react';
import Tab from './Tab';

interface TabItem {
  id: string;
  label: string;
}

interface TabGroupProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const TabGroup: React.FC<TabGroupProps> = ({ tabs, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`flex overflow-hidden rounded-t-lg border border-gray-200 ${className}`}>
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  );
};

export default TabGroup;