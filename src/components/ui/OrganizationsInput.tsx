import React, { useState, useRef } from 'react';
import { Organization } from '../../services/organizationService';

interface OrganizationsInputProps {
    organizations: Organization[];
    selectedOrganizations: string[];
    onOrganizationsChange: (organizations: string[]) => void;
    disabled?: boolean;
    className?: string;
}

export const OrganizationsInput: React.FC<OrganizationsInputProps> = ({
    organizations,
    selectedOrganizations,
    onOrganizationsChange,
    disabled = false,
    className = ''
}) => {
    const [showOrgSuggestions, setShowOrgSuggestions] = useState(false);
    const [newOrg, setNewOrg] = useState('');
    const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
    const orgDropdownRef = useRef<HTMLDivElement>(null);

    const handleOrgInputChange = (value: string) => {
        setNewOrg(value);
        const filtered = organizations
            .filter(org => {
                const isNotSelected = !selectedOrganizations?.includes(org.name);
                const matchesSearch = value === '' || org.name.toLowerCase().includes(value.toLowerCase());
                return isNotSelected && matchesSearch;
            });
        setFilteredOrgs(filtered);
    };

    const handleOrgSelect = (org: Organization) => {
        onOrganizationsChange([...(selectedOrganizations || []), org.name]);
        setNewOrg('');
        setShowOrgSuggestions(false);
        setFilteredOrgs(prev => prev.filter(o => o.id !== org.id));
    };

    const handleRemoveOrg = (orgName: string) => {
        onOrganizationsChange(selectedOrganizations?.filter(name => name !== orgName) || []);
        const removedOrg = organizations.find(org => org.name === orgName);
        if (removedOrg && (newOrg === '' || removedOrg.name.toLowerCase().includes(newOrg.toLowerCase()))) {
            setFilteredOrgs(prev => [...prev, removedOrg]);
        }
    };

    const handleOrgInputFocus = () => {
        if (!disabled) {
            const availableOrgs = organizations.filter(org => !selectedOrganizations?.includes(org.name));
            setFilteredOrgs(availableOrgs);
            setShowOrgSuggestions(true);
        }
    };

    if (disabled) {
        return (
            <div className={`p-2 border rounded-md bg-[#F5F5F5] min-h-[42px] ${className}`}>
                <span className="text-[#262626] text-[14px] leading-[22px] font-semibold">
                    {selectedOrganizations?.join(', ') || 'None'}
                </span>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`} ref={orgDropdownRef}>
            <div className="flex flex-wrap items-center gap-1 p-2 border rounded-md bg-white min-h-[42px]">
                {selectedOrganizations?.map(orgName => (
                    <div key={orgName} className="flex items-center bg-gray-100 rounded-md px-2 py-1 text-sm">
                        <span className="text-[#262626] text-[14px] leading-[22px] font-semibold">{orgName}</span>
                        <button
                            onClick={() => handleRemoveOrg(orgName)}
                            className="ml-2 text-gray-500 hover:text-red-500"
                            aria-label={`Remove ${orgName}`}
                        >
                            ×
                        </button>
                    </div>
                ))}
                <input
                    type="text"
                    className="flex-1 min-w-[100px] outline-none text-[#262626] text-[14px] leading-[22px] font-semibold"
                    placeholder={selectedOrganizations?.length === 0 ? "Type to search organizations" : ""}
                    value={newOrg}
                    onChange={(e) => handleOrgInputChange(e.target.value)}
                    onFocus={handleOrgInputFocus}
                    aria-labelledby="org-label"
                />
            </div>
            {showOrgSuggestions && filteredOrgs.length > 0 && (
                <div 
                    role="listbox"
                    aria-labelledby="org-label"
                    className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg"
                >
                    {filteredOrgs.map(org => (
                        <div
                            key={org.id}
                            role="option"
                            aria-selected={selectedOrganizations?.includes(org.name)}
                            className="px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-[#262626] text-[14px] leading-[22px] font-semibold"
                            onClick={() => handleOrgSelect(org)}
                        >
                            {org.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}; 