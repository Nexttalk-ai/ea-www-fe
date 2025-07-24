import { useState } from 'react';
import { FaBars } from 'react-icons/fa';
import SidebarItem from './SidebarItem';
import sidebarConfig from './sidebar.config';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-[calc(100vh-48px)] bg-white shadow-md border-r z-10 transition-all duration-300 ${
        collapsed ? 'w-[64px]' : 'w-[208px]'
      }`}
    >
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between h-[48px] px-[23px] border-b">
        <button onClick={() => setCollapsed(!collapsed)} className="text-black hover:text-gray-600">
          <FaBars size={18} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-[4px] py-[16px]">
        {sidebarConfig.map((item, idx) => (
          <SidebarItem key={idx} item={item} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
