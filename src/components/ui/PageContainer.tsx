import React, { ReactNode } from 'react';

interface PageContainerProps {
    className?: string;
    title?: string;
    leftElement?: ReactNode;
    centerElement?: ReactNode;
    rightElement?: ReactNode;
    bottomElement?: ReactNode;
    children: ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({
    className,
    title,
    leftElement,
    centerElement,
    rightElement,
    bottomElement,
    children
}) => {
    // Calculate heights: Header (48px) is already accounted for in HomeLayout
    // PageContainer elements: title (~56px), top elements (~80px), bottom element (~64px)
    // Total PageContainer overhead: ~200px
    const contentHeight = 'calc(100vh - 248px)'; // 48px header + 200px PageContainer elements
    
    return (
        <div className={`bg-white h-[calc(100vh-48px)] flex flex-col ${className}`}>
            {title && (
                <h1 className="text-[20px] font-medium text-black text-center pt-8 px-10 flex-shrink-0">{title}</h1>
            )}
            {(leftElement || centerElement || rightElement) && (
                <div className="flex justify-between items-center mt-8 mb-[6px] px-10 flex-shrink-0">
                    {leftElement}
                    {centerElement}
                    {rightElement}
                </div>
            )}
            <div className="px-10 flex-1 min-h-0">
                {children}
            </div>
            {bottomElement && (
                <div className="mt-2 px-10 pb-8 flex-shrink-0">
                    {bottomElement}
                </div>
            )}
        </div>
    );
};

export default PageContainer; 