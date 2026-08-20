import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePreferences } from './PreferencesContext';

interface PinContextType {
  hasPin: boolean;
  unlocked: boolean;
  setPin: (pin: string) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;
  removePin: (currentPin: string) => Promise<boolean>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  requestPinReset: (email: string) => Promise<boolean>;
}

const PinContext = createContext<PinContextType | undefined>(undefined);

// Simple hashing function
async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin + "fin_salt");
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function PinProvider({ children }: { children: React.ReactNode }) {
  const { prefs, updatePrefs } = usePreferences();
  const [unlocked, setUnlocked] = useState(false);

  const hasPin = !!prefs.pinHash;

  useEffect(() => {
    if (!hasPin) {
      setUnlocked(true); // If no PIN, always unlocked
    }
  }, [hasPin]);

  const setPin = async (pin: string) => {
    if (pin.length !== 4) return false;
    const hashed = await hashPin(pin);
    updatePrefs({ pinHash: hashed });
    setUnlocked(true);
    return true;
  };

  const verifyPin = async (pin: string) => {
    if (!hasPin) return true;
    const hashed = await hashPin(pin);
    return hashed === prefs.pinHash;
  };

  const unlock = async (pin: string) => {
    const isValid = await verifyPin(pin);
    if (isValid) {
      setUnlocked(true);
      return true;
    }
    return false;
  };

  const removePin = async (currentPin: string) => {
    const isValid = await verifyPin(currentPin);
    if (isValid) {
      updatePrefs({ pinHash: null });
      setUnlocked(true);
      return true;
    }
    return false;
  };

  const lock = () => {
    if (hasPin) {
      setUnlocked(false);
    }
  };

  const requestPinReset = async (email: string) => {
    console.log('Requesting PIN reset for', email);
    return true;
  };

  return (
    <PinContext.Provider value={{ hasPin, unlocked, setPin, verifyPin, removePin, unlock, lock, requestPinReset }}>
      {children}
    </PinContext.Provider>
  );
}

export function usePin() {
  const context = useContext(PinContext);
  if (context === undefined) {
    throw new Error('usePin must be used within a PinProvider');
  }
  return context;
}
