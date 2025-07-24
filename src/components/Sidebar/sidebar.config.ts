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
        label: 'Roles',
        path: '/roles',
    },
    {
        label: 'Campaign Uploader',
        children: [
            {
                label: 'Keywords Bank',
                path: '/keywords',
            },
            {
                label: 'Creatives',
                path: '/creatives',
            },
            {
                label: 'Creative Maker',
                path: '/creative-maker',
            },
            {
                label: 'Activity Log',
                path: '/activity-log',
            }
        ]
    },
    {
        label: 'Rules',
        path: '/rules',
    },
];

export default sidebarConfig;
