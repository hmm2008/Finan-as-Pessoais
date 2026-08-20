import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { applyPrefs } from './lib/prefs';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { AuthProvider, PinProvider, PrivacyProvider, DashboardProvider, NotificationProvider, PreferencesProvider } from './contexts';
import { TrashProvider } from './contexts/TrashContext';
import { initOfflineSyncListeners } from './lib/googleSheetsDataService';

// Apply preferences instantly to avoid flash
applyPrefs();

// Initialize offline sync recovery listeners
initOfflineSyncListeners();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <PreferencesProvider>
              <PinProvider>
                <PrivacyProvider>
                  <DashboardProvider>
                    <TrashProvider>
                      <NotificationProvider>
                        <App />
                      </NotificationProvider>
                    </TrashProvider>
                  </DashboardProvider>
                </PrivacyProvider>
              </PinProvider>
            </PreferencesProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
