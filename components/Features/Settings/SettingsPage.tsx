import React, { useState, useEffect } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { AppSettingsFormData, Proposal } from '../../../types';
import Button from '../../UI/Button';
import { FiSave, FiAlertCircle, FiGitBranch, FiHardDrive, FiCheckCircle, FiXCircle, FiSend, FiCpu, FiLayout, FiDollarSign } from 'react-icons/fi';
import { supabase } from '../../../services/supabaseClient';
import { useToast } from '../../../contexts/ToastContext';
import SiteContentSettings from './SiteContentSettings';

type Section = 'alertas' | 'agente' | 'financeiro' | 'integracoes' | 'status' | 'site_content';

const NavItem: React.FC<{ icon: React.ElementType, label: string, section: Section, activeSection: Section, onClick: () => void }> = ({ icon: Icon, label, section, activeSection, onClick }) => {
    const isActive = activeSection === section;
    return (
        <button
            onClick={onClick}
            className={`flex items-center w-full p-3 text-base font-normal rounded-lg transition-all duration-200 text-left ${
                isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
        >
            <Icon className="w-6 h-6" />
            <span className="ml-3">{label}</span>
        </button>
    );
};

const FormSection: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="bg-gray-800 shadow-md rounded-lg p-6">
    <h2 className="text-xl font-semibold text-white">{title}</h2>
    <p className="text-gray-400 mt-1 mb-6">{description}</p>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input id={id} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props} />
    </div>
);

const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <textarea id={id} className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props} />
    </div>
);


const CheckboxField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div className="flex items-center">
        <input type="checkbox" id={id} className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" {...props} />
        <label htmlFor={id} className="ml-2 block text-sm text-gray-300">{label}</label>
    </div>
);

type CheckStatus = 'idle' | 'loading' | 'success' | 'error';
type TableCheckStatus = {
    [key: string]: { name: string, status: CheckStatus, message: string };
};

const initialCheckStatus: TableCheckStatus = {
    empresas_unidades: { name: 'Clientes', status: 'idle', message: '' },
    proposals: { name: 'Propostas', status: 'idle', message: '' },
    contracts: { name: 'Contratos', status: 'idle', message: '' },
    financial_records: { name: 'Registros Financeiros', status: 'idle', message: '' },
    app_settings: { name: 'Configurações do App', status: 'idle', message: '' },
};

const StatusCheck: React.FC = () => {
    const [checkStatus, setCheckStatus] = useState<TableCheckStatus>(initialCheckStatus);
    const [isChecking, setIsChecking] = useState(false);

    const handleCheckStatus = async () => {
        setIsChecking(true);
        // Reset status to loading
        const loadingStatus = { ...initialCheckStatus };
        Object.keys(loadingStatus).forEach(key => {
            loadingStatus[key].status = 'loading';
        });
        setCheckStatus(loadingStatus);

        const checks = Object.keys(initialCheckStatus).map(async (tableName) => {
            // FIX: Changed select('id', ...) to select('*', ...) because not all tables have an 'id' column.
            const { error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
            return {
                tableName,
                status: error ? 'error' : 'success',
                message: error ? error.message : 'Conexão bem-sucedida.'
            };
        });

        const results = await Promise.all(checks);

        const newStatus = { ...initialCheckStatus };
        results.forEach(result => {
            newStatus[result.tableName] = {
                ...newStatus[result.tableName],
                status: result.status as CheckStatus,
                message: result.message,
            };
        });
        setCheckStatus(newStatus);
        setIsChecking(false);
    };

    const StatusIcon = ({ status }: { status: CheckStatus }) => {
        switch (status) {
            case 'loading': return <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>;
            case 'success': return <FiCheckCircle className="w-5 h-5 text-green-400" />;
            case 'error': return <FiXCircle className="w-5 h-5 text-red-400" />;
            default: return <div className="w-5 h-5 bg-gray-600 rounded-full"></div>;
        }
    };

    return (
        <FormSection
            title="Diagnóstico do Sistema"
            description="Verifique a comunicação com o backend e o status das tabelas principais do banco de dados."
        >
            <Button type="button" onClick={handleCheckStatus} disabled={isChecking}>
                <FiHardDrive className="mr-2" />
                {isChecking ? 'Verificando...' : 'Verificar Conexão'}
            </Button>
            
            <div className="space-y-3 pt-4">
                {/* FIX: Replaced Object.entries with Object.keys to fix TypeScript inference issue. */}
                {Object.keys(checkStatus).map((key) => {
                    const value = checkStatus[key];
                    return (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-md">
                            <div className="flex items-center">
                                <StatusIcon status={value.status} />
                                <span className="ml-3 text-gray-300">{value.name}</span>
                            </div>
                            <span className="text-xs text-gray-500 italic">{value.status !== 'idle' && value.status !== 'loading' ? value.message : ''}</span>
                        </div>
                    );
                })}
            </div>
        </FormSection>
    );
};


const SettingsPage: React.FC = () => {
    const { settings, isLoading: isLoadingSettings, updateSettings } = useSettings();
    const [formData, setFormData] = useState<AppSettingsFormData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTestingWebhook, setIsTestingWebhook] = useState(false);
    const [activeSection, setActiveSection] = useState<Section>('alertas');
    const { addToast } = useToast();
    
    useEffect(() => {
        // Only update form data once settings are loaded or if loading finished and there are no settings
        if (!isLoadingSettings) {
            setFormData({
                webhook_url: settings?.webhook_url || '',
                notify_on_proposal_approved: settings?.notify_on_proposal_approved || false,
                notify_on_contract_submitted: settings?.notify_on_contract_submitted || false,
                notify_on_proposal_created: settings?.notify_on_proposal_created || false,
                default_email_sender: settings?.default_email_sender || '',
                default_email_subject: settings?.default_email_subject || '',
                default_email_body: settings?.default_email_body || '',
                show_ai_chat: settings?.show_ai_chat || false,
                agent_webhook_url: settings?.agent_webhook_url || '',
                payment_instructions_daniel: settings?.payment_instructions_daniel || '',
                payment_instructions_natan: settings?.payment_instructions_natan || '',
            });
        }
    }, [settings, isLoadingSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => prev ? { ...prev, [name]: checked } : null);
        } else {
            setFormData(prev => prev ? { ...prev, [name]: value } : null);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;
        setIsSubmitting(true);
        try {
            await updateSettings(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTestWebhook = async () => {
        if (!formData?.webhook_url) {
            addToast('Por favor, insira uma URL de webhook para testar.', 'error');
            return;
        }

        setIsTestingWebhook(true);

        const mockProposalPayload: Partial<Proposal> = {
            proposal_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
            proposal_code: "PROP-2024-TEST",
            contact_person: "Cliente de Teste",
            contact_whatsapp: "5521999998888",
            event_description: "Evento de teste para webhook",
            event_location: "Rio de Janeiro, RJ",
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
            total_value: 1500.75,
            status: "Rascunho",
            empresas_unidades: {
                client_id: "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
                nome_fantasia: "Empresa Teste LTDA",
                razao_social: "Empresa de Teste e Inovação LTDA",
                cnpj_unidade: "00.111.222/0001-33",
                contact_name: "Cliente de Teste",
                contact_email: "teste@empresa.com",
                contact_whatsapp: "5521999998888",
            } as any,
        };

        try {
            const response = await fetch(formData.webhook_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mockProposalPayload),
            });

            if (response.ok) {
                addToast('Webhook de teste enviado com sucesso!', 'success');
            } else {
                addToast(`Falha no envio: Servidor respondeu com ${response.status}`, 'error');
            }
        } catch (error) {
            console.error("Webhook test error:", error);
            addToast('Erro de rede ao tentar enviar o webhook.', 'error');
        } finally {
            setIsTestingWebhook(false);
        }
    };

    const renderSection = () => {
        if (isLoadingSettings || !formData) {
            return <div className="p-6 text-center text-gray-300">Carregando...</div>;
        }

        switch(activeSection) {
            case 'alertas':
                return (
                    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                        <FormSection
                            title="Alertas de Propostas"
                            description="Envie eventos automáticos para seu webhook do N8N (ou similar) quando uma nova proposta for criada."
                        >
                             <div>
                                <label htmlFor="webhook_url" className="block text-sm font-medium text-gray-400 mb-1">URL do Webhook (POST)</label>
                                <div className="flex gap-2">
                                    <input 
                                        id="webhook_url" 
                                        name="webhook_url" 
                                        type="url" 
                                        placeholder="https://seu.n8n.url/webhook/..." 
                                        value={formData.webhook_url ?? ''} 
                                        onChange={handleChange} 
                                        className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <Button type="button" variant="secondary" onClick={handleTestWebhook} disabled={isTestingWebhook || !formData.webhook_url}>
                                        <FiSend className={`mr-2 ${isTestingWebhook ? 'animate-pulse' : ''}`}/>
                                        {isTestingWebhook ? 'Testando...' : 'Testar'}
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-700 mt-4">
                                <h4 className="text-md font-semibold text-gray-300 mb-3">Eventos</h4>
                                <CheckboxField 
                                    label="Enviar alerta quando uma nova proposta for criada" 
                                    id="notify_on_proposal_created" 
                                    name="notify_on_proposal_created" 
                                    checked={formData.notify_on_proposal_created} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </FormSection>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" variant="primary" disabled={isSubmitting}>
                                <FiSave className="mr-2"/>
                                {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
                            </Button>
                        </div>
                    </form>
                );
            case 'agente':
                return (
                    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                        <FormSection
                            title="Agente de IA da Landing Page"
                            description="Configure o assistente virtual que interage com os visitantes no seu site."
                        >
                            <CheckboxField 
                                label="Ativar e exibir o agente de IA na landing page" 
                                id="show_ai_chat" 
                                name="show_ai_chat" 
                                checked={formData.show_ai_chat} 
                                onChange={handleChange} 
                            />
                            <InputField 
                                label="URL do Webhook do Agente (n8n)" 
                                id="agent_webhook_url" 
                                name="agent_webhook_url" 
                                type="url" 
                                placeholder="https://seu.n8n.url/webhook/agente" 
                                value={formData.agent_webhook_url ?? ''} 
                                onChange={handleChange} 
                            />
                        </FormSection>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" variant="primary" disabled={isSubmitting}>
                                <FiSave className="mr-2"/>
                                {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
                            </Button>
                        </div>
                    </form>
                );
            case 'financeiro':
                return (
                     <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                        <FormSection
                            title="Instruções de Pagamento"
                            description="Configure os dados que serão preenchidos automaticamente nas faturas ao selecionar a conta recebedora."
                        >
                            <TextareaField
                                label="Instruções para 'Conta Daniel' (Hyperview)"
                                id="payment_instructions_daniel"
                                name="payment_instructions_daniel"
                                value={formData.payment_instructions_daniel || ''}
                                onChange={handleChange}
                                rows={5}
                                placeholder="Ex: HYPERVIEW MARKETING E EVENTOS (C D B JARDIM LTDA)&#10;CNPJ: 49.904.720/0001-70&#10;PIX (CNPJ): 49904720000170"
                            />
                             <TextareaField
                                label="Instruções para 'Conta Natan'"
                                id="payment_instructions_natan"
                                name="payment_instructions_natan"
                                value={formData.payment_instructions_natan || ''}
                                onChange={handleChange}
                                rows={5}
                                placeholder="Ex: NATAN PEREIRA DE SOUZA 14197452701&#10;CNPJ: 54.912.356/0001-09&#10;PIX (CNPJ): 54912356000109"
                            />
                        </FormSection>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" variant="primary" disabled={isSubmitting}>
                                <FiSave className="mr-2"/>
                                {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
                            </Button>
                        </div>
                    </form>
                );
            case 'site_content':
                return <div className="animate-fade-in"><SiteContentSettings /></div>;
            case 'integracoes':
                return (
                    <div className="animate-fade-in">
                       <FormSection
                           title="Integrações"
                           description="Conecte o HyperCRM com outras ferramentas para automatizar seus fluxos de trabalho."
                       >
                           <div className="text-center py-12 text-gray-500">
                               <FiGitBranch className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                               <h3 className="text-lg font-semibold text-gray-300">Em Breve</h3>
                               <p>Novas integrações serão adicionadas em futuras atualizações.</p>
                           </div>
                       </FormSection>
                   </div>
                );
            case 'status':
                return <div className="animate-fade-in"><StatusCheck /></div>;
            default:
                return null;
        }
    };


    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            <h1 className="text-xl md:text-2xl font-semibold text-white mb-6">Configurações</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-12 md:gap-8">
                {/* Vertical Navigation */}
                <aside className="md:col-span-3 mb-8 md:mb-0">
                    <nav className="space-y-1">
                        <NavItem icon={FiAlertCircle} label="Alertas" section="alertas" activeSection={activeSection} onClick={() => setActiveSection('alertas')} />
                        <NavItem icon={FiCpu} label="Agente IA" section="agente" activeSection={activeSection} onClick={() => setActiveSection('agente')} />
                        <NavItem icon={FiDollarSign} label="Financeiro" section="financeiro" activeSection={activeSection} onClick={() => setActiveSection('financeiro')} />
                        <NavItem icon={FiLayout} label="Conteúdo do Site" section="site_content" activeSection={activeSection} onClick={() => setActiveSection('site_content')} />
                        <NavItem icon={FiGitBranch} label="Integrações" section="integracoes" activeSection={activeSection} onClick={() => setActiveSection('integracoes')} />
                        <NavItem icon={FiHardDrive} label="Status do Sistema" section="status" activeSection={activeSection} onClick={() => setActiveSection('status')} />
                    </nav>
                </aside>

                {/* Content */}
                <main className="md:col-span-9">
                   {renderSection()}
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;