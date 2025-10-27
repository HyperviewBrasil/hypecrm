import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit, FiSearch, FiRefreshCw, FiArchive, FiUnlock } from 'react-icons/fi';
import {
  getClients,
  addClient,
  updateClient,
  updateClientStatus,
} from '../../../services/clientService';
import { EmpresaUnidade, EmpresaUnidadeFormData } from '../../../types';
import Button from '../../UI/Button';
import Modal from '../../UI/Modal';
import ClientForm from './ClientForm';
import { useToast } from '../../../contexts/ToastContext';

const ClientList: React.FC<{ 
  clientToCreate: Partial<EmpresaUnidadeFormData> | null;
  onClientCreated: () => void;
}> = ({ clientToCreate, onClientCreated }) => {
  const [clients, setClients] = useState<EmpresaUnidade[]>([]);
  const [filteredClients, setFilteredClients] = useState<EmpresaUnidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<EmpresaUnidade | Partial<EmpresaUnidadeFormData> | null>(null);
  const [clientToUpdateStatus, setClientToUpdateStatus] = useState<EmpresaUnidade | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const { addToast } = useToast();

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getClients();
      setClients(data);
    } catch (err: any) {
      console.error("Full error fetching clients:", err);
      let errorMessage = err.message || 'Ocorreu um erro desconhecido.';
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        errorMessage = 'Falha de rede ao buscar clientes. Verifique sua conexão com a internet.';
      }
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  useEffect(() => {
    if (clientToCreate) {
      setClientToEdit(clientToCreate); // Treat as editing for pre-filling
      setIsModalOpen(true);
    }
  }, [clientToCreate]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = clients
      .filter(client => {
        const isArchived = client.status_texto === 'Arquivado';
        return showArchived ? isArchived : !isArchived;
      })
      .filter(item =>
        (item.nome_fantasia?.toLowerCase() || '').includes(lowercasedFilter) ||
        (item.razao_social?.toLowerCase() || '').includes(lowercasedFilter) ||
        (item.contact_name?.toLowerCase() || '').includes(lowercasedFilter) ||
        item.cnpj_unidade.includes(lowercasedFilter)
      );
    setFilteredClients(filteredData);
  }, [searchTerm, clients, showArchived]);

  const handleOpenModalForAdd = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (client: EmpresaUnidade) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setClientToEdit(null);
    if (clientToCreate) {
      onClientCreated(); // Reset the prop in App.tsx
    }
  };

  const handleSubmit = async (formData: EmpresaUnidadeFormData) => {
    setIsSubmitting(true);
    try {
      if (clientToEdit && 'client_id' in clientToEdit) {
        await updateClient(clientToEdit.client_id, formData);
        addToast('Cliente atualizado com sucesso!', 'success');
      } else {
        await addClient(formData);
        addToast('Cliente adicionado com sucesso!', 'success');
      }
      handleCloseModal();
      await fetchClients(); // Refetch clients after submission
    } catch (err: any) {
      console.error(err);
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!clientToUpdateStatus) return;

    const isArchiving = clientToUpdateStatus.status_texto !== 'Arquivado';
    const newStatus = isArchiving ? 'Arquivado' : 'Ativo';
    const successMessage = isArchiving ? 'Cliente arquivado com sucesso!' : 'Cliente reativado com sucesso!';
    const actionVerb = isArchiving ? 'Arquivando...' : 'Reativando...';
    
    setIsSubmitting(true);
    try {
      await updateClientStatus(clientToUpdateStatus.client_id, newStatus);
      addToast(successMessage, 'success');
      setClientToUpdateStatus(null); // Close confirmation modal
      await fetchClients(); // Refetch
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusClasses = (status: string | null) => {
    switch(status) {
        case 'Ativo': return 'bg-green-900 text-green-200';
        case 'Arquivado': return 'bg-gray-700 text-gray-300';
        case 'Inativo': return 'bg-yellow-900 text-yellow-200';
        case 'Suspenso': return 'bg-red-900 text-red-200';
        default: return 'bg-gray-600 text-gray-200';
    }
  }


  if (isLoading && clients.length === 0) {
    return <div className="p-6 text-center text-gray-300">Carregando clientes...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-400">Erro ao carregar clientes: {error}</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-white">Lista de Clientes</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
           <div className="relative flex-grow">
             <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input
               type="text"
               placeholder="Buscar cliente..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border bg-gray-800 border-gray-600 text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
             />
           </div>
           <Button onClick={fetchClients} variant="secondary" className="p-2.5" title="Recarregar Clientes">
              <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
           </Button>
           <Button onClick={handleOpenModalForAdd} variant="primary" className='whitespace-nowrap'>
             <FiPlus className="mr-2" /> Novo Cliente
           </Button>
        </div>
      </div>
       <div className="flex justify-end mb-4">
          <label htmlFor="show-archived" className="flex items-center cursor-pointer">
              <span className="mr-3 text-sm text-gray-300">Mostrar arquivados</span>
              <div className="relative">
                  <input type="checkbox" id="show-archived" className="sr-only" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                  <div className={`block ${showArchived ? 'bg-blue-600' : 'bg-gray-600'} w-14 h-8 rounded-full`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showArchived ? 'transform translate-x-6' : ''}`}></div>
              </div>
          </label>
      </div>

      <div className="bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Empresa / Nome Fantasia</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contato Principal</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">CNPJ</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                    <tr key={client.client_id} className={`hover:bg-gray-700/50 transition-all duration-200 ${client.status_texto === 'Arquivado' ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{client.nome_fantasia || client.razao_social || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <p>{client.contact_name}</p>
                        <p className="text-xs text-gray-400">{client.contact_whatsapp}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{client.cnpj_unidade || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(client.status_texto)}`}>
                        {client.status_texto}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-4">
                        <button onClick={() => handleOpenModalForEdit(client)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Editar">
                            <FiEdit size={18} />
                        </button>
                        <button onClick={() => setClientToUpdateStatus(client)} className="text-yellow-400 hover:text-yellow-300 transition-colors" title={client.status_texto === 'Arquivado' ? 'Desarquivar' : 'Arquivar'}>
                             {client.status_texto === 'Arquivado' ? <FiUnlock size={18} /> : <FiArchive size={18} />}
                        </button>
                        </div>
                    </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">
                        Nenhum cliente encontrado.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={clientToEdit && 'client_id' in clientToEdit ? 'Editar Cliente' : 'Adicionar Novo Cliente'}>
        <ClientForm
          clientToEdit={clientToEdit}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

       <Modal isOpen={!!clientToUpdateStatus} onClose={() => setClientToUpdateStatus(null)} title={clientToUpdateStatus?.status_texto !== 'Arquivado' ? 'Confirmar Arquivamento' : 'Confirmar Reativação'}>
            <div>
                <p className="text-gray-300 mb-6">
                    {clientToUpdateStatus?.status_texto !== 'Arquivado' ? 
                        <>Você tem certeza que deseja arquivar o cliente <strong className="font-semibold text-white">{clientToUpdateStatus?.nome_fantasia || clientToUpdateStatus?.contact_name}</strong>? Ele ficará oculto da lista principal.</> :
                        <>Você tem certeza que deseja reativar o cliente <strong className="font-semibold text-white">{clientToUpdateStatus?.nome_fantasia || clientToUpdateStatus?.contact_name}</strong>? Ele voltará a aparecer na lista principal.</>
                    }
                </p>
                <div className="flex justify-end gap-4">
                    <Button variant="secondary" onClick={() => setClientToUpdateStatus(null)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button variant={clientToUpdateStatus?.status_texto !== 'Arquivado' ? 'danger' : 'primary'} onClick={handleStatusUpdate} disabled={isSubmitting}>
                        {isSubmitting ? 'Processando...' : (clientToUpdateStatus?.status_texto !== 'Arquivado' ? 'Arquivar' : 'Reativar')}
                    </Button>
                </div>
            </div>
      </Modal>

    </div>
  );
};

export default ClientList;