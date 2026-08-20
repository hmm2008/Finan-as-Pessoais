import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  updatePrefs: (newPrefs: Partial<UserPreferences>) => void;
  resetToDefaults: () => void;
  getUserPrefs: () => Promise<UserPreferences>;
  requestPinReset: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPin: (email: string, code: string, newPin: string) => Promise<{ success: boolean; message: string }>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

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
  const isUpdatingRef = useRef(false);

  // Sync with Firestore
  useEffect(() => {
    let unsubscribeListener: (() => void) | null = null;

    const applyCloudData = (cloudData: Partial<UserPreferences>) => {
      if (isUpdatingRef.current) return;
      setPrefs(prev => {
        const newPrefs = {
          ...prev,
          ...cloudData,
          navLabels: { ...(prev.navLabels || {}), ...(cloudData.navLabels || {}) },
          pageTitles: { ...(prev.pageTitles || {}), ...(cloudData.pageTitles || {}) },
          pageSubtitles: { ...(prev.pageSubtitles || {}), ...(cloudData.pageSubtitles || {}) }
        };
        try {
          localStorage.setItem('finanas_user_prefs', JSON.stringify(newPrefs));
        } catch (e) {}
        return newPrefs;
      });
    };

    const attachListener = (targetId: string) => {
      if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
      }

      const docRef = doc(db, 'user_preferences', targetId);
      unsubscribeListener = onSnapshot(docRef, async (snap) => {
        if (snap.exists()) {
          applyCloudData(snap.data() as Partial<UserPreferences>);
        } else if (targetId !== 'global_shared') {
          // Se o documento do utilizador ainda não existir, tenta carregar do global_shared
          try {
            const globalSnap = await getDoc(doc(db, 'user_preferences', 'global_shared'));
            if (globalSnap.exists()) {
              applyCloudData(globalSnap.data() as Partial<UserPreferences>);
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

  const updatePrefs = async (newPrefs: Partial<UserPreferences>) => {
    isUpdatingRef.current = true;
    
    // 1. Atualiza estado local e localStorage de forma síncrona
    let updatedPayload: UserPreferences = DEFAULT_PREFERENCES;
    setPrefs(prev => {
      updatedPayload = {
        ...prev,
        ...newPrefs,
        navLabels: { ...(prev.navLabels || {}), ...(newPrefs.navLabels || {}) },
        pageTitles: { ...(prev.pageTitles || {}), ...(newPrefs.pageTitles || {}) },
        pageSubtitles: { ...(prev.pageSubtitles || {}), ...(newPrefs.pageSubtitles || {}) }
      };

      try {
        localStorage.setItem('finanas_user_prefs', JSON.stringify(updatedPayload));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      
      return updatedPayload;
    });

    // 2. Sincronização em background com a Firestore (totalmente não-bloqueante para a UI)
    const user = auth.currentUser;
    const finalPayload = {
       ...updatedPayload,
       updatedAt: new Date().toISOString()
    };
    
    // Dispara a gravação na nuvem em background
    setDoc(doc(db, 'user_preferences', 'global_shared'), { 
      ...finalPayload, 
      userId: 'global_shared',
      created_by_id: 'global_shared'
    }, { merge: true }).catch(err => {
      console.warn('Background sync error (global_shared):', err);
    });

    if (user) {
      setDoc(doc(db, 'user_preferences', user.uid), { 
        ...finalPayload, 
        userId: user.uid, 
        created_by_id: user.uid 
      }, { merge: true }).catch(err => {
        console.warn('Background sync error (user preferences):', err);
      });
    }
    
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 1000);
  };

  const resetToDefaults = () => {
    isUpdatingRef.current = true;
    setPrefs(DEFAULT_PREFERENCES);
    localStorage.removeItem('finanas_user_prefs');

    const user = auth.currentUser;
    const resetPayload = {
      ...DEFAULT_PREFERENCES,
      updatedAt: new Date().toISOString()
    };

    setDoc(doc(db, 'user_preferences', 'global_shared'), { ...resetPayload, userId: 'global_shared' }).catch(() => {});
    if (user) {
      setDoc(doc(db, 'user_preferences', user.uid), { ...resetPayload, userId: user.uid, created_by_id: user.uid }).catch(() => {});
    }

    setTimeout(() => { isUpdatingRef.current = false; }, 500);
  };

  const getUserPrefs = async (): Promise<UserPreferences> => prefs;

  const requestPinReset = async (email: string) => {
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
  };

  const resetPin = async (email: string, resetCode: string, newPin: string) => {
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
  };

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
