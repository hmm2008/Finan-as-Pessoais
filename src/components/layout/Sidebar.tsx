import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Wallet, TrendingUp, Car, Target, Settings, 
  CreditCard, LogOut, Bell, FileText, Trash2, Calendar, Database, Wrench, Check, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth, usePin } from '../../contexts';
import { usePreferences } from '../../contexts/PreferencesContext';
import { Button } from '../ui/button';
import { useConnectDrive } from '../../hooks/useConnectDrive';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { logout } = useAuth();
  const { hasPin, lock, unlocked } = usePin();
  const { prefs } = usePreferences();
  const navigate = useNavigate();
  const { isConnecting, toastMsg, handleConnectDrive } = useConnectDrive();
  
  const customLabels = prefs.navLabels || {};

  const navItems = [
    { id: '/', label: customLabels['/'] || 'Visão Geral', icon: LayoutDashboard },
    { id: '/financas', label: customLabels['/financas'] || 'Finanças', icon: Wallet },
    { id: '/receitas-fixas', label: customLabels['/receitas-fixas'] || 'Receitas Fixas', icon: TrendingUp, secure: true },
    { id: '/despesas-fixas', label: customLabels['/despesas-fixas'] || 'Despesas Fixas', icon: Calendar },
    { id: '/orcamentos', label: customLabels['/orcamentos'] || 'Orçamentos', icon: CreditCard, secure: true },
    { id: '/patrimonio', label: customLabels['/patrimonio'] || 'Património', icon: TrendingUp },
    { id: '/viaturas', label: customLabels['/viaturas'] || 'Viaturas', icon: Car },
    { id: '/objectivos', label: customLabels['/objectivos'] || customLabels['/objetivos'] || 'Objetivos', icon: Target, secure: true },
    { id: '/utilitarios', label: customLabels['/utilitarios'] || customLabels['/backup'] || customLabels['/arquivo'] || 'Utilitários', icon: Wrench },
    { id: '/lixeira', label: customLabels['/lixeira'] || customLabels['/trash'] || 'Lixeira', icon: Trash2, secure: true },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const handleLock = () => {
    lock();
    if (onClose) onClose();
  };

  return (
    <nav className="dark flex h-full w-64 flex-col border-r border-border bg-slate-950 py-4 text-slate-50">
      <div className="px-6 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            F
          </div>
          Finanças
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Se for uma página protegida e estiver bloqueada, omitimos o link (ou mostramos mas com lock)
          // Mas vamos permitir navegar, e a rota protegida vai tratar de pedir o PIN.
          return (
            <NavLink
              key={item.id}
              to={item.id}
              onClick={onClose}
              className={({ isActive }) => 
                `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-primary/15 text-primary shadow-xs font-semibold' 
                    : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground hover:translate-x-1'
                }`
              }
            >
              <Icon className="h-5 w-5 transition-transform duration-150 group-hover:scale-110" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      
      <div className="border-t border-border mt-4 px-3 py-4 space-y-1">
        <NavLink
          to="/configuracoes"
          onClick={onClose}
          className={({ isActive }) => 
            `group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
              isActive 
                ? 'bg-primary/15 text-primary font-semibold' 
                : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground hover:translate-x-1'
            }`
          }
        >
          <Settings className="h-5 w-5 transition-transform duration-150 group-hover:rotate-45" />
          <span>{customLabels['/configuracoes'] || 'Configurações'}</span>
        </NavLink>
        
        {hasPin && (
          <button 
            onClick={handleLock} 
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 hover:translate-x-1"
          >
            <div className="w-5 h-5 flex items-center justify-center transition-transform duration-150 group-hover:scale-110">🔒</div>
            <span>Bloquear App</span>
          </button>
        )}
        
        <button 
          onClick={handleConnectDrive}
          disabled={isConnecting}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 hover:bg-emerald-500/10 hover:text-emerald-400 text-muted-foreground hover:translate-x-1"
        >
          {isConnecting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Database className="h-5 w-5 transition-transform duration-150 group-hover:scale-110" />
          )}
          <span>{customLabels['drive_connect'] || 'Conectar à Drive'}</span>
        </button>
        
        <button 
          onClick={handleLogout} 
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 hover:bg-destructive/15 hover:text-destructive text-muted-foreground hover:translate-x-1"
        >
          <LogOut className="h-5 w-5 transition-transform duration-150 group-hover:-translate-x-0.5" />
          <span>Terminar Sessão</span>
        </button>
      </div>

      {/* Floating Toast */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-[100] text-white shadow-2xl px-5 py-3.5 rounded-xl flex items-center gap-3 font-medium text-sm border animate-in fade-in slide-in-from-bottom-5 ${
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
    </nav>
  );
}
