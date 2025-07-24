import { useState, useRef, useEffect } from 'react';
import { HiDotsVertical } from 'react-icons/hi';
import { createPortal } from 'react-dom';

interface DotButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const DotButton = ({ className, children }: DotButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const dropdown = dropdownRef.current;
      const button = containerRef.current;
      
      if (!dropdown || !button) return;
      
      const buttonRect = button.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const padding = 5; // Padding between button and dropdown

      // Check if there's enough space below
      if (spaceBelow >= dropdownRect.height + padding) {
        // Position below
        dropdown.style.top = `${buttonRect.bottom + padding}px`;
        dropdown.style.bottom = 'auto';
      } else if (spaceAbove >= dropdownRect.height + padding) {
        // Position above
        dropdown.style.bottom = `${windowHeight - buttonRect.top + padding}px`;
        dropdown.style.top = 'auto';
      } else {
        // If no space above or below, position below and make it scrollable
        dropdown.style.top = `${buttonRect.bottom + padding}px`;
        dropdown.style.bottom = 'auto';
        dropdown.style.maxHeight = `${spaceBelow - padding}px`;
      }
      
      dropdown.style.right = `${window.innerWidth - buttonRect.right - 20}px`;
    };

    // Initial position
    updatePosition();

    // Handle any scroll event
    const handleScroll = () => {
      setIsOpen(false);
    };

    // Handle clicks outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!containerRef.current?.contains(target) && 
          !dropdownRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          onClick={toggleDropdown}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <HiDotsVertical className={`size-[20px] text-black ${className}`} />
        </button>
      </div>
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed flex flex-col bg-white rounded-md shadow-lg shadow-blur-[28px] border border-gray-200 overflow-auto"
          style={{
            zIndex: 1000,
            minWidth: '118px'
          }}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
};

export default DotButton;
