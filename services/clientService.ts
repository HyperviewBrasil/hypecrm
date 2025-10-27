import { supabase } from './supabaseClient';
import { EmpresaUnidade, EmpresaUnidadeFormData } from '../types';

/**
 * Fetches all clients from the database.
 */
export const getClients = async (): Promise<EmpresaUnidade[]> => {
    const { data, error } = await supabase
        .from('empresas_unidades')
        .select('*')
        .order('data_status', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        throw error; // Re-throw original error for better context in UI
    }
    return data || [];
};

/**
 * Fetches only active clients.
 */
export const getActiveClients = async (): Promise<EmpresaUnidade[]> => {
    const { data, error } = await supabase
        .from('empresas_unidades')
        .select('*')
        .eq('status_texto', 'Ativo')
        .order('nome_fantasia', { ascending: true });
    
    if (error) {
        console.error('Error fetching active clients:', error);
        throw error;
    }
    return data || [];
};

/**
 * Adds a new client to the database.
 */
export const addClient = async (formData: EmpresaUnidadeFormData): Promise<EmpresaUnidade> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated for adding client.');

    const clientData = {
        ...formData,
        // Convert empty string date fields to null to prevent db errors
        data_fundacao_unidade: formData.data_fundacao_unidade || null,
        inserted_by: user.id,
        status_texto: 'Ativo', // Default status
        data_status: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('empresas_unidades')
        .insert(clientData)
        .select()
        .single();
    
    if (error) {
        console.error('Error adding client:', error);
        throw error;
    }
    if (!data) {
        throw new Error('Client creation did not return data.');
    }

    return data;
};

/**
 * Adds a new "quick" client (contact) with only name and whatsapp.
 */
export const addQuickClient = async (name: string, whatsapp: string): Promise<EmpresaUnidade> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated for adding quick client.');

    const quickClientData: Partial<EmpresaUnidadeFormData> = {
        contact_name: name,
        contact_whatsapp: whatsapp,
        nome_fantasia: name, // Use name as fantasy name for quick add
        // Generate a unique, non-real CNPJ for quick adds to avoid conflicts
        cnpj_unidade: `Q-${Date.now()}`, 
        status_texto: 'Ativo',
        data_status: new Date().toISOString(),
    };

    const payload = {
        ...quickClientData,
        inserted_by: user.id,
    };

    const { data, error } = await supabase
        .from('empresas_unidades')
        .insert(payload)
        .select()
        .single();
    
    if (error) {
        console.error('Error adding quick client:', error);
        throw error;
    }

    if (!data) {
        throw new Error('Quick client creation did not return data.');
    }

    return data;
};

/**
 * Updates an existing client.
 */
export const updateClient = async (clientId: string, formData: EmpresaUnidadeFormData): Promise<EmpresaUnidade> => {
    const updateData = {
        ...formData,
        // Convert empty string date fields to null to prevent db errors
        data_fundacao_unidade: formData.data_fundacao_unidade || null,
        data_status: formData.data_status || null,
        data_atualizacao: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('empresas_unidades')
        .update(updateData)
        .eq('client_id', clientId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating client:', error);
        if (error.message.includes('duplicate key value violates unique constraint "empresas_unidades_cnpj_unidade_key"')) {
            throw new Error('Cliente já existe. Verifique se não está arquivado.');
        }
        throw error;
    }
    if (!data) {
        throw new Error('Client update did not return data.');
    }

    return data;
};

/**
 * Updates the status of a client (e.g., to archive or activate).
 */
export const updateClientStatus = async (clientId: string, status: string): Promise<EmpresaUnidade> => {
    const { data, error } = await supabase
        .from('empresas_unidades')
        .update({ 
            status_texto: status,
            data_status: new Date().toISOString(),
            data_atualizacao: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating client status:', error);
        throw error;
    }
     if (!data) {
        throw new Error('Client status update did not return data.');
    }

    return data;
};