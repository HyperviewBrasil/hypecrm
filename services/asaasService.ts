import { EmpresaUnidade } from '../types';
import { supabase } from './supabaseClient';

const ASAAS_API_KEY = import.meta.env.VITE_ASAAS_API_KEY;
const ASAAS_BASE_URL = 'https://api.asaas.com/v3';

/**
 * Sync a single client with Asaas.
 * Checks if customer exists by CPF/CNPJ, creates if not, updates Supabase with Asaas ID.
 */
export const syncClientWithAsaas = async (client: EmpresaUnidade): Promise<string | null> => {
    if (!ASAAS_API_KEY) {
        console.warn('VITE_ASAAS_API_KEY is not defined. Skipping Asaas sync.');
        return null;
    }

    try {
        const cleanCnpj = client.cnpj_unidade?.replace(/\D/g, '');
        if (!cleanCnpj) {
            console.warn('Client missing CNPJ, cannot sync with Asaas.');
            return null;
        }

        // 1. Search existing Asaas customer by cpfCnpj
        const searchUrl = `${ASAAS_BASE_URL}/customers?cpfCnpj=${cleanCnpj}`;
        const searchRes = await fetch(searchUrl, {
            headers: {
                'access_token': ASAAS_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (!searchRes.ok) {
            console.error('Asaas search failed:', await searchRes.text());
            return null;
        }
        const searchData = await searchRes.json();

        let asaasId = null;

        // If customer exists, use existing ID
        if (searchData?.data && searchData.data.length > 0) {
            asaasId = searchData.data[0].id;
        } else {
            // 2. Create Asaas customer if it does not exist
            const createPayload = {
                name: client.razao_social || client.nome_fantasia || client.contact_name,
                cpfCnpj: cleanCnpj,
                email: client.contact_email,
                phone: client.contact_whatsapp?.startsWith('+') ? client.contact_whatsapp : '+55' + client.contact_whatsapp?.replace(/^0/, ''),
                mobilePhone: client.contact_whatsapp?.startsWith('+') ? client.contact_whatsapp : '+55' + client.contact_whatsapp?.replace(/^0/, ''),
                address: client.endereco_logradouro || '',
                addressNumber: client.endereco_numero || '',
                complement: client.endereco_detalhes || '',
                province: client.endereco_bairro || '',
                postalCode: client.endereco_cep || '',
                city: client.endereco_cidade || '',
                state: client.endereco_estado || '',
                externalReference: client.client_id,
                personType: cleanCnpj.length <= 11 ? 'FISICA' : 'JURIDICA'
            };

            const createRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
                method: 'POST',
                headers: {
                    'access_token': ASAAS_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createPayload)
            });

            if (!createRes.ok) {
                const errorText = await createRes.text();
                console.error('Asaas customer creation failed:', errorText);
                return null;
            }
            const createData = await createRes.json();
            if (createData.id) {
                asaasId = createData.id;
            }
        }

        if (asaasId && client.asaas_customer_id !== asaasId) {
            // 3. Update Supabase with asaas_customer_id
            await supabase
                .from('empresas_unidades')
                .update({ asaas_customer_id: asaasId })
                .eq('client_id', client.client_id);
        }

        return asaasId;
    } catch (error) {
        console.error('Error syncing client with Asaas:', error);
        return null;
    }
};

/**
 * Sync all existing clients with Asaas (for initial setup or recovery).
 */
export const syncAllClientsWithAsaas = async () => {
    const { data: clients, error } = await supabase
        .from('empresas_unidades')
        .select('*');

    if (error) {
        console.error('Error fetching clients for Asaas sync:', error);
        return;
    }

    for (const client of clients || []) {
        try {
            await syncClientWithAsaas(client);
        } catch (err) {
            console.error(`Failed to sync client ${client.client_id}:`, err);
        }
    }
};