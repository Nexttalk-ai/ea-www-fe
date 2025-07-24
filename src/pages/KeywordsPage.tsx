import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomeLayout from '../layouts/HomeLayout';
import KeywordsTable from '../components/tables/KeywordsTable';
import AddKeyword from './AddKeyword';

const KeywordsPage: React.FC = () => {
    return (
        <HomeLayout>
            <Routes>
                <Route path="/" element={<KeywordsTable />} />
                <Route path="/add" element={<AddKeyword />} />
                <Route path="/edit" element={<AddKeyword />} />
            </Routes>
        </HomeLayout>
    );
};

export default KeywordsPage; 