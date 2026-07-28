import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FiPlus, FiEdit, FiSearch, FiRefreshCw, FiArchive, FiUnlock, FiShare2, FiFileText, FiPenTool, FiFilter } from 'react-icons/fi';
import {
  getProposals,
  addProposal,
  updateProposal,
  updateProposalStatus,
} from '../../../services/proposalService';
import { Proposal, ProposalFormData } from '../../../types';
import Button from '../../UI/Button';
import Modal from '../../UI/Modal';
import ProposalForm from './ProposalForm';
import ShareModal from './ShareModal';
import ProposalPDFLayout from './ProposalPDFLayout';
import { useToast } from '../../../contexts/ToastContext';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface ProposalsPageProps {
  onGenerateContract: (proposal: Proposal) => void;
  isCreating?: boolean;
  onCreationDone?: () => void;
}

const ProposalsPage: React.FC<ProposalsPageProps> = ({ onGenerateContract, isCreating, onCreationDone }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposalToEdit, setProposalToEdit] = useState<Proposal | null>(null);
  const [proposalToUpdateStatus, setProposalToUpdateStatus] = useState<Proposal | null>(null);
  const [proposalToShare, setProposalToShare] = useState<Proposal | null>(null);
  const [proposalForPdf, setProposalForPdf] = useState<Proposal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useToast();
  
  // State for mobile swipe gestures
  const [swipedProposal, setSwipedProposal] = useState<{ id: string, startX: number, deltaX: number } | null>(null);
  const isSwipingRef = useRef(false);

  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProposals();
      setProposals(data);
    } catch (err: any) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);
  
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  useEffect(() => {
    if (isCreating) {
      handleOpenModalForAdd();
    }
  }, [isCreating]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = proposals
      .filter(proposal => {
        const isArchived = proposal.status === 'Arquivado';
        return showArchived ? isArchived : !isArchived;
      })
      .filter(proposal => {
        if (statusFilter === 'Todos') return true;
        return proposal.status === statusFilter;
      })
      .filter(item =>
        (item.empresas_unidades?.nome_fantasia?.toLowerCase() || '').includes(lowercasedFilter) ||
        (item.empresas_unidades?.razao_social?.toLowerCase() || '').includes(lowercasedFilter) ||
        (item.empresas_unidades?.cnpj_unidade || '').includes(lowercasedFilter) ||
        (item.contact_person?.toLowerCase() || '').includes(lowercasedFilter) ||
        item.proposal_code.toLowerCase().includes(lowercasedFilter)
      );
    setFilteredProposals(filteredData);
  }, [searchTerm, proposals, showArchived, statusFilter]);

  const handleOpenModalForAdd = () => {
    setProposalToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (proposal: Proposal) => {
    setProposalToEdit(proposal);
    setIsModalOpen(true);
  };
  
  const handleOpenShareModal = (proposal: Proposal) => {
    setProposalToShare(proposal);
    setProposalForPdf(proposal);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProposalToEdit(null);
    if (isCreating && onCreationDone) {
        onCreationDone();
    }
  };

  const handleCloseShareModal = () => {
    setProposalToShare(null);
  };

  const handleSubmit = async (formData: ProposalFormData) => {
    setIsSubmitting(true);
    try {
      if (proposalToEdit) {
        await updateProposal(proposalToEdit.proposal_id, formData);
        addToast('Proposta atualizada com sucesso!', 'success');
      } else {
        await addProposal(formData);
        addToast('Proposta adicionada com sucesso!', 'success');
      }
      handleCloseModal();
      await fetchProposals();
    } catch (err: any) {
      console.error(err);
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (proposal?: Proposal) => {
    const proposalToActOn = proposal || proposalToUpdateStatus;
    if (!proposalToActOn) return;

    const isArchiving = proposalToActOn.status !== 'Arquivado';
    const newStatus = isArchiving ? 'Arquivado' : 'Rascunho';
    const successMessage = isArchiving ? 'Proposta arquivada com sucesso!' : 'Proposta desarquivada com sucesso!';
    
    setIsSubmitting(true);
    try {
      await updateProposalStatus(proposalToActOn.proposal_id, newStatus);
      addToast(successMessage, 'success');
      await fetchProposals();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
      setProposalToUpdateStatus(null);
    }
  };
  
  const handleMarkAsSent = useCallback(async () => {
    if (!proposalToShare) return;
    try {
        const updatedProposal = await updateProposalStatus(proposalToShare.proposal_id, 'Enviado');
        addToast('Proposta marcada como enviada!', 'info');
        setProposals(prev => 
            prev.map(p => p.proposal_id === proposalToShare.proposal_id ? updatedProposal : p)
        );
        setProposalToShare(updatedProposal); 
    } catch (err: any) {
        addToast(err.message, 'error');
    }
  }, [proposalToShare, addToast]);
  
  // --- Swipe Gesture Handlers ---
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, proposalId: string) => {
    isSwipingRef.current = false;
    setSwipedProposal({ id: proposalId, startX: e.touches[0].clientX, deltaX: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!swipedProposal) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - swipedProposal.startX;
    if (Math.abs(deltaX) > 10) { // Threshold to detect a swipe vs. a click
        isSwipingRef.current = true;
    }
    setSwipedProposal({ ...swipedProposal, deltaX });
  };

  const handleTouchEnd = (proposal: Proposal) => {
    if (!swipedProposal) return;
    const threshold = 120;

    if (swipedProposal.deltaX > threshold) {
        // Swipe Right -> Open Archive Confirmation Modal
        setProposalToUpdateStatus(proposal);
    } else if (swipedProposal.deltaX < -threshold) {
        // Swipe Left -> Share
        handleOpenShareModal(proposal);
    }
    
    // Reset swipe state regardless of action
    setSwipedProposal(null);
    setTimeout(() => { isSwipingRef.current = false; }, 100);
  };

  const handleCardClick = (proposal: Proposal) => {
    if (isSwipingRef.current) return;
    handleOpenModalForEdit(proposal); // Click -> Edit
  };


  const getStatusStyles = (status: string | null) => {
    switch(status) {
        case 'Rascunho': return { bg: 'bg-yellow-900 text-yellow-200', border: 'border-yellow-500' };
        case 'Enviado': return { bg: 'bg-blue-800 text-blue-200', border: 'border-blue-500' };
        case 'Aprovado': return { bg: 'bg-green-900 text-green-200', border: 'border-green-500' };
        case 'Recusado': return { bg: 'bg-red-900 text-red-200', border: 'border-red-500' };
        case 'Arquivado': return { bg: 'bg-gray-700 text-gray-300', border: 'border-gray-500' };
        default: return { bg: 'bg-gray-600 text-gray-200', border: 'border-gray-400' };
    }
  }

  const proposalToEditForForm = useMemo(() => {
    if (!proposalToEdit) return undefined;
    return {
      ...proposalToEdit,
      // Ensure 'items' is an array before mapping. If it's null or undefined, default to an empty array.
      items: (proposalToEdit.items || []).map((item, index) => ({
        ...item,
        id: `${proposalToEdit.proposal_id}-${index}`,
      })),
    };
  }, [proposalToEdit]);
  
  const statusFilterOptions = ['Todos', 'Rascunho', 'Enviado', 'Aprovado', 'Recusado'];


  if (isLoading && proposals.length === 0) {
    return <div className="p-6 text-center text-gray-300">Carregando propostas...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-400">Erro ao carregar propostas: {error}</div>;
  }
  
  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
        }
      `}</style>
      
      {proposalForPdf && (
        <div id="printable-area" className="hidden print-area">
          <ProposalPDFLayout proposal={proposalForPdf} />
        </div>
      )}

      <div className="p-2 md:p-3 print-hidden">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-2 gap-2">
            <h1 className="text-xl md:text-2xl font-semibold text-white">Lista de Propostas</h1>
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-auto md:flex-grow">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border bg-gray-800 border-gray-600 text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button onClick={() => setShowFilters(!showFilters)} variant={showFilters ? 'primary' : 'secondary'} className="p-2.5" title="Filtros">
                        <FiFilter />
                    </Button>
                    <Button onClick={fetchProposals} variant="secondary" className="p-2.5" title="Recarregar Propostas">
                        <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                    <Button onClick={handleOpenModalForAdd} variant="primary" className='flex-grow whitespace-nowrap md:flex-grow-0'>
                        <FiPlus className="mr-2" /> Nova Proposta
                    </Button>
                </div>
            </div>
        </div>

        {showFilters && (
            <div className="bg-gray-800/50 p-2 md:p-3 rounded-lg mb-2 flex flex-col sm:flex-row items-center gap-2">
                <div className="w-full sm:w-auto">
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        {statusFilterOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div className="w-full sm:w-auto sm:ml-auto pt-5">
                    <label htmlFor="show-archived" className="flex items-center cursor-pointer">
                        <span className="mr-3 text-sm text-gray-300">Mostrar arquivadas</span>
                        <div className="relative">
                            <input type="checkbox" id="show-archived" className="sr-only" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                            <div className={`block ${showArchived ? 'bg-blue-600' : 'bg-gray-600'} w-14 h-8 rounded-full`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showArchived ? 'transform translate-x-6' : ''}`}></div>
                        </div>
                    </label>
                </div>
            </div>
        )}

        <div>
          {filteredProposals.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-gray-800/50 rounded-lg border border-gray-700/50 backdrop-blur-sm overflow-hidden">
                <table className="w-full text-xs divide-y divide-gray-700/30">
                  <thead className="bg-gray-700/50 border-b border-gray-700/50">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-semibold text-gray-300 text-xs">Código</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-gray-300 text-xs">Cliente</th>
                      <th className="px-2 py-1.5 text-right font-semibold text-gray-300 text-xs">Valor</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-gray-300 text-xs">Status</th>
                      <th className="px-2 py-1.5 text-center font-semibold text-gray-300 text-xs">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {filteredProposals.map((proposal) => (
                        <tr key={proposal.proposal_id} className={`hover:bg-gray-700/30 transition-colors text-xs ${proposal.status === 'Arquivado' ? 'opacity-60' : ''}`}>
                          <td className="px-2 py-1 text-xs font-mono text-gray-200">{proposal.proposal_code}</td>
                          <td className="px-2 py-1 text-xs text-gray-200 truncate max-w-[120px]">{proposal.empresas_unidades?.nome_fantasia || proposal.empresas_unidades?.razao_social || 'N/A'}</td>
                          <td className="px-2 py-1 text-xs text-right text-gray-200 font-semibold whitespace-nowrap">{formatCurrency(proposal.total_value)}</td>
                          <td className="px-2 py-1 text-xs">
                              <span className={`px-1 py-0.5 text-xs font-semibold rounded inline-block ${getStatusStyles(proposal.status).bg}`}>
                                {proposal.status}
                              </span>
                          </td>
                          <td className="px-2 py-1 text-center">
                              <div className="flex justify-center items-center gap-0.5">
                                {proposal.status === 'Aprovado' && (
                                  <button onClick={() => onGenerateContract(proposal)} className="text-gray-400 hover:text-purple-300 p-0.5" title="Gerar Contrato"> <FiPenTool size={12} /> </button>
                                )}
                                <button onClick={() => handleOpenShareModal(proposal)} className="text-gray-400 hover:text-green-300 p-0.5" title="Compartilhar"> <FiShare2 size={12} /> </button>
                                <button onClick={() => handleOpenModalForEdit(proposal)} className="text-gray-400 hover:text-blue-300 p-0.5" title="Editar"> <FiEdit size={12} /> </button>
                                <button onClick={() => setProposalToUpdateStatus(proposal)} className="text-gray-400 hover:text-yellow-300 p-0.5" title={proposal.status === 'Arquivado' ? 'Desarquivar' : 'Arquivar'}>
                                    {proposal.status === 'Arquivado' ? <FiUnlock size={12} /> : <FiArchive size={12} />}
                                </button>
                              </div>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredProposals.map((proposal) => {
                  const isBeingSwiped = swipedProposal?.id === proposal.proposal_id;
                  const deltaX = isBeingSwiped ? swipedProposal.deltaX : 0;
                  const cardStyle = {
                      transform: `translateX(${deltaX}px)`,
                      transition: isBeingSwiped ? 'none' : 'transform 0.3s ease-out',
                  };
                  const opacity = 1 - Math.abs(deltaX) / (window.innerWidth * 0.8);
                  return (
                    <div key={proposal.proposal_id} className="relative bg-gray-700 rounded-lg overflow-hidden">
                      {/* Background actions */}
                       <div className="absolute inset-0 flex justify-between items-center text-white">
                            <div className="flex items-center pl-6 h-full bg-green-600" style={{ opacity: Math.max(0, -deltaX / 70), transform: `translateX(${Math.min(0, -deltaX - 70)}px)`}}>
                                <FiShare2 size={24} />
                            </div>
                            <div className="flex items-center pr-6 h-full bg-yellow-500" style={{ opacity: Math.max(0, deltaX / 70), transform: `translateX(${Math.max(0, deltaX - 70)}px)`}}>
                                <FiArchive size={24} />
                            </div>
                        </div>

                      <div 
                        style={{...cardStyle, opacity}}
                        className={`relative bg-gray-800 shadow-lg rounded-lg border-l-4 ${getStatusStyles(proposal.status).border} ${proposal.status === 'Arquivado' ? 'opacity-60' : ''}`}
                        onTouchStart={(e) => handleTouchStart(e, proposal.proposal_id)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={() => handleTouchEnd(proposal)}
                        onClick={() => handleCardClick(proposal)}
                      >
                          <div className="p-4 space-y-4">
                              <div className="flex justify-between items-start gap-4">
                                  <div>
                                      <p className="text-lg font-bold text-white truncate">{proposal.empresas_unidades?.nome_fantasia || proposal.empresas_unidades?.razao_social || 'Cliente'}</p>
                                      <p className="text-sm text-gray-400 font-mono">{proposal.proposal_code}</p>
                                  </div>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyles(proposal.status).bg} whitespace-nowrap`}>
                                      {proposal.status}
                                  </span>
                              </div>
                              <div className="flex justify-between items-end">
                                  <div>
                                      <p className="text-sm text-gray-400">Valor Total</p>
                                      <p className="text-xl font-semibold text-blue-400">{formatCurrency(proposal.total_value)}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      {proposal.status === 'Aprovado' && (
                                        <button onClick={(e) => { e.stopPropagation(); onGenerateContract(proposal); }} className="text-gray-400 hover:text-purple-400 transition-colors p-2" title="Gerar Contrato"> <FiPenTool size={20} /> </button>
                                      )}
                                      <button onClick={(e) => { e.stopPropagation(); handleOpenShareModal(proposal); }} className="text-gray-400 hover:text-green-400 transition-colors p-2" title="Compartilhar"> <FiShare2 size={20} /> </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleOpenModalForEdit(proposal); }} className="text-gray-400 hover:text-blue-400 transition-colors p-2" title="Editar"> <FiEdit size={20} /> </button>
                                      <button onClick={(e) => { e.stopPropagation(); setProposalToUpdateStatus(proposal); }} className="text-gray-400 hover:text-yellow-400 transition-colors p-2" title={proposal.status === 'Arquivado' ? 'Desarquivar' : 'Arquivar'}>
                                          {proposal.status === 'Arquivado' ? <FiUnlock size={20} /> : <FiArchive size={20} />}
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-gray-800 shadow-md rounded-lg text-center py-20 text-gray-400">
                <FiFileText className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-white">Nenhuma proposta encontrada</h3>
                <p>Tente ajustar seus filtros ou crie uma nova proposta.</p>
            </div>
          )}
        </div>

        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={proposalToEdit ? 'Editar Proposta' : 'Adicionar Nova Proposta'}>
          <ProposalForm
            proposalToEdit={proposalToEditForForm as (ProposalFormData & {proposal_id?: string, proposal_code?: string}) | undefined}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            isLoading={isSubmitting}
          />
        </Modal>

        <Modal isOpen={!!proposalToUpdateStatus} onClose={() => setProposalToUpdateStatus(null)} title={proposalToUpdateStatus?.status !== 'Arquivado' ? 'Confirmar Arquivamento' : 'Confirmar Desarquivamento'} closeOnBackdrop>
              <div>
                  <p className="text-gray-300 mb-6">
                      {proposalToUpdateStatus?.status !== 'Arquivado' ? 
                          <>Você tem certeza que deseja arquivar a proposta <strong className="font-semibold text-white">{proposalToUpdateStatus?.proposal_code}</strong>?</> :
                          <>Você tem certeza que deseja desarquivar a proposta <strong className="font-semibold text-white">{proposalToUpdateStatus?.proposal_code}</strong>?</>
                      }
                  </p>
                  <div className="flex justify-end gap-4">
                      <Button variant="secondary" onClick={() => setProposalToUpdateStatus(null)} disabled={isSubmitting}>
                          Cancelar
                      </Button>
                      <Button variant={proposalToUpdateStatus?.status !== 'Arquivado' ? 'danger' : 'primary'} onClick={() => handleStatusUpdate()} disabled={isSubmitting}>
                          {isSubmitting ? 'Processando...' : (proposalToUpdateStatus?.status !== 'Arquivado' ? 'Arquivar' : 'Desarquivar')}
                      </Button>
                  </div>
              </div>
        </Modal>
        
        <ShareModal 
            isOpen={!!proposalToShare}
            onClose={handleCloseShareModal}
            proposal={proposalToShare}
            onMarkAsSent={handleMarkAsSent}
        />
      </div>
    </>
  );
};

export default ProposalsPage;