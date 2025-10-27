import React from 'react';
import { Proposal } from '../../../types';
import { FiCheckCircle } from 'react-icons/fi';


// Helper function to format currency
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Helper function to format dates
const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    // Ensure we handle UTC dates correctly from Supabase by adding a time component and specifying timezone
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatTimestamp = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo', // Adjust to your timezone
        dateStyle: 'short',
        timeStyle: 'short'
    });
};

interface ProposalPDFLayoutProps {
    proposal: Proposal;
    isAnnex?: boolean;
    approvalTimestamp?: string | null;
}

const ApprovalStampSVG: React.FC<{ timestamp: string | null }> = ({ timestamp }) => (
    <svg width="220" height="100" viewBox="0 0 220 100" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -rotate-12 opacity-80 pointer-events-none">
        <defs>
            <filter id="stamp-texture" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="turbulence" />
                <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
        </defs>
        <rect x="2" y="2" width="216" height="96" rx="8" 
              className="fill-transparent stroke-green-600" 
              strokeWidth="4" 
              filter="url(#stamp-texture)" />
        <g className="text-green-700 font-sans select-none" style={{ filter: 'url(#stamp-texture)' }}>
            <text x="50%" y="35" dominantBaseline="middle" textAnchor="middle" className="font-bold text-xl uppercase tracking-wider flex items-center">
                 <FiCheckCircle className="inline h-4 w-4 mr-1" /> APROVADO
            </text>
            <text x="50%" y="65" dominantBaseline="middle" textAnchor="middle" className="font-mono text-lg tracking-widest">{formatTimestamp(timestamp)}</text>
        </g>
    </svg>
);


const ProposalPDFLayout: React.FC<ProposalPDFLayoutProps> = ({ proposal, isAnnex = false, approvalTimestamp = null }) => {
    // Calculate number of days, defaulting to 1 if dates are invalid or not set
    let days = 1;
    if (proposal.start_date && proposal.end_date) {
        const start = new Date(proposal.start_date);
        const end = new Date(proposal.end_date);
        if (end >= start) {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
    }

    const itemsPeriodTotal = (proposal.items?.reduce((acc, item) => acc + (item.quantity * item.unit_value), 0) || 0) * days;
    const client = proposal.empresas_unidades;

    return (
        <div className="relative bg-white text-gray-800 p-8 font-sans">
            {isAnnex && (
                <ApprovalStampSVG timestamp={approvalTimestamp} />
            )}

            {/* Header */}
            <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
                <div>
                    <h1 className="text-3xl font-bold text-black font-logo lowercase">hyperview</h1>
                    <p className="text-gray-500 text-sm">RUA SILVA BUENO 1177 - IPIRANGA, SÃO PAULO - SP</p>
                    <p className="text-gray-500 text-sm">CNPJ: 49.904.720/0001-70</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-semibold tracking-wider">PROPOSTA COMERCIAL</h2>
                    <p className="text-sm font-mono mt-1 text-gray-600">{proposal.proposal_code}</p>
                    <p className="text-sm mt-1">Data: {formatDate(proposal.created_at)}</p>
                </div>
            </header>

            {/* Client and Event Details */}
            <section className="grid grid-cols-2 gap-8 my-8">
                <div>
                    <h3 className="text-sm uppercase font-bold text-gray-400 tracking-wider mb-2">Para</h3>
                    <p className="font-bold text-lg">{client?.nome_fantasia || client?.razao_social}</p>
                    {client?.razao_social && client?.razao_social !== client?.nome_fantasia && (
                        <p className="text-gray-600">{client.razao_social}</p>
                    )}
                    <p className="text-gray-600">CNPJ: {client?.cnpj_unidade || 'N/A'}</p>
                    <p className="text-gray-600 mt-2">A/C: {proposal.contact_person}</p>
                </div>
                <div>
                    <h3 className="text-sm uppercase font-bold text-gray-400 tracking-wider mb-2">Sobre o Projeto</h3>
                    <p className="font-semibold">{proposal.event_description || 'Não especificado.'}</p>
                    <p className="text-gray-600">Local: {proposal.event_location || 'Não especificado.'}</p>
                    <p className="text-gray-600">Período: {formatDate(proposal.start_date)} a {formatDate(proposal.end_date)} ({days} diárias)</p>
                </div>
            </section>
            
            {/* Items Table */}
            <section>
                <h3 className="text-sm uppercase font-bold text-gray-400 tracking-wider mb-2">Detalhes do Investimento</h3>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                            <th className="p-3 font-semibold text-gray-800">Descrição do Item</th>
                            <th className="p-3 font-semibold text-center text-gray-800">Qtd.</th>
                            <th className="p-3 font-semibold text-right text-gray-800">Valor Unit. (diária)</th>
                            <th className="p-3 font-semibold text-right text-gray-800">Subtotal (diária)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proposal.items?.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                                <td className="p-3 text-gray-800">{item.item}</td>
                                <td className="p-3 text-center text-gray-800">{item.quantity}</td>
                                <td className="p-3 text-right text-gray-800">{formatCurrency(item.unit_value)}</td>
                                <td className="p-3 font-semibold text-right text-gray-800">{formatCurrency(item.quantity * item.unit_value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
            {/* Totals */}
            <section className="flex justify-end mt-6">
                <div className="w-full max-w-sm space-y-2 text-gray-600">
                    <div className="flex justify-between font-semibold">
                        <p>Subtotal Itens ({days} diárias):</p>
                        <p className="text-gray-800">{formatCurrency(itemsPeriodTotal)}</p>
                    </div>
                    <div className="flex justify-between">
                        <p>Custos de Deslocamento:</p>
                        <p className="text-gray-800">{formatCurrency(proposal.travel_costs)}</p>
                    </div>
                    <div className="flex justify-between">
                        <p>Custos de Produção:</p>
                        <p className="text-gray-800">{formatCurrency(proposal.production_costs)}</p>
                    </div>
                    {proposal.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <p>Desconto:</p>
                            <p>-{formatCurrency(proposal.discount)}</p>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-2 border-t-2 border-gray-400 mt-2 text-black">
                        <p>VALOR TOTAL:</p>
                        <p>{formatCurrency(proposal.total_value)}</p>
                    </div>
                </div>
            </section>

            {/* Payment Conditions */}
            <section className="mt-8">
                <h3 className="text-sm uppercase font-bold text-gray-400 tracking-wider mb-2">Condições de Pagamento</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                    <p>
                        <strong>50% do valor desta proposta</strong> para reservar a data e o restante até <strong>48 horas antes do evento</strong>. Condições especiais podem ser negociadas.
                    </p>
                    <p>
                        <strong>Formas de Pagamento:</strong> Fatura de locação, depósito em conta corrente, PIX, cartão de crédito e stablecoins.
                    </p>
                </div>
            </section>


            {/* Footer */}
            <footer className="mt-12 border-t border-gray-200 pt-4 text-xs text-gray-500 text-center">
                <p>Esta proposta é válida por 15 dias.</p>
                <p>contato@hyperview.com.br | (21) 98729-6134</p>
            </footer>
        </div>
    );
};

export default ProposalPDFLayout;