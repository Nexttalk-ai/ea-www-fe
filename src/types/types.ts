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
    status: string;
    organization: Array<string>;
}

export interface Domain {
    id: string;
    name: string;
    address: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    version: number;
}

export interface TSPID {
    id: string;
    tspid_value: string;
    enabled: boolean;
    generationMethod: 'manual' | 'auto' | 'partner_feed';
    expiryDays: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    version: number;
    content?: any;
}