import React from 'react';
import { FiX, FiUsers, FiFileText, FiLogOut, FiPenTool, FiSettings, FiHome, FiBriefcase, FiDatabase } from 'react-icons/fi';
import { supabase } from '../../services/supabaseClient';
import { View } from '../../App';

interface SidebarProps {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  setView: (view: View) => void;
  currentView: View;
}

const NavItem: React.FC<{
    icon: React.ElementType;
    label: string;
    view: View;
    currentView: View;
    onClick: () => void;
}> = ({ icon: Icon, label, view, currentView, onClick }) => {
    const isActive = currentView === view;
    return (
        <li>
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    onClick();
                }}
                className={`flex items-center p-3 text-base font-normal rounded-lg transition-all duration-200 ${
                    isActive
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white border border-transparent'
                }`}
            >
                <Icon className="w-6 h-6" />
                <span className="ml-3">{label}</span>
            </a>
        </li>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setOpen, setView, currentView }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // App.tsx's onAuthStateChange will handle navigation
  };
  
  const handleSetView = (view: View) => {
    setView(view);
    setOpen(false); // Close sidebar on mobile after navigation
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      ></div>

      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-gray-800/95 backdrop-blur-md border-r border-gray-700/50 transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <span className="text-2xl font-logo text-white lowercase">hyperview</span>
            <button 
              className="md:hidden text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg p-2 transition-all duration-200" 
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
            >
              <FiX size={24} />
            </button>
          </div>
          <ul className="space-y-2">
            <NavItem
                icon={FiHome}
                label="Dashboard"
                view="dashboard"
                currentView={currentView}
                onClick={() => handleSetView('dashboard')}
            />
            <NavItem
                icon={FiUsers}
                label="Clientes"
                view="clients"
                currentView={currentView}
                onClick={() => handleSetView('clients')}
            />
            <NavItem
                icon={FiFileText}
                label="Propostas"
                view="proposals"
                currentView={currentView}
                onClick={() => handleSetView('proposals')}
            />
            <NavItem
                icon={FiPenTool}
                label="Contratos"
                view="contracts"
                currentView={currentView}
                onClick={() => handleSetView('contracts')}
            />
            <NavItem
               icon={FiBriefcase}
               label="Financeiro"
               view="finance"
               currentView={currentView}
               onClick={() => handleSetView('finance')}
            />
            <NavItem
               icon={FiDatabase}
               label="Mapeamento Asaas"
               view="client_mapping"
               currentView={currentView}
               onClick={() => handleSetView('client_mapping')}
            />
            <NavItem
               icon={FiSettings}
               label="Configurações"
               view="settings"
               currentView={currentView}
               onClick={() => handleSetView('settings')}
            />
          </ul>

          <div className="mt-auto">
             <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                }}
                className="flex items-center p-3 text-base font-normal text-gray-300 rounded-lg hover:bg-red-800/30 hover:text-red-300 transition-all duration-200 border border-red-700/30 hover:border-red-600/50"
            >
                <FiLogOut className="w-6 h-6" />
                <span className="ml-3">Sair</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
