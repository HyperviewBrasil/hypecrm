import React, { useState, useEffect } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import AIChat from './AIChat';
import Button from '../../UI/Button';
import { getPublicSettings } from '../../../services/publicService';

interface HypePageProps {
  onNavigateToLanding: () => void;
  initialMessage?: string | null;
}

interface PublicSettings {
    show_ai_chat: boolean;
    agent_webhook_url: string | null;
}

const HypePage: React.FC<HypePageProps> = ({ onNavigateToLanding, initialMessage }) => {
    const [settings, setSettings] = useState<PublicSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const publicSettings = await getPublicSettings();
            setSettings(publicSettings);
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur-md border-b border-gray-700 shadow-lg flex-shrink-0">
                <div className="flex justify-between items-center h-16 px-4 md:px-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-logo tracking-tighter text-white lowercase">hyperview</h1>
                         <span className="hidden sm:inline text-gray-400">|</span>
                        <p className="hidden sm:inline text-gray-400">Atendente Virtual Hype</p>
                    </div>
                    <Button onClick={onNavigateToLanding} variant="secondary" className="text-sm p-2.5">
                        <FiArrowLeft className="h-5 w-5 md:mr-2" />
                        <span className="hidden md:inline">Voltar à Página Inicial</span>
                    </Button>
                </div>
            </header>
            
            <main className="flex-1 flex flex-col items-center justify-center p-0 sm:p-4 overflow-hidden">
                <div className="w-full h-full max-w-4xl mx-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-400">Carregando agente...</p>
                        </div>
                    ) : (settings?.show_ai_chat && settings.agent_webhook_url) ? (
                        <AIChat webhookUrl={settings.agent_webhook_url} initialMessage={initialMessage} />
                    ) : (
                         <div className="text-center text-gray-400">
                            <h2 className="text-2xl font-bold text-white mb-2">Agente Indisponível</h2>
                            <p>O assistente virtual não está ativado no momento.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default HypePage;