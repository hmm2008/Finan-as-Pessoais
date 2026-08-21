import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'normal' | 'spaced' | 'comfortable' | 'spacious';
  accentColor: string;
  fontFamily: 'sans' | 'serif' | 'mono' | 'system';
  baseFontSize: 'sm' | 'md' | 'lg';
  privacyMode: boolean;
  pinHash: string | null;
  navLabels?: Record<string, string>;
  pageTitles?: Record<string, string>;
  pageSubtitles?: Record<string, string>;
  updatedAt?: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  density: 'comfortable',
  accentColor: '#4f46e5',
  fontFamily: 'sans',
  baseFontSize: 'md',
  privacyMode: false,
  pinHash: null,
  navLabels: {
    '/': 'Visão Geral',
    '/financas': 'Finanças',
    '/receitas-fixas': 'Receitas Fixas',
    '/despesas-fixas': 'Despesas Fixas',
    '/orcamentos': 'Orçamentos',
    '/patrimonio': 'Património',
    '/viaturas': 'Viaturas',
    '/objectivos': 'Objetivos',
    '/utilitarios': 'Utilitários',
    '/lixeira': 'Lixeira',
    '/configuracoes': 'Configurações'
  },
  pageTitles: {
    '/': 'Visão Geral',
    '/financas': 'Finanças',
    '/receitas-fixas': 'Receitas Fixas',
    '/despesas-fixas': 'Despesas Fixas',
    '/orcamentos': 'Orçamentos',
    '/patrimonio': 'Património',
    '/viaturas': 'Viaturas',
    '/objectivos': 'Objetivos',
    '/utilitarios': 'Utilitários',
    '/lixeira': 'Lixeira',
    '/configuracoes': 'Configurações'
  },
  pageSubtitles: {
    '/': 'O seu painel financeiro interativo',
    '/financas': 'Gestão de entradas, saídas e transferências',
    '/receitas-fixas': 'Gestão de ordenados, rendas e outros rendimentos periódicos',
    '/despesas-fixas': 'Controlo e acompanhamento de encargos periódicos',
    '/orcamentos': 'Tetos de despesa e limites por categoria',
    '/patrimonio': 'Acompanhamento do património líquido e ativos',
    '/viaturas': 'Registo de abastecimentos e custos com veículos',
    '/objectivos': 'Poupanças e fundos de reserva em acompanhamento',
    '/utilitarios': 'Geração de relatórios, dados e backups',
    '/lixeira': 'Itens eliminados disponíveis para recuperação',
    '/configuracoes': 'Personalização do sistema, PIN e definições'
  }
};

interface PreferencesContextType {
  prefs: UserPreferences;
  updatePrefs: (newPrefs: Partial<UserPreferences>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  getUserPrefs: () => Promise<UserPreferences>;
  requestPinReset: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPin: (email: string, code: string, newPin: string) => Promise<{ success: boolean; message: string }>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

/**
 * Structural deep equality comparison that handles key declaration ordering
 */
function isDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isDeepEqual(a[key], b[key])) return false;
  }
  return true;
}

/**
 * Sanitizes object for Firestore serialization (removes undefined)
 */
function sanitizeForFirestore(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) => (value === undefined ? null : value)));
}

function getLocalPrefs(): UserPreferences {
  try {
    const raw = localStorage.getItem('finanas_user_prefs');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        navLabels: { ...DEFAULT_PREFERENCES.navLabels, ...(parsed.navLabels || {}) },
        pageTitles: { ...DEFAULT_PREFERENCES.pageTitles, ...(parsed.pageTitles || {}) },
        pageSubtitles: { ...DEFAULT_PREFERENCES.pageSubtitles, ...(parsed.pageSubtitles || {}) }
      };
    }
  } catch (e) {
    console.error('Failed to parse local prefs', e);
  }
  return DEFAULT_PREFERENCES;
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<UserPreferences>(getLocalPrefs);
  const prefsRef = useRef<UserPreferences>(prefs);
  const lastLocalUpdateTimestampRef = useRef<number>(0);

  // Synchronize ref with latest state to prevent stale closures
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  // Async Firestore persistence helper
  const saveToFirestore = useCallback(async (payload: UserPreferences) => {
    const user = auth.currentUser;
    const targetId = user ? user.uid : 'global_shared';
    const cleanData = sanitizeForFirestore(payload);

    try {
      await setDoc(doc(db, 'user_preferences', targetId), {
        ...cleanData,
        userId: targetId,
        created_by_id: targetId
      }, { merge: true });

      if (user) {
        await setDoc(doc(db, 'user_preferences', 'global_shared'), {
          ...cleanData,
          userId: 'global_shared',
          created_by_id: 'global_shared'
        }, { merge: true }).catch(() => {});
      }
    } catch (err) {
      console.warn('Error persisting user preferences to Firestore:', err);
    }
  }, []);

  // Sync with Firestore (Listener)
  useEffect(() => {
    let unsubscribeListener: (() => void) | null = null;

    const handleCloudSnapshot = (cloudData: Partial<UserPreferences>) => {
      const current = prefsRef.current;

      // Ignore echoes from recent local user interactions (within 2 seconds)
      if (Date.now() - lastLocalUpdateTimestampRef.current < 2000) {
        return;
      }

      // Check timestamp ordering
      const localTime = current.updatedAt ? new Date(current.updatedAt).getTime() : 0;
      const cloudTime = cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : 0;

      if (cloudTime > 0 && localTime > 0 && cloudTime < localTime) {
        return;
      }

      const merged: UserPreferences = {
        ...current,
        ...cloudData,
        navLabels: { ...(current.navLabels || {}), ...(cloudData.navLabels || {}) },
        pageTitles: { ...(current.pageTitles || {}), ...(cloudData.pageTitles || {}) },
        pageSubtitles: { ...(current.pageSubtitles || {}), ...(cloudData.pageSubtitles || {}) },
        updatedAt: cloudData.updatedAt || current.updatedAt
      };

      // Strict deep equality check to prevent redundant re-renders / loops
      if (isDeepEqual(merged, current)) {
        return;
      }

      setPrefs(merged);
      try {
        localStorage.setItem('finanas_user_prefs', JSON.stringify(merged));
      } catch (e) {}
    };

    const attachListener = (targetId: string) => {
      if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
      }

      const docRef = doc(db, 'user_preferences', targetId);
      unsubscribeListener = onSnapshot(docRef, async (snap) => {
        // Ignore snapshots with pending local writes
        if (snap.metadata.hasPendingWrites) {
          return;
        }

        if (snap.exists()) {
          handleCloudSnapshot(snap.data() as Partial<UserPreferences>);
        } else if (targetId !== 'global_shared') {
          try {
            const globalSnap = await getDoc(doc(db, 'user_preferences', 'global_shared'));
            if (globalSnap.exists()) {
              handleCloudSnapshot(globalSnap.data() as Partial<UserPreferences>);
            }
          } catch (err) {
            console.warn('Error reading fallback global_shared:', err);
          }
        }
      }, (err) => {
        console.warn(`Firestore user_preferences (${targetId}) listener error:`, err);
      });
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const targetId = user ? user.uid : 'global_shared';
      attachListener(targetId);
    });

    return () => {
      if (unsubscribeListener) unsubscribeListener();
      unsubscribeAuth();
    };
  }, []);

  // Sync to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else if (prefs.theme === 'light') {
      root.classList.remove('dark');
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }

    root.style.setProperty('--custom-accent-color', prefs.accentColor);

    root.classList.remove('font-inter', 'font-system', 'font-serif', 'font-mono');
    if (prefs.fontFamily === 'serif') {
      root.style.fontFamily = 'Georgia, Cambria, "Times New Roman", Times, serif';
    } else if (prefs.fontFamily === 'mono') {
      root.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    } else if (prefs.fontFamily === 'system') {
      root.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    } else {
      root.style.fontFamily = 'Plus Jakarta Sans, Inter, sans-serif';
    }

    if (prefs.baseFontSize === 'sm') {
      root.style.fontSize = '14px';
    } else if (prefs.baseFontSize === 'lg') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }

    root.setAttribute('data-density', prefs.density);
  }, [prefs]);

  const updatePrefs = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    const now = new Date().toISOString();
    lastLocalUpdateTimestampRef.current = Date.now();

    const current = prefsRef.current;
    const updatedPayload: UserPreferences = {
      ...current,
      ...newPrefs,
      navLabels: { ...(current.navLabels || {}), ...(newPrefs.navLabels || {}) },
      pageTitles: { ...(current.pageTitles || {}), ...(newPrefs.pageTitles || {}) },
      pageSubtitles: { ...(current.pageSubtitles || {}), ...(newPrefs.pageSubtitles || {}) },
      updatedAt: now
    };

    if (isDeepEqual(updatedPayload, current)) {
      return;
    }

    // 1. Instant local state update
    setPrefs(updatedPayload);

    // 2. Local storage persistence
    try {
      localStorage.setItem('finanas_user_prefs', JSON.stringify(updatedPayload));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 3. Firestore persistence
    await saveToFirestore(updatedPayload);
  }, [saveToFirestore]);

  const resetToDefaults = useCallback(async () => {
    const now = new Date().toISOString();
    lastLocalUpdateTimestampRef.current = Date.now();

    const resetPayload: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      updatedAt: now
    };

    setPrefs(resetPayload);
    try {
      localStorage.setItem('finanas_user_prefs', JSON.stringify(resetPayload));
    } catch (e) {}

    await saveToFirestore(resetPayload);
  }, [saveToFirestore]);

  const getUserPrefs = useCallback(async (): Promise<UserPreferences> => prefsRef.current, []);

  const requestPinReset = useCallback(async (email: string) => {
    if (!email.includes('@')) {
      return { success: false, message: 'Endereço de e-mail inválido.' };
    }
    try {
      const response = await fetch('/api/request-pin-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message || `Código de verificação enviado para ${email}.` };
      } else {
        return { success: false, message: data.error || 'Erro ao solicitar recuperação de PIN.' };
      }
    } catch (err: any) {
      return { success: false, message: 'Erro de ligação ao servidor.' };
    }
  }, []);

  const resetPin = useCallback(async (email: string, resetCode: string, newPin: string) => {
    if (resetCode.length !== 6) {
      return { success: false, message: 'Código de verificação incorreto (deve ter 6 dígitos).' };
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return { success: false, message: 'O PIN deve ser composto por 4 dígitos numéricos.' };
    }
    try {
      const user = auth.currentUser;
      const response = await fetch('/api/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: resetCode,
          newPin,
          userId: user?.uid
        })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message || 'PIN redefinido com sucesso!' };
      } else {
        return { success: false, message: data.error || 'Erro ao redefinir PIN.' };
      }
    } catch (err: any) {
      return { success: false, message: 'Erro de ligação ao servidor.' };
    }
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        prefs,
        updatePrefs,
        resetToDefaults,
        getUserPrefs,
        requestPinReset,
        resetPin
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
