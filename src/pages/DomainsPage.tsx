import React from 'react';
import DomainsTable from '../components/tables/DomainsTable';
import HomeLayout from '../layouts/HomeLayout';

const DomainsPage: React.FC = () => {
    return (
        <HomeLayout>
            <DomainsTable />
        </HomeLayout>
    );
};

export default DomainsPage; 