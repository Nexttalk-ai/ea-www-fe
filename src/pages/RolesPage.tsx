import React from 'react';
import HomeLayout from '../layouts/HomeLayout';
import RolesTable from '../components/tables/RolesTable';

const RolesPage: React.FC = () => {
    return (
        <HomeLayout>
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold mb-6">Roles Management</h1>
                    <RolesTable />
                </div>
            </div>
        </HomeLayout>
    );
};

export default RolesPage; 