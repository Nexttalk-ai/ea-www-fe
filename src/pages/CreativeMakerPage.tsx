import React from 'react';
import CreativeMakerTable from '../components/tables/CreativeMakerTable';
import HomeLayout from '../layouts/HomeLayout';

const CreativeMakerPage: React.FC = () => {
    return (
        <HomeLayout>
            <CreativeMakerTable />
        </HomeLayout>
    );
};

export default CreativeMakerPage; 