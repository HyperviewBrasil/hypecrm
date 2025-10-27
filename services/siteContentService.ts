import { supabase } from './supabaseClient';
import { SiteContent, SiteContentFormData } from '../types';

const CONTENT_ID = 1;

/**
 * Fetches the site content settings from the database.
 * @returns A promise that resolves to the site content object or null.
 */
export const getSiteContent = async (): Promise<SiteContent | null> => {
    const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('id', CONTENT_ID)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'not found'
        console.error('Error fetching site content:', error.message);
        throw new Error('Falha ao carregar conteúdo do site.');
    }
    
    // The content is stored in a JSONB column named 'content'
    return data ? data.content : null;
};

/**
 * Updates the site content settings.
 * @param formData The data to save.
 * @returns A promise that resolves to the updated site content.
 */
export const updateSiteContent = async (formData: SiteContentFormData): Promise<SiteContent> => {
    const { data, error } = await supabase
        .from('site_content')
        .upsert({ id: CONTENT_ID, content: formData, updated_at: new Date().toISOString() })
        .select('content')
        .single();

    if (error) {
        console.error('Error updating site content:', error.message);
        throw new Error(`Falha ao salvar conteúdo do site: ${error.message}`);
    }

    if (!data) {
        throw new Error('Update did not return data.');
    }
    
    return data.content;
};
