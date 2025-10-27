import React from 'react';
import { Session } from '@supabase/supabase-js';
import { FiMenu, FiUser } from 'react-icons/fi';

interface HeaderProps {
    session: Session | null;
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ session, onMenuClick }) => {
  return (
    <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Left side: Menu button for mobile */}
      <button className="md:hidden text-gray-400 hover:text-white" onClick={onMenuClick}>
        <FiMenu size={24} />
      </button>
      
      {/* This empty div helps to center the middle content if needed, or just push right content to the edge */}
      <div className="md:flex-1"></div>

      {/* Right side: User info */}
      <div className="flex items-center gap-3">
        <FiUser size={20} className="text-gray-400" />
        <span className="text-sm text-gray-300 hidden md:inline">
            {session?.user?.email || 'Usuário'}
        </span>
      </div>
    </header>
  );
};

export default Header;
