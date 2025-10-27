

import { supabase } from './supabaseClient';
import { Contract, ContractFormData, PublicContractFormData, PublicFinalizationFormData } from '../types';

// Helper to build a clean payload for the database from form data
const buildContractPayload = (formData: ContractFormData) => {
    return {
      proposal_id: formData.proposal_id,
      signatory_name: formData.signatory_name,
      signatory_cpf: formData.signatory_cpf,
      signatory_rg: formData.signatory_rg,
      signatory_address: formData.signatory_address,
      signatory_emails: formData.signatory_emails,
      installation_address: formData.installation_address,
      installation_contact_name: formData.installation_contact_name,
      installation_contact_whatsapp: formData.installation_contact_whatsapp,
      billing_contact_name: formData.billing_contact_name,
      billing_contact_email: formData.billing_contact_email,
      items: formData.items.map(({ id, ...rest }) => rest), // remove temporary client-side ID
      travel_costs: Number(formData.travel_costs) || 0,
      production_costs: Number(formData.production_costs) || 0,
      discount: Number(formData.discount) || 0,
      contract_value: formData.contract_value,
      status: formData.status,
      additional_info: formData.additional_info,
      purchase_order: formData.purchase_order,
    };
};

/**
 * Generates the next contract code (e.g., CONT-YYYY-XXXX).
 */
export const getNextContractCode = async (): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const { data, error, count } = await supabase
        .from('contracts')
        .select('contract_code', { count: 'exact', head: true })
        .like('contract_code', `CONT-${currentYear}-%`);

    if (error) {
        console.error('Error fetching contract count:', error);
        // Fallback in case of error
        return `CONT-${currentYear}-0001`;
    }

    const nextId = (count || 0) + 1;
    const paddedId = nextId.toString().padStart(4, '0');
    return `CONT-${currentYear}-${paddedId}`;
};

/**
 * Fetches all contracts from the database.
 */
export const getContracts = async (): Promise<Contract[]> => {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
            *,
            proposals (
                *,
                empresas_unidades (
                    *
                )
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching contracts:', error.message, error.details);
        throw new Error(`Falha ao carregar contratos: ${error.message}`);
    }

    return data || [];
};

/**
 * Fetches a single contract by its secure public access ID for public viewing.
 */
