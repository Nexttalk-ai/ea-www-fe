import React, { useRef, useEffect, useState } from 'react';

interface CustomScrollbarHProps {
    tableRef: React.RefObject<HTMLDivElement>;
    tableScrollWidth: number;
    className?: string;
}

const CustomScrollbarH: React.FC<CustomScrollbarHProps> = ({ 
    tableRef, 
    tableScrollWidth, 
    className = "" 
}) => {
    const scrollbarRef = useRef<HTMLDivElement>(null);

    const handleScrollbarScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (tableRef.current) {
            const scrollbarElement = e.currentTarget;
            const scrollbarMaxScroll = scrollbarElement.scrollWidth - scrollbarElement.clientWidth;
            const tableMaxScroll = tableRef.current.scrollWidth - tableRef.current.clientWidth;
            
            if (scrollbarMaxScroll > 0 && tableMaxScroll > 0) {
                const scrollRatio = scrollbarElement.scrollLeft / scrollbarMaxScroll;
                tableRef.current.scrollLeft = scrollRatio * tableMaxScroll;
            }
        }
    };

    const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (scrollbarRef.current) {
            const tableElement = e.currentTarget;
            const tableMaxScroll = tableElement.scrollWidth - tableElement.clientWidth;
            const scrollbarMaxScroll = scrollbarRef.current.scrollWidth - scrollbarRef.current.clientWidth;
            
            if (tableMaxScroll > 0 && scrollbarMaxScroll > 0) {
                const scrollRatio = tableElement.scrollLeft / tableMaxScroll;
                scrollbarRef.current.scrollLeft = scrollRatio * scrollbarMaxScroll;
            }
        }
    };

    useEffect(() => {
        const tableElement = tableRef.current;
        if (tableElement) {
            tableElement.addEventListener('scroll', handleTableScroll as any);
            return () => {
                tableElement.removeEventListener('scroll', handleTableScroll as any);
            };
        }
    }, [tableRef]);

    return (
        <div 
            ref={scrollbarRef}
            className={`w-full overflow-x-auto custom-scrollbar ${className}`}
            onScroll={handleScrollbarScroll}
            style={{ height: '16px' }}
        >
            <div 
                style={{ 
                    width: `${tableScrollWidth}px`,
                    backgroundColor: 'transparent'
                }}
            />
        </div>
    );
};

export default CustomScrollbarH; 