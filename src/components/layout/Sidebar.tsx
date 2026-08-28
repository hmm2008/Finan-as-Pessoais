import React, { useState } from 'react';
import { motion } from 'motion/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Wallet, TrendingUp, Car, Target, Settings, 
  CreditCard, LogOut, Bell, FileText, Trash2, Calendar, Database, Wrench, Check, AlertCircle, Loader2,
  Lock, Unlock, KeyRound, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth, usePin } from '../../contexts';
import { usePreferences, textStyleToCSS } from '../../contexts/PreferencesContext';
import { Button } from '../ui/button';
import { PinUnlockModal } from './PinUnlockModal';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { logout } = useAuth();
  const { hasPin, lock, unlocked } = usePin();
  const { prefs } = usePreferences();
  const navigate = useNavigate();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
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
    { id: '/lixeira', label: customLabels['/lixeira'] || customLabels['/trash'] || 'Reciclagem', icon: Trash2, secure: true },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const handleLockToggle = () => {
    if (unlocked) {
      lock();
      if (onClose) onClose();
    } else {
      setShowUnlockModal(true);
    }
  };

  const { backgroundColor: _sidebarBg, ...sidebarTextStyle } = prefs.customStyles?.sidebar || {};

  return (
    <>
      <motion.nav 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`dark flex h-full ${collapsed ? 'w-20' : 'w-64'} flex-col border-r border-border/40 ${prefs.customStyles?.sidebar?.backgroundColor ? '' : 'bg-background/90 backdrop-blur-2xl'} py-6 text-foreground transition-all duration-300 z-10`}
        style={{ backgroundColor: prefs.customStyles?.sidebar?.backgroundColor }}
      >
        <div className={`px-6 mb-8 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 text-foreground font-black text-xl tracking-tighter">
            <div className="w-9 h-9 bg-foreground rounded-[1.25rem] flex items-center justify-center text-background">
              F
            </div>
            {!collapsed && 'Finanças'}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.id}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => 
                  `group flex items-center ${collapsed ? 'justify-center' : 'gap-3.5'} rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${
                    isActive 
                      ? 'bg-foreground/5 text-foreground shadow-sm' 
                      : 'text-muted-foreground/60 hover:bg-foreground/5 hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {!collapsed && <span style={textStyleToCSS(sidebarTextStyle)}>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
        
        <div className="border-t border-border/40 mt-4 px-4 py-4 space-y-2">
          <NavLink
            to="/configuracoes"
            onClick={onClose}
            title={collapsed ? (customLabels['/configuracoes'] || 'Configurações') : undefined}
            className={({ isActive }) => 
              `group flex w-full items-center ${collapsed ? 'justify-center' : 'gap-3.5'} rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${
                isActive 
                  ? 'bg-foreground/5 text-foreground' 
                  : 'text-muted-foreground/60 hover:bg-foreground/5 hover:text-foreground'
              }`
            }
          >
            <Settings className="h-5 w-5" />
            {!collapsed && <span style={textStyleToCSS(sidebarTextStyle)}>{customLabels['/configuracoes'] || 'Configurações'}</span>}
          </NavLink>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="group flex w-full items-center rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-widest text-[10px] text-muted-foreground/60 hover:bg-foreground/5 hover:text-foreground mt-2 transition-all duration-300"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <div className="flex items-center gap-3.5">
                <ChevronLeft className="h-5 w-5" />
                <span style={textStyleToCSS(sidebarTextStyle)}>{customLabels['/sidebar-collapse'] || 'Colapsar'}</span>
              </div>
            )}
          </button>
          
          {hasPin ? (
            <button 
              onClick={handleLockToggle} 
              className={`group flex w-full items-center ${collapsed ? 'justify-center' : 'justify-between'} rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                unlocked
                  ? 'text-muted-foreground/60 hover:text-foreground'
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              <div className={`flex items-center ${collapsed ? '' : 'gap-3.5'}`}>
                {unlocked ? (
                  <Unlock className="h-5 w-5" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}
                {!collapsed && <span style={textStyleToCSS(sidebarTextStyle)}>{unlocked ? 'Bloquear App' : 'Desbloquear'}</span>}
              </div>
            </button>
          ) : (
            <button 
              onClick={() => { navigate('/configuracoes'); if (onClose) onClose(); }} 
              className={`group flex w-full items-center ${collapsed ? 'justify-center' : 'justify-between'} rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all duration-300`}
            >
              <div className={`flex items-center ${collapsed ? '' : 'gap-3.5'}`}>
                <KeyRound className="h-5 w-5" />
                {!collapsed && <span style={textStyleToCSS(sidebarTextStyle)}>{customLabels['/create-pin'] || 'PIN de Acesso'}</span>}
              </div>
            </button>
          )}
          
          <button 
            onClick={handleLogout} 
            className={`group flex w-full items-center ${collapsed ? 'justify-center' : 'gap-3.5'} rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-widest text-[10px] transition-all duration-300 hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground/60`}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span style={textStyleToCSS(sidebarTextStyle)}>Sair</span>}
          </button>
        </div>
      </motion.nav>

      <PinUnlockModal open={showUnlockModal} onClose={() => setShowUnlockModal(false)} />
    </>
  );
}

