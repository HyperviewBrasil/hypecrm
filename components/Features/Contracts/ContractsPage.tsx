import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiFileText, FiSearch, FiRefreshCw, FiEdit, FiShare2, FiArchive, FiUnlock } from 'react-icons/fi';
import { Proposal, Contract, ContractFormData } from '../../../types';
import { getContracts, addContract, updateContract, getNextContractCode, updateContractStatus } from '../../../services/contractService';
import Button from '../../UI/Button';
import Modal from '../../UI/Modal';
import ContractForm from './ContractForm';
import ContractShareModal from './ContractShareModal';
import ContractPDFLayout from './ContractPDFLayout';
import { useToast } from '../../../contexts/ToastContext';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface ContractsPageProps {
  proposalForContract: Proposal | null;
  onContractCreated: () => void;
}

const ContractsPage: React.FC<ContractsPageProps> = ({ proposalForContract, onContractCreated }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<Contract | null>(null);
  const [contractToUpdateStatus, setContractToUpdateStatus] = useState<Contract | null>(null);
  const [contractToShare, setContractToShare] = useState<Contract | null>(null);
  const [contractForPdf, setContractForPdf] = useState<Contract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [nextCode, setNextCode] = useState('');
  const { addToast } = useToast();

  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getContracts();
      setContracts(data);
    } catch (err: any) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);
  
  const fetchNextCode = useCallback(async () => {
    try {
      const code = await getNextContractCode();
      setNextCode(code);
    } catch (err: any) {
      addToast('Falha ao gerar código do contrato.', 'error');
    }
  }, [addToast]);


  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    if (proposalForContract) {
      setContractToEdit(null); // Ensure we are creating, not editing
      fetchNextCode();
      setIsModalOpen(true);
    }
  }, [proposalForContract, fetchNextCode]);


  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = contracts
      .filter(contract => {
        const isArchived = contract.status === 'Arquivado';
        return showArchived ? isArchived : !isArchived;
      })
      .filter(item =>
        (item.proposals?.empresas_unidades?.nome_fantasia?.toLowerCase() || '').includes(lowercasedFilter) ||
        (item.proposals?.empresas_unidades?.razao_social?.toLowerCase() || '').includes(lowercasedFilter) ||
        (item.contract_code.toLowerCase()).includes(lowercasedFilter) ||
        (item.proposals?.proposal_code.toLowerCase() || '').includes(lowercasedFilter)
      );
    setFilteredContracts(filteredData);
  }, [searchTerm, contracts, showArchived]);
  
  const handleOpenModalForEdit = (contract: Contract) => {
    setContractToEdit(contract);
    setIsModalOpen(true);
  };
  
  const handleOpenShareModal = (contract: Contract) => {
    setContractToShare(contract);
    setContractForPdf(contract); // Also set for PDF generation
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setContractToEdit(null);
    onContractCreated(); // Reset the prop in App.tsx
  };

  const handleSubmit = async (formData: ContractFormData) => {
    setIsSubmitting(true);
    try {
      if (contractToEdit) {
        await updateContract(contractToEdit.contract_id, formData);
        addToast('Contrato atualizado com sucesso!', 'success');
      } else {
        await addContract(formData);
        addToast('Contrato criado com sucesso!', 'success');
      }
      
      handleCloseModal();
      await fetchContracts();
    } catch (err: any) {
      console.error(err);
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleStatusUpdate = async () => {
    if (!contractToUpdateStatus) return;

    const isArchiving = contractToUpdateStatus.status !== 'Arquivado';
    const previousStatus = contractToUpdateStatus.status;
    const newStatus = isArchiving ? 'Arquivado' : (['Enviado', 'Concluído'].includes(previousStatus) ? previousStatus : 'Rascunho');
    const successMessage = isArchiving ? 'Contrato arquivado com sucesso!' : 'Contrato desarquivado com sucesso!';
    
    setIsSubmitting(true);
    try {
      await updateContractStatus(contractToUpdateStatus.contract_id, newStatus);
      addToast(successMessage, 'success');
      await fetchContracts();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
      setContractToUpdateStatus(null);
    }
  };

   const contractToEditForForm = useMemo(() => {
    if (!contractToEdit) return undefined;
    return {
      ...contractToEdit,
      items: contractToEdit.items.map((item, index) => ({
        ...item,
        id: `${contractToEdit.contract_id}-${index}`,
      })),
    };
  }, [contractToEdit]);

  const getStatusStyles = (status: string | null) => {
    switch(status) {
        case 'Rascunho': return 'bg-yellow-900 text-yellow-200';
        case 'Enviado': return 'bg-green-900 text-green-200';
        case 'Concluído': return 'bg-purple-800 text-purple-200';
        case 'Arquivado': return 'bg-gray-700 text-gray-300';
        default: return 'bg-gray-600 text-gray-200';
    }
  }

  if (isLoading && contracts.length === 0) {
    return <div className="p-6 text-center text-gray-300">Carregando contratos...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-400">Erro ao carregar contratos: {error}</div>;
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-contract-area, #printable-contract-area * { visibility: visible; }
          #printable-contract-area { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
        }
      `}</style>
      
      {contractForPdf && (
        <div id="printable-contract-area" className="hidden print-area">
          <ContractPDFLayout contract={contractForPdf} />
        </div>
      )}

      <div className="p-4 md:p-6 print-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-white">Lista de Contratos</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border bg-gray-800 border-gray-600 text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Button onClick={fetchContracts} variant="secondary" className="p-2.5" title="Recarregar Contratos">
                <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        <div className="flex justify-end mb-4">
            <label htmlFor="show-archived-contracts" className="flex items-center cursor-pointer">
                <span className="mr-3 text-sm text-gray-300">Mostrar arquivados</span>
                <div className="relative">
                    <input type="checkbox" id="show-archived-contracts" className="sr-only" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                    <div className={`block ${showArchived ? 'bg-blue-600' : 'bg-gray-600'} w-14 h-8 rounded-full`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showArchived ? 'transform translate-x-6' : ''}`}></div>
                </div>
            </label>
        </div>


        <div className="bg-gray-800 shadow-md rounded-lg">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden">
            <table className="w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contrato</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Proposta</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cliente</th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Valor</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-3 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredContracts.length > 0 ? (
                    filteredContracts.map((contract) => (
                        <tr key={contract.contract_id} className={`hover:bg-gray-700/50 transition-all duration-200 ${contract.status === 'Arquivado' ? 'opacity-60' : ''}`}>
                        <td className="px-3 py-4 whitespace-nowrap text-xs font-medium text-white font-mono">{contract.contract_code}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">{contract.proposals?.proposal_code}</td>
                        <td className="px-3 py-4 text-xs text-gray-300 truncate">{contract.proposals?.empresas_unidades?.nome_fantasia || contract.proposals?.empresas_unidades?.razao_social || '-'}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-300 font-semibold text-right">{formatCurrency(contract.contract_value)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-xs">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles(contract.status)}`}>
                            {contract.status}
                            </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center gap-2">
                              <button onClick={() => handleOpenShareModal(contract)} className="text-green-400 hover:text-green-300 transition-colors" title="Compartilhar/Ver PDF"> <FiShare2 size={16} /> </button>
                              <button onClick={() => handleOpenModalForEdit(contract)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Editar"> <FiEdit size={16} /> </button>
                              <button onClick={() => setContractToUpdateStatus(contract)} className="text-yellow-400 hover:text-yellow-300 transition-colors" title={contract.status === 'Arquivado' ? 'Desarquivar' : 'Arquivar'}>
                                  {contract.status === 'Arquivado' ? <FiUnlock size={16} /> : <FiArchive size={16} />}
                              </button>
                            </div>
                        </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400">
                            <FiFileText className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                            <h3 className="text-lg font-semibold text-white">Nenhum contrato encontrado</h3>
                            <p>Contratos são gerados a partir de propostas aprovadas.</p>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-700">
            {filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                    <div key={contract.contract_id} className={`p-4 space-y-2 ${contract.status === 'Arquivado' ? 'opacity-60' : ''}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono font-bold text-white">{contract.contract_code}</p>
                                <p className="text-xs text-gray-400 truncate">{contract.proposals?.empresas_unidades?.nome_fantasia || contract.proposals?.empresas_unidades?.razao_social || '-'}</p>
                            </div>
                            <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusStyles(contract.status)}`}>
                                {contract.status}
                            </span>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                            <p>Proposta: <span className="text-gray-300 font-mono">{contract.proposals?.proposal_code}</span></p>
                            <p>Valor: <span className="text-gray-300 font-semibold">{formatCurrency(contract.contract_value)}</span></p>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <button onClick={() => handleOpenShareModal(contract)} className="text-green-400 hover:text-green-300 transition-colors" title="Compartilhar"> <FiShare2 size={18} /> </button>
                          <button onClick={() => handleOpenModalForEdit(contract)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Editar"> <FiEdit size={18} /> </button>
                          <button onClick={() => setContractToUpdateStatus(contract)} className="text-yellow-400 hover:text-yellow-300 transition-colors" title={contract.status === 'Arquivado' ? 'Desarquivar' : 'Arquivar'}>
                              {contract.status === 'Arquivado' ? <FiUnlock size={18} /> : <FiArchive size={18} />}
                          </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-10 text-gray-400">
                    <FiFileText className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-semibold text-white">Nenhum contrato</h3>
                    <p className="text-sm">Gerados a partir de propostas aprovadas.</p>
                </div>
            )}
          </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={contractToEdit ? 'Editar Contrato' : 'Gerar Novo Contrato'}>
          <ContractForm
            proposal={proposalForContract}
            contractToEdit={contractToEditForForm}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            isLoading={isSubmitting}
            contractCode={contractToEdit?.contract_code || nextCode}
          />
        </Modal>

        <Modal isOpen={!!contractToUpdateStatus} onClose={() => setContractToUpdateStatus(null)} title={contractToUpdateStatus?.status !== 'Arquivado' ? 'Confirmar Arquivamento' : 'Confirmar Desarquivamento'} closeOnBackdrop>
            <div>
                <p className="text-gray-300 mb-6">
                    {contractToUpdateStatus?.status !== 'Arquivado' ? 
                        <>Você tem certeza que deseja arquivar o contrato <strong className="font-semibold text-white">{contractToUpdateStatus?.contract_code}</strong>?</> :
                        <>Você tem certeza que deseja desarquivar o contrato <strong className="font-semibold text-white">{contractToUpdateStatus?.contract_code}</strong>?</>
                    }
                </p>
                <div className="flex justify-end gap-4">
                    <Button variant="secondary" onClick={() => setContractToUpdateStatus(null)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button variant={contractToUpdateStatus?.status !== 'Arquivado' ? 'danger' : 'primary'} onClick={handleStatusUpdate} disabled={isSubmitting}>
                        {isSubmitting ? 'Processando...' : (contractToUpdateStatus?.status !== 'Arquivado' ? 'Arquivar' : 'Desarquivar')}
                    </Button>
                </div>
            </div>
        </Modal>


        <ContractShareModal 
            isOpen={!!contractToShare}
            onClose={() => setContractToShare(null)}
            contract={contractToShare}
        />

      </div>
    </>
  );
};

export default ContractsPage;