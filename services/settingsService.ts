import { supabase } from './supabaseClient';
import { AppSettings, AppSettingsFormData } from '../types';

/**
 * Fetches the application settings from the database.
 * Assumes there is only one row with id = 1.
 * @returns A promise that resolves to the app settings.
 */
export const getSettings = async (): Promise<AppSettings | null> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore 'not found' error, it's not critical
    console.error('Error fetching settings:', error.message, error.details);
    throw new Error(`Falha ao carregar configurações: ${error.message}`);
  }

  return data;
};

/**
 * Updates or creates the application settings in the database.
 * @param formData - The data to save.
 * @returns A promise that resolves to the updated settings.
 */
export const updateSettings = async (formData: AppSettingsFormData): Promise<AppSettings> => {
  // Use upsert to create the settings row if it doesn't exist, or update it if it does.
  // The `id` is included to ensure we're targeting the single settings row.
  const { data, error } = await supabase
    .from('app_settings')
    .upsert({ ...formData, id: 1, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.error('Error updating settings:', error.message, error.details);
    throw new Error(`Falha ao salvar configurações: ${error.message}`);
  }

  if (!data) {
    throw new Error('Settings update did not return data.');
  }

  return data;
};