import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  [key: string]: any;
}

const STORAGE_KEY_PREFIX = 'chamby_form_';

export const useFormPersistence = (formId: string) => {
  const { toast } = useToast();
  const storageKey = `${STORAGE_KEY_PREFIX}${formId}`;

  const saveFormData = useCallback((data: FormData) => {
    try {
      const formState = {
        data,
        timestamp: Date.now(),
        url: window.location.pathname + window.location.search
      };
      localStorage.setItem(storageKey, JSON.stringify(formState));
      console.log('Form data saved:', storageKey);
    } catch (error) {
      console.error('Error saving form data:', error);
      toast({
        title: "Error al guardar progreso",
        description: "No se pudo guardar tu progreso automáticamente",
        variant: "destructive",
      });
    }
  }, [storageKey, toast]);

  const loadFormData = useCallback((): FormData | null => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) return null;

      const formState = JSON.parse(savedData);
      
      // Check if data is not too old (24 hours)
      const age = Date.now() - formState.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (age > maxAge) {
        console.log('Form data expired, clearing...');
        clearFormData();
        return null;
      }

      console.log('Form data loaded:', storageKey);
      return formState.data;
    } catch (error) {
      console.error('Error loading form data:', error);
      toast({
        title: "Tu progreso no pudo ser restaurado",
        description: "Por favor verifica tus datos",
        variant: "destructive",
      });
      return null;
    }
  }, [storageKey, toast]);

  const clearFormData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      console.log('Form data cleared:', storageKey);
    } catch (error) {
      console.error('Error clearing form data:', error);
    }
  }, [storageKey]);

  const hasFormData = useCallback((): boolean => {
    return localStorage.getItem(storageKey) !== null;
  }, [storageKey]);

  return {
    saveFormData,
    loadFormData,
    clearFormData,
    hasFormData
  };
};
