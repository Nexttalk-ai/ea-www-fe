import React from 'react';

interface LogoProps {
    imageSrc: string;
    size?: number;
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({
    imageSrc,
    size,
    className
}: LogoProps) => {
    return (
        <img
        src={imageSrc}
        alt="Logo"
        style={{ width: size, height: size }}
        className={`object-contain ${className || ''}`}
        />
    );
};

export default Logo;