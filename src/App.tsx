import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { useAuth } from './contexts';
import { Layout, ProtectedRoute, PageLoader } from './components/layout';
import { CookieConsent } from './components/ui/CookieConsent';
import { useConnectDrive } from './hooks/useConnectDrive';

// Lazy loaded views
import {
  WelcomeView, DashboardView, FinancasView, ViaturasView,
  PatrimonioView, NotificacoesView, OrcamentosView,
  DespesasFixasView, ReceitasFixasView, ObjectivosView,
  ConfiguracoesView, LixeiraView, ArquivoView, UtilitariosView,
  RelatorioMensalImprimivelView, PageNotFoundView
} from './views';

export default function App() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { isConnected, handleConnectDrive } = useConnectDrive();

  // Automatic Drive connection after login if configured but disconnected
  React.useEffect(() => {
    if (isAuthenticated && !isConnected) {
      const hasConfig = !!localStorage.getItem('google_drive_spreadsheet_info');
      const hasToken = !!localStorage.getItem('google_drive_access_token');
      
      // If we have config but no token or isConnected is false (expired)
      if (hasConfig && !hasToken) {
        handleConnectDrive();
      }
    }
  }, [isAuthenticated, isConnected]);

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-primary">
        <div className="animate-pulse flex flex-col items-center">
           <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold mb-4">F</div>
           <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="*" element={<WelcomeView />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <CookieConsent />
      <Routes>
        <Route path="/welcome" element={<Navigate to="/" replace />} />
        <Route path="/relatorio-imprimivel" element={<RelatorioMensalImprimivelView />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardView />} />
          <Route path="/financas" element={<FinancasView />} />
          <Route path="/viaturas" element={<ViaturasView />} />
          <Route path="/notificacoes" element={<NotificacoesView />} />
          <Route path="/despesas-fixas" element={<DespesasFixasView />} />
          <Route path="/utilitarios" element={<UtilitariosView />} />
          <Route path="/backup" element={<Navigate to="/utilitarios" replace />} />
          <Route path="/arquivo" element={<Navigate to="/utilitarios" replace />} />
          
          {/* Protected Routes */}
          <Route path="/patrimonio" element={<ProtectedRoute><PatrimonioView /></ProtectedRoute>} />
          <Route path="/orcamentos" element={<ProtectedRoute><OrcamentosView /></ProtectedRoute>} />
          <Route path="/receitas-fixas" element={<ProtectedRoute><ReceitasFixasView /></ProtectedRoute>} />
          <Route path="/objectivos" element={<ProtectedRoute><ObjectivosView /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesView /></ProtectedRoute>} />
          <Route path="/lixeira" element={<ProtectedRoute><LixeiraView /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<PageNotFoundView />} />
      </Routes>
    </Suspense>
  );
}

