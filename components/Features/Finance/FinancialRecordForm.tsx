import React, { useState, useEffect, useMemo } from 'react';
import { FinancialRecord, FinancialRecordFormData, Installment, CustomExpense } from '../../../types';
import { updateFinancialRecord } from '../../../services/financialService';
import Button from '../../UI/Button';
import { useToast } from '../../../contexts/ToastContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';

interface FinancialRecordFormProps {
    record: FinancialRecord;
    onCancel: () => void;
    onSuccess: (updatedRecord: FinancialRecord) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, containerClassName?: string }> = ({ label, id, containerClassName, ...props }) => (
    <div className={containerClassName}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input id={id} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props} />
    </div>
);

const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string, containerClassName?: string }> = ({ label, id, containerClassName, ...props }) => (
    <div className={containerClassName}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <textarea id={id} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props} />
    </div>
);

const FinancialRecordForm: React.FC<FinancialRecordFormProps> = ({ record, onCancel, onSuccess }) => {
    const [formData, setFormData] = useState<FinancialRecordFormData>({
        billing_status: record.billing_status,
        installments: record.installments,
        receiving_account: record.receiving_account,
        payment_instructions: record.payment_instructions,
        expenses_accommodation: record.expenses_accommodation ?? 0,
        expenses_transport: record.expenses_transport ?? 0,
        expenses_tax_percent: record.expenses_tax_percent ?? 0,
        expenses_third_party: record.expenses_third_party ?? 0,
        expenses_materials: record.expenses_materials ?? 0,
        expenses_miscellaneous: record.expenses_miscellaneous ?? 0,
        reimbursement_daniel: record.reimbursement_daniel ?? 0,
        reimbursement_natan: record.reimbursement_natan ?? 0,
        custom_expenses: record.custom_expenses ?? [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const { settings } = useSettings();

    // Recalculate totals and profit whenever expenses or revenue change
    const { totalExpenses, netProfit, danielShare, natanShare } = useMemo(() => {
        const customExpensesTotal = formData.custom_expenses?.reduce((acc, exp) => acc + (Number(exp.value) || 0), 0) || 0;
        
        const fixedExpensesTotal =
          (Number(formData.expenses_accommodation) || 0) +
          (Number(formData.expenses_transport) || 0) +
          (Number(formData.expenses_third_party) || 0) +
          (Number(formData.expenses_materials) || 0) +
          (Number(formData.expenses_miscellaneous) || 0);
        
        const totalExpenses = fixedExpensesTotal + customExpensesTotal;
        
        const taxAmount = record.total_revenue * (Number(formData.expenses_tax_percent || 0) / 100);
        const netProfitBeforeReimbursements = record.total_revenue - totalExpenses - taxAmount;

        const reimbursementDaniel = Number(formData.reimbursement_daniel) || 0;
        const reimbursementNatan = Number(formData.reimbursement_natan) || 0;
        const totalReimbursements = reimbursementDaniel + reimbursementNatan;

        const profitForSplit = netProfitBeforeReimbursements - totalReimbursements;

        const danielShare = (profitForSplit / 2) + reimbursementDaniel;
        const natanShare = (profitForSplit / 2) + reimbursementNatan;

        return { totalExpenses, netProfit: netProfitBeforeReimbursements, danielShare, natanShare };
    }, [formData, record.total_revenue]);
    
    // --- Generic Handlers ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'receiving_account') {
            const newAccount = value as 'Conta Daniel' | 'Conta Natan';
            const defaultInstructions = newAccount === 'Conta Daniel' 
                ? settings?.payment_instructions_daniel 
                : settings?.payment_instructions_natan;

            if (defaultInstructions && formData.payment_instructions !== defaultInstructions) {
                if (window.confirm('Você deseja substituir as instruções de pagamento atuais pelas novas instruções padrão desta conta?')) {
                    setFormData(prev => ({ 
                        ...prev, 
                        receiving_account: newAccount,
                        payment_instructions: defaultInstructions 
                    }));
                    return;
                }
            }
        }
        
        setFormData(prev => ({ ...prev, [name]: value as any }));
    };

    // --- Installment Handlers ---
    const handleInstallmentChange = (id: string, field: keyof Omit<Installment, 'id' | 'status'>, value: string) => {
        const updatedInstallments = formData.installments.map(inst => 
            inst.id === id ? { ...inst, [field]: value } : inst
        );
        setFormData(prev => ({ ...prev, installments: updatedInstallments }));
    };
    
    const toggleInstallmentStatus = (id: string) => {
        const updatedInstallments = formData.installments.map(inst => {
            if (inst.id === id) {
                // FIX: Explicitly define the type for newStatus to ensure it matches the 'Pendente' | 'Pago' union type.
                const newStatus: 'Pendente' | 'Pago' = inst.status === 'Pendente' ? 'Pago' : 'Pendente';
                return { ...inst, status: newStatus };
            }
            return inst;
        });
        // The billing_status is no longer calculated here.
        // The backend trigger will handle setting the correct status upon saving.
        setFormData(prev => ({ ...prev, installments: updatedInstallments }));
    };
    
    const handleAddInstallment = () => {
        const newInstallment: Installment = { id: crypto.randomUUID(), due_date: new Date().toISOString().split('T')[0], value: 0, status: 'Pendente' };
        setFormData(prev => ({ ...prev, installments: [...prev.installments, newInstallment] }));
    };

    const handleRemoveInstallment = (id: string) => {
        setFormData(prev => ({...prev, installments: prev.installments.filter(i => i.id !== id)}));
    };
    
    // --- Custom Expense Handlers ---
    const handleCustomExpenseChange = (id: string, field: 'description' | 'value', value: string) => {
        const updatedExpenses = formData.custom_expenses.map(exp => 
            exp.id === id ? { ...exp, [field]: field === 'value' ? parseFloat(value) || 0 : value } : exp
        );
        setFormData(prev => ({ ...prev, custom_expenses: updatedExpenses }));
    };

    const handleAddCustomExpense = () => {
        const newExpense: CustomExpense = { id: crypto.randomUUID(), description: '', value: 0 };
        setFormData(prev => ({ ...prev, custom_expenses: [...(prev.custom_expenses ?? []), newExpense] }));
    };

    const handleRemoveCustomExpense = (id: string) => {
        setFormData(prev => ({ ...prev, custom_expenses: prev.custom_expenses.filter(exp => exp.id !== id) }));
    };
    
    // --- Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const totalInstallmentValue = formData.installments.reduce((sum, i) => sum + Number(i.value), 0);
        if (Math.abs(totalInstallmentValue - record.total_revenue) > 0.01) {
            addToast('O valor total das parcelas não corresponde ao valor do contrato.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const updatedRecord = await updateFinancialRecord(record.financial_record_id, formData);
            addToast('Registro financeiro salvo com sucesso!', 'success');
            onSuccess(updatedRecord);
        } catch (err: any) {
            const errorMessage = `Falha ao salvar registro: ${err.message || 'Erro desconhecido.'}`;
            addToast(errorMessage, 'error');
            console.error('Update financial record failed:', err);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Detalhes da Fatura</h3>
                    <div className="max-w-sm">
                        <label htmlFor="receiving_account" className="block text-sm font-medium text-gray-400 mb-1">Conta Recebedora</label>
                        <select
                            id="receiving_account"
                            name="receiving_account"
                            value={formData.receiving_account || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md"
                        >
                            <option value="">Não especificado</option>
                            <option value="Conta Daniel">Conta Daniel</option>
                            <option value="Conta Natan">Conta Natan</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Installments */}
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Contas a Receber (Parcelas)</h3>
                <div className="space-y-2">
                    {formData.installments.map(inst => (
                        <div key={inst.id} className="grid grid-cols-12 gap-2 items-center">
                            <input type="date" value={inst.due_date} onChange={e => handleInstallmentChange(inst.id, 'due_date', e.target.value)} className="col-span-4 w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md" />
                            <input type="number" step="0.01" value={inst.value} onChange={e => handleInstallmentChange(inst.id, 'value', e.target.value)} className="col-span-4 w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md" />
                            <Button type="button" variant={inst.status === 'Pago' ? 'primary' : 'secondary'} onClick={() => toggleInstallmentStatus(inst.id)} className="col-span-3 text-xs py-2">{inst.status}</Button>
                            <button type="button" onClick={() => handleRemoveInstallment(inst.id)} className="col-span-1 text-red-400 hover:text-red-300 flex justify-center items-center"><FiTrash2 size={16} /></button>
                        </div>
                    ))}
                </div>
                <Button type="button" variant="secondary" onClick={handleAddInstallment} className="mt-3 text-sm"><FiPlus className="mr-2" /> Adicionar Parcela</Button>
            </div>
            
            <div>
                <TextareaField
                    label="Informações Adicionais de Pagamento"
                    id="payment_instructions"
                    name="payment_instructions"
                    value={formData.payment_instructions || ''}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Ex: Dados bancários para TED, condições especiais de pagamento, etc."
                />
            </div>

            {/* Expenses */}
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Contas a Pagar (Custos Fixos)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InputField label="Hospedagem" name="expenses_accommodation" type="number" step="0.01" value={formData.expenses_accommodation} onChange={handleChange} />
                    <InputField label="Transporte" name="expenses_transport" type="number" step="0.01" value={formData.expenses_transport} onChange={handleChange} />
                    <InputField label="Serviços Terceiros" name="expenses_third_party" type="number" step="0.01" value={formData.expenses_third_party} onChange={handleChange} />
                    <InputField label="Compras Material" name="expenses_materials" type="number" step="0.01" value={formData.expenses_materials} onChange={handleChange} />
                    <InputField label="Diversos" name="expenses_miscellaneous" type="number" step="0.01" value={formData.expenses_miscellaneous} onChange={handleChange} />
                    <InputField label="Imposto (%)" name="expenses_tax_percent" type="number" step="0.01" value={formData.expenses_tax_percent} onChange={handleChange} />
                </div>
            </div>

             {/* Custom Expenses */}
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Custos Adicionais (Individual)</h3>
                <div className="space-y-2">
                     {(formData.custom_expenses ?? []).map(exp => (
                        <div key={exp.id} className="grid grid-cols-12 gap-2 items-center">
                            <input type="text" placeholder="Descrição do custo" value={exp.description} onChange={e => handleCustomExpenseChange(exp.id, 'description', e.target.value)} className="col-span-8 w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md" />
                            <input type="number" step="0.01" placeholder="Valor" value={exp.value} onChange={e => handleCustomExpenseChange(exp.id, 'value', e.target.value)} className="col-span-3 w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md" />
                            <button type="button" onClick={() => handleRemoveCustomExpense(exp.id)} className="col-span-1 text-red-400 hover:text-red-300 flex justify-center items-center"><FiTrash2 size={16} /></button>
                        </div>
                    ))}
                </div>
                <Button type="button" variant="secondary" onClick={handleAddCustomExpense} className="mt-3 text-sm"><FiPlus className="mr-2" /> Adicionar Custo</Button>
            </div>
            
             {/* Reimbursements */}
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Reembolsos</h3>
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Reembolso Daniel" name="reimbursement_daniel" type="number" step="0.01" value={formData.reimbursement_daniel} onChange={handleChange} />
                    <InputField label="Reembolso Natan" name="reimbursement_natan" type="number" step="0.01" value={formData.reimbursement_natan} onChange={handleChange} />
                </div>
            </div>

            {/* Summary & Profit Split */}
            <div className="pt-4 border-t border-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-300">Demonstrativo de Resultados</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-900/50 p-3 rounded-md">
                        <p className="text-sm text-gray-400">Receita Total</p>
                        <p className="text-xl font-bold text-green-400">{formatCurrency(record.total_revenue)}</p>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-md">
                        <p className="text-sm text-gray-400">Despesas Totais</p>
                        <p className="text-xl font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-md border border-blue-500">
                        <p className="text-sm text-gray-400">Lucro Líquido</p>
                        <p className="text-xl font-bold text-blue-400">{formatCurrency(netProfit)}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center pt-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <p className="text-base font-semibold text-gray-300">Split Daniel (50% + Reembolso)</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(danielShare)}</p>
                    </div>
                     <div className="bg-gray-800 p-4 rounded-lg">
                        <p className="text-base font-semibold text-gray-300">Split Natan (50% + Reembolso)</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(natanShare)}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                    <FiSave className="mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </form>
    );
};

export default FinancialRecordForm;