import React from 'react';
import { Session } from '@supabase/supabase-js';
import { FiMenu, FiUser } from 'react-icons/fi';

interface HeaderProps {
    session: Session | null;
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ session, onMenuClick }) => {
  return (
    <header className="h-16 bg-gray-800/80 backdrop-blur-md border-b border-gray-700/50 flex items-center justify-between px-3 sm:px-6 flex-shrink-0">
      {/* Left side: Menu button for mobile */}
      <button 
        className="md:hidden text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg p-2 transition-all duration-200" 
        onClick={onMenuClick}
        aria-label="Menu"
      >
        <FiMenu size={24} />
      </button>
      
      {/* Logo/Title - visible on mobile */}
      <div className="md:hidden flex-1 text-center">
        <span className="text-lg font-logo text-white lowercase">hyperview</span>
      </div>

      {/* This empty div helps to center the middle content if needed, or just push right content to the edge */}
      <div className="flex-1 hidden md:block"></div>

      {/* Right side: User info */}
      <div className="flex items-center gap-2 sm:gap-3">
        <FiUser size={20} className="text-gray-400" />
        <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline max-w-[150px] truncate">
            {session?.user?.email || 'Usuário'}
        </span>
      </div>
    </header>
  );
};

export default Header;
