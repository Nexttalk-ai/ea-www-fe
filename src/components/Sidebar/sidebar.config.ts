export interface SidebarSubItem {
    label: string;
    path: string;
    disabled?: boolean;
}

export interface SidebarItemConfig {
    label: string;
    path?: string;
    icon?: string;
    disabled?: boolean;
    children?: SidebarSubItem[];
}

const sidebarConfig: SidebarItemConfig[] = [
    {
        label: 'User Management',
        path: '/users',
    },
    {
        label: 'Organizations',
        path: '/organizations',
    },
    {
        label: 'Domains',
        path: '/domains',
    },
    {
        label: 'TSPID Configs',
        path: '/tspid',
    },
    {
        label: 'Rules',
        path: '/rules',
    },
];

export default sidebarConfig;
