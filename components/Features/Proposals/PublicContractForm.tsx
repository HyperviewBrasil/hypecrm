import React, { useState, useEffect } from 'react';
import { PublicFinalizationFormData, EmpresaUnidade } from '../../../types';
import Button from '../../UI/Button';
import { useToast } from '../../../contexts/ToastContext';
import { FiSearch } from 'react-icons/fi';

interface PublicContractFormProps {
  isLoading: boolean;
  onSubmit: (data: PublicFinalizationFormData) => void;
  initialClientData?: EmpresaUnidade | null;
}

const initialFormData: PublicFinalizationFormData = {
  cnpj_unidade: '',
  razao_social: '',
  nome_fantasia: '',
  endereco_logradouro: '',
  endereco_numero: '',
  endereco_bairro: '',
  endereco_cidade: '',
  endereco_estado: '',
  endereco_cep: '',
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
  purchase_order: '',
  additional_info: '',
};

interface BrasilAPICNPJ {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-4">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
      {children}
    </div>
  </div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, containerClassName?: string }> = ({ label, id, containerClassName, ...props }) => (
    <div className={containerClassName}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}{props.required && <span className="text-red-400 ml-1">*</span>}</label>
        <input id={id} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props} />
    </div>
);

const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string, containerClassName?: string }> = ({ label, id, containerClassName, ...props }) => (
    <div className={containerClassName}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}{props.required && <span className="text-red-400 ml-1">*</span>}</label>
        <textarea id={id} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props}></textarea>
    </div>
);


