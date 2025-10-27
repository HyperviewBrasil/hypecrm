import React, { useState, useEffect, useMemo } from 'react';
import { Proposal, Contract, ContractFormData } from '../../../types';
import Button from '../../UI/Button';
import { useToast } from '../../../contexts/ToastContext';

interface ContractFormProps {
  proposal?: Proposal | null; // For creation
  contractToEdit?: Contract | null; // For editing
  onSubmit: (data: ContractFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  contractCode: string;
}

const FormSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`mb-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-4">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
      {children}
    </div>
  </div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, containerClassName?: string }> = ({ label, id, containerClassName, ...props }) => (
    <div className={containerClassName}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input id={id} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props} />
    </div>
);

const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string, containerClassName?: string }> = ({ label, id, containerClassName, ...props }) => (
    <div className={containerClassName}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <textarea id={id} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props}></textarea>
    </div>
);

const ContractForm: React.FC<ContractFormProps> = ({ proposal, contractToEdit, onSubmit, onCancel, isLoading, contractCode }) => {
  const [formData, setFormData] = useState<ContractFormData | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (contractToEdit) {
        setFormData({
            ...contractToEdit,
            items: contractToEdit.items.map((item, index) => ({ ...item, id: `item-${index}` })),
        });
    } else if (proposal) {
      setFormData({
        proposal_id: proposal.proposal_id,
        signatory_name: '',
        signatory_cpf: '',
        signatory_rg: '',
        signatory_address: '',
        signatory_emails: '',
        installation_address: '',
        installation_contact_name: '',
        installation_contact_whatsapp: '',
        billing_contact_name: '',
        billing_contact_email: '',
        items: proposal.items.map((item, index) => ({ ...item, id: `item-${index}` })),
        travel_costs: proposal.travel_costs,
        production_costs: proposal.production_costs,
        discount: proposal.discount,
        contract_value: proposal.total_value,
        status: 'Rascunho',
        purchase_order: '',
        additional_info: '',
      });
    }
  }, [proposal, contractToEdit]);
  
  const sourceProposal = useMemo(() => contractToEdit?.proposals || proposal, [contractToEdit, proposal]);
  const client = sourceProposal?.empresas_unidades;

  const { total, days } = useMemo(() => {
      if (!formData) return { total: 0, days: 1 };
  
      let days = 1;
      if (sourceProposal?.start_date && sourceProposal?.end_date) {
          const start = new Date(sourceProposal.start_date);
          const end = new Date(sourceProposal.end_date);
          if (end >= start) {
              const diffTime = Math.abs(end.getTime() - start.getTime());
              days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          }
      }
      
      const itemsDailyTotal = formData.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_value)), 0);
      const itemsPeriodTotal = itemsDailyTotal * days;
      
      const subtotal = itemsPeriodTotal + Number(formData.travel_costs) + Number(formData.production_costs);
      const total = subtotal - Number(formData.discount);

      return { total, days };
  }, [formData, sourceProposal]);


  useEffect(() => {
      if (formData) {
          setFormData(prev => prev ? { ...prev, contract_value: total } : null);
      }
  }, [total]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => (prev ? { ...prev, [name]: value } : null));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData) {
          addToast("Dados do formulário não inicializados.", "error");
          return;
      }
      onSubmit(formData);
  };
  
  if (!formData || !client) {
      return <div className="p-6 text-center text-gray-300">Carregando dados...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Info Card */}
        <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Cliente</h3>
            <div className="bg-gray-800 p-4 rounded-md border border-gray-700 h-full">
                <p className="font-bold text-white text-lg">{client.nome_fantasia || client.razao_social}</p>
                <p className="text-sm text-gray-400">CNPJ: {client.cnpj_unidade.startsWith('Q-') ? 'Não informado' : client.cnpj_unidade}</p>
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-1 text-sm">
                    <p><strong className="text-gray-400 font-medium">Proposta Origem:</strong> <span className="text-blue-400 font-mono">{sourceProposal?.proposal_code}</span></p>
                    <p><strong className="text-gray-400 font-medium">Contato Principal:</strong> <span className="text-gray-200">{client.contact_name}</span></p>
                </div>
            </div>
        </div>

        {/* Contract Info */}
        <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Informações do Contrato</h3>
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Código do Contrato</label>
                    <div className="w-full px-3 py-2 bg-gray-800 text-lg font-mono font-semibold text-white rounded-md">{contractCode}</div>
                </div>
                 <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="Rascunho">Rascunho</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Arquivado">Arquivado</option>
                    </select>
                </div>
             </div>
        </div>
      </div>
      
      <FormSection title="Dados do Responsável (Signatário)">
          <InputField label="Nome Completo" id="signatory_name" name="signatory_name" value={formData.signatory_name} onChange={handleChange} required containerClassName="md:col-span-3"/>
          <InputField label="CPF" id="signatory_cpf" name="signatory_cpf" value={formData.signatory_cpf} onChange={handleChange} />
          <InputField label="RG" id="signatory_rg" name="signatory_rg" value={formData.signatory_rg} onChange={handleChange} />
          <InputField label="Endereço Completo" id="signatory_address" name="signatory_address" value={formData.signatory_address} onChange={handleChange} containerClassName="md:col-span-3"/>
          <InputField label="E-mails para envio (separados por vírgula)" id="signatory_emails" name="signatory_emails" type="email" multiple value={formData.signatory_emails} onChange={handleChange} containerClassName="md:col-span-3"/>
      </FormSection>

      <FormSection title="Local de Instalação e Contato">
        <InputField label="Endereço Completo de Instalação" id="installation_address" name="installation_address" value={formData.installation_address} onChange={handleChange} required containerClassName="md:col-span-3"/>
        <InputField label="Responsável no Local" id="installation_contact_name" name="installation_contact_name" value={formData.installation_contact_name} onChange={handleChange} containerClassName="md:col-span-2"/>
        <InputField label="WhatsApp do Responsável" id="installation_contact_whatsapp" name="installation_contact_whatsapp" value={formData.installation_contact_whatsapp} onChange={handleChange} />
      </FormSection>

      <FormSection title="Faturamento e Valores">
          <InputField label="Nome do Responsável Financeiro" id="billing_contact_name" name="billing_contact_name" value={formData.billing_contact_name} onChange={handleChange} required containerClassName="lg:col-span-2"/>
          <InputField label="E-mail para Faturas" id="billing_contact_email" name="billing_contact_email" type="email" value={formData.billing_contact_email} onChange={handleChange} required />
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Total de Diárias</label>
                    <div className="w-full px-3 py-2 bg-gray-800 text-lg font-semibold text-white rounded-md">{days > 0 ? days : '-'}</div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Valor Total do Contrato</label>
                    <div className="w-full px-3 py-2 bg-gray-900 border border-blue-500 text-lg font-bold text-white rounded-md">R$ {total.toFixed(2)}</div>
                </div>
            </div>
      </FormSection>

      <FormSection title="Informações Adicionais do Cliente">
        <InputField label="Ordem de Compra (O.C.) / Pedido" id="purchase_order" name="purchase_order" value={formData.purchase_order} onChange={handleChange} containerClassName="md:col-span-3"/>
        <TextareaField label="Observações e Detalhes Adicionais" id="additional_info" name="additional_info" value={formData.additional_info} onChange={handleChange} rows={4} containerClassName="md:col-span-3"/>
      </FormSection>

      <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Contrato'}
        </Button>
      </div>
    </form>
  );
};

export default ContractForm;