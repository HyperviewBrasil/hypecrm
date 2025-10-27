import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { AppSettings, AppSettingsFormData } from '../types';
import { getSettings, updateSettings as updateSettingsService } from '../services/settingsService';
import { useToast } from './ToastContext';

interface SettingsContextType {
  settings: AppSettings | null;
  isLoading: boolean;
  updateSettings: (data: AppSettingsFormData) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error: any) {
      // Don't show an error on initial load if settings just don't exist yet
      console.error("Failed to fetch settings:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (data: AppSettingsFormData) => {
    try {
      const updatedSettings = await updateSettingsService(data);
      setSettings(updatedSettings);
      addToast('Configurações salvas com sucesso!', 'success');
    } catch (error: any) {
      addToast(`Erro ao salvar configurações: ${error.message}`, 'error');
      throw error; // Re-throw to be caught in the component
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};