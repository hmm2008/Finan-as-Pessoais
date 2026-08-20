import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { purgeDemoRecordsFromLocalAndFirebase } from '../utils/cleanupDemoData';

interface AuthContextType {
  user: User | null;
  isLoadingAuth: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  navigateToLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false);
      
      if (currentUser) {
        try {
          await purgeDemoRecordsFromLocalAndFirebase();
        } catch (err) {
          console.error("Failed to purge demo records after login", err);
        }
      } else {
        purgeDemoRecordsFromLocalAndFirebase().catch(() => {});
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed or dismissed the popup window - not a system error
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
      } else {
        setAuthError('auth_required');
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const navigateToLogin = () => {
    // Basic navigation or trigger login directly depending on app design
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
