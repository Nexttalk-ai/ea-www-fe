import React from 'react';
import UsersTable from '../components/tables/UsersTable';
import HomeLayout from '../layouts/HomeLayout';

const UsersPage: React.FC = () => {
    return (
        <HomeLayout>
            <UsersTable />
        </HomeLayout>
    );
};

export default UsersPage;