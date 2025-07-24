import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';

interface EditButtonProps {
    id: string;
    path: string;
}

const EditButton: React.FC<EditButtonProps> = ({ id, path }) => {
    const navigate = useNavigate();

    const handleEdit = () => {
        navigate(`${path}/edit/${id}`);
    };

    return (
        <button
            onClick={handleEdit}
            className="text-blue-500 hover:text-blue-700 transition-colors duration-200 p-1 rounded hover:bg-blue-50"
            title="Edit Rule"
        >
            <FaEdit className="w-4 h-4" />
        </button>
    );
};

export default EditButton; 