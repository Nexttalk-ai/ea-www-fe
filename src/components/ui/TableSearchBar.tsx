import { RiSearchLine, RiCloseCircleFill } from 'react-icons/ri';
import Input from './Input';
import { useState } from 'react';

interface TableSearchBarProps {
    id: string;
    className?: string;
    onInput?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TableSearchBar: React.FC<TableSearchBarProps> = ({ id, className, onInput }) => {
    const [value, setValue] = useState('');

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onInput?.(e);
    };

    const handleClear = () => {
        setValue('');
        // Create a synthetic event to notify parent components
        const syntheticEvent = {
            target: { value: '' },
            currentTarget: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>;
        onInput?.(syntheticEvent);
    };

    return (
        <div className="relative inline-block">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-[18px] h-[18px] pointer-events-none" />
            <Input
                type="text"
                id={id}
                value={value}
                placeholder="Search"
                onChange={handleInput}
                className={`pl-10 ${className}`}
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                    <RiCloseCircleFill className="text-gray-400 cursor-pointer w-[18px] h-[18px] hover:text-gray-600" />
                </button>
            )}
        </div>
    );
};

export default TableSearchBar;