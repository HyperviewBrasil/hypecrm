import React, { useState, useEffect } from 'react';
import { Proposal, PublicFinalizationFormData } from '../../../types';
import { getProposalByPublicId, approveProposalPublic } from '../../../services/proposalService';
import { updateContractPublic, getContractByProposalId } from '../../../services/contractService';
import { FiCheck, FiDownload, FiArrowLeft, FiLock } from 'react-icons/fi';
import ProposalPDFLayout from './ProposalPDFLayout';
import Button from '../../UI/Button';
import ProposalStatusTimeline from './ProposalStatusTimeline';
import ApprovalWorkflow from './ApprovalWorkflow';

interface ProposalTrackerPageProps {
  onNavigateToLanding: () => void;
}

type WorkflowState = 'loading' | 'error' | 'viewing' | 'approving' | 'approved' | 'submitting' | 'submitted';

const ProposalTrackerPage: React.FC<ProposalTrackerPageProps> = ({ onNavigateToLanding }) => {
    const [workflowState, setWorkflowState] = useState<WorkflowState>('loading');
    const [error, setError] = useState<string | null>(null);
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [contractPublicId, setContractPublicId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const publicId = params.get('id');

        if (!publicId) {
            setError('Link de acesso inválido ou ausente.');
            setWorkflowState('error');
            return;
        }

        const fetchProposal = async () => {
            setWorkflowState('loading');
            setError(null);
            setProposal(null);
            
            try {
                const result = await getProposalByPublicId(publicId);
                if (!result) {
                    setError('Proposta não encontrada ou o link é inválido.');
                    setWorkflowState('error');
                } else {
                    setProposal(result);
                    if (result.status === 'Aprovado') {
                         setWorkflowState('approved');
                         // Fetch associated contract to get its public ID for the finalization form
                         const associatedContract = await getContractByProposalId(result.proposal_id);
                         if (associatedContract) {
                             setContractPublicId(associatedContract.public_access_id);
                             if (associatedContract.status === 'Concluído') {
                                 setWorkflowState('submitted'); // If contract is already filled and done
                             }
                         } else {
                             setError('Proposta aprovada, mas não foi possível encontrar o contrato associado para finalização.');
                             setWorkflowState('error');
                         }
                    } else {
                         setWorkflowState('viewing');
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Ocorreu um erro ao buscar os dados.');
                setWorkflowState('error');
            }
        };

        fetchProposal();
    }, []);
    
    const handlePrint = () => {
        window.print();
    };

    const handleApprove = async () => {
        if (!proposal) return;

        setWorkflowState('approving');
        setError(null);
        try {
            const newContractPublicId = await approveProposalPublic(proposal.public_access_id);
            setContractPublicId(newContractPublicId);
            setWorkflowState('approved');
        } catch (err: any) {
            setError(err.message || 'Falha ao aprovar a proposta. Tente novamente.');
            setWorkflowState('viewing'); // Go back to viewing on error
        }
    };
    
    const handleFinalizationSubmit = async (formData: PublicFinalizationFormData) => {
        if (!proposal || !contractPublicId) {
             setError('Ocorreu um erro: ID do contrato não encontrado. Por favor, recarregue a página.');
             return;
        };

        setWorkflowState('submitting');
        setError(null);
        try {
            await updateContractPublic(contractPublicId, formData);
            setWorkflowState('submitted');
        } catch (err: any) {
            setError(err.message || 'Falha ao enviar os dados. Verifique as informações e tente novamente.');
            setWorkflowState('approved'); // Go back to form
        }
    };

    const renderContent = () => {
        if (workflowState === 'loading') {
            return (
                <div className="flex flex-col items-center justify-center h-full pt-20">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-400">Carregando proposta...</p>
                </div>
            );
        }
        
        if (workflowState === 'error') {
             return (
                <div className="flex flex-col items-center justify-center h-full pt-20 text-center">
                    <FiLock className="h-12 w-12 text-yellow-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white">Não foi possível carregar o documento</h3>
                    <p className="text-red-400 mt-2">{error}</p>
                </div>
            );
        }
        
        if (workflowState === 'approved' || workflowState === 'submitting' || workflowState === 'submitted') {
            return (
                <ApprovalWorkflow
                    status={workflowState === 'approved' ? 'approved' : workflowState === 'submitting' ? 'submitting' : 'submitted'}
                    onSubmit={handleFinalizationSubmit}
                    error={error}
                    initialClientData={proposal?.empresas_unidades}
                />
            );
        }

        if (proposal && (workflowState === 'viewing' || workflowState === 'approving')) {
            return (
                <>
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-white">Acompanhamento da Proposta</h2>
                        <p className="text-gray-400 mt-2">Veja o status atual e os detalhes da sua proposta comercial.</p>
                    </div>
                    
                    <div className="mb-12">
                        <ProposalStatusTimeline status={proposal.status} />
                    </div>

                    {proposal.status === 'Enviado' && (
                        <div className="text-center bg-gray-900/50 p-6 rounded-lg border border-gray-700 max-w-2xl mx-auto mb-8">
                            <h3 className="text-xl font-semibold text-white">Próximo Passo: Aprovação</h3>
                            <p className="text-gray-400 my-3">Se estiver de acordo com os termos, clique no botão abaixo para aprovar a proposta e prosseguir para a formalização do contrato.</p>
                             <Button onClick={handleApprove} variant="success" className="px-8 py-3 mx-auto" disabled={workflowState === 'approving'}>
                                {workflowState === 'approving' ? 'Aprovando...' : <><FiCheck className="mr-2"/>Aprovar Proposta</>}
                            </Button>
                            {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
                        </div>
                    )}
                    
                    <div className="mx-auto my-8 w-full max-w-[21cm] bg-white rounded-lg shadow-2xl print:shadow-none print:m-0 print:p-0">
                         <ProposalPDFLayout proposal={proposal} />
                    </div>
                </>
            );
        }
        
        return null;
    };

    return (
       <>
        {/* This is the dedicated area for printing */}
        {proposal && (
            <div className="hidden print-area">
                 <ProposalPDFLayout proposal={proposal} />
            </div>
        )}

        <div className="min-h-screen bg-gray-900 text-white flex flex-col print-hidden">
            {/* Sticky Header */}
            <header className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur-md border-b border-gray-700 shadow-lg">
                <div className="flex justify-between items-center h-16 px-4 md:px-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-logo tracking-tighter text-white lowercase">hyperview</h1>
                         <span className="hidden sm:inline text-gray-400">|</span>
                        <p className="hidden sm:inline text-gray-400">Portal do Cliente</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button onClick={onNavigateToLanding} variant="secondary" className="text-sm p-2.5">
                            <FiArrowLeft className="h-5 w-5 md:mr-2" />
                            <span className="hidden md:inline">Voltar ao Portal</span>
                        </Button>
                        {(workflowState === 'viewing' || workflowState === 'approving') && (
                             <Button onClick={handlePrint} variant="primary" className="text-sm p-2.5" disabled={!proposal || workflowState === 'approving'}>
                                <FiDownload className="h-5 w-5 md:mr-2"/>
                                <span className="hidden md:inline">Baixar PDF</span>
                            </Button>
                        )}
                    </div>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                {renderContent()}
            </main>
        </div>
       </>
    );
};

export default ProposalTrackerPage;