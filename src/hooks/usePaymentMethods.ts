import { useState, useEffect, useCallback } from 'react';

export const DEFAULT_PAYMENT_METHODS: string[] = [
  'Débito Direto',
  'Cartão de Débito',
  'Cartão de Crédito',
  'MBWay',
  'Transferência Bancária',
  'Numerário',
  'Cheque',
  'Outro'
];

const STORAGE_KEY = 'fin_payment_methods';
const EVENT_NAME = 'fin_payment_methods_updated';

// Helper to read methods from localStorage
export function getSavedPaymentMethods(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults to ensure core methods are always preserved, deduplicated
        const set = new Set<string>();
        DEFAULT_PAYMENT_METHODS.forEach(m => set.add(m));
        parsed.forEach((m: any) => {
          if (typeof m === 'string' && m.trim()) set.add(m.trim());
        });
        return Array.from(set);
      }
    }
  } catch (e) {
    console.error('Error reading payment methods from localStorage', e);
  }
  return DEFAULT_PAYMENT_METHODS;
}

// Helper to save methods
export function savePaymentMethods(methods: string[]): void {
  try {
    const sanitized = Array.from(new Set(methods.map(m => m.trim()).filter(Boolean)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: sanitized }));
  } catch (e) {
    console.error('Error saving payment methods to localStorage', e);
  }
}

// Normalizer helper matching string input against available methods
export function normalizePaymentMethod(val: any, fallback: string = 'Débito Direto', availableMethods?: string[]): string {
  if (val === undefined || val === null || val === '') return fallback;
  const str = String(val).trim();
  const lower = str.toLowerCase();

  const methods = availableMethods && availableMethods.length > 0 ? availableMethods : getSavedPaymentMethods();

  // 1. Exact or case-insensitive match with existing list
  const exactMatch = methods.find(m => m.toLowerCase() === lower);
  if (exactMatch) return exactMatch;

  // 2. Heuristic matches for standard terms
  if (lower.includes('mbway') || lower.includes('mb way') || lower.includes('mb-way')) {
    const found = methods.find(m => m.toLowerCase().includes('mbway') || m.toLowerCase().includes('mb way'));
    return found || 'MBWay';
  }
  if (lower.includes('crédito') || lower.includes('credito') || lower.includes('credit')) {
    const found = methods.find(m => m.toLowerCase().includes('crédito') || m.toLowerCase().includes('credito'));
    return found || 'Cartão de Crédito';
  }
  if (lower.includes('débito direto') || lower.includes('debito direto') || lower.includes('dd') || lower.includes('direct debit') || lower.includes('autorização de débito') || lower.includes('autorizacao')) {
    const found = methods.find(m => m.toLowerCase().includes('débito direto') || m.toLowerCase().includes('debito direto'));
    return found || 'Débito Direto';
  }
  if (lower.includes('débito') || lower.includes('debito') || lower.includes('debit') || lower.includes('multibanco') || lower.includes('atm') || lower.includes('pos')) {
    const found = methods.find(m => m.toLowerCase().includes('cartão de débito') || m.toLowerCase().includes('cartao de debito'));
    return found || 'Cartão de Débito';
  }
  if (lower.includes('transferência') || lower.includes('transferencia') || lower.includes('sepa') || lower.includes('trf') || lower.includes('wire') || lower.includes('transfer')) {
    const found = methods.find(m => m.toLowerCase().includes('transferência') || m.toLowerCase().includes('transferencia'));
    return found || 'Transferência Bancária';
  }
  if (lower.includes('numerário') || lower.includes('numerario') || lower.includes('dinheiro') || lower.includes('cash') || lower.includes('espécie') || lower.includes('especie')) {
    const found = methods.find(m => m.toLowerCase().includes('numerário') || m.toLowerCase().includes('numerario') || m.toLowerCase().includes('dinheiro'));
    return found || 'Numerário';
  }
  if (lower.includes('cheque') || lower.includes('check')) {
    const found = methods.find(m => m.toLowerCase().includes('cheque'));
    return found || 'Cheque';
  }
  if (lower.includes('cartão') || lower.includes('cartao') || lower.includes('card')) {
    const found = methods.find(m => m.toLowerCase().includes('cartão') || m.toLowerCase().includes('cartao'));
    return found || 'Cartão de Débito';
  }

  // Return the original string capitalized if trimmed
  return str || fallback;
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState<string[]>(getSavedPaymentMethods);

  useEffect(() => {
    // Initial sync
    setMethods(getSavedPaymentMethods());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setMethods(customEvent.detail);
      } else {
        setMethods(getSavedPaymentMethods());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const addPaymentMethod = useCallback((newMethod: string): string => {
    const trimmed = newMethod.trim();
    if (!trimmed) return '';

    const current = getSavedPaymentMethods();
    const exists = current.some(m => m.toLowerCase() === trimmed.toLowerCase());
    
    if (!exists) {
      const updated = [...current, trimmed];
      savePaymentMethods(updated);
      setMethods(updated);
      return trimmed;
    } else {
      const existing = current.find(m => m.toLowerCase() === trimmed.toLowerCase()) || trimmed;
      return existing;
    }
  }, []);

  const removePaymentMethod = useCallback((methodToRemove: string) => {
    const current = getSavedPaymentMethods();
    const updated = current.filter(m => m !== methodToRemove);
    savePaymentMethods(updated);
    setMethods(updated);
  }, []);

  const resetPaymentMethods = useCallback(() => {
    savePaymentMethods(DEFAULT_PAYMENT_METHODS);
    setMethods(DEFAULT_PAYMENT_METHODS);
  }, []);

  const customMethods = methods.filter(m => !DEFAULT_PAYMENT_METHODS.includes(m));

  return {
    paymentMethods: methods,
    customMethods,
    defaultMethods: DEFAULT_PAYMENT_METHODS,
    addPaymentMethod,
    removePaymentMethod,
    resetPaymentMethods,
    normalizeMethod: (val: any, fallback?: string) => normalizePaymentMethod(val, fallback, methods)
  };
}
