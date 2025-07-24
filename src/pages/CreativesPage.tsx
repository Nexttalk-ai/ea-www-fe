import React from 'react';
import CreativesTable from '../components/tables/CreativesTable';
import HomeLayout from '../layouts/HomeLayout';

const CreativesPage: React.FC = () => {
    return (
        <HomeLayout>
            <CreativesTable />
        </HomeLayout>
    );
};

export default CreativesPage; 