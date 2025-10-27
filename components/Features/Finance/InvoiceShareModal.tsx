import React from 'react';
import Modal from '../../UI/Modal';
import Button from '../../UI/Button';
import { FinancialRecord } from '../../../types';
import { FiCopy, FiMail, FiDownload, FiMessageSquare } from 'react-icons/fi';
import { useToast } from '../../../contexts/ToastContext';

interface InvoiceShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: FinancialRecord | null;
}

const InvoiceShareModal: React.FC<InvoiceShareModalProps> = ({ isOpen, onClose, record }) => {
    const { addToast } = useToast();

    if (!record) return null;

    const shareUrl = `${window.location.origin}${window.location.pathname}?publicView=invoice_tracker&id=${record.public_access_id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            addToast('Link copiado para a área de transferência!', 'success');
        }).catch(err => {
            addToast('Falha ao copiar o link.', 'error');
        });
    };

    const handleShareEmail = () => {
        const subject = `Fatura Ref. Contrato: ${record.contracts.contract_code} - Hyperview`;
        const body = `Olá,\n\nSegue o link para acessar a fatura referente ao contrato ${record.contracts.contract_code}:\n\n${shareUrl}\n\nAtenciosamente,\nEquipe Hyperview`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleShareWhatsApp = () => {
        const message = `Olá! Acesse a fatura referente ao contrato ${record.contracts.contract_code} da Hyperview através do link: ${shareUrl}`;
        const encodedMessage = encodeURIComponent(message);
        let phoneNumber = record.contracts.proposals?.contact_whatsapp?.replace(/\D/g, '') || '';

        if (phoneNumber) {
            if (phoneNumber.length === 10 || phoneNumber.length === 11) {
                phoneNumber = '55' + phoneNumber;
            }
            window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
        } else {
            addToast('Número de WhatsApp não encontrado. Abrindo compartilhamento geral.', 'info');
            window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        }
    };
    
    const handleDownloadPdf = () => {
        addToast("Preparando para impressão...", "info");
        setTimeout(() => window.print(), 500);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Compartilhar Fatura">
            <div className="p-2">
                <div className="mb-6">
                    <p className="text-gray-400 text-sm">Fatura do Contrato</p>
                    <p className="font-bold text-white text-lg">{record.contracts.contract_code}</p>
                    <p className="text-gray-300">Cliente: {record.contracts.proposals?.empresas_unidades?.nome_fantasia || 'N/A'}</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">Link de Acesso Público</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <Button variant="secondary" onClick={handleCopyLink} title="Copiar Link">
                                <FiCopy />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                        <Button onClick={handleShareEmail} variant="secondary">
                            <FiMail className="mr-2" /> Email
                        </Button>
                         <Button onClick={handleShareWhatsApp} variant="secondary">
                            <FiMessageSquare className="mr-2" /> WhatsApp
                        </Button>
                        <Button onClick={handleDownloadPdf} variant="primary">
                            <FiDownload className="mr-2" /> Baixar PDF
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceShareModal;
