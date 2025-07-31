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
    domain_url: string;
    status: 'ENABLED' | 'DISABLED';
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    version: number;
}

export interface TSPID {
    id: string;
    revshare_coefficient: number | null;
    organization_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    version: number;
    status: 'ENABLED' | 'DISABLED';
}