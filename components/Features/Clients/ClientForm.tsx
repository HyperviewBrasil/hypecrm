import React, { useState, useEffect } from 'react';
import { EmpresaUnidade, EmpresaUnidadeFormData } from '../../../types';
import Button from '../../UI/Button';
import { useToast } from '../../../contexts/ToastContext';
import { FiSearch } from 'react-icons/fi';

interface ClientFormProps {
  clientToEdit?: EmpresaUnidade | Partial<EmpresaUnidadeFormData> | null;
  onSubmit: (data: EmpresaUnidadeFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const initialFormData: EmpresaUnidadeFormData = {
  contact_name: '',
  contact_whatsapp: '',
  contact_email: '',
  nome_fantasia: '',
  razao_social: '',
  cnpj_unidade: '',
  data_fundacao_unidade: '',
  e_matriz: false,
  data_status: '',
  status_texto: 'Ativo',
  patrimonio: null,
  natureza_juridica: '',
  porte_acronimo: '',
  optante_simples: false,
  endereco_logradouro: '',
  endereco_numero: '',
  endereco_bairro: '',
  endereco_cidade: '',
  endereco_estado: '',
  endereco_cep: '',
  endereco_detalhes: '',
  cnae_principal_texto: '',
};

interface BrasilAPICNPJ {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  data_inicio_atividade: string;
  cnae_fiscal_descricao: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  natureza_juridica: string;
  descricao_porte: string;
  capital_social: number;
  opcao_pelo_simples: boolean;
  descricao_matriz_filial: string;
}

const FormSection: React.FC<{ title: string; children: React.ReactNode; description?: string; }> = ({ title, description, children }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
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

const ClientForm: React.FC<ClientFormProps> = ({ clientToEdit, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<EmpresaUnidadeFormData>(initialFormData);
  const [isCnpjLoading, setIsCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (clientToEdit) {
      const mergedData = { ...initialFormData, ...clientToEdit };
      mergedData.data_fundacao_unidade = mergedData.data_fundacao_unidade?.split('T')[0] ?? '';
      mergedData.data_status = mergedData.data_status?.split('T')[0] ?? '';
      mergedData.patrimonio = mergedData.patrimonio ?? null;

      delete (mergedData as any).client_id;
      delete (mergedData as any).inserted_by;
      delete (mergedData as any).data_atualizacao;
      
      setFormData(mergedData as EmpresaUnidadeFormData);

    } else {
      setFormData(initialFormData);
    }
  }, [clientToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'patrimonio') {
        setFormData(prev => ({ ...prev, [name]: value === '' ? null : parseFloat(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
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
        data_fundacao_unidade: data.data_inicio_atividade || '',
        e_matriz: data.descricao_matriz_filial?.toLowerCase() === 'matriz',
        porte_acronimo: data.descricao_porte || '',
        optante_simples: data.opcao_pelo_simples || false,
        natureza_juridica: data.natureza_juridica || '',
        endereco_logradouro: data.logradouro || '',
        endereco_numero: data.numero || '',
        endereco_bairro: data.bairro || '',
        endereco_cidade: data.municipio || '',
        endereco_estado: data.uf || '',
        endereco_cep: data.cep?.replace(/\D/g, '') || '',
        endereco_detalhes: data.complemento || '',
        cnae_principal_texto: data.cnae_fiscal_descricao || '',
        patrimonio: data.capital_social || null
      }));

      addToast('Dados da empresa preenchidos!', 'success');

    } catch (err: any) {
      setCnpjError(err.message);
      addToast(err.message, 'error');
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
      <FormSection title="Contato Principal">
        <InputField label="Nome do Contato" id="contact_name" name="contact_name" value={formData.contact_name} onChange={handleChange} required containerClassName="md:col-span-1" />
        <InputField label="WhatsApp" id="contact_whatsapp" name="contact_whatsapp" value={formData.contact_whatsapp} onChange={handleChange} />
        <InputField label="E-mail" id="contact_email" name="contact_email" type="email" value={formData.contact_email} onChange={handleChange} />
      </FormSection>

      <FormSection title="Dados da Empresa" description="Preencha o CNPJ e saia do campo para buscar e preencher os dados automaticamente.">
        <InputField label="Nome Fantasia" id="nome_fantasia" name="nome_fantasia" value={formData.nome_fantasia ?? ''} onChange={handleChange} containerClassName="md:col-span-2" />
        
        <div>
            <label htmlFor="cnpj_unidade" className="block text-sm font-medium text-gray-400 mb-1">CNPJ</label>
            <div className="relative">
                <input 
                    id="cnpj_unidade"
                    name="cnpj_unidade"
                    value={formData.cnpj_unidade}
                    onChange={handleCnpjChange}
                    onBlur={handleCnpjLookup}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
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
        
        <InputField label="Razão Social" id="razao_social" name="razao_social" value={formData.razao_social ?? ''} onChange={handleChange} containerClassName="md:col-span-3" />
      </FormSection>

       <FormSection title="Endereço">
        <InputField label="Logradouro" id="endereco_logradouro" name="endereco_logradouro" value={formData.endereco_logradouro ?? ''} onChange={handleChange} containerClassName="md:col-span-2" />
        <InputField label="Número" id="endereco_numero" name="endereco_numero" value={formData.endereco_numero ?? ''} onChange={handleChange} />
        <InputField label="Bairro" id="endereco_bairro" name="endereco_bairro" value={formData.endereco_bairro ?? ''} onChange={handleChange} />
        <InputField label="Cidade" id="endereco_cidade" name="endereco_cidade" value={formData.endereco_cidade ?? ''} onChange={handleChange} />
        <InputField label="Estado (UF)" id="endereco_estado" name="endereco_estado" value={formData.endereco_estado ?? ''} onChange={handleChange} maxLength={2} />
        <InputField label="CEP" id="endereco_cep" name="endereco_cep" value={formData.endereco_cep ?? ''} onChange={handleChange} />
      </FormSection>

      <FormSection title="Informações Adicionais da Empresa">
        <InputField label="Data de Fundação" id="data_fundacao_unidade" name="data_fundacao_unidade" type="date" value={formData.data_fundacao_unidade ?? ''} onChange={handleChange} />
        <InputField label="Natureza Jurídica" id="natureza_juridica" name="natureza_juridica" value={formData.natureza_juridica ?? ''} onChange={handleChange} containerClassName="md:col-span-2"/>
        <InputField label="Porte" id="porte_acronimo" name="porte_acronimo" value={formData.porte_acronimo ?? ''} onChange={handleChange} />
         <InputField label="Patrimônio" id="patrimonio" name="patrimonio" type="number" step="0.01" value={formData.patrimonio ?? ''} onChange={handleChange} />
        <div className="flex items-center mt-6 gap-6">
            <div className="flex items-center">
              <input type="checkbox" id="e_matriz" name="e_matriz" checked={!!formData.e_matriz} onChange={handleChange} className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"/>
              <label htmlFor="e_matriz" className="ml-2 block text-sm text-gray-300">É Matriz?</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="optante_simples" name="optante_simples" checked={!!formData.optante_simples} onChange={handleChange} className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"/>
              <label htmlFor="optante_simples" className="ml-2 block text-sm text-gray-300">Optante do Simples?</label>
            </div>
        </div>
      </FormSection>


      <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={isLoading || isCnpjLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Cliente'}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;