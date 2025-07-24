import { useState } from 'react';
import type { ColDef } from "ag-grid-community";
import BaseTable from './BaseTable';
import Input from '../ui/Input';

interface Role {
    role: string;
    manageUsers: boolean;
    manageOrganizations: boolean;
    manageCreatives: boolean;
    manageAdvertising: boolean;
}

const CustomCheckboxRenderer = (props: any) => {
    const isChecked = props.value;
    
    return (
        <div className="flex items-center justify-center h-full">
            <div className={`
                w-5 h-5 rounded border-2 flex items-center justify-center
                ${isChecked ? 'bg-primary border-primary' : 'border-gray-300'}
            `}>
                {isChecked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
        </div>
    );
};

const mockRoles: Role[] = [
    {
        role: 'Superadmin',
        manageUsers: true,
        manageOrganizations: true,
        manageCreatives: true,
        manageAdvertising: true
    },
    {
        role: 'Admin',
        manageUsers: true,
        manageOrganizations: true,
        manageCreatives: true,
        manageAdvertising: false
    },
    {
        role: 'User',
        manageUsers: false,
        manageOrganizations: false,
        manageCreatives: false,
        manageAdvertising: false
    },
    {
        role: 'Creatives Manager',
        manageUsers: false,
        manageOrganizations: false,
        manageCreatives: true,
        manageAdvertising: false
    }
];

const RolesTable = () => {
    const [rowData, setRowData] = useState<Role[]>(mockRoles);

    const columnDefs: ColDef[] = [
        { 
            field: 'role', 
            headerName: 'Role', 
            sortable: true, 
            filter: true,
            flex: 1,
            minWidth: 150
        },
        { 
            field: 'manageUsers', 
            headerName: 'Manage Users', 
            sortable: true, 
            filter: true,
            cellRenderer: CustomCheckboxRenderer,
            flex: 1,
            minWidth: 150
        },
        { 
            field: 'manageOrganizations', 
            headerName: 'Manage Organizations', 
            sortable: true, 
            filter: true,
            cellRenderer: CustomCheckboxRenderer,
            flex: 1,
            minWidth: 150
        },
        { 
            field: 'manageCreatives', 
            headerName: 'Manage Creatives', 
            sortable: true, 
            filter: true,
            cellRenderer: CustomCheckboxRenderer,
            flex: 1,
            minWidth: 150
        },
        { 
            field: 'manageAdvertising', 
            headerName: 'Manage Advertising', 
            sortable: true, 
            filter: true,
            cellRenderer: CustomCheckboxRenderer,
            flex: 1,
            minWidth: 150
        }
    ];

    const defaultColDef = {
        resizable: true,
        sortable: true,
        filter: true,
        wrapText: true,
        autoHeight: true,
        cellClass: 'cell-wrap-text'
    };

    const modalContent = (formData: Partial<Role>, handleInputChange: (field: keyof Role, value: any) => void) => (
        <div className="flex flex-col gap-4">
            <Input
                type="text"
                label="Role Name"
                placeholder="Enter role name"
                value={formData.role || ''}
                onChange={(e) => handleInputChange('role', e.target.value)}
            />
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Permissions</label>
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.manageUsers}
                            onChange={(e) => handleInputChange('manageUsers', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        Manage Users
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.manageOrganizations}
                            onChange={(e) => handleInputChange('manageOrganizations', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        Manage Organizations
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.manageCreatives}
                            onChange={(e) => handleInputChange('manageCreatives', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        Manage Creatives
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.manageAdvertising}
                            onChange={(e) => handleInputChange('manageAdvertising', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        Manage Advertising
                    </label>
                </div>
            </div>
        </div>
    );

    return (
        <BaseTable
            rowData={rowData}
            setRowData={setRowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            modalContent={modalContent}
            modalTitle="Role"
        />
    );
};

export default RolesTable; 