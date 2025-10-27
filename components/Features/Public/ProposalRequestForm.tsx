import React, { useState } from 'react';
import Button from '../../UI/Button';
import { useToast } from '../../../contexts/ToastContext';
import { submitPublicProposalRequest } from '../../../services/publicService';
import { PublicProposalRequestFormData } from '../../../types';

const initialFormData: PublicProposalRequestFormData = {
  name: '',
  email: '',
  whatsapp: '',
  company: '',
  cnpj: '',
  start_date: '',
  end_date: '',
  location: '',
  description: '',
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, required?: boolean, containerClassName?: string }> = ({ label, id, required, containerClassName, ...props }) => (
    <div className={containerClassName}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        <input id={id} required={required} className="w-full px-3 py-2 border bg-gray-800 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props} />
    </div>
);

const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string, required?: boolean }> = ({ label, id, required, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        <textarea id={id} required={required} className="w-full px-3 py-2 border bg-gray-800 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props} />
    </div>
);


const ProposalRequestForm: React.FC = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        let formattedValue = value;
        if (value.length > 2) formattedValue = `${value.slice(0, 2)}.${value.slice(2)}`;
        if (value.length > 5) formattedValue = `${formattedValue.slice(0, 6)}.${formattedValue.slice(6)}`;
        if (value.length > 8) formattedValue = `${formattedValue.slice(0, 10)}/${formattedValue.slice(10)}`;
        if (value.length > 12) formattedValue = `${formattedValue.slice(0, 15)}-${formattedValue.slice(15)}`;
        setFormData(prev => ({ ...prev, cnpj: formattedValue.slice(0, 18) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            await submitPublicProposalRequest(formData);
            setFormData(initialFormData); // Reset form
            addToast('Solicitação enviada! Nossa equipe entrará em contato em breve.', 'success');
        } catch (error: any) {
            console.error("Form submission error:", error);
            addToast(error.message || 'Falha ao enviar solicitação. Tente novamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Seu Nome" id="name" name="name" value={formData.name} onChange={handleChange} required autoComplete="name" containerClassName="md:col-span-2" />
                <InputField label="E-mail" id="email" name="email" type="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
                <InputField label="WhatsApp" id="whatsapp" name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange} required autoComplete="tel" />
                <InputField label="Empresa (Opcional)" id="company" name="company" value={formData.company} onChange={handleChange} autoComplete="organization" />
                <InputField label="CNPJ (Opcional)" id="cnpj" name="cnpj" value={formData.cnpj} onChange={handleCnpjChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Data de Início do Evento" id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} required />
                <InputField label="Data Final do Evento" id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} required />
            </div>

            <InputField label="Local/Cidade do Evento" id="location" name="location" value={formData.location} onChange={handleChange} required />
            
            <TextareaField 
                label="Descreva o evento ou como gostaria de usar o holograma"
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Ex: Lançamento de produto em um shopping, show com artista holográfico, etc."
            />

            <div className="text-right pt-4">
                <Button type="submit" variant="primary" className="px-8 py-3" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                </Button>
            </div>
        </form>
    );
};

export default ProposalRequestForm;