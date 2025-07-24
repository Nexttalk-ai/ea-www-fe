import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaTimes } from 'react-icons/fa';

interface Option {
    value: string;
    label: string;
}

interface SelectProps {
    id: string;
    label?: string;
    options: Option[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    error?: string;
    showSearchBar?: boolean;
    multipleSelect?: boolean;
    disabled?: boolean;
    className?: string;
}

const Select: React.FC<SelectProps> = ({
    id,
    label,
    options,
    value,
    onChange,
    placeholder = 'Select...',
    error,
    showSearchBar = false,
    multipleSelect = false,
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownWidth, setDropdownWidth] = useState<number>(0);
    const inputRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown width based on longest option
    useEffect(() => {
        if (inputRef.current) {
            const inputWidth = inputRef.current.offsetWidth;
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.whiteSpace = 'nowrap';
            tempDiv.style.fontSize = '14px'; // Match text-sm
            tempDiv.style.padding = '8px 16px'; // Match px-4 py-2
            document.body.appendChild(tempDiv);

            let maxWidth = inputWidth;
            options.forEach(option => {
                tempDiv.textContent = option.label;
                const width = tempDiv.offsetWidth + 32; // Add padding
                maxWidth = Math.max(maxWidth, width);
            });

            document.body.removeChild(tempDiv);
            setDropdownWidth(maxWidth + 4); // Add small buffer
        }
    }, [options]);

    const handleOptionClick = (optionValue: string) => {
        if (multipleSelect) {
            if (value.includes(optionValue)) {
                onChange(value.filter(v => v !== optionValue));
            } else {
                onChange([...value, optionValue]);
            }
        } else {
            onChange([optionValue]);
            setIsOpen(false);
        }
    };

    const removeValue = (valueToRemove: string) => {
        onChange(value.filter(v => v !== valueToRemove));
    };

    const getSelectedLabels = () => {
        return value.map(v => options.find(opt => opt.value === v)?.label || v);
    };

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <div
                    ref={inputRef}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={`
                        min-h-[42px] h-fit w-full bg-white border border-gray-300 rounded-md
                        px-4 py-2 text-sm text-gray-600
                        ${!disabled ? 'cursor-pointer hover:bg-white' : 'cursor-not-allowed opacity-60'}
                        flex items-center justify-between
                        ${error ? 'border-red-500' : 'focus:border-blue-500'}
                    `}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                        {value.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {getSelectedLabels().map((label, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-1 text-gray-600 text-sm truncate bg-gray-100 px-2 py-1 rounded"
                                    >
                                        <span className="truncate">{label}</span>
                                        {multipleSelect && !disabled && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeValue(value[index]);
                                                }}
                                                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                            >
                                                <FaTimes className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-gray-400">{placeholder}</span>
                        )}
                    </div>
                    <FaChevronDown className={`flex-shrink-0 h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && !disabled && (
                <div 
                    className="absolute z-50 mt-1"
                    style={{ width: `${dropdownWidth}px`, minWidth: '100%' }}
                >
                    <div className="bg-white border border-gray-300 rounded-md shadow-sm max-h-[280px] overflow-hidden">
                        {showSearchBar && (
                            <div className="p-2 border-b border-gray-200 bg-white sticky top-0">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-600"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        <div className="overflow-y-auto max-h-[280px] bg-white">
                            {filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleOptionClick(option.value)}
                                    className={`
                                        px-4 py-2 text-sm cursor-pointer text-gray-600 truncate
                                        ${value.includes(option.value) 
                                            ? 'bg-white' 
                                            : 'hover:bg-blue-50'}
                                    `}
                                >
                                    {option.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Select; 
