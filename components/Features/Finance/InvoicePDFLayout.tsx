import React from 'react';
import { FinancialRecord } from '../../../types';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    // Add timezone to prevent off-by-one day errors
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};
const formatTimestamp = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'short'
    });
};


const InvoicePDFLayout: React.FC<{ record: FinancialRecord }> = ({ record }) => {
    const client = record.contracts?.proposals?.empresas_unidades || record.empresas_unidades;

    return (
        <div className="bg-white text-gray-800 p-8 md:p-12 font-sans">
            {/* --- CABEÇALHO ATUALIZADO --- */}
            <header className="flex justify-between items-start pb-6 border-b border-gray-200">
                <div>
                    <h1 className="text-4xl font-logo text-black lowercase">hyperview</h1>
                    <div className="text-gray-600 text-xs mt-2 space-y-0.5">
                        <p>hyperview.com.br</p>
                        <p>(21) 98070-2917 | (21) 98729-6134</p>
                        <p>contato@hyperview.com.br</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold tracking-wider text-black">FATURA</h2>
                    <div className="text-sm text-gray-500 mt-2 space-y-1">
                        {record.contracts ? (
                            <>
                                <p>Contrato: <span className="font-semibold text-gray-700">{record.contracts.contract_code}</span></p>
                                <p>Proposta: <span className="font-semibold text-gray-700">{record.contracts.proposals?.proposal_code}</span></p>
                                {record.contracts.purchase_order && (
                                    <p>O.C.: <span className="font-semibold text-gray-700">{record.contracts.purchase_order}</span></p>
                                )}
                            </>
                        ) : (
                            <>
                                <p>Fatura: <span className="font-semibold text-gray-700">AVULSA</span></p>
                                {record.description && (
                                    <p>Serviço: <span className="font-semibold text-gray-700">{record.description}</span></p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-2 gap-8 mt-8 mb-10">
                <div>
                    <h3 className="text-sm uppercase font-bold text-gray-400 tracking-wider mb-2">CLIENTE</h3>
                    <p className="font-bold text-lg text-black">{client?.nome_fantasia || client?.razao_social}</p>
                    {client?.razao_social && client.razao_social !== client.nome_fantasia && (
                        <p className="text-gray-600">{client.razao_social}</p>
                    )}
                    {client?.cnpj_unidade && (
                        <p className="text-gray-600">CNPJ: {client.cnpj_unidade}</p>
                    )}
                </div>
                <div className="text-right">
                    <h3 className="text-sm uppercase font-bold text-gray-400 tracking-wider mb-2">DATA DE EMISSÃO</h3>
                    <p className="font-semibold text-lg text-black">{formatTimestamp(record.created_at)}</p>
                </div>
            </section>

            <table className="w-full text-sm text-left">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3 font-semibold text-gray-600 uppercase">Descrição</th>
                        <th className="p-3 font-semibold text-gray-600 uppercase text-right">Vencimento</th>
                        <th className="p-3 font-semibold text-gray-600 uppercase text-right">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    {record.installments.map((inst, index) => (
                        <tr key={inst.id || index} className="border-b border-gray-100">
                            <td className="p-3 text-gray-800">
                                {record.contracts 
                                    ? `Referente à Parcela do Contrato ${record.contracts.contract_code}`
                                    : `Referente à Parcela da Fatura Avulsa`
                                }
                            </td>
                            <td className="p-3 text-gray-800 text-right">{formatDate(inst.due_date)}</td>
                            <td className="p-3 text-gray-800 text-right font-semibold">{formatCurrency(inst.value)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div className="flex justify-end mt-6">
                <div className="w-full max-w-sm space-y-2">
                     <div className="flex justify-between text-xl font-bold pt-2 border-t-2 border-gray-300 mt-2 text-black">
                        <p>VALOR TOTAL:</p>
                        <p>{formatCurrency(record.total_revenue)}</p>
                    </div>
                </div>
            </div>
            
            {/* Caixa de Destaque para Instruções de Pagamento */}
            {record.payment_instructions && (
                <section className="mt-10">
                    <h4 className="font-bold text-sm text-gray-700 mb-2 uppercase tracking-wider">Instruções para Pagamento</h4>
                    <div className="bg-gray-100 border-l-4 border-blue-500 rounded-r-lg p-4 text-sm text-gray-800">
                        <p className="whitespace-pre-wrap font-mono leading-relaxed">{record.payment_instructions}</p>
                    </div>
                </section>
            )}

            {/* Caixa de Destaque para Observações Adicionais */}
            {record.contracts?.additional_info && (
                <section className="mt-6">
                    <h4 className="font-bold text-sm text-gray-700 mb-2 uppercase tracking-wider">Observações Adicionais (do Contrato)</h4>
                     <div className="bg-gray-100 border-l-4 border-gray-500 rounded-r-lg p-4 text-sm text-gray-800">
                        <p className="whitespace-pre-wrap leading-relaxed">{record.contracts.additional_info}</p>
                    </div>
                </section>
            )}

            <footer className="mt-12 border-t border-gray-200 pt-4 text-xs text-gray-500 text-center">
                <p>Esta fatura deve ser paga até a data de vencimento de sua respectiva parcela.</p>
                <p>Por favor, envie o comprovante para o e-mail: financeiro@hyperview.com.br</p>
            </footer>
        </div>
    );
};

export default InvoicePDFLayout;
