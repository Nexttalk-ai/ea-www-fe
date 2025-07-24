import React from 'react';

interface CustomInputProps {
    label: string;
    value: string | number | string[];
    onChange?: (value: string) => void;
    disabled?: boolean;
    type?: string;
    placeholder?: string;
    className?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({
    label,
    value,
    onChange,
    disabled = false,
    type = 'text',
    placeholder = '',
    className = ''
}) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : value;

    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <input
                type={type}
                value={displayValue}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} 
                    ${className}`}
            />
        </div>
    );
};

export default CustomInput; 