import React, { useState } from 'react';
import Modal from '../../UI/Modal';
import Button from '../../UI/Button';
import { useToast } from '../../../contexts/ToastContext';

interface QuickClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, whatsapp: string) => Promise<void>;
  isLoading: boolean;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input id={id} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props} />
    </div>
);

const QuickClientModal: React.FC<QuickClientModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) {
      addToast('Por favor, preencha o nome e o WhatsApp.', 'error');
      return;
    }
    onSubmit(name, whatsapp);
  };
  
  // Reset fields when modal is closed
  const handleClose = () => {
    setName('');
    setWhatsapp('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cadastro Rápido de Contato">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-400">
          Adicione um novo contato rapidamente. Você poderá preencher os dados completos da empresa mais tarde na tela de Clientes.
        </p>
        <InputField
          label="Nome do Contato"
          id="quick_contact_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <InputField
          label="WhatsApp do Contato"
          id="quick_contact_whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          required
        />
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Contato'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default QuickClientModal;