import { lazy } from 'react';

// Use lazy loading for all views
export const WelcomeView = lazy(() => import('./WelcomeView'));
export const DashboardView = lazy(() => import('./DashboardView'));
export const FinancasView = lazy(() => import('./FinancasView'));
export const ViaturasView = lazy(() => import('./ViaturasView'));
export const PatrimonioView = lazy(() => import('./PatrimonioView'));
export const NotificacoesView = lazy(() => import('./NotificacoesView'));
export const OrcamentosView = lazy(() => import('./OrcamentosView'));
export const DespesasFixasView = lazy(() => import('./DespesasFixasView'));
export const ReceitasFixasView = lazy(() => import('./ReceitasFixasView'));
export const ObjectivosView = lazy(() => import('./ObjectivosView'));
export const ConfiguracoesView = lazy(() => import('./ConfiguracoesView'));
export const LixeiraView = lazy(() => import('./LixeiraView'));
export const ArquivoView = lazy(() => import('./ArquivoView'));
export const UtilitariosView = lazy(() => import('./UtilitariosView'));
export const RelatorioMensalImprimivelView = lazy(() => import('./RelatorioMensalImprimivelView'));
export const PageNotFoundView = lazy(() => import('./PageNotFoundView'));
