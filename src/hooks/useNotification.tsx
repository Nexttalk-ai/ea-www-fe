import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Notification from '../components/ui/Notification';
import { NotificationType, NotificationPosition } from '../types/types';

interface NotificationOptions {
  type: NotificationType;
  position?: NotificationPosition;
  duration?: number;
}

interface NotificationItem extends NotificationOptions {
  id: string;
  message: React.ReactNode;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const show = useCallback((
    message: React.ReactNode,
    options: NotificationOptions
  ) => {
    const id = uuidv4(); 
    
    setNotifications(prev => [...prev, {
      id,
      message,
      ...options,
    }]);

    return id;
  }, []);

  const close = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const NotificationContainer = () => (
    <>
      {notifications.map(({ id, message, ...options }) => (
        <Notification
          key={id}
          {...options}
          onClose={() => close(id)}
        >
          {message}
        </Notification>
      ))}
    </>
  );

  return {
    show,
    close,
    NotificationContainer,
  };
};