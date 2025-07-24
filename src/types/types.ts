export type NotificationType = 'success' | 'error' | 'warning';

export type NotificationPosition = 
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left';

export interface NotificationProps {
  type: NotificationType;
  position?: NotificationPosition;
  duration?: number;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    organization: Array<string>;
}