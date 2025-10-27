import React, { useState, useEffect } from 'react';
import { FinancialRecord } from '../../../types';
import { getFinancialRecordByPublicId } from '../../../services/financialService';
import { FiLock, FiDownload, FiArrowLeft } from 'react-icons/fi';
import InvoicePDFLayout from './InvoicePDFLayout';
import Button from '../../UI/Button';

interface InvoiceTrackerPageProps {
  onNavigateToLanding: () => void;
}

const InvoiceTrackerPage: React.FC<InvoiceTrackerPageProps> = ({ onNavigateToLanding }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [record, setRecord] = useState<FinancialRecord | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const publicId = params.get('id');

        if (!publicId) {
            setError('Link de acesso inválido ou ausente.');
            setIsLoading(false);
            return;
        }

        const fetchRecord = async () => {
            setIsLoading(true);
            try {
                const result = await getFinancialRecordByPublicId(publicId);
                if (!result) {
                    setError('Fatura não encontrada ou o link é inválido.');
                }
                setRecord(result);
            } catch (err: any) {
                setError(err.message || 'Ocorreu um erro ao buscar os dados.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecord();
    }, []);
    
    const handlePrint = () => {
        window.print();
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full pt-20">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-400">Carregando fatura...</p>
                </div>
            );
        }
        
        if (error) {
             return (
                <div className="flex flex-col items-center justify-center h-full pt-20 text-center">
                    <FiLock className="h-12 w-12 text-yellow-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white">Não foi possível carregar o documento</h3>
                    <p className="text-red-400 mt-2">{error}</p>
                </div>
            );
        }

        if (record) {
            return (
                <div className="mx-auto my-8 w-full max-w-[21cm] bg-white rounded-lg shadow-2xl print:shadow-none print:m-0 print:p-0">
                     <InvoicePDFLayout record={record} />
                </div>
            );
        }
        
        return null;
    };

    return (
       <>
        {record && (
            <div className="hidden print-area">
                 <InvoicePDFLayout record={record} />
            </div>
        )}

        <div className="min-h-screen bg-gray-900 text-white flex flex-col print-hidden">
            <header className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur-md border-b border-gray-700 shadow-lg">
                <div className="flex justify-between items-center h-16 px-4 md:px-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-logo tracking-tighter text-white lowercase">hyperview</h1>
                         <span className="hidden sm:inline text-gray-400">|</span>
                        <p className="hidden sm:inline text-gray-400">Visualização de Fatura</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <Button onClick={onNavigateToLanding} variant="secondary" className="text-sm px-3 py-1.5">
                            <FiArrowLeft className="mr-2 h-4 w-4"/> Voltar ao Portal
                        </Button>
                         <Button onClick={handlePrint} variant="primary" disabled={!record || isLoading}>
                            <FiDownload className="mr-2"/> Baixar PDF
                        </Button>
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

export default InvoiceTrackerPage;
