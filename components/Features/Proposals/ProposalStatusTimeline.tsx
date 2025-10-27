import React from 'react';
import { FiEdit, FiSend, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface ProposalStatusTimelineProps {
  status: 'Rascunho' | 'Enviado' | 'Aprovado' | 'Recusado' | 'Arquivado';
}

const steps = [
  { name: 'Rascunho', icon: FiEdit },
  { name: 'Enviado', icon: FiSend },
  { name: 'Aprovado', icon: FiCheckCircle },
];

const getStepIndex = (status: ProposalStatusTimelineProps['status']) => {
  switch (status) {
    case 'Rascunho': return 0;
    case 'Enviado': return 1;
    case 'Aprovado': return 2;
    case 'Recusado': return 1; // It happens after 'Enviado'
    case 'Arquivado': return -1; // Not part of the main flow
    default: return -1;
  }
};

const ProposalStatusTimeline: React.FC<ProposalStatusTimelineProps> = ({ status }) => {
  const currentStepIndex = getStepIndex(status);

  if (status === 'Arquivado') {
    return <div className="text-center text-gray-500">Proposta Arquivada</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isRecusado = status === 'Recusado' && step.name === 'Aprovado';
          
          let iconComponent;
          if (isRecusado) {
            iconComponent = <FiXCircle className="w-6 h-6 text-red-500" />;
          } else {
            iconComponent = <step.icon className={`w-6 h-6 ${isActive || isCompleted ? 'text-white' : 'text-gray-500'}`} />;
          }

          return (
            <React.Fragment key={step.name}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isRecusado ? 'bg-red-900/50 border-red-500' :
                  isCompleted ? 'bg-green-600 border-green-500' :
                  isActive ? 'bg-blue-600 border-blue-500 animate-pulse' :
                  'bg-gray-700 border-gray-600'
                }`}>
                  {iconComponent}
                </div>
                <p className={`mt-2 text-sm font-semibold text-center ${
                  isRecusado ? 'text-red-400' :
                  isActive || isCompleted ? 'text-white' : 
                  'text-gray-400'
                }`}>{isRecusado ? 'Recusado' : step.name}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 transition-colors duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gray-600'}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProposalStatusTimeline;