const PublicContractForm: React.FC<PublicContractFormProps> = ({ isLoading, onSubmit, initialClientData }) => {
  const [formData, setFormData] = useState<PublicFinalizationFormData>(initialFormData);
  const [isCnpjLoading, setIsCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const { addToast } = useToast();
  
  useEffect(() => {
    if (initialClientData) {
        setFormData(prev => ({
            ...prev,
            cnpj_unidade: initialClientData.cnpj_unidade.startsWith('Q-') ? '' : initialClientData.cnpj_unidade,
            razao_social: initialClientData.razao_social ?? '',
            nome_fantasia: initialClientData.nome_fantasia ?? '',
            endereco_logradouro: initialClientData.endereco_logradouro ?? '',
            endereco_numero: initialClientData.endereco_numero ?? '',
            endereco_bairro: initialClientData.endereco_bairro ?? '',
            endereco_cidade: initialClientData.endereco_cidade ?? '',
            endereco_estado: initialClientData.endereco_estado ?? '',
            endereco_cep: initialClientData.endereco_cep ?? '',
            // Pre-fill some contact details if available
            billing_contact_name: initialClientData.contact_name ?? '',
            billing_contact_email: initialClientData.contact_email ?? '',
        }))
    }
  }, [initialClientData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formattedValue = value;
    if (value.length > 2) formattedValue = `${value.slice(0, 2)}.${value.slice(2)}`;
    if (value.length > 5) formattedValue = `${formattedValue.slice(0, 6)}.${formattedValue.slice(6)}`;
    if (value.length > 8) formattedValue = `${formattedValue.slice(0, 10)}/${formattedValue.slice(10)}`;
    if (value.length > 12) formattedValue = `${formattedValue.slice(0, 15)}-${formattedValue.slice(15)}`;
    
    setFormData(prev => ({ ...prev, cnpj_unidade: formattedValue.slice(0, 18) }));
  };

  const handleCnpjLookup = async () => {
    const cleanCnpj = formData.cnpj_unidade?.replace(/\D/g, '') ?? '';
    if (cleanCnpj.length !== 14) {
      if(formData.cnpj_unidade) setCnpjError('CNPJ inválido. Deve conter 14 dígitos.');
      return;
    }

    setIsCnpjLoading(true);
    setCnpjError(null);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'CNPJ não encontrado.' : 'Erro ao consultar CNPJ.');
      }
      const data: BrasilAPICNPJ = await response.json();
      
      setFormData(prev => ({
        ...prev,
        razao_social: data.razao_social || '',
        nome_fantasia: data.nome_fantasia || '',
        endereco_logradouro: data.logradouro || '',
        endereco_numero: data.numero || '',
        endereco_bairro: data.bairro || '',
        endereco_cidade: data.municipio || '',
        endereco_estado: data.uf || '',
        endereco_cep: data.cep?.replace(/\D/g, '') || '',
      }));

      addToast('Dados da empresa preenchidos!', 'success');

    } catch (err: any) {
      setCnpjError(err.message);
    } finally {
      setIsCnpjLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
        <FormSection title="Dados da Empresa Contratante">
            <div className="md:col-span-2">
                <label htmlFor="cnpj_unidade" className="block text-sm font-medium text-gray-400 mb-1">CNPJ <span className="text-red-400 ml-1">*</span></label>
                <div className="relative">
                    <input 
                        id="cnpj_unidade"
                        name="cnpj_unidade"
                        value={formData.cnpj_unidade ?? ''}
                        onChange={handleCnpjChange}
                        onBlur={handleCnpjLookup}
                        placeholder="00.000.000/0000-00"
                        className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
                        required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {isCnpjLoading ? (
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <FiSearch className="text-gray-400" />
                        )}
                    </div>
                </div>
                 {cnpjError && <p className="text-red-400 text-xs mt-1">{cnpjError}</p>}
            </div>
            <InputField label="Razão Social" id="razao_social" name="razao_social" value={formData.razao_social ?? ''} onChange={handleChange} required containerClassName="md:col-span-2"/>
            <InputField label="Nome Fantasia" id="nome_fantasia" name="nome_fantasia" value={formData.nome_fantasia ?? ''} onChange={handleChange} />
            <InputField label="Endereço (Logradouro)" id="endereco_logradouro" name="endereco_logradouro" value={formData.endereco_logradouro ?? ''} onChange={handleChange} required containerClassName="md:col-span-2"/>
            <InputField label="Número" id="endereco_numero" name="endereco_numero" value={formData.endereco_numero ?? ''} onChange={handleChange} required />
            <InputField label="Bairro" id="endereco_bairro" name="endereco_bairro" value={formData.endereco_bairro ?? ''} onChange={handleChange} required />
            <InputField label="Cidade" id="endereco_cidade" name="endereco_cidade" value={formData.endereco_cidade ?? ''} onChange={handleChange} required />
            <InputField label="Estado (UF)" id="endereco_estado" name="endereco_estado" value={formData.endereco_estado ?? ''} onChange={handleChange} required />
            <InputField label="CEP" id="endereco_cep" name="endereco_cep" value={formData.endereco_cep ?? ''} onChange={handleChange} required />
        </FormSection>

        <FormSection title="Dados do Responsável (Signatário)">
            <InputField label="Nome Completo" id="signatory_name" name="signatory_name" value={formData.signatory_name} onChange={handleChange} required containerClassName="md:col-span-3"/>
            <InputField label="CPF" id="signatory_cpf" name="signatory_cpf" value={formData.signatory_cpf} onChange={handleChange} required />
            <InputField label="RG" id="signatory_rg" name="signatory_rg" value={formData.signatory_rg} onChange={handleChange} />
            <InputField label="Endereço Completo do Signatário" id="signatory_address" name="signatory_address" value={formData.signatory_address} onChange={handleChange} required containerClassName="md:col-span-3"/>
            <InputField label="E-mails para envio (separados por vírgula)" id="signatory_emails" name="signatory_emails" type="text" value={formData.signatory_emails} onChange={handleChange} required containerClassName="md:col-span-3"/>
        </FormSection>

        <FormSection title="Local de Instalação e Contato">
            <InputField label="Endereço Completo de Instalação" id="installation_address" name="installation_address" value={formData.installation_address} onChange={handleChange} required containerClassName="md:col-span-3"/>
            <InputField label="Responsável no Local" id="installation_contact_name" name="installation_contact_name" value={formData.installation_contact_name} onChange={handleChange} required containerClassName="md:col-span-2"/>
            <InputField label="WhatsApp do Responsável" id="installation_contact_whatsapp" name="installation_contact_whatsapp" value={formData.installation_contact_whatsapp} onChange={handleChange} required />
        </FormSection>

        <FormSection title="Faturamento e Informações Adicionais">
            <InputField label="Nome do Responsável Financeiro" id="billing_contact_name" name="billing_contact_name" value={formData.billing_contact_name} onChange={handleChange} required containerClassName="md:col-span-2"/>
            <InputField label="E-mail para Faturas" id="billing_contact_email" name="billing_contact_email" type="email" value={formData.billing_contact_email} onChange={handleChange} required />
            <InputField label="Ordem de Compra (O.C.) / Pedido" id="purchase_order" name="purchase_order" value={formData.purchase_order ?? ''} onChange={handleChange} containerClassName="md:col-span-3"/>
            <TextareaField label="Informações Adicionais" id="additional_info" name="additional_info" value={formData.additional_info ?? ''} onChange={handleChange} rows={4} containerClassName="md:col-span-3"/>
        </FormSection>
        
        <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-700">
            <Button type="submit" variant="primary" disabled={isLoading || isCnpjLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Dados e Finalizar'}
            </Button>
        </div>
    </form>
  );
};

export default PublicContractForm;