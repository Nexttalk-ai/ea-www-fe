import React, { ReactNode, useState, useRef, useEffect } from 'react';

interface CustomSelectProps {
  children: ReactNode;
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  children,
  className = '',
  placeholder = 'Select an option',
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(value);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    setIsOpen(false);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div 
      ref={selectRef}
      className={`relative inline-block w-full ${className}`}
    >
      <div
        className="flex items-center justify-between w-full px-4 py-2 text-sm border rounded-md cursor-pointer bg-white hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedValue ? 'text-gray-900' : 'text-gray-500'}>
          {selectedValue || placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
          <div className="py-1 max-h-60 overflow-auto">
            {React.Children.map(children, (child) => {
              if (React.isValidElement<OptionProps>(child)) {
                return React.cloneElement(child, {
                  onClick: () => handleSelect(child.props.value),
                  className: `block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 cursor-pointer ${
                    child.props.value === selectedValue ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`,
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface OptionProps {
  value: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Option: React.FC<OptionProps> = ({ children, className = '', onClick }) => {
  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
}; 