import React, { useState } from 'react';
import { EmpresaUnidadeFormData } from '../../../types';
import Button from '../../UI/Button';
import { FiSearch, FiCheckCircle } from 'react-icons/fi';

// This is a type for the data coming from the BrasilAPI
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
  descricao_porte: string;
  capital_social: number;
  opcao_pelo_simples: boolean;
  descricao_matriz_filial: string;
}

// Function to map API data to our form data structure
const mapApiDataToFormData = (apiData: BrasilAPICNPJ): Partial<EmpresaUnidadeFormData> => {
    // Sanitize CEP - remove non-digits
    const cep = apiData.cep?.replace(/\D/g, '');

    return {
        // Initialize contact fields as empty, as they are not provided by the API
        contact_name: '',
        contact_whatsapp: '',
        contact_email: '',
        
        // Map company data from the API
        cnpj_unidade: apiData.cnpj?.replace(/\D/g, ''),
        razao_social: apiData.razao_social,
        nome_fantasia: apiData.nome_fantasia,
        data_fundacao_unidade: apiData.data_inicio_atividade,
        e_matriz: apiData.descricao_matriz_filial?.toLowerCase() === 'matriz',
        porte_acronimo: apiData.descricao_porte,
        optante_simples: apiData.opcao_pelo_simples,
        endereco_logradouro: apiData.logradouro,
        endereco_numero: apiData.numero,
        endereco_bairro: apiData.bairro,
        endereco_cidade: apiData.municipio,
        endereco_estado: apiData.uf,
        endereco_cep: cep,
        endereco_detalhes: apiData.complemento,
        cnae_principal_texto: apiData.cnae_fiscal_descricao,
        patrimonio: apiData.capital_social
    };
};

const CnpjResultDisplay: React.FC<{ data: BrasilAPICNPJ, onUseData: () => void }> = ({ data, onUseData }) => (
    <div className="bg-gray-800 shadow-md rounded-lg p-6 mt-6 animate-fade-in">
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Resultado da Consulta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><strong className="text-gray-400">Razão Social:</strong> <span className="text-gray-200">{data.razao_social}</span></div>
            <div><strong className="text-gray-400">Nome Fantasia:</strong> <span className="text-gray-200">{data.nome_fantasia}</span></div>
            <div><strong className="text-gray-400">CNPJ:</strong> <span className="text-gray-200">{data.cnpj}</span></div>
            <div><strong className="text-gray-400">Início da Atividade:</strong> <span className="text-gray-200">{new Date(data.data_inicio_atividade).toLocaleDateString()}</span></div>
            <div><strong className="text-gray-400">Endereço:</strong> <span className="text-gray-200">{`${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio} - ${data.uf}`}</span></div>
            <div><strong className="text-gray-400">CEP:</strong> <span className="text-gray-200">{data.cep}</span></div>
            <div className="md:col-span-2"><strong className="text-gray-400">Atividade Principal (CNAE):</strong> <span className="text-gray-200">{data.cnae_fiscal_descricao}</span></div>
        </div>
        <div className="mt-6 flex justify-end">
            <Button onClick={onUseData} variant="primary">
                <FiCheckCircle className="mr-2" />
                Usar estes dados para cadastrar
            </Button>
        </div>
    </div>
);


const CnpjPage: React.FC<{ onUseData: (data: Partial<EmpresaUnidadeFormData>) => void }> = ({ onUseData }) => {
    const [cnpj, setCnpj] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [consultationResult, setConsultationResult] = useState<BrasilAPICNPJ | null>(null);

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Basic CNPJ formatting as user types
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        let formattedValue = value;
        if (value.length > 2) formattedValue = `${value.slice(0, 2)}.${value.slice(2)}`;
        if (value.length > 5) formattedValue = `${formattedValue.slice(0, 6)}.${formattedValue.slice(6)}`;
        if (value.length > 8) formattedValue = `${formattedValue.slice(0, 10)}/${formattedValue.slice(10)}`;
        if (value.length > 12) formattedValue = `${formattedValue.slice(0, 15)}-${formattedValue.slice(15)}`;
        setCnpj(formattedValue.slice(0, 18));
    };

    const handleConsult = async () => {
        const cleanCnpj = cnpj.replace(/\D/g, '');
        if (cleanCnpj.length !== 14) {
            setError('CNPJ inválido. Deve conter 14 dígitos.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setConsultationResult(null);

        try {
            // Using a public API for CNPJ consultation.
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
            if (!response.ok) {
                if(response.status === 404) {
                    throw new Error('CNPJ não encontrado.');
                }
                throw new Error(`Erro na consulta: ${response.statusText}`);
            }
            const data: BrasilAPICNPJ = await response.json();
            setConsultationResult(data);
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao consultar o CNPJ.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseData = () => {
        if (consultationResult) {
            const formData = mapApiDataToFormData(consultationResult);
            onUseData(formData);
        }
    };
    
    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="bg-gray-800 shadow-md rounded-lg p-6">
                <h1 className="text-xl md:text-2xl font-semibold text-white mb-4">Consulta de CNPJ</h1>
                <p className="text-gray-400 mb-6">Digite um CNPJ para buscar informações da empresa e pré-cadastrar um novo cliente.</p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={cnpj}
                        onChange={handleCnpjChange}
                        placeholder="00.000.000/0000-00"
                        className="flex-grow px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Button onClick={handleConsult} disabled={isLoading || !cnpj}>
                        <FiSearch className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Consultando...' : 'Consultar'}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mt-6" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            
            {consultationResult && (
                <CnpjResultDisplay data={consultationResult} onUseData={handleUseData} />
            )}
        </div>
    );
};

export default CnpjPage;