import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { usePin } from '../../contexts';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useConnectDrive } from '../../hooks/useConnectDrive';
import { Check, AlertCircle, Loader2, Database } from 'lucide-react';

export function BottomPageNav() {
  const { unlocked } = usePin();
  const { prefs } = usePreferences();
  const location = useLocation();
  const { isConnecting, toastMsg, handleConnectDrive } = useConnectDrive();
  const customLabels = prefs.navLabels || {};

  const allLinks = [
    { id: '/', label: customLabels['/'] || 'Visão Geral' },
    { id: '/financas', label: customLabels['/financas'] || 'Finanças' },
    { id: '/receitas-fixas', label: customLabels['/receitas-fixas'] || 'Receitas Fixas', secure: true },
    { id: '/despesas-fixas', label: customLabels['/despesas-fixas'] || 'Despesas Fixas' },
    { id: '/orcamentos', label: customLabels['/orcamentos'] || 'Orçamentos', secure: true },
    { id: '/patrimonio', label: customLabels['/patrimonio'] || 'Património' },
    { id: '/viaturas', label: customLabels['/viaturas'] || 'Viaturas' },
    { id: '/objectivos', label: customLabels['/objectivos'] || 'Objetivos', secure: true },
    { id: '/utilitarios', label: customLabels['/utilitarios'] || customLabels['/backup'] || customLabels['/arquivo'] || 'Utilitários' },
    { id: '/lixeira', label: customLabels['/lixeira'] || 'Lixeira', secure: true },
    { id: '/configuracoes', label: customLabels['/configuracoes'] || 'Configurações', secure: true },
  ];

  const visibleLinks = allLinks.filter(link => {
    if (link.secure && !unlocked) return false;
    return true;
  });

  if (visibleLinks.length === 0) return null;

  return (
    <>
      <div className="shrink-0 border-t border-border/80 bg-card/95 backdrop-blur-md px-3 py-2 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none justify-start md:justify-center">
          {visibleLinks.map(link => {
            const isActive = location.pathname === link.id;
            return (
              <NavLink
                key={link.id}
                to={link.id}
                className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary'
                }`}
              >
                {link.label}
              </NavLink>
            );
          })}
          
          <button
            onClick={handleConnectDrive}
            disabled={isConnecting}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-150 text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20"
          >
            {isConnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Database className="h-3 w-3" />}
            {customLabels['drive_connect'] || 'Conectar à Drive'}
          </button>
        </div>
      </div>

      {/* Floating Toast */}
      {toastMsg && (
        <div className={`fixed bottom-16 right-6 z-[100] text-white shadow-2xl px-5 py-3.5 rounded-xl flex items-center gap-3 font-medium text-sm border animate-in fade-in slide-in-from-bottom-5 ${
          toastMsg.type === 'success' ? 'bg-emerald-600 border-emerald-500/50' : 
          toastMsg.type === 'error' ? 'bg-destructive border-destructive/50' : 
          'bg-blue-600 border-blue-500/50'
        }`}>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            {toastMsg.type === 'success' ? <Check className="w-4 h-4 stroke-[3]" /> : 
             toastMsg.type === 'error' ? <AlertCircle className="w-4 h-4 stroke-[3]" /> : 
             <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />}
          </div>
          <div>
            <p className="font-semibold">{toastMsg.title}</p>
            <p className="text-xs opacity-90">{toastMsg.desc}</p>
          </div>
        </div>
      )}
    </>
  );
}
