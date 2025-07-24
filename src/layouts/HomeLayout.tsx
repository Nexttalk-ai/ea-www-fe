import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt} from 'react-icons/fa';
import { MdWavingHand } from 'react-icons/md';
import authService from '../services/auth.service';
import MultiTimezoneClock from '@/components/ui/MultiTimezoneClock';
import Logo from '@/components/ui/Logo';
import OrganizationSelector from '@/components/ui/OrganizationSelector';
import { useOrganizationSelection } from '@/hooks/useOrganizationSelection';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUser } from '@/hooks/useUser';
import Sidebar from '@/components/Sidebar/Sidebar';

interface HomeLayoutProps {
  children: React.ReactNode;
}

const HomeLayout: React.FC<HomeLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { userId, isLoading: isLoadingUserId } = useCurrentUser();
  const { user, isLoading: isLoadingUser } = useUser(userId || '');

  const isLoading = isLoadingUserId || isLoadingUser;
  const userName = user?.name || 'User';
  const organizations = user?.organizations || [];

  const { selectedOrgIds, updateSelection } = useOrganizationSelection(
    organizations.length > 0 ? organizations[0] : ''
  );

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during sign out:', error);
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-light-gray">
      {/* Header */}
      <header className="h-12 bg-[#001529] flex items-center justify-between px-4 text-white">
        {/* Left: Logo */}
        <div className="h-full flex items-center">
          <Logo imageSrc="/images/ExplorAdsAdminLogo.png" className="h-[32px] w-auto object-contain" />
        </div>
        {/* Right: Greeting, Clocks, Org Selector, Logout */}
        <div className="flex items-center gap-[12px] h-full">
          {/* Greeting */}
          <div className="flex items-center text-white">
            <MdWavingHand className="w-[18px] h-[18px] mr-[4px]" />
            <span className="text-sm leading-[22px]">
              {isLoading ? 'Loading...' : `Hello ${userName}`}
            </span>
          </div>

          {/* Clocks */}
          <div className="w-[124px]">
            <MultiTimezoneClock />
          </div>

          {/* Organization Selector */}
          <div className="h-[38px]">
            {organizations.length > 0 && (
              <OrganizationSelector
                organizations={organizations}
                selectedOrgIds={selectedOrgIds}
                onChange={updateSelection}
              />
            )}
          </div>

          {/* Logout */}
          <button onClick={handleSignOut} className="hover:text-white px-2">
            <FaSignOutAlt className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Layout */}
      <div className="flex flex-1">
        <Sidebar />
        <div className="w-full h-[calc(100vh-48px)] overflow-auto">
          <main>{children}</main>
        </div>
      </div>
      </div>
  );
};

export default HomeLayout;