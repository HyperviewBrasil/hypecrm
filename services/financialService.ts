import { supabase } from './supabaseClient';
import { FinancialRecord, FinancialRecordFormData, Contract, Installment } from '../types';

/**
 * Fetches all financial records, joining related contract and client data.
 */
export const getFinancialRecords = async (): Promise<FinancialRecord[]> => {
  const { data, error } = await supabase
    .from('financial_records')
    .select(`
      *,
      contracts (
        *,
        proposals (
          *,
          empresas_unidades (*)
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching financial records:', error.message);
    throw new Error(`Falha ao carregar registros financeiros: ${error.message}`);
  }

  // Supabase typing can be tricky with nested joins, so we cast here.
  return (data as any) || [];
};

/**
 * Fetches a single financial record by its public access ID.
 */
export const getFinancialRecordByPublicId = async (publicId: string): Promise<FinancialRecord | null> => {
  const { data, error } = await supabase
    .from('financial_records')
    .select(`
      *,
      contracts (
        *,
        proposals (
          *,
          empresas_unidades (*)
        )
      )
    `)
    .eq('public_access_id', publicId)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
    console.error('Error fetching financial record by public ID:', error.message);
    throw new Error('Falha ao buscar o registro financeiro.');
  }

  return (data as any) || null;
};


/**
 * Creates a new financial record for a given contract from the manual invoice flow.
 * @param contract The selected contract object.
 * @param installments The array of installments configured by the user.
 * @param receivingAccount The account selected to receive the payment.
 * @param paymentInstructions Optional additional payment instructions.
 */
export const createInvoice = async (
    contract: Contract, 
    installments: Installment[], 
    receivingAccount: 'Conta Daniel' | 'Conta Natan',
    paymentInstructions: string | null
): Promise<FinancialRecord> => {
    const newRecordData = {
        contract_id: contract.contract_id,
        billing_status: 'Pendente', // The trigger will correct this based on installments
        total_revenue: contract.contract_value,
        installments: installments.map(({ id, ...rest }) => rest), // remove client-side ID
        receiving_account: receivingAccount,
        payment_instructions: paymentInstructions,
        // Initialize all expense fields
        expenses_accommodation: 0,
        expenses_transport: 0,
        expenses_tax_percent: 0,
        expenses_third_party: 0,
        expenses_materials: 0,
        expenses_miscellaneous: 0,
        reimbursement_daniel: 0,
        reimbursement_natan: 0,
        custom_expenses: [],
        // Calculated fields will be updated on the server or via a view/trigger
        total_expenses: 0,
        net_profit: contract.contract_value,
    };

    const { data, error } = await supabase
        .from('financial_records')
        .insert(newRecordData)
        .select()
        .single();

    if (error) {
        console.error('Error creating invoice record:', error);
        throw new Error('Falha ao criar a fatura.');
    }

    return data;
};


/**
 * Updates an existing financial record (e.g., expenses, installment status).
 * @param recordId The ID of the financial record to update.
 * @param formData The data to update.
 */
export const updateFinancialRecord = async (recordId: string, formData: FinancialRecordFormData): Promise<FinancialRecord> => {
    
    // Recalculate totals based on form data
    const customExpensesTotal = formData.custom_expenses?.reduce((acc, exp) => acc + (Number(exp.value) || 0), 0) || 0;

    const fixedExpensesTotal =
      (Number(formData.expenses_accommodation) || 0) +
      (Number(formData.expenses_transport) || 0) +
      (Number(formData.expenses_third_party) || 0) +
      (Number(formData.expenses_materials) || 0) +
      (Number(formData.expenses_miscellaneous) || 0);
      
    const totalExpenses = fixedExpensesTotal + customExpensesTotal;
    
    // Fetch total revenue to calculate net profit correctly
    const { data: currentRecord } = await supabase
        .from('financial_records')
        .select('total_revenue')
        .eq('financial_record_id', recordId)
        .single();
    
    const totalRevenue = currentRecord?.total_revenue || 0;
    const taxAmount = totalRevenue * (Number(formData.expenses_tax_percent || 0) / 100);
    const netProfit = totalRevenue - totalExpenses - taxAmount;

    // IMPORTANT: Exclude billing_status from the payload.
    // The backend trigger is now the single source of truth for this value.
    const { billing_status, ...restOfFormData } = formData;

    // FIX: Remove client-side only 'id' properties from nested arrays before sending to Supabase
    const cleanInstallments = (formData.installments ?? []).map(({ id, ...rest }) => rest);
    const cleanCustomExpenses = (formData.custom_expenses ?? []).map(({ id, ...rest }) => rest);

    const updatePayload = {
      ...restOfFormData,
      installments: cleanInstallments,
      custom_expenses: cleanCustomExpenses,
      total_expenses: totalExpenses,
      net_profit: netProfit,
    };

    const { data, error } = await supabase
        .from('financial_records')
        .update(updatePayload)
        .eq('financial_record_id', recordId)
        .select()
        .single();

    if (error) {
        console.error('Error updating financial record:', error);
        throw error; // Throw original Supabase error for better debugging
    }

    return data;
};

/**
 * Updates the billing status of a financial record (e.g., to archive it).
 */
export const updateFinancialRecordStatus = async (recordId: string, status: FinancialRecordFormData['billing_status']): Promise<FinancialRecord> => {
    const { data, error } = await supabase
        .from('financial_records')
        .update({ billing_status: status })
        .eq('financial_record_id', recordId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating financial record status:', error);
        throw error; // Throw original Supabase error
    }

    return data;
};