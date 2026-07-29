import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiLink, FiSearch } from 'react-icons/fi';
import { EmpresaUnidade } from '../../../types';
import { getClients } from '../../../services/clientService';
import { syncClientWithAsaas, syncAllClientsWithAsaas } from '../../../services/asaasService';
import Button from '../../UI/Button';
import { useToast } from '../../../contexts/ToastContext';

const ClientMappingPage: React.FC = () => {
    const [clients, setClients] = useState<EmpresaUnidade[]>([]);
    const [filteredClients, setFilteredClients] = useState<EmpresaUnidade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [syncStatus, setSyncStatus] = useState<Record<string, 'idle' | 'syncing' | 'success' | 'error'>>({});
    const { addToast } = useToast();

    const fetchClients = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getClients();
            setClients(data);
            setFilteredClients(data);
        } catch (err: any) {
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = clients.filter(client =>
            (client.nome_fantasia?.toLowerCase() || '').includes(lowercasedFilter) ||
            (client.razao_social?.toLowerCase() || '').includes(lowercasedFilter) ||
            (client.contact_name?.toLowerCase() || '').includes(lowercasedFilter) ||
            (client.cnpj_unidade || '').includes(lowercasedFilter)
        );
        setFilteredClients(filtered);
    }, [searchTerm, clients]);

    const handleSyncAll = async () => {
        setIsSyncing(true);
        try {
            await syncAllClientsWithAsaas();
            addToast('Sincronização em lote concluída!', 'success');
            await fetchClients(); // Refresh to show updated asaas_customer_id
        } catch (err: any) {
            addToast(err.message, 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncSingle = async (client: EmpresaUnidade) => {
        setSyncStatus(prev => ({ ...prev, [client.client_id]: 'syncing' }));
        try {
            await syncClientWithAsaas(client);
            setSyncStatus(prev => ({ ...prev, [client.client_id]: 'success' }));
            addToast(`Cliente ${client.nome_fantasia || client.contact_name} sincronizado!`, 'success');
            await fetchClients(); // Refresh to show updated asaas_customer_id
        } catch (err: any) {
            setSyncStatus(prev => ({ ...prev, [client.client_id]: 'error' }));
            addToast(err.message, 'error');
        }
    };

    const getStatusIcon = (client: EmpresaUnidade) => {
        const status = syncStatus[client.client_id];
        if (status === 'syncing') return <FiRefreshCw className="animate-spin text-yellow-400" />;
        if (status === 'success') return <FiCheckCircle className="text-green-400" />;
        if (status === 'error') return <FiXCircle className="text-red-400" />;
        if (client.asaas_customer_id) return <FiCheckCircle className="text-green-400" />;
        return <FiLink className="text-gray-500" />;
    };

    const getStatusText = (client: EmpresaUnidade) => {
        const status = syncStatus[client.client_id];
        if (status === 'syncing') return 'Sincronizando...';
        if (status === 'success') return 'Sincronizado';
        if (status === 'error') return 'Erro';
        if (client.asaas_customer_id) return 'Sincronizado';
        return 'Pendente';
    };

    const getStatusColor = (client: EmpresaUnidade) => {
        const status = syncStatus[client.client_id];
        if (status === 'syncing') return 'bg-yellow-900/50 text-yellow-300';
        if (status === 'success') return 'bg-green-900/50 text-green-300';
        if (status === 'error') return 'bg-red-900/50 text-red-300';
        if (client.asaas_customer_id) return 'bg-green-900/50 text-green-300';
        return 'bg-gray-700 text-gray-300';
    };

    if (isLoading && clients.length === 0) {
        return <div className="p-6 text-center text-gray-300">Carregando clientes...</div>;
    }

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-xl md:text-2xl font-semibold text-white">Mapeamento Clientes → Asaas</h1>
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
                    <Button onClick={handleSyncAll} variant="primary" disabled={isSyncing}>
                        <FiRefreshCw className={isSyncing ? 'animate-spin' : ''} />
                        Sincronizar Todos
                    </Button>
                </div>
            </div>

            <div className="bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Empresa / Nome Fantasia</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">CNPJ</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Asaas ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                                <tr key={client.client_id} className="hover:bg-gray-700/50 transition-all duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                        {client.nome_fantasia || client.razao_social || client.contact_name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {client.cnpj_unidade || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {client.asaas_customer_id || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client)}`}>
                                            {getStatusIcon(client)}
                                            <span className="ml-1">{getStatusText(client)}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleSyncSingle(client)}
                                            disabled={syncStatus[client.client_id] === 'syncing'}
                                            className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                                            title="Sincronizar com Asaas"
                                        >
                                            <FiRefreshCw size={18} />
                                        </button>
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

            <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Legenda</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-900/50 text-green-300 text-xs leading-5 font-semibold rounded-full">
                            <FiCheckCircle className="inline" /> Sincronizado
                        </span>
                        <span className="text-gray-400">Cliente cadastrado no Asaas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs leading-5 font-semibold rounded-full">
                            <FiLink className="inline" /> Pendente
                        </span>
                        <span className="text-gray-400">Cliente não sincronizado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs leading-5 font-semibold rounded-full">
                            <FiRefreshCw className="inline animate-spin" /> Sincronizando...
                        </span>
                        <span className="text-gray-400">Processando sincronização</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-red-900/50 text-red-300 text-xs leading-5 font-semibold rounded-full">
                            <FiXCircle className="inline" /> Erro
                        </span>
                        <span className="text-gray-400">Falha na sincronização</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientMappingPage;