export const getContractByPublicId = async (publicId: string): Promise<Contract | null> => {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
             *,
            proposals (
                *,
                empresas_unidades (
                    *
                )
            )
        `)
        .eq('public_access_id', publicId)
        .single();
        
    if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
        console.error('Error fetching contract by public ID:', error.message);
        throw new Error('Falha ao buscar o contrato.');
    }

    return data;
};


/**
 * Adds a new contract to the database.
 */
export const addContract = async (formData: ContractFormData): Promise<Contract> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated for adding contract.');

    // --- PREVENTIVE CHECK FOR DUPLICATE CONTRACT ---
    const { data: existingContract, error: checkError } = await supabase
        .from('contracts')
        .select('contract_id')
        .eq('proposal_id', formData.proposal_id)
        .maybeSingle(); // Use maybeSingle to not error if nothing is found

    if (checkError) {
        console.error('Error checking for existing contract:', checkError);
        throw new Error('Falha ao verificar se já existe um contrato para esta proposta.');
    }

    if (existingContract) {
        throw new Error('Já existe um contrato para esta proposta. Edite o contrato existente ou arquive-o antes de criar um novo.');
    }
    // --- END OF CHECK ---

    const contractCode = await getNextContractCode();

    const contractData = {
      ...buildContractPayload(formData),
      created_by: user.id,
      contract_code: contractCode,
    };

    const { data, error } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

    if (error) {
        console.error('Error adding contract:', error.message, error.details);
        throw new Error(`Falha ao adicionar contrato: ${error.message}`);
    }

    if (!data) {
        throw new Error('Contract creation did not return data.');
    }

    return data;
};

/**
 * Updates an existing contract.
 */
export const updateContract = async (contractId: string, formData: ContractFormData): Promise<Contract> => {
    const contractData = buildContractPayload(formData);

    const { data, error } = await supabase
        .from('contracts')
        .update(contractData)
        .eq('contract_id', contractId)
        .select()
        .single();

    if (error) {
        console.error('Error updating contract:', error.message, error.details);
        throw new Error(`Falha ao atualizar contrato: ${error.message}`);
    }

    if (!data) {
        throw new Error('Contract update did not return data.');
    }

    return data;
};

/**
 * Updates the status of a contract.
 */
export const updateContractStatus = async (contractId: string, status: string): Promise<Contract> => {
    const { data, error } = await supabase
        .from('contracts')
        .update({ status: status })
        .eq('contract_id', contractId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating contract status:', error.message, error.details);
        throw new Error(`Falha ao atualizar status do contrato: ${error.message}`);
    }

    if (!data) {
        throw new Error('Contract status update did not return data.');
    }

    return data;
};

/**
 * Allows a public user to update the details of their contract and the associated client info.
 * @param publicId The public access ID of the contract.
 * @param formData The data to update.
 */
export const updateContractPublic = async (publicId: string, formData: PublicFinalizationFormData): Promise<void> => {
    const { error } = await supabase.rpc('update_contract_public', {
        contract_public_id: publicId,
        // Client data
        p_cnpj_unidade: formData.cnpj_unidade,
        p_razao_social: formData.razao_social,
        p_nome_fantasia: formData.nome_fantasia,
        p_endereco_logradouro: formData.endereco_logradouro,
        p_endereco_numero: formData.endereco_numero,
        p_endereco_bairro: formData.endereco_bairro,
        p_endereco_cidade: formData.endereco_cidade,
        p_endereco_estado: formData.endereco_estado,
        p_endereco_cep: formData.endereco_cep,
        // Contract data
        p_signatory_name: formData.signatory_name,
        p_signatory_cpf: formData.signatory_cpf,
        p_signatory_rg: formData.signatory_rg,
        p_signatory_address: formData.signatory_address,
        p_signatory_emails: formData.signatory_emails,
        p_installation_address: formData.installation_address,
        p_installation_contact_name: formData.installation_contact_name,
        p_installation_contact_whatsapp: formData.installation_contact_whatsapp,
        p_billing_contact_name: formData.billing_contact_name,
        p_billing_contact_email: formData.billing_contact_email,
        p_additional_info: formData.additional_info,
        p_purchase_order: formData.purchase_order,
    });

    if (error) {
        console.error('Error in RPC update_contract_public:', error);
        throw new Error(error.message || 'Falha ao atualizar os dados do contrato.');
    }
};

/**
 * Fetches a single contract by its related proposal ID.
 */
export const getContractByProposalId = async (proposalId: string): Promise<Contract | null> => {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
             *,
            proposals (
                *,
                empresas_unidades (
                    *
                )
            )
        `)
        .eq('proposal_id', proposalId)
        .maybeSingle();
        
    if (error) {
        console.error('Error fetching contract by proposal ID:', error.message);
        throw new Error('Falha ao buscar o contrato pela proposta.');
    }

    return data;
};

/**
 * Fetches statistics about contracts (total value of completed contracts).
 */
export const getContractStats = async (): Promise<{ completedValue: number }> => {
  const { data, error } = await supabase
    .from('contracts')
    .select('contract_value')
    .eq('status', 'Concluído');
  
  if (error) {
    console.error('Error fetching completed contracts value:', error.message);
    throw new Error('Falha ao buscar valor dos contratos concluídos.');
  }

  const completedValue = data?.reduce((sum, contract) => sum + (contract.contract_value || 0), 0) || 0;

  return { completedValue };
};

/**
 * Fetches contracts that do not yet have an associated financial record.
 * Useful for creating new invoices.
 */
export const getContractsForInvoiceCreation = async (): Promise<Contract[]> => {
    // Fetch contracts that are in a billable state
    const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
            *,
            proposals (
                *,
                empresas_unidades (*)
            )
        `)
        .in('status', ['Enviado', 'Concluído']);

    if (contractsError) {
        console.error('Error fetching contracts:', contractsError.message);
        throw new Error(`Falha ao carregar contratos: ${contractsError.message}`);
    }

    // Fetch all existing financial records to know which contracts are already invoiced
    const { data: recordsData, error: recordsError } = await supabase
        .from('financial_records')
        .select('contract_id');

    if (recordsError) {
        console.error('Error fetching financial records:', recordsError.message);
        throw new Error(`Falha ao verificar registros financeiros: ${recordsError.message}`);
    }
    
    // Create a Set of contract IDs that already have a financial record for efficient lookup
    const invoicedContractIds = new Set(recordsData.map(r => r.contract_id));
    
    // Filter out contracts that are already in the Set
    const availableContracts = (contractsData || []).filter(c => !invoicedContractIds.has(c.contract_id));

    return availableContracts;
};