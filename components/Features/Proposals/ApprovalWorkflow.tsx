import React from 'react';
import { FiCheckCircle, FiPenTool, FiSend } from 'react-icons/fi';
import PublicContractForm from './PublicContractForm';
import { PublicFinalizationFormData, EmpresaUnidade } from '../../../types';

type WorkflowStatus = 'approved' | 'submitting' | 'submitted';

interface ApprovalWorkflowProps {
  status: WorkflowStatus;
  onSubmit: (data: PublicFinalizationFormData) => void;
  error: string | null;
  initialClientData?: EmpresaUnidade | null;
}

const Step: React.FC<{ icon: React.ElementType, title: string, description: string, isActive: boolean, isCompleted: boolean }> = ({ icon: Icon, title, description, isActive, isCompleted }) => {
    const statusClasses = {
        completed: 'bg-green-600 border-green-500 text-white',
        active: 'bg-blue-600 border-blue-500 text-white',
        inactive: 'bg-gray-700 border-gray-600 text-gray-400'
    };
    
    let currentClass = statusClasses.inactive;
    if (isCompleted) currentClass = statusClasses.completed;
    if (isActive) currentClass = statusClasses.active;

    return (
        <div className="flex items-start">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${currentClass}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="ml-4">
                <h4 className={`font-bold ${isCompleted || isActive ? 'text-white' : 'text-gray-400'}`}>{title}</h4>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
    );
};


const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({ status, onSubmit, error, initialClientData }) => {
    
    if (status === 'submitted') {
        return (
             <div className="text-center text-gray-300 max-w-xl mx-auto bg-gray-900/50 p-8 rounded-lg">
                <FiCheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">Dados Enviados com Sucesso!</h2>
                <p className="text-gray-400">
                    Obrigado por preencher as informações. O contrato foi formalizado e nossa equipe entrará em contato em breve para os próximos passos.
                </p>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Proposta Aprovada!</h2>
                <p className="text-gray-400 mt-2">Excelente! Agora precisamos de algumas informações adicionais para formalizar o contrato.</p>
            </div>
            
            {/* Stepper */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Step icon={FiCheckCircle} title="Passo 1: Aprovado" description="Você aceitou os termos da proposta." isCompleted={true} isActive={false} />
                <Step icon={FiPenTool} title="Passo 2: Preencher Dados" description="Forneça os detalhes para o contrato." isCompleted={false} isActive={true} />
                <Step icon={FiSend} title="Passo 3: Finalizado" description="O contrato é formalizado e enviado." isCompleted={false} isActive={false} />
            </div>
            
             <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-6">Formulário de Dados do Contrato</h3>
                {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
                <PublicContractForm 
                    isLoading={status === 'submitting'}
                    onSubmit={onSubmit}
                    initialClientData={initialClientData}
                />
            </div>
        </div>
    );
};

export default ApprovalWorkflow;
