import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

/**
 * Hook pour sauvegarder et restaurer automatiquement l'état d'un formulaire
 * Sauvegarde quand l'app passe en arrière-plan et périodiquement
 */
export const useFormPersistence = (storageKey, formState, setFormState) => {
  const appState = useRef(AppState.currentState);
  const saveTimeoutRef = useRef(null);

  // Fonction de sauvegarde
  const saveFormData = async () => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(formState));
      console.log('💾 Formulaire sauvegardé automatiquement');
    } catch (error) {
      console.log('⚠️ Erreur sauvegarde formulaire:', error.message);
    }
  };

  // Fonction de restauration
  const loadFormData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormState(parsedData);
        console.log('📂 Formulaire restauré depuis la sauvegarde');
        return true;
      }
      return false;
    } catch (error) {
      console.log('⚠️ Erreur chargement formulaire:', error.message);
      return false;
    }
  };

  // Fonction pour effacer la sauvegarde
  const clearFormData = async () => {
    try {
      await AsyncStorage.removeItem(storageKey);
      console.log('🗑️ Sauvegarde formulaire supprimée');
    } catch (error) {
      console.log('⚠️ Erreur suppression sauvegarde:', error.message);
    }
  };

  // Sauvegarder périodiquement (toutes les 10 secondes après un changement)
  useEffect(() => {
    // Annuler le timeout précédent
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Programmer une nouvelle sauvegarde
    saveTimeoutRef.current = setTimeout(() => {
      saveFormData();
    }, 10000); // 10 secondes

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formState]);

  // Sauvegarder quand l'app passe en arrière-plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('📱 App en arrière-plan, sauvegarde du formulaire...');
        saveFormData();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [formState]);

  // Charger au montage
  useEffect(() => {
    loadFormData();
  }, []);

  return {
    saveFormData,
    loadFormData,
    clearFormData
  };
};
