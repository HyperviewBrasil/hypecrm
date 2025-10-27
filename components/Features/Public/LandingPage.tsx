import React, { useState, useEffect, useRef } from 'react';
import Button from '../../UI/Button';
import LoginModal from '../Auth/LoginModal';
import ProposalRequestForm from './ProposalRequestForm';
import { FiArrowRight, FiCpu, FiImage } from 'react-icons/fi';
import { getPublicSiteContent } from '../../../services/publicService';
import { SiteContent, SiteProductCard } from '../../../types';
import FloatingContactButtons from './FloatingContactButtons';

// Fallback data in case the backend fetch fails
const fallbackContent: SiteContent = {
    hero_video_url: 'https://hxgasuppbciqlytlebty.supabase.co/storage/v1/object/public/media/fundosite2.mp4',
    products: [
        { name: 'Hyperhost', description: 'Hologramas em tamanho real...', media_url: 'https://hxgasuppbciqlytlebty.supabase.co/storage/v1/object/public/site/hyperhost.mp4', patented: false },
        { name: 'Hypertalk', description: 'Eleve suas palestras a outro patamar...', media_url: 'https://hxgasuppbciqlytlebty.supabase.co/storage/v1/object/public/site/hypertalk.mp4', patented: false },
        { name: 'Hyperbag', description: 'A mochila holográfica...', media_url: 'https://hxgasuppbciqlytlebty.supabase.co/storage/v1/object/public/site/hyperbag.mp4', patented: true },
        { name: 'Decoração de Stands', description: 'Destaque sua marca...', media_url: 'https://hxgasuppbciqlytlebty.supabase.co/storage/v1/object/public/site/decoracao.mp4', patented: false }
    ],
    contact_whatsapp: '5521987296134',
    contact_email: 'contato@hyperview.com.br',
};

const ProductCard: React.FC<{ product: SiteProductCard }> = ({ product }) => {
    const isVideo = product.media_url.endsWith('.mp4') || product.media_url.endsWith('.webm');

    return (
        <div className="flex-shrink-0 w-80 h-[28rem] rounded-xl border border-white/10 bg-gray-800/20 backdrop-blur-lg p-6 flex flex-col justify-end relative overflow-hidden group">
            {isVideo ? (
                <video
                    src={product.media_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            ) : (
                <img
                    src={product.media_url}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white">{product.name}</h3>
                <p className="text-gray-300 mt-2 text-sm">{product.description}</p>
                {product.patented && (
                    <div className="mt-4 inline-block bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 rounded-full px-3 py-1 text-xs font-semibold">
                        Produto Patenteado
                    </div>
                )}
            </div>
        </div>
    );
};

const ProductCardSkeleton: React.FC = () => (
    <div className="flex-shrink-0 w-80 h-[28rem] rounded-xl border border-white/10 bg-gray-800/50 p-6 flex flex-col justify-end relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gray-700"></div>
        <div className="relative z-10 space-y-3">
            <div className="h-8 bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-600 rounded w-5/6"></div>
        </div>
    </div>
);


const LandingPage: React.FC<{ onNavigateToHype: (initialMessage?: string) => void; }> = ({ onNavigateToHype }) => {
    const [subSloganIndex, setSubSloganIndex] = useState(0);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [siteContent, setSiteContent] = useState<SiteContent>(fallbackContent);
    const [isLoadingContent, setIsLoadingContent] = useState(true);

    const subSlogans = [
        "Líder mundial em soluções para holografia.",
        "Locações e vendas para eventos e ativação de marcas."
    ];
    
    useEffect(() => {
        const fetchContent = async () => {
            setIsLoadingContent(true);
            const content = await getPublicSiteContent();
            setSiteContent(content || fallbackContent);
            setIsLoadingContent(false);
        };
        fetchContent();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setSubSloganIndex(prevIndex => (prevIndex + 1) % subSlogans.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <div className="bg-gray-900 text-white font-sans">
                <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md">
                    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-logo text-white lowercase">hyperview</h1>
                        <Button onClick={() => setIsLoginModalOpen(true)} variant="secondary">
                            Acesso Restrito
                        </Button>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
                    {isLoadingContent ? (
                        <div className="absolute z-0 w-full h-full bg-gray-800 animate-pulse"></div>
                    ) : (
                        <video
                            key={siteContent.hero_video_url}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute z-0 w-full h-full object-cover"
                            src={siteContent.hero_video_url}
                        />
                    )}
                    <div className="absolute z-10 inset-0 bg-black/60"></div>
                    <div className="relative z-20 px-6">
                        <h2 className="text-4xl md:text-7xl font-extrabold text-white leading-tight drop-shadow-lg">
                            Sua Mensagem, Outra Dimensão
                        </h2>
                        <div className="h-8 mt-4">
                            {subSlogans.map((slogan, index) => (
                                 <p key={index} className={`text-lg md:text-xl text-gray-300 transition-opacity duration-1000 absolute w-full left-0 ${subSloganIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                                    {slogan}
                                </p>
                            ))}
                        </div>
                    </div>
                </section>

                 {/* Products Section */}
                <section className="py-16 md:py-24 bg-gray-900">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-white">Conheça Nossas Soluções Holográficas</h2>
                            <p className="mt-4 text-lg text-gray-400">Tecnologia de ponta para criar experiências inesquecíveis.</p>
                        </div>
                        <div className="flex gap-8 pb-4 -mx-6 px-6 overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {isLoadingContent ? (
                                Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                            ) : (
                               (siteContent.products || []).map(product => (
                                    <div key={product.name} className="snap-center">
                                        <ProductCard product={product} />
                                    </div>
                                ))
                            )}
                             <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
                        </div>
                    </div>
                </section>

                {/* Hype AI Section */}
                <section className="py-16 md:py-24 bg-black/20">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                             <div className="flex-shrink-0">
                                <img src="https://hxgasuppbciqlytlebty.supabase.co/storage/v1/object/public/site/perfilhype.png" alt="Hype AI Assistant" className="w-40 h-40 rounded-full border-4 border-blue-500 shadow-lg"/>
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-3xl md:text-4xl font-bold text-white">Converse com o Futuro, Agora.</h2>
                                <p className="mt-4 text-lg text-gray-300">
                                    Nossa assistente virtual Hype está pronta para ajudar. Peça informações sobre os produtos da Hyperview, solicite orçamentos, tire dúvidas técnicas e explore o universo da projeção holográfica.
                                </p>
                                <div className="mt-8">
                                    <Button onClick={() => onNavigateToHype()} variant="primary" className="px-8 py-3 text-lg">
                                        <FiCpu className="mr-3"/> Iniciar Chat com Hype
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Proposal Form Section */}
                <section id="proposal-form-section" className="bg-gray-900 py-16 md:py-24">
                    <div className="container mx-auto px-6 max-w-4xl">
                        <div className="text-center mb-12">
                             <h2 className="text-3xl md:text-4xl font-bold text-white">Pronto para Inovar?</h2>
                            <p className="mt-4 text-lg text-gray-400">Preencha o formulário abaixo e nossa equipe criará uma proposta personalizada para o seu projeto.</p>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 sm:p-8 rounded-2xl shadow-2xl">
                            <ProposalRequestForm />
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-800">
                    <div className="container mx-auto px-6 py-8 text-center text-gray-400">
                        <p>&copy; {new Date().getFullYear()} Hyperview. Todos os direitos reservados.</p>
                    </div>
                </footer>
            </div>
            <FloatingContactButtons
                whatsapp={siteContent.contact_whatsapp}
                email={siteContent.contact_email}
            />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </>
    );
};

export default LandingPage;