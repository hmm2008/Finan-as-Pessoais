import React, { createContext, useContext } from 'react';
import { usePreferences } from './PreferencesContext';

interface PrivacyContextType {
  privacyMode: boolean;
  togglePrivacy: () => void;
  maskValue: (value: string | number, formatter?: (val: number) => string) => string;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const { prefs, updatePrefs } = usePreferences();

  const togglePrivacy = () => {
    updatePrefs({ privacyMode: !prefs.privacyMode });
  };

  const maskValue = (value: string | number, formatter?: (val: number) => string) => {
    if (!prefs.privacyMode) {
      if (typeof value === 'number' && formatter) return formatter(value);
      return String(value);
    }
    return '€••••';
  };

  return (
    <PrivacyContext.Provider value={{ privacyMode: !!prefs.privacyMode, togglePrivacy, maskValue }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
