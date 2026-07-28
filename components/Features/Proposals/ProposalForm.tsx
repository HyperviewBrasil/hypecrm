import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProposalFormData, ProposalItem, EmpresaUnidade } from '../../../types';
import { getActiveClients, addQuickClient } from '../../../services/clientService';
import Button from '../../UI/Button';
import { FiPlus, FiTrash2, FiSearch, FiUserPlus } from 'react-icons/fi';
import { useToast } from '../../../contexts/ToastContext';
import QuickClientModal from './QuickClientModal';

interface ProposalFormProps {
  proposalToEdit?: ProposalFormData & { proposal_id?: string; proposal_code?: string; };
  onSubmit: (data: ProposalFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const initialFormData: ProposalFormData = {
  client_id: null,
  contact_person: '',
  contact_whatsapp: '',
  event_description: '',
  event_location: '',
  start_date: '',
  end_date: '',
  items: [],
  travel_costs: 0,
  production_costs: 0,
  discount: 0,
  status: 'Rascunho',
};

// Reusable components for form structure
const FormSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={className}>
        <h3 className="text-md font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-4">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input id={id} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props} />
    </div>
);

const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <textarea id={id} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props} />
    </div>
);

const ProposalForm: React.FC<ProposalFormProps> = ({ proposalToEdit, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<ProposalFormData>(initialFormData);
  const [clients, setClients] = useState<EmpresaUnidade[]>([]);
  const { addToast } = useToast();
  
  // State for the new client search UI
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  
  // State for Quick Add Modal
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  useEffect(() => {
    const fetchClientsData = async () => {
      try {
        const clientData = await getActiveClients();
        setClients(clientData);
      } catch (error: any) {
        addToast(error.message, 'error');
      }
    };
    fetchClientsData();
  }, [addToast]);
  
  // Click outside handler for search results - only affects search, not modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Only close search if clicking outside AND not on the modal
      const modalElement = document.querySelector('.fixed.inset-0.z-50');
      if (modalElement && modalElement.contains(event.target as Node)) {
        return; // Click is inside modal, do nothing
      }
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (proposalToEdit) {
      setFormData({
        ...initialFormData,
        ...proposalToEdit,
        start_date: proposalToEdit.start_date?.split('T')[0] ?? '',
        end_date: proposalToEdit.end_date?.split('T')[0] ?? '',
      });
    } else {
      setFormData(initialFormData);
    }
  }, [proposalToEdit]);
  
  const { days, total } = useMemo(() => {
    let days = 0;
    if (formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        if (end >= start) {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
    }
    const effectiveDays = days > 0 ? days : 1;
    const itemsDailyTotal = formData.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_value)), 0);
    const itemsPeriodTotal = itemsDailyTotal * effectiveDays;
    const subtotal = itemsPeriodTotal + Number(formData.travel_costs) + Number(formData.production_costs);
    const total = subtotal - Number(formData.discount);
    return { days, total };
  }, [formData]);

  const selectedClient = useMemo(() => {
    if (!formData.client_id || clients.length === 0) return null;
    return clients.find(c => c.client_id === formData.client_id);
  }, [formData.client_id, clients]);
  
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return [];
    
    const lowercasedFilter = clientSearchTerm.toLowerCase().trim();
    if (!lowercasedFilter) return [];

    return clients.filter(client => {
        // Text fields check
        if (client.nome_fantasia?.toLowerCase().includes(lowercasedFilter)) return true;
        if (client.razao_social?.toLowerCase().includes(lowercasedFilter)) return true;
        if (client.contact_name?.toLowerCase().includes(lowercasedFilter)) return true;

        // Numeric/Formatted fields check: clean both the data and the search term
        const digitsOnlyFilter = lowercasedFilter.replace(/\D/g, '');
        if (digitsOnlyFilter.length > 0) {
            if (client.contact_whatsapp?.replace(/\D/g, '').includes(digitsOnlyFilter)) return true;
            if (client.cnpj_unidade?.replace(/\D/g, '').includes(digitsOnlyFilter)) return true;
        }
        
        // Special case for non-numeric part of CNPJ (e.g., 'Q-')
        const hasLetters = /[a-z]/i.test(lowercasedFilter);
        if (hasLetters && client.cnpj_unidade?.toLowerCase().includes(lowercasedFilter)) {
            return true;
        }

        return false;
    });
  }, [clientSearchTerm, clients]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectClient = (client: EmpresaUnidade) => {
    setFormData(prev => ({ 
        ...prev, 
        client_id: client.client_id,
        contact_person: client.contact_name || prev.contact_person,
        contact_whatsapp: client.contact_whatsapp || prev.contact_whatsapp,
    }));
    setClientSearchTerm('');
    setIsSearchFocused(false);
  };
  
  const handleClearClient = () => {
     setFormData(prev => ({ ...prev, client_id: null, contact_person: '', contact_whatsapp: '' }));
     setClientSearchTerm('');
  };
  
  const handleQuickAddSubmit = async (name: string, whatsapp: string) => {
    setIsQuickAdding(true);
    try {
        const newClient = await addQuickClient(name, whatsapp);
        setClients(prev => [newClient, ...prev]); // Add new client to the list
        handleSelectClient(newClient); // Automatically select the new client
        addToast('Contato rápido adicionado com sucesso!', 'success');
        setIsQuickAddModalOpen(false);
    } catch (err: any) {
        addToast(err.message, 'error');
    } finally {
        setIsQuickAdding(false);
    }
  };


  const handleItemChange = (id: string, field: keyof ProposalItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), item: '', quantity: 1, unit_value: 0 }],
    }));
  };

  const handleRemoveItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.client_id) {
          addToast("Por favor, selecione um cliente.", "error");
          return;
      }
      onSubmit(formData);
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-300">Dados da Proposta</h3>
                <span className="text-sm font-mono text-gray-400">
                  {proposalToEdit?.proposal_code ? `Editando: ${proposalToEdit.proposal_code}` : 'Código será gerado ao salvar'}
                </span>
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full sm:w-auto px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="Rascunho">Rascunho</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Recusado">Recusado</option>
                </select>
            </div>
        </div>

        {/* Top Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 gap-y-6">
            <FormSection title="Cliente e Contato">
                {selectedClient ? (
                    <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-white text-lg">{selectedClient.nome_fantasia || selectedClient.razao_social}</p>
                                <p className="text-sm text-gray-400">CNPJ: {selectedClient.cnpj_unidade.startsWith('Q-') ? 'Não informado' : selectedClient.cnpj_unidade}</p>
                            </div>
                            <Button type="button" variant="secondary" onClick={handleClearClient} className="text-sm py-1 px-3 flex-shrink-0">Trocar</Button>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-700 space-y-1 text-sm">
                            <p><strong className="text-gray-400 font-medium">Contato:</strong> <span className="text-gray-200">{formData.contact_person}</span></p>
                            <p><strong className="text-gray-400 font-medium">WhatsApp:</strong> <span className="text-gray-200">{formData.contact_whatsapp}</span></p>
                        </div>
                    </div>
                ) : (
                    <div className="relative" ref={searchWrapperRef}>
                        <label htmlFor="client_search" className="block text-sm font-medium text-gray-400 mb-1">Buscar Cliente</label>
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                id="client_search"
                                type="text"
                                value={clientSearchTerm}
                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                placeholder="Nome, CNPJ, WhatsApp..."
                                autoComplete="off"
                                className="w-full pl-10 pr-4 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        {isSearchFocused && clientSearchTerm && (
                            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredClients.length > 0 ? (
                                    filteredClients.map(client => (
                                        <div key={client.client_id} onClick={() => handleSelectClient(client)} className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                                            <p className="font-semibold text-white">{client.nome_fantasia || client.contact_name}</p>
                                            <p className="text-sm text-gray-400">{client.cnpj_unidade.startsWith('Q-') ? `Contato: ${client.contact_name}` : client.cnpj_unidade}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-gray-400 text-center">Nenhum cliente encontrado.</div>
                                )}
                                <div className="p-2 border-t border-gray-700">
                                    <Button type="button" variant="secondary" className="w-full text-sm" onClick={() => setIsQuickAddModalOpen(true)}>
                                        <FiUserPlus className="mr-2" />
                                        Não encontrou? Cadastrar novo contato
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </FormSection>
            
            <FormSection title="Período">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Data Inicial" id="start_date" name="start_date" type="date" value={formData.start_date ?? ''} onChange={handleChange} />
                    <InputField label="Data Final" id="end_date" name="end_date" type="date" value={formData.end_date ?? ''} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Total de Diárias</label>
                    <div className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-md">{days > 0 ? days : '-'}</div>
                </div>
            </FormSection>
        </div>

        {/* Full-width Sections */}
        <FormSection title="Detalhes do Evento">
            <TextareaField 
                label="Descrição do Evento/Projeto" 
                id="event_description" 
                name="event_description" 
                value={formData.event_description} 
                onChange={handleChange} 
                rows={4}
                placeholder="Ex: Lançamento do produto X no evento Y"
            />
            <InputField 
                label="Local/Cidade do Evento" 
                id="event_location" 
                name="event_location" 
                value={formData.event_location} 
                onChange={handleChange} 
                placeholder="Ex: São Paulo, SP"
            />
        </FormSection>
        
        <FormSection title="Custos e Descontos">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField label="Custos de Deslocamento" id="travel_costs" name="travel_costs" type="number" step="0.01" value={formData.travel_costs} onChange={handleChange} />
                <InputField label="Custos de Produção" id="production_costs" name="production_costs" type="number" step="0.01" value={formData.production_costs} onChange={handleChange} />
                <InputField label="Desconto Global" id="discount" name="discount" type="number" step="0.01" value={formData.discount} onChange={handleChange} />
             </div>
        </FormSection>

        {/* Items Section - Full Width */}
        <FormSection title="Itens da Proposta" className="pt-4">
             <div className="hidden md:grid grid-cols-12 gap-4 text-xs text-gray-400 px-1 mb-2 font-medium uppercase">
                <div className="col-span-6">Descrição</div>
                <div className="col-span-2 text-center">Qtd.</div>
                <div className="col-span-3 text-right">Valor Unit. (diária)</div>
             </div>
             <div className="space-y-4">
                {formData.items.map((item) => (
                    <div key={item.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 md:bg-transparent md:p-0 md:border-none md:grid md:grid-cols-12 md:gap-4 md:items-center">
                        <div className="col-span-12 md:col-span-6">
                             <label className="text-xs font-medium text-gray-400 mb-1 md:hidden">Descrição</label>
                             <input type="text" placeholder="Descrição do Item" value={item.item} onChange={e => handleItemChange(item.id, 'item', e.target.value)} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md" />
                        </div>
                        
                        <div className="col-span-12 md:col-span-6 grid grid-cols-3 gap-2 mt-2 md:mt-0 md:contents">
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-xs font-medium text-gray-400 mb-1 md:hidden">Qtd.</label>
                                <input type="number" placeholder="Qtd" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value))} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md text-center" />
                            </div>
                            <div className="col-span-2 md:col-span-3">
                                <label className="text-xs font-medium text-gray-400 mb-1 md:hidden">Valor Unit.</label>
                                <input type="number" step="0.01" placeholder="Valor Unit." value={item.unit_value} onChange={e => handleItemChange(item.id, 'unit_value', parseFloat(e.target.value))} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md text-right" />
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center mt-2 md:mt-0">
                           <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-300 h-10 w-10 flex justify-center items-center"><FiTrash2 size={18} /></button>
                        </div>
                    </div>
                ))}
             </div>
             <Button type="button" variant="secondary" onClick={handleAddItem} className="mt-3 text-sm">
                <FiPlus className="mr-2"/> Adicionar Item
             </Button>
        </FormSection>

        {/* Total and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-4 border-t border-gray-700">
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Valor Total da Proposta</label>
                <div className="px-4 py-2 bg-gray-900 border border-blue-500 text-2xl font-bold text-white rounded-md">
                    R$ {total.toFixed(2)}
                </div>
             </div>
             <div className="flex justify-end gap-4">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar Proposta'}
                </Button>
            </div>
        </div>
    </form>
    
    <QuickClientModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onSubmit={handleQuickAddSubmit}
        isLoading={isQuickAdding}
    />
    </>
  );
};

export default ProposalForm;