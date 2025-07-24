import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import type { SidebarItemConfig } from './sidebar.config';

interface SidebarItemProps {
    item: SidebarItemConfig;
    collapsed: boolean;
}

const SidebarItem = ({ item, collapsed }: SidebarItemProps) => {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.path && location.pathname.startsWith(item.path);

    const handleClick = () => {
        if (hasChildren) setOpen(prev => !prev);
    };

    return (
        <div className="w-[208px]">
            <div
                onClick={handleClick}
                className={`flex items-center justify-between h-[40px] px-[23px] rounded cursor-pointer transition-colors duration-150
          ${isActive ? 'bg-[#E6F7FF] text-[#1890FF]' : 'text-black hover:bg-[#E6F7FF] hover:text-[#1890FF]'}`}
            >
                {item.path ? (
                    <NavLink
                        to={item.path}
                        className="flex-1 text-sm font-normal"
                    >
                        {!collapsed && item.label}
                    </NavLink>
                ) : (
                    <span className="flex-1 text-sm font-normal">
                        {!collapsed && item.label}
                    </span>
                )}

                {hasChildren && !collapsed && (
                    <span>{open ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}</span>
                )}
            </div>

            {open && hasChildren && !collapsed && (
                <div className="ml-2 mt-1 space-y-[10px]">
                    {item.children!.map((sub, idx) => {
                        const subIsActive = location.pathname === sub.path;
                        return (
                            <NavLink
                                to={sub.path}
                                key={idx}
                                className={`block h-[40px] px-[23px] text-sm font-normal rounded flex items-center transition-colors duration-150
                  ${subIsActive ? 'bg-[#E6F7FF] text-[#1890FF]' : 'text-black hover:bg-[#E6F7FF] hover:text-[#1890FF]'}`}
                            >
                                {sub.label}
                            </NavLink>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SidebarItem;
