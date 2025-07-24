import { useState, useEffect } from 'react';

export const useOrganizationSelection = (defaultOrgName: string) => {
    const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('selectedOrgIds');
        if (stored) {
            setSelectedOrgIds(JSON.parse(stored));
        } else if (defaultOrgName) {
            setSelectedOrgIds([defaultOrgName]);
        }
    }, [defaultOrgName]);

    const updateSelection = (orgNames: string[]) => {
        setSelectedOrgIds(orgNames);
        localStorage.setItem('selectedOrgIds', JSON.stringify(orgNames));
    };

    return { selectedOrgIds, updateSelection };
};
