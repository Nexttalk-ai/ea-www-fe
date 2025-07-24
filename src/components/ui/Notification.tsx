import React, { useEffect, useState } from 'react';
import { NotificationProps } from '../../types/types';
import { IoCloseOutline } from "react-icons/io5";
import SuccessNotification from './SuccessNotification';
import ErrorNotification from './ErrorNotification';

const Notification: React.FC<NotificationProps> = ({
  type = 'success',
  position = 'top-right',
  children,
  onClose,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Duration of the exit animation
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 3000); // Auto-close after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed z-[1100] w-[320px] h-[164px]
        ${positionStyles[position]}
        bg-white
        ${isLeaving ? 'animate-fade-out' : 'animate-fade-in'}
        rounded-md shadow-lg
        transform transition-all duration-300 ease-in-out
        ${className}
      `}
      role="alert"
    >
      <div className="flex flex-col items-center justify-center h-full relative">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 transition-colors"
          aria-label="Close notification"
        >
          <IoCloseOutline className="w-5 h-5" />
        </button>

        {type === 'success' ? <SuccessNotification /> : <ErrorNotification />}

        <div className="text-center mt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Notification;