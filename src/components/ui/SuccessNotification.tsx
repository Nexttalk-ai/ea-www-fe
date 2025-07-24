import React from 'react';

const SuccessNotification: React.FC = () => {
  return (
    <div className="relative" style={{ marginTop: '20px', marginBottom: '24px' }}>
      <div 
        className="absolute rounded-full bg-green-100" 
        style={{ 
          width: '48px', 
          height: '48px', 
          top: '-24px', 
          left: '-24px',
          opacity: '0.8'
        }}
      />
      <div 
        className="relative flex items-center justify-center" 
        style={{ 
          width: '24px', 
          height: '24px',
          position: 'absolute',
          top: '-12px',
          left: '-12px'
        }}
      >
        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke="currentColor" d="M7 13l3 3 7-7"/>
        </svg>
      </div>
    </div>
  );
};

export default SuccessNotification; 