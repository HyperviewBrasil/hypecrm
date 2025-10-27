import React, { useState, useEffect } from 'react';
import { SiteContent, SiteContentFormData, SiteProductCard } from '../../../types';
import { getSiteContent, updateSiteContent } from '../../../services/siteContentService';
import Button from '../../UI/Button';
import { useToast } from '../../../contexts/ToastContext';
import { FiSave, FiVideo, FiImage } from 'react-icons/fi';

const MediaPreview: React.FC<{ url: string }> = ({ url }) => {
    if (!url) {
        return (
            <div className="w-full h-24 bg-gray-700/50 flex flex-col items-center justify-center text-xs text-gray-500 rounded-md border border-dashed border-gray-600">
                <FiImage size={24} />
                <span>Sem Mídia</span>
            </div>
        );
    }
    const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');
    
    return (
        <div className="w-full h-24 bg-black rounded-md overflow-hidden shadow-inner">
            {isVideo ? (
                <video src={url} muted loop autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
                <img src={url} alt="Preview" className="w-full h-full object-cover" />
            )}
        </div>
    );
};

const FormSection: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-gray-400 mt-1 mb-6">{description}</p>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);


const SiteContentSettings: React.FC = () => {
    const [formData, setFormData] = useState<SiteContentFormData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            try {
                const content = await getSiteContent();
                if (content) {
                    setFormData(content);
                } else {
                    // Initialize with empty state if no data exists
                    setFormData({ hero_video_url: '', products: [], contact_whatsapp: '', contact_email: '' });
                }
            } catch (error: any) {
                addToast(error.message, 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, [addToast]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (formData) {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleProductChange = (index: number, field: keyof SiteProductCard, value: string | boolean) => {
        if (formData) {
            const updatedProducts = [...formData.products];
            updatedProducts[index] = { ...updatedProducts[index], [field]: value };
            setFormData({ ...formData, products: updatedProducts });
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;
        
        setIsSaving(true);
        try {
            await updateSiteContent(formData);
            addToast('Conteúdo do site salvo com sucesso!', 'success');
        } catch (error: any) {
            addToast(error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <div className="p-6 text-center text-gray-300">Carregando configurações de conteúdo...</div>;
    }
    
    if (!formData) {
        return <div className="p-6 text-center text-red-400">Não foi possível carregar os dados.</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection
                title="Vídeo do Topo (Hero)"
                description="URL do vídeo (MP4) que aparece no topo da landing page. Use links do Supabase Storage para melhor performance."
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-2">
                        <label htmlFor="hero_video_url" className="block text-sm font-medium text-gray-400 mb-1">URL do Vídeo</label>
                        <input
                            id="hero_video_url"
                            name="hero_video_url"
                            type="url"
                            value={formData.hero_video_url}
                            onChange={handleChange}
                            placeholder="https://.../video.mp4"
                            className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">Pré-visualização</label>
                         <MediaPreview url={formData.hero_video_url} />
                    </div>
                </div>
            </FormSection>

            <FormSection
                title="Cards de Produtos"
                description="Gerencie as mídias (vídeo ou imagem) e informações dos cards de produtos na landing page."
            >
                <div className="space-y-8">
                    {formData.products.map((product, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-6 border-b border-gray-700 last:border-b-0 last:pb-0">
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Produto</label>
                                    <p className="text-lg font-semibold text-white bg-gray-900/50 p-3 rounded-md">{product.name}</p>
                                </div>
                                <div>
                                    <label htmlFor={`product-url-${index}`} className="block text-sm font-medium text-gray-400 mb-1">URL da Mídia (Vídeo MP4 ou Imagem)</label>
                                    <input
                                        id={`product-url-${index}`}
                                        type="url"
                                        value={product.media_url}
                                        onChange={(e) => handleProductChange(index, 'media_url', e.target.value)}
                                        placeholder="https://.../media.mp4"
                                        className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input 
                                      type="checkbox"
                                      id={`patented-check-${index}`}
                                      checked={!!product.patented}
                                      onChange={(e) => handleProductChange(index, 'patented', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor={`patented-check-${index}`} className="ml-2 text-sm text-gray-300">Produto Patenteado</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Pré-visualização</label>
                                <MediaPreview url={product.media_url} />
                            </div>
                        </div>
                    ))}
                </div>
            </FormSection>
            
            <FormSection
                title="Contatos da Landing Page"
                description="Defina o WhatsApp e E-mail que serão usados nos botões flutuantes de contato no site."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="contact_whatsapp" className="block text-sm font-medium text-gray-400 mb-1">WhatsApp para Contato (com DDI)</label>
                        <input
                            id="contact_whatsapp"
                            name="contact_whatsapp"
                            type="tel"
                            value={formData.contact_whatsapp || ''}
                            onChange={handleChange}
                            placeholder="5521999998888"
                            className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="contact_email" className="block text-sm font-medium text-gray-400 mb-1">E-mail para Contato</label>
                        <input
                            id="contact_email"
                            name="contact_email"
                            type="email"
                            value={formData.contact_email || ''}
                            onChange={handleChange}
                            placeholder="contato@empresa.com"
                            className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm"
                        />
                    </div>
                </div>
            </FormSection>


            <div className="flex justify-end pt-4">
                <Button type="submit" variant="primary" disabled={isSaving}>
                    <FiSave className="mr-2"/>
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </form>
    );
};

export default SiteContentSettings;