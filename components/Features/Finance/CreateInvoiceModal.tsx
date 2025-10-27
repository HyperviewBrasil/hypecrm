import React, { useState, useEffect, useMemo } from 'react';
import { Contract, Installment } from '../../../types';
import { getContractsForInvoiceCreation } from '../../../services/contractService';
import { createInvoice } from '../../../services/financialService';
import Modal from '../../UI/Modal';
import Button from '../../UI/Button';
import { useToast } from '../../../contexts/ToastContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { FiPlus, FiTrash2, FiFileText } from 'react-icons/fi';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoadingContracts, setIsLoadingContracts] = useState(true);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [receivingAccount, setReceivingAccount] = useState<'Conta Daniel' | 'Conta Natan' | ''>('');
    const [paymentInstructions, setPaymentInstructions] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();
    const { settings } = useSettings();

    useEffect(() => {
        if (isOpen) {
            const fetchContracts = async () => {
                setIsLoadingContracts(true);
                try {
                    const availableContracts = await getContractsForInvoiceCreation();
                    setContracts(availableContracts);
                } catch (err: any) {
                    addToast(err.message, 'error');
                } finally {
                    setIsLoadingContracts(false);
                }
            };
            fetchContracts();
        } else {
            // Reset state on close
            setSelectedContract(null);
            setInstallments([]);
            setReceivingAccount('');
            setPaymentInstructions('');
        }
    }, [isOpen, addToast]);

    // Auto-fill payment instructions when receiving account changes
    useEffect(() => {
        if (receivingAccount === 'Conta Daniel') {
            setPaymentInstructions(settings?.payment_instructions_daniel || '');
        } else if (receivingAccount === 'Conta Natan') {
            setPaymentInstructions(settings?.payment_instructions_natan || '');
        }
    }, [receivingAccount, settings]);

    const handleContractSelect = (contractId: string) => {
        const contract = contracts.find(c => c.contract_id === contractId);
        if (contract) {
            setSelectedContract(contract);
            // Default to one installment
            const defaultDueDate = new Date();
            defaultDueDate.setDate(defaultDueDate.getDate() + 7);
            setInstallments([{
                id: crypto.randomUUID(),
                due_date: defaultDueDate.toISOString().split('T')[0],
                value: contract.contract_value,
                status: 'Pendente'
            }]);
        }
    };
    
    const totalInstallmentValue = useMemo(() => {
        return installments.reduce((sum, i) => sum + (Number(i.value) || 0), 0);
    }, [installments]);

    const handleInstallmentChange = (id: string, field: 'due_date' | 'value', value: string) => {
        setInstallments(prev => prev.map(inst => 
            inst.id === id ? { ...inst, [field]: field === 'value' ? parseFloat(value) || 0 : value } : inst
        ));
    };
    
    const handleAddInstallment = () => {
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        const newInstallment: Installment = {
            id: crypto.randomUUID(),
            due_date: defaultDueDate.toISOString().split('T')[0],
            value: 0,
            status: 'Pendente'
        };
        setInstallments(prev => [...prev, newInstallment]);
    };

    const handleRemoveInstallment = (id: string) => {
        setInstallments(prev => prev.filter(i => i.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedContract) {
            addToast('Selecione um contrato.', 'error');
            return;
        }
        if (Math.abs(totalInstallmentValue - selectedContract.contract_value) > 0.01) {
            addToast('A soma das parcelas não bate com o valor do contrato.', 'error');
            return;
        }
        if (!receivingAccount) {
            addToast('Selecione a conta recebedora.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await createInvoice(selectedContract, installments, receivingAccount, paymentInstructions);
            addToast('Fatura criada com sucesso!', 'success');
            onSuccess();
        } catch (err: any) {
            addToast(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const valueDifference = selectedContract ? selectedContract.contract_value - totalInstallmentValue : 0;
    const isValueMismatch = Math.abs(valueDifference) > 0.01;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Fatura">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="contract-select" className="block text-sm font-medium text-gray-400 mb-1">Selecione o Contrato</label>
                    <select
                        id="contract-select"
                        onChange={(e) => handleContractSelect(e.target.value)}
                        className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md"
                        disabled={isLoadingContracts || !!selectedContract}
                        value={selectedContract?.contract_id || ''}
                    >
                        <option value="" disabled>{isLoadingContracts ? 'Carregando...' : 'Selecione...'}</option>
                        {contracts.map(c => (
                            <option key={c.contract_id} value={c.contract_id}>
                                {c.contract_code} - {c.proposals?.empresas_unidades?.nome_fantasia}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedContract && (
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-white">{selectedContract.contract_code}</h3>
                                <p className="text-sm text-gray-400">{selectedContract.proposals?.empresas_unidades?.nome_fantasia}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-400">Valor Total</p>
                                <p className="text-xl font-bold text-blue-400">{formatCurrency(selectedContract.contract_value)}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-md font-semibold text-gray-300 mb-2">Parcelas</h4>
                            <div className="space-y-2">
                                {installments.map(inst => (
                                    <div key={inst.id} className="grid grid-cols-12 gap-2 items-center">
                                        <input type="date" value={inst.due_date} onChange={e => handleInstallmentChange(inst.id, 'due_date', e.target.value)} className="col-span-6 md:col-span-5 w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md text-sm" />
                                        <input type="number" step="0.01" value={inst.value} onChange={e => handleInstallmentChange(inst.id, 'value', e.target.value)} className="col-span-6 md:col-span-5 w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md text-sm" />
                                        <button type="button" onClick={() => handleRemoveInstallment(inst.id)} className="col-span-12 md:col-span-2 text-red-400 hover:text-red-300 flex justify-center items-center h-full"><FiTrash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="secondary" onClick={handleAddInstallment} className="mt-3 text-sm"><FiPlus className="mr-2" /> Adicionar Parcela</Button>
                        </div>

                        <div className={`p-2 rounded-md text-sm text-center font-semibold ${isValueMismatch ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                            {isValueMismatch ? `Diferença: ${formatCurrency(valueDifference)}` : 'Total das parcelas corresponde ao valor do contrato'}
                        </div>
                        
                         <div>
                            <label htmlFor="receiving-account-select" className="block text-sm font-medium text-gray-400 mb-1">Conta Recebedora</label>
                            <select
                                id="receiving-account-select"
                                value={receivingAccount}
                                onChange={(e) => setReceivingAccount(e.target.value as any)}
                                className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md"
                            >
                                <option value="" disabled>Selecione uma conta</option>
                                <option value="Conta Daniel">Conta Daniel</option>
                                <option value="Conta Natan">Conta Natan</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="payment_instructions" className="block text-sm font-medium text-gray-400 mb-1">Informações Adicionais de Pagamento</label>
                            <textarea
                                id="payment_instructions"
                                value={paymentInstructions}
                                onChange={(e) => setPaymentInstructions(e.target.value)}
                                rows={4}
                                placeholder="Será preenchido automaticamente ao selecionar a conta recebedora..."
                                className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md"
                            />
                        </div>
                    </div>
                )}
                
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting || !selectedContract || isValueMismatch || !receivingAccount}>
                        <FiFileText className="mr-2" />
                        {isSubmitting ? 'Salvando...' : 'Salvar Fatura'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateInvoiceModal;