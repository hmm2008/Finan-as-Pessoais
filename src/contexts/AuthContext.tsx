import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { purgeDemoRecordsFromLocalAndFirebase } from '../utils/cleanupDemoData';
import { syncAllLocalEntitiesToFirestore } from '../hooks/queries';

const GUEST_USER = {
  uid: 'local_user',
  displayName: 'Utilizador Local',
  email: 'modo.local@app.internal',
  photoURL: null,
  emailVerified: true,
  isAnonymous: true,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => '',
  getIdTokenResult: async () => ({} as any),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
  providerId: 'local'
} as unknown as User;

interface AuthContextType {
  user: User | null;
  isLoadingAuth: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  login: () => Promise<void>;
  loginAsLocalUser: () => void;
  logout: () => Promise<void>;
  navigateToLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const isLocalSession = localStorage.getItem('fin_local_session') === 'true';

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          await purgeDemoRecordsFromLocalAndFirebase();
          await syncAllLocalEntitiesToFirestore(currentUser.uid);
        } catch (err) {
          console.error("Failed to sync/purge records after login", err);
        }
      } else if (isLocalSession) {
        setUser(GUEST_USER);
      } else {
        setUser(null);
        purgeDemoRecordsFromLocalAndFirebase().catch(() => {});
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsLocalUser = () => {
    localStorage.setItem('fin_local_session', 'true');
    setUser(GUEST_USER);
    setAuthError(null);
  };

  const login = async () => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      localStorage.removeItem('fin_local_session');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setAuthError(null);
        return;
      }
      console.error('Authentication error:', err);
      if (err.code === 'auth/network-request-failed') {
        setAuthError('network_error');
      } else if (err.code === 'auth/user-not-found') {
        setAuthError('user_not_registered');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('popup_blocked');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError('unauthorized_domain');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('operation_not_allowed');
      } else {
        setAuthError(err.message || 'auth_required');
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('fin_local_session');
    await signOut(auth).catch(() => {});
    setUser(null);
  };

  const navigateToLogin = () => {
    login();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoadingAuth,
        isAuthenticated: !!user,
        authError,
        login,
        loginAsLocalUser,
        logout,
        navigateToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
