import React from 'react';

interface AuthSideSectionProps {
  children?: React.ReactNode;
}

const AuthSideSection: React.FC<AuthSideSectionProps> = ({ children }) => {
  return (
      <div className="text-center text-white">
        {children}
      </div>
  );
};

export default AuthSideSection;