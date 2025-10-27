import { supabase } from './supabaseClient';
import { Proposal, ProposalFormData, ProposalItem } from '../types';
import { getSettings } from './settingsService';

// Helper function to calculate total value
const calculateTotal = (formData: ProposalFormData): number => {
    // Calculate number of days
    let days = 0;
    if (formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        if (end >= start) {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            // +1 to be inclusive of start and end dates
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
    }
    
    // If dates are not set or invalid, but there are items, assume 1 day for calculation.
    const effectiveDays = days > 0 ? days : 1;

    const itemsDailyTotal = formData.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_value)), 0);
    const itemsPeriodTotal = itemsDailyTotal * effectiveDays;
    
    const subtotal = itemsPeriodTotal + Number(formData.travel_costs) + Number(formData.production_costs);
    return subtotal - Number(formData.discount);
};

// Helper to build a clean payload for the database from form data
const buildProposalPayload = (formData: ProposalFormData) => {
    const total_value = calculateTotal(formData);
    
    // Explicitly construct the object to send to Supabase
    // This prevents extra properties (like 'empresas_unidades' from a join) from being sent during an update
    return {
        client_id: formData.client_id,
        contact_person: formData.contact_person,
        contact_whatsapp: formData.contact_whatsapp,
        event_description: formData.event_description,
        event_location: formData.event_location,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        items: formData.items.map(({ id, ...rest }) => rest), // remove temporary client-side ID
        travel_costs: Number(formData.travel_costs) || 0,
        production_costs: Number(formData.production_costs) || 0,
        discount: Number(formData.discount) || 0,
        status: formData.status,
        total_value: total_value,
    };
};

/**
 * Generates the next proposal code (e.g., PROP-YYYY-XXXX).
 * This version is more resilient to race conditions by fetching the highest existing code
 * and incrementing it, which works better with the retry logic in `addProposal`.
 */
export const getNextProposalCode = async (): Promise<string> => {
    const currentYear = new Date().getFullYear();
    // Fetch the latest proposal code for the current year to determine the next sequential number.
    const { data, error } = await supabase
        .from('proposals')
        .select('proposal_code')
        .like('proposal_code', `PROP-${currentYear}-%`)
        .order('proposal_code', { ascending: false }) // Order descending to get the highest number first
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // 'PGRST116' means no rows found, which is fine.
        console.error('Error fetching latest proposal code:', error);
        throw new Error('Falha ao buscar o último código de proposta.');
    }

    let nextId = 1;
    if (data && data.proposal_code) {
        // If a proposal exists, parse its number and increment.
        try {
            const lastIdNumber = parseInt(data.proposal_code.split('-')[2], 10);
            nextId = lastIdNumber + 1;
        } catch (parseError) {
            console.error('Error parsing last proposal code, falling back to count.', parseError);
            // Fallback to count method if parsing fails for some reason
            const { count } = await supabase
                .from('proposals')
                .select('*', { count: 'exact', head: true })
                .like('proposal_code', `PROP-${currentYear}-%`);
            nextId = (count || 0) + 1;
        }
    }
    // If no proposal exists for the year, nextId remains 1.

    const paddedId = nextId.toString().padStart(4, '0');
    return `PROP-${currentYear}-${paddedId}`;
};


/**
 * Fetches all proposals from the database.
 */
export const getProposals = async (): Promise<Proposal[]> => {
    const { data, error } = await supabase
        .from('proposals')
        .select(`
            *,
            empresas_unidades (
                *
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching proposals:', error.message, error.details);
        throw new Error(`Falha ao carregar propostas: ${error.message}`);
    }

    return data || [];
};

/**
 * Fetches a single proposal by its secure public access ID for public viewing.
 * @param publicId The proposal's public access UUID.
 * @returns A promise that resolves to the proposal or null if not found.
 */
export const getProposalByPublicId = async (publicId: string): Promise<Proposal | null> => {
    const { data, error } = await supabase
        .from('proposals')
        .select(`
            *,
            empresas_unidades (
                *
            )
        `)
        .eq('public_access_id', publicId)
        .single(); // Expects one or zero results
    
    if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
        console.error('Error fetching proposal by public ID:', error.message);
        throw new Error('Falha ao buscar a proposta.');
    }

    return data;
};


/**
 * Adds a new proposal to the database, handling potential proposal_code collisions.
 */
export const addProposal = async (formData: ProposalFormData): Promise<Proposal> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated for adding proposal.');

    let createdProposal: Proposal | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!createdProposal && attempts < maxAttempts) {
        attempts++;
        const proposalCode = await getNextProposalCode();

        const proposalData = {
            ...buildProposalPayload(formData),
            created_by: user.id,
            proposal_code: proposalCode,
        };

        const { data, error } = await supabase
            .from('proposals')
            .insert(proposalData)
            .select('*, empresas_unidades(*)')
            .single();

        if (error) {
            // '23505' is the PostgreSQL error code for unique_violation
            if (error.code === '23505' && error.message.includes('proposals_proposal_code_key')) {
                console.warn(`Attempt ${attempts}: Collision on proposal code ${proposalCode}. Retrying...`);
                // Wait a random short time before the next attempt to reduce future collisions
                await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
            } else {
                // For any other error, we should fail immediately
                console.error('Error adding proposal:', error.message, error.details);
                throw new Error(`Falha ao adicionar proposta: ${error.message}`);
            }
        } else if (data) {
            createdProposal = data;
        }
    }

    if (!createdProposal) {
        throw new Error('Falha ao criar proposta após múltiplas tentativas devido a conflitos de código. Por favor, tente novamente.');
    }

    return createdProposal;
};


/**
 * Updates an existing proposal.
 */
export const updateProposal = async (proposalId: string, formData: ProposalFormData): Promise<Proposal> => {
    const proposalData = buildProposalPayload(formData);

    const { data, error } = await supabase
        .from('proposals')
        .update(proposalData)
        .eq('proposal_id', proposalId)
        .select()
        .single();

    if (error) {
        console.error('Error updating proposal:', error.message, error.details);
        throw new Error(`Falha ao atualizar proposta: ${error.message}`);
    }

    if (!data) {
        throw new Error('Proposal update did not return data.');
    }

    return data;
};

/**
 * Updates the status of a proposal (e.g., to archive or unarchive it).
 * @param proposalId - The ID of the proposal to update.
 * @param status - The new status text (e.g., 'Arquivado', 'Rascunho').
 * @returns A promise that resolves to the updated proposal.
 */
export const updateProposalStatus = async (proposalId: string, status: string): Promise<Proposal> => {
    const { data, error } = await supabase
        .from('proposals')
        .update({ status: status })
        .eq('proposal_id', proposalId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating proposal status:', error.message, error.details);
        throw new Error(`Falha ao atualizar status da proposta: ${error.message}`);
    }

    if (!data) {
        throw new Error('Proposal status update did not return data.');
    }

    return data;
};

/**
 * Allows a public user to approve a proposal, which triggers contract creation.
 * @param publicId The public access ID of the proposal to approve.
 * @returns The public access ID of the newly created contract.
 */
export const approveProposalPublic = async (publicId: string): Promise<string> => {
    const { data, error } = await supabase.rpc('approve_proposal_and_create_contract', {
        proposal_public_id: publicId,
    });

    if (error) {
        console.error('Error in RPC approve_proposal_and_create_contract:', error);
        throw new Error(error.message || 'Falha ao aprovar a proposta.');
    }

    return data;
};

/**
 * Fetches statistics about proposals (drafts and sent counts).
 */
export const getProposalStats = async (): Promise<{ draftCount: number; sentCount: number }> => {
  const { count: draftCount, error: draftError } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Rascunho');

  if (draftError) {
    console.error('Error fetching draft proposal count:', draftError.message);
    throw new Error('Falha ao contar propostas em rascunho.');
  }

  const { count: sentCount, error: sentError } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Enviado');

  if (sentError) {
    console.error('Error fetching sent proposal count:', sentError.message);
    throw new Error('Falha ao contar propostas enviadas.');
  }

  return { draftCount: draftCount || 0, sentCount: sentCount || 0 };
};