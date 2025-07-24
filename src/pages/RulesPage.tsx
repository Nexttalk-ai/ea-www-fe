import React from 'react';
import RulesTable from '../components/tables/RulesTable';
import HomeLayout from '../layouts/HomeLayout';

const RulesPage: React.FC = () => {
    return (
        <HomeLayout>
            <RulesTable />
        </HomeLayout>
    );
};

export default RulesPage; 