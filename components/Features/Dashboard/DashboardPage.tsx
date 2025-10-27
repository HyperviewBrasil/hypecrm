
import React, { useState, useEffect } from 'react';
import { FiFileText, FiPlusCircle, FiUsers, FiSend, FiDollarSign } from 'react-icons/fi';
import { getProposalStats } from '../../../services/proposalService';
import { getContractStats } from '../../../services/contractService';
import StatCard from '../../UI/StatCard';
import { useToast } from '../../../contexts/ToastContext';

interface DashboardPageProps {
  onNavigateToNewProposal: () => void;
  onNavigateToNewClient: () => void;
}

interface Stats {
  draftCount: number;
  proposalSentCount: number;
  completedContractValue: number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const ActionCard: React.FC<{ title: string; description: string; icon: React.ElementType; onClick: () => void }> = ({ title, description, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className="bg-gray-800 p-6 rounded-lg shadow-lg text-left w-full hover:bg-gray-700/50 hover:border-blue-500 border border-transparent transition-all duration-200 flex items-start space-x-4"
    >
        <div className="p-3 bg-blue-600 text-white rounded-lg mt-1">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-gray-400 mt-1">{description}</p>
        </div>
    </button>
);


const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToNewProposal, onNavigateToNewClient }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [proposalStats, contractStats] = await Promise.all([
          getProposalStats(),
          getContractStats()
        ]);
        setStats({
          draftCount: proposalStats.draftCount,
          proposalSentCount: proposalStats.sentCount,
          completedContractValue: contractStats.completedValue,
        });
      } catch (error: any) {
        addToast(error.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [addToast]);
  
  const StatSkeleton: React.FC = () => (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-6 animate-pulse">
          <div className="p-4 bg-gray-700 rounded-lg w-16 h-16"></div>
          <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          </div>
      </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Ações Rápidas */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <ActionCard 
                title="Nova Proposta"
                description="Crie e envie uma nova proposta comercial para um cliente."
                icon={FiFileText}
                onClick={onNavigateToNewProposal}
           />
           <ActionCard 
                title="Novo Cliente"
                description="Cadastre uma nova empresa ou unidade para gerenciar."
                icon={FiUsers}
                onClick={onNavigateToNewClient}
           />
        </div>
      </section>

      {/* Estatísticas */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Visão Geral</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading || !stats ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <StatCard 
                title="Valor em Contratos Concluídos"
                value={formatCurrency(stats.completedContractValue)}
                icon={FiDollarSign}
                colorClass="text-green-400"
              />
              <StatCard 
                title="Propostas em Rascunho"
                value={stats.draftCount.toString()}
                icon={FiFileText}
                colorClass="text-yellow-400"
              />
              <StatCard 
                title="Propostas Enviadas"
                value={stats.proposalSentCount.toString()}
                icon={FiSend}
                colorClass="text-blue-400"
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
