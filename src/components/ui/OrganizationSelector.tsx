import React, { useState } from 'react';

interface Props {
  organizations: string[];
  selectedOrgIds: string[];
  onChange: (selected: string[]) => void;
}

const OrganizationSelector: React.FC<Props> = ({ organizations, selectedOrgIds, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(prev => !prev);

  const handleCheckboxChange = (orgName: string) => {
    if (selectedOrgIds.includes(orgName)) {
      onChange(selectedOrgIds.filter(orgId => orgId !== orgName));
    } else {
      onChange([...selectedOrgIds, orgName]);
    }
  };

  const selectedNames = organizations.filter(org => selectedOrgIds.includes(org));

  return (
    <div className="relative w-[108px]">
      {/* Selector Button */}
      <div
        className="bg-[#001529] text-white text-sm h-[38px] px-4 py-2 rounded-[2px] flex items-center justify-between shadow-[0px_2px_0px_rgba(0,0,0,0.016)] cursor-pointer hover:bg-[#002244] min-w-[108px] max-w-[180px] whitespace-nowrap"
        onClick={toggleDropdown}
      >
        <span className="whitespace-nowrap">{selectedNames[0] || 'Select'}</span>
        {selectedNames.length > 1 && (
          <span className="text-[10px] opacity-70 ml-1">(+{selectedNames.length - 1})</span>
        )}
        <svg
          className="w-3 h-3 text-white ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-1 bg-white text-black text-sm rounded shadow-md py-2 z-10 w-48">
          {organizations.map((orgName, index) => (
            <label key={index} className="flex items-center px-4 py-1 hover:bg-gray-100">
              <input
                type="checkbox"
                checked={selectedOrgIds.includes(orgName)}
                onChange={() => handleCheckboxChange(orgName)}
                className="mr-2"
              />
              {orgName}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationSelector;
