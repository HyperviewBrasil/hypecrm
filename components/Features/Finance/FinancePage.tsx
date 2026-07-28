import React, { useState, useEffect, useCallback } from 'react';
import { FiDollarSign, FiFilter, FiRefreshCw, FiEdit, FiArchive, FiUnlock, FiSearch, FiPlus, FiShare2 } from 'react-icons/fi';
import { FinancialRecord, FinancialRecordFormData } from '../../../types';
import { getFinancialRecords, updateFinancialRecordStatus } from '../../../services/financialService';
import Button from '../../UI/Button';
import Modal from '../../UI/Modal';
import FinancialRecordForm from './FinancialRecordForm';
import CreateInvoiceModal from './CreateInvoiceModal';
import InvoiceShareModal from './InvoiceShareModal';
import InvoicePDFLayout from './InvoicePDFLayout';
import { useToast } from '../../../contexts/ToastContext';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const FinancePage: React.FC = () => {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<FinancialRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filter and Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('Todos');
    const [showFilters, setShowFilters] = useState(false);

    // Modals state
    const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState<FinancialRecord | null>(null);
    const [recordToUpdateStatus, setRecordToUpdateStatus] = useState<FinancialRecord | null>(null);
    const [recordToShare, setRecordToShare] = useState<FinancialRecord | null>(null);
    const [recordForPdf, setRecordForPdf] = useState<FinancialRecord | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { addToast } = useToast();

    const fetchRecords = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getFinancialRecords();
            setRecords(data);
        } catch (err: any) {
            setError(err.message);
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    useEffect(() => {
        const lowercasedSearch = searchTerm.toLowerCase();
        const filtered = records
            .filter(r => {
                const isArchived = r.billing_status === 'Arquivado';
                return showArchived ? isArchived : !isArchived;
            })
            .filter(r => {
                if (statusFilter === 'Todos') return true;
                return r.billing_status === statusFilter;
            })
            .filter(r => 
                (r.contracts.contract_code.toLowerCase().includes(lowercasedSearch)) ||
                (r.contracts.proposals?.empresas_unidades?.nome_fantasia?.toLowerCase().includes(lowercasedSearch))
            );
        setFilteredRecords(filtered);
    }, [records, statusFilter, showArchived, searchTerm]);
    
    const handleUpdateSuccess = (updatedRecord: FinancialRecord) => {
        setRecords(prev => prev.map(r => r.financial_record_id === updatedRecord.financial_record_id ? { ...r, ...updatedRecord } : r));
        setRecordToEdit(null);
    };
    
    const handleStatusUpdate = async () => {
        if (!recordToUpdateStatus) return;

        const isArchiving = recordToUpdateStatus.billing_status !== 'Arquivado';
        
        setIsSubmitting(true);
        try {
            if (isArchiving) {
                // Archiving is a direct status update
                await updateFinancialRecordStatus(recordToUpdateStatus.financial_record_id, 'Arquivado');
                addToast('Registro arquivado com sucesso!', 'success');
            } else {
                // To un-archive, we set the status to 'Pendente'. This will trigger the
                // backend database function which recalculates the correct status ('Atrasado', 'Pago', etc.)
                // based on the current state of its installments. This is more reliable than
                // trying to trigger it implicitly.
                await updateFinancialRecordStatus(recordToUpdateStatus.financial_record_id, 'Pendente');
                addToast('Registro desarquivado com sucesso!', 'success');
            }
            await fetchRecords(); // Refetch to get the source of truth from the DB
        } catch (err: any) {
            const errorMessage = `Falha ao atualizar status: ${err.message || 'Erro desconhecido.'}`;
            addToast(errorMessage, 'error');
            console.error('Update financial record status failed:', err);
        } finally {
            setIsSubmitting(false);
            setRecordToUpdateStatus(null);
        }
    };
    
    const handleCreationSuccess = () => {
        setIsCreateInvoiceModalOpen(false);
        fetchRecords(); // Refresh the list
    };
    
    const handleOpenShareModal = (record: FinancialRecord) => {
        setRecordToShare(record);
        setRecordForPdf(record);
    };


    const getStatusStyles = (status: FinancialRecordFormData['billing_status'] | null) => {
        switch(status) {
            case 'Pendente': return 'bg-yellow-900 text-yellow-200';
            case 'Atrasado': return 'bg-red-900 text-red-200';
            case 'Pago Parcialmente': return 'bg-blue-800 text-blue-200';
            case 'Pago': return 'bg-green-900 text-green-200';
            case 'Arquivado': return 'bg-gray-700 text-gray-300';
            default: return 'bg-gray-600 text-gray-200';
        }
    };
    
    const statusFilterOptions = ['Todos', 'Pendente', 'Atrasado', 'Pago Parcialmente', 'Pago'];

    if (isLoading && records.length === 0) {
        return <div className="p-6 text-center text-gray-300">Carregando dados financeiros...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-400">Erro ao carregar dados: {error}</div>;
    }

    return (
        <div className="p-4 md:p-6 print-hidden">
             {recordForPdf && (
                <div id="printable-area" className="hidden print-area">
                    <InvoicePDFLayout record={recordForPdf} />
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <h1 className="text-xl md:text-2xl font-semibold text-white">Gestão Financeira</h1>
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
                        <Button onClick={fetchRecords} variant="secondary" className="p-2.5" title="Recarregar">
                            <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
                        </Button>
                         <Button onClick={() => setIsCreateInvoiceModalOpen(true)} variant="primary" className="whitespace-nowrap">
                            <FiPlus className="mr-2"/> Criar Fatura
                        </Button>
                    </div>
                </div>
            </div>
            
            {showFilters && (
                <div className="bg-gray-800/50 p-4 rounded-lg mb-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            {statusFilterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="w-full sm:w-auto sm:ml-auto pt-5">
                        <label htmlFor="show-archived-finance" className="flex items-center cursor-pointer">
                            <span className="mr-3 text-sm text-gray-300">Mostrar arquivados</span>
                            <div className="relative">
                                <input type="checkbox" id="show-archived-finance" className="sr-only" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                                <div className={`block ${showArchived ? 'bg-blue-600' : 'bg-gray-600'} w-14 h-8 rounded-full`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showArchived ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contrato</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Receita Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Despesas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lucro Líquido</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status Pag.</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {filteredRecords.length > 0 ? filteredRecords.map(record => (
                            <tr key={record.financial_record_id} className={`hover:bg-gray-700/50 transition-colors ${record.billing_status === 'Arquivado' ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">{record.contracts.contract_code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{record.contracts.proposals?.empresas_unidades?.nome_fantasia}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-400">{formatCurrency(record.total_revenue)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400">{formatCurrency(record.total_expenses)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-400">{formatCurrency(record.net_profit)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles(record.billing_status)}`}>
                                        {record.billing_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <div className="flex justify-end items-center gap-4">
                                        <button onClick={() => handleOpenShareModal(record)} className="text-green-400 hover:text-green-300 transition-colors" title="Compartilhar Fatura">
                                            <FiShare2 size={18} />
                                        </button>
                                        <button onClick={() => setRecordToEdit(record)} className="text-blue-400 hover:text-blue-300" title="Editar / Detalhes">
                                            <FiEdit size={18} />
                                        </button>
                                        <button onClick={() => setRecordToUpdateStatus(record)} className="text-yellow-400 hover:text-yellow-300" title={record.billing_status === 'Arquivado' ? 'Desarquivar' : 'Arquivar'}>
                                            {record.billing_status === 'Arquivado' ? <FiUnlock size={18} /> : <FiArchive size={18} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-400">
                                    <FiDollarSign className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                                    <h3 className="text-lg font-semibold text-white">Nenhum registro financeiro encontrado</h3>
                                    <p>Clique em "Criar Fatura" para começar.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <CreateInvoiceModal 
                isOpen={isCreateInvoiceModalOpen}
                onClose={() => setIsCreateInvoiceModalOpen(false)}
                onSuccess={handleCreationSuccess}
            />
            
            <Modal isOpen={!!recordToEdit} onClose={() => setRecordToEdit(null)} title={`Detalhes Financeiros: ${recordToEdit?.contracts.contract_code}`}>
                {recordToEdit && (
                    <FinancialRecordForm 
                        record={recordToEdit}
                        onCancel={() => setRecordToEdit(null)}
                        onSuccess={handleUpdateSuccess}
                    />
                )}
            </Modal>
            
            <Modal isOpen={!!recordToUpdateStatus} onClose={() => setRecordToUpdateStatus(null)} title={recordToUpdateStatus?.billing_status !== 'Arquivado' ? 'Confirmar Arquivamento' : 'Confirmar Desarquivamento'} closeOnBackdrop>
                <div>
                    <p className="text-gray-300 mb-6">
                        {recordToUpdateStatus?.billing_status !== 'Arquivado' ? 
                            <>Você tem certeza que deseja arquivar o registro do contrato <strong className="font-semibold text-white">{recordToUpdateStatus?.contracts.contract_code}</strong>?</> :
                            <>Você tem certeza que deseja desarquivar o registro do contrato <strong className="font-semibold text-white">{recordToUpdateStatus?.contracts.contract_code}</strong>?</>
                        }
                    </p>
                    <div className="flex justify-end gap-4">
                        <Button variant="secondary" onClick={() => setRecordToUpdateStatus(null)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button variant={recordToUpdateStatus?.billing_status !== 'Arquivado' ? 'danger' : 'primary'} onClick={handleStatusUpdate} disabled={isSubmitting}>
                            {isSubmitting ? 'Processando...' : (recordToUpdateStatus?.billing_status !== 'Arquivado' ? 'Arquivar' : 'Desarquivar')}
                        </Button>
                    </div>
                </div>
            </Modal>
            
            <InvoiceShareModal
                isOpen={!!recordToShare}
                onClose={() => setRecordToShare(null)}
                record={recordToShare}
            />

        </div>
    );
};

export default FinancePage;