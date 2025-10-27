import { supabase } from './supabaseClient';
import { PublicProposalRequestFormData, SiteContent } from '../types';

/**
 * Handles the submission from the public proposal request form by calling a secure RPC function.
 * This function encapsulates the logic to find/create a client and then create a new proposal
 * in a single, atomic transaction on the backend, bypassing RLS issues for anonymous users.
 */
export const submitPublicProposalRequest = async (formData: PublicProposalRequestFormData): Promise<void> => {
  const cleanedCnpj = formData.cnpj.replace(/\D/g, '').trim();

  const { error } = await supabase.rpc('create_public_proposal_request', {
    p_name: formData.name,
    p_email: formData.email,
    p_whatsapp: formData.whatsapp,
    p_company: formData.company,
    // FIX: If CNPJ is empty, generate a unique placeholder like in `addQuickClient` to satisfy the NOT NULL constraint.
    p_cnpj: cleanedCnpj || `Q-${Date.now()}`,
    p_start_date: formData.start_date || null,
    p_end_date: formData.end_date || null,
    p_location: formData.location,
    p_description: formData.description,
  });

  if (error) {
    console.error('Error in RPC create_public_proposal_request:', error);
    // Propagate a more specific error message from the backend if available.
    const userMessage = error.message || 'Falha ao registrar sua solicitação. Por favor, tente novamente mais tarde.';
    throw new Error(userMessage);
  }
};

/**
 * Fetches public-facing settings, like feature toggles for the landing page.
 * Calls a secure RPC function that only exposes safe-to-view settings.
 */
export const getPublicSettings = async (): Promise<{ show_ai_chat: boolean; agent_webhook_url: string | null }> => {
  const { data, error } = await supabase.rpc('get_public_settings');

  if (error) {
    console.error('Error fetching public settings:', error.message);
    // Return a safe default so the page doesn't break
    return { show_ai_chat: false, agent_webhook_url: null };
  }
  return data;
};

/**
 * Fetches public site content (hero video, product cards) for the landing page.
 * Calls a secure RPC function.
 */
export const getPublicSiteContent = async (): Promise<SiteContent | null> => {
  const { data, error } = await supabase.rpc('get_public_site_content');

  if (error) {
    console.error('Error fetching public site content:', error.message);
    return null; // Return null on error so the page can use fallbacks
  }
  return data;
};
