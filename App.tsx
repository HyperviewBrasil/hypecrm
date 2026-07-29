import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
import { EmpresaUnidadeFormData, Proposal } from './types';

// Components
import LoginPage from './components/Features/Auth/LoginPage';
import LandingPage from './components/Features/Public/LandingPage';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ClientList from './components/Features/Clients/ClientList';
import ProposalsPage from './components/Features/Proposals/ProposalsPage';
import ContractsPage from './components/Features/Contracts/ContractsPage';
import FinancePage from './components/Features/Finance/FinancePage';
import SettingsPage from './components/Features/Settings/SettingsPage';
import { useToast } from './contexts/ToastContext';
import ProposalTrackerPage from './components/Features/Proposals/ProposalTrackerPage';
import ContractTrackerPage from './components/Features/Contracts/ContractTrackerPage';
import DashboardPage from './components/Features/Dashboard/DashboardPage';
import HypePage from './components/Features/Public/HypePage';
import InvoiceTrackerPage from './components/Features/Finance/InvoiceTrackerPage';
import ClientMappingPage from './components/Features/Clients/ClientMappingPage';

// View type for navigation
export type View = 'dashboard' | 'clients' | 'proposals' | 'contracts' | 'finance' | 'settings' | 'client_mapping';
export type PublicView = 'landing' | 'login' | 'proposal_tracker' | 'contract_tracker' | 'hype' | 'invoice_tracker';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicView, setPublicView] = useState<PublicView>('landing');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [clientToCreate, setClientToCreate] = useState<Partial<EmpresaUnidadeFormData> | null>(null);
  const [proposalForContract, setProposalForContract] = useState<Proposal | null>(null);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [initialHypeMessage, setInitialHypeMessage] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    // Read public view from URL on initial load
    const params = new URLSearchParams(window.location.search);
    const viewFromUrl = params.get('publicView') as PublicView;
    if (viewFromUrl && ['landing', 'login', 'proposal_tracker', 'contract_tracker', 'hype', 'invoice_tracker'].includes(viewFromUrl)) {
        setPublicView(viewFromUrl);
    } else {
        const path = window.location.pathname;
        if (path === '/hype') {
            setPublicView('hype');
        }
    }
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(prevSession => {
          // Só muda a tela para dashboard se o usuário REALMENTE acabou de fazer login
          // (transição de prevSession === null para session !== null)
          if (_event === 'SIGNED_IN' && !prevSession && session) {
            setCurrentView('dashboard');
          }
          return session;
        });

        if (_event === 'SIGNED_OUT') {
          setPublicView('landing'); // Default to landing on logout
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Update URL to reflect public view changes
    const url = new URL(window.location.href);
    if (publicView === 'hype') {
      url.pathname = '/hype';
      url.search = '';
    } else {
      url.pathname = '/';
      if (publicView !== 'landing') {
        url.searchParams.set('publicView', publicView);
      } else {
        url.searchParams.delete('publicView');
      }
    }
    window.history.replaceState({}, '', url);
  }, [publicView]);
  
  const handleGenerateContract = (proposal: Proposal) => {
    setProposalForContract(proposal);
    setCurrentView('contracts');
    addToast(`Iniciando contrato para a proposta ${proposal.proposal_code}.`, 'info');
  };

  const handleNavigateToHype = (initialMessage?: string) => {
    if (initialMessage) {
      setInitialHypeMessage(initialMessage);
    }
    setPublicView('hype');
  };

  const handleNavigateFromHype = () => {
    setPublicView('landing');
    setInitialHypeMessage(null); // Clear the message when leaving the page
  };


  // --- Handlers for Dashboard Quick Actions ---
  const handleGoToNewProposal = () => {
    setIsCreatingProposal(true);
    setCurrentView('proposals');
  };

  const handleGoToNewClient = () => {
    // We send an empty object to signal the ClientList to open the modal for a new client.
    // The CNPJ lookup can also send data, so this is consistent.
    setClientToCreate({});
    setCurrentView('clients');
  };
  // ---

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage onNavigateToNewProposal={handleGoToNewProposal} onNavigateToNewClient={handleGoToNewClient} />;
      case 'clients':
        return <ClientList clientToCreate={clientToCreate} onClientCreated={() => setClientToCreate(null)} />;
      case 'proposals':
        return <ProposalsPage onGenerateContract={handleGenerateContract} isCreating={isCreatingProposal} onCreationDone={() => setIsCreatingProposal(false)} />;
      case 'contracts':
        return <ContractsPage proposalForContract={proposalForContract} onContractCreated={() => setProposalForContract(null)} />;
      case 'finance':
        return <FinancePage />;
      case 'settings':
        return <SettingsPage />;
      case 'client_mapping':
        return <ClientMappingPage />;
      default:
        return <DashboardPage onNavigateToNewProposal={handleGoToNewProposal} onNavigateToNewClient={handleGoToNewClient} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
        Carregando...
      </div>
    );
  }

  if (!session) {
    switch (publicView) {
        case 'login':
            return <LoginPage onNavigateToLanding={() => setPublicView('landing')} />;
        case 'proposal_tracker':
            return <ProposalTrackerPage onNavigateToLanding={() => setPublicView('landing')} />;
        case 'contract_tracker':
            return <ContractTrackerPage onNavigateToLanding={() => setPublicView('landing')} />;
        case 'invoice_tracker':
            return <InvoiceTrackerPage onNavigateToLanding={() => setPublicView('landing')} />;
        case 'hype':
            return <HypePage onNavigateToLanding={handleNavigateFromHype} initialMessage={initialHypeMessage} />;
        default:
            return <LandingPage 
                onNavigateToHype={handleNavigateToHype}
            />;
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setOpen={setSidebarOpen} 
        setView={setCurrentView}
        currentView={currentView}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header session={session} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 w-full">
          <div className="w-full h-full">
            {renderCurrentView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;