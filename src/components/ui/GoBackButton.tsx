import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Button from './Button';

interface GoBackButtonProps {
    text: string;
    path: string;
    className?: string;
}

const GoBackButton: React.FC<GoBackButtonProps> = ({ text, path, className }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(path);
    };

    return (
        <Button
            onClick={handleBack}
            className={`text-black flex items-center min-w-fit gap-2 px-0 pl-0 self-start ${className}`}
        >
            <FaArrowLeft />
            {text}
        </Button>
    );
};

export default GoBackButton; 