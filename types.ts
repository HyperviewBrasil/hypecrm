// --- Client (EmpresaUnidade) ---
export interface EmpresaUnidade {
  client_id: string;
  contact_name: string;
  contact_whatsapp: string;
  contact_email: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj_unidade: string;
  data_fundacao_unidade: string | null;
  e_matriz: boolean | null;
  data_status: string | null;
  status_texto: string | null;
  patrimonio: number | null;
  natureza_juridica: string | null;
  porte_acronimo: string | null;
  optante_simples: boolean | null;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  endereco_cep: string | null;
  endereco_detalhes: string | null;
  cnae_principal_texto: string | null;
  inserted_by: string;
  data_atualizacao: string;
  asaas_customer_id?: string | null;
}

// In ClientForm, a Partial is used for editing and creating. 
// A form data type is useful to avoid passing db-only fields.
export type EmpresaUnidadeFormData = Omit<EmpresaUnidade, 'client_id' | 'inserted_by' | 'data_atualizacao'>;

// --- Proposal ---
export interface ProposalItem {
  id: string; // client-side only
  item: string;
  quantity: number;
  unit_value: number;
}

export interface ProposalFormData {
  client_id: string | null;
  contact_person: string;
  contact_whatsapp: string;
  event_description: string;
  event_location: string;
  start_date: string | null;
  end_date: string | null;
  items: ProposalItem[];
  travel_costs: number;
  production_costs: number;
  discount: number;
  status: 'Rascunho' | 'Enviado' | 'Aprovado' | 'Recusado' | 'Arquivado';
}

export interface Proposal extends ProposalFormData {
  proposal_id: string;
  proposal_code: string;
  total_value: number;
  created_by: string;
  created_at: string;
  public_access_id: string;
  empresas_unidades: EmpresaUnidade | null;
}

// --- Contract ---
export interface ContractFormData {
  proposal_id: string;
  signatory_name: string;
  signatory_cpf: string;
  signatory_rg: string;
  signatory_address: string;
  signatory_emails: string;
  installation_address: string;
  installation_contact_name: string;
  installation_contact_whatsapp: string;
  billing_contact_name: string;
  billing_contact_email: string;
  items: ProposalItem[];
  travel_costs: number;
  production_costs: number;
  discount: number;
  contract_value: number;
  status: 'Rascunho' | 'Enviado' | 'Concluído' | 'Arquivado';
  purchase_order: string | null;
  additional_info: string | null;
}

export interface Contract extends ContractFormData {
  contract_id: string;
  contract_code: string;
  created_by: string;
  created_at: string;
  public_access_id: string;
  proposals: Proposal | null;
}

// --- Public Forms ---
export interface PublicProposalRequestFormData {
  name: string;
  email: string;
  whatsapp: string;
  company: string;
  cnpj: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
}

// This is data submitted by client to finalize contract
export interface PublicFinalizationFormData {
    cnpj_unidade: string;
    razao_social: string;
    nome_fantasia: string;
    endereco_logradouro: string;
    endereco_numero: string;
    endereco_bairro: string;
    endereco_cidade: string;
    endereco_estado: string;
    endereco_cep: string;
    signatory_name: string;
    signatory_cpf: string;
    signatory_rg: string;
    signatory_address: string;
    signatory_emails: string;
    installation_address: string;
    installation_contact_name: string;
    installation_contact_whatsapp: string;
    billing_contact_name: string;
    billing_contact_email: string;
    purchase_order: string | null;
    additional_info: string | null;
}

// Used in contractService, but is the same as PublicFinalizationFormData
export type PublicContractFormData = PublicFinalizationFormData;

// --- Settings ---
export interface AppSettingsFormData {
  webhook_url: string | null;
  notify_on_proposal_created: boolean;
  notify_on_proposal_approved: boolean;
  notify_on_contract_submitted: boolean;
  default_email_sender: string | null;
  default_email_subject: string | null;
  default_email_body: string | null;
  show_ai_chat: boolean;
  agent_webhook_url: string | null;
  payment_instructions_daniel: string | null;
  payment_instructions_natan: string | null;
}

export interface AppSettings extends AppSettingsFormData {
  id: number;
  updated_at: string;
}

// --- Finance ---
export interface Installment {
    id: string;
    due_date: string;
    value: number;
    status: 'Pendente' | 'Pago';
}

export interface CustomExpense {
    id: string;
    description: string;
    value: number;
}

export interface FinancialRecordFormData {
    billing_status: 'Pendente' | 'Atrasado' | 'Pago Parcialmente' | 'Pago' | 'Arquivado';
    installments: Installment[];
    receiving_account?: 'Conta Daniel' | 'Conta Natan';
    payment_instructions?: string | null;
    expenses_accommodation: number;
    expenses_transport: number;
    expenses_tax_percent: number;
    expenses_third_party: number;
    expenses_materials: number;
    expenses_miscellaneous: number;
    reimbursement_daniel: number;
    reimbursement_natan: number;
    custom_expenses: CustomExpense[];
}

export interface FinancialRecord extends FinancialRecordFormData {
    financial_record_id: string;
    contract_id: string | null;
    public_access_id: string;
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    created_at: string;
    payment_instructions: string | null;
    contracts: Contract | null;
    empresas_unidades?: EmpresaUnidade | null;
    description?: string | null;
}

// --- Site Content ---
export interface SiteProductCard {
  name: string;
  description: string;
  media_url: string;
  patented: boolean;
}

export interface SiteContent {
  id?: 1;
  hero_video_url: string;
  products: SiteProductCard[];
  contact_whatsapp?: string;
  contact_email?: string;
}

export type SiteContentFormData = SiteContent;