import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface Metric {
    id: string;
    name: string;
    description: string | null;
    status: string;
}

interface MetricSelectProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    metrics: Metric[];
    placeholder?: string;
    error?: string;
    className?: string;
}

const MetricSelect: React.FC<MetricSelectProps> = ({
    id,
    value,
    onChange,
    metrics,
    placeholder = 'Select metric...',
    error,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownWidth, setDropdownWidth] = useState<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Calculate dropdown width based on wrapper width
    useEffect(() => {
        if (wrapperRef.current) {
            setDropdownWidth(wrapperRef.current.offsetWidth);
        }
    }, [wrapperRef.current]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMetricClick = (metricName: string) => {
        onChange(metricName);
        setIsOpen(false);
        if (inputRef.current) {
            inputRef.current.focus();
            const len = metricName.length;
            inputRef.current.setSelectionRange(len, len);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        setSearchTerm(newValue);
    };

    const handleInputClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const filteredMetrics = metrics.filter(metric =>
        metric.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative w-full ${className}`} ref={wrapperRef}>
            <div className="relative w-full">
                <div className="relative flex items-center w-full">
                    <input
                        ref={inputRef}
                        type="text"
                        id={id}
                        value={value}
                        onChange={handleInputChange}
                        onClick={handleInputClick}
                        onFocus={() => setIsOpen(true)}
                        className={`
                            h-[42px] w-full bg-white border border-gray-300 rounded-md
                            px-4 py-2 text-sm text-gray-600
                            focus:outline-none focus:border-blue-500
                            ${error ? 'border-red-500' : ''}
                        `}
                        placeholder={placeholder}
                    />
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                        <FaChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {isOpen && (
                <div 
                    className="absolute z-50 mt-1 w-full"
                >
                    <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden w-full">
                        <div className="overflow-y-auto max-h-[320px]">
                            {filteredMetrics.map((metric) => (
                                <div
                                    key={metric.id}
                                    onClick={() => handleMetricClick(metric.name)}
                                    className={`
                                        px-4 py-3 text-base cursor-pointer text-gray-600
                                        ${value === metric.name ? 'bg-white' : 'hover:bg-blue-50'}
                                    `}
                                >
                                    {metric.name}
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

export default MetricSelect; 
