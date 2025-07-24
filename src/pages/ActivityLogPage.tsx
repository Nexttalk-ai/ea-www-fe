import React from 'react';
import ActivityLogTable from '../components/tables/ActivityLogTable';
import HomeLayout from '../layouts/HomeLayout';

const ActivityLogPage: React.FC = () => {
    return (
        <HomeLayout>
            <ActivityLogTable />
        </HomeLayout>
    );
};

export default ActivityLogPage; 