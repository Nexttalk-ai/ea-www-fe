import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

interface ButtonActionProps {
    className?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface IconActionProps {
    className?: string;
    onClick?: (event: React.MouseEvent<SVGElement>) => void;
}

export const EditButton = ({ onClick }: ButtonActionProps) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
        >
            <FaRegEdit className="text-black w-4 h-4" />
            <span className="text-[14px]">Edit</span>
        </button>
    )
}

export const DeleteButton = ({ onClick }: ButtonActionProps) => {   
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f5] transition-colors"
        >
            <FaRegTrashAlt className="text-[#EA3A3D] w-4 h-4" />
            <span className="text-[14px] text-[#EA3A3D]">Delete</span>
        </button>
    )
}

export const EditIcon = ({ className, onClick }: IconActionProps) => {
    return (
        <FiEdit2 className={`text-blue-500 cursor-pointer hover:text-blue-600 transition-colors ${className}`} onClick={onClick} />
    )
}

export const DeleteIcon = ({ className, onClick }: IconActionProps) => {   
    return (
        <FiTrash2 className={`text-red-500 cursor-pointer hover:text-red-600 transition-colors ${className}`} onClick={onClick} />
    )
}
