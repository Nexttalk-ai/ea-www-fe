import { useNavigate } from 'react-router-dom';

interface ViewButtonProps {
    path: string;
    className?: string;
}

const ViewButton = ({ 
    path,
    className = ''
}: ViewButtonProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(path);
    };

    return (
        <button
            onClick={handleClick}
            className={`gap-[8px] px-[7px] w-[47px] h-[24px] bg-white text-black border border-[#d9d9d9] rounded-[2px] hover:bg-gray-100 transition-colors ${className}`}
        >
            View
        </button>
    );
};

export default ViewButton; 