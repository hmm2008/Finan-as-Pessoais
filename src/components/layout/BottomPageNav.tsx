import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { usePin } from '../../contexts';
import { usePreferences } from '../../contexts/PreferencesContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Building2, 
  Target, 
  Settings, 
  Car, 
  History, 
  Trash2, 
  Wrench,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart
} from 'lucide-react';

export function BottomPageNav() {
  const { unlocked } = usePin();
  const { prefs } = usePreferences();
  const location = useLocation();
  const customLabels = prefs.navLabels || {};

  const allLinks = [
    { id: '/', label: customLabels['/'] || 'Início', icon: LayoutDashboard },
    { id: '/financas', label: customLabels['/financas'] || 'Finanças', icon: Wallet },
    { id: '/patrimonio', label: customLabels['/patrimonio'] || 'Património', icon: Building2 },
    { id: '/objectivos', label: customLabels['/objectivos'] || 'Objetivos', icon: Target, secure: true },
    { id: '/configuracoes', label: customLabels['/configuracoes'] || 'Ajustes', icon: Settings, secure: true },
    
    // Secondary links (shown in desktop scroller)
    { id: '/receitas-fixas', label: customLabels['/receitas-fixas'] || 'Receitas Fixas', icon: ArrowUpCircle, secondary: true, secure: true },
    { id: '/despesas-fixas', label: customLabels['/despesas-fixas'] || 'Despesas Fixas', icon: ArrowDownCircle, secondary: true },
    { id: '/orcamentos', label: customLabels['/orcamentos'] || 'Orçamentos', icon: PieChart, secondary: true, secure: true },
    { id: '/viaturas', label: customLabels['/viaturas'] || 'Viaturas', icon: Car, secondary: true },
    { id: '/utilitarios', label: customLabels['/utilitarios'] || 'Utilitários', icon: Wrench, secondary: true },
    { id: '/lixeira', label: customLabels['/lixeira'] || 'Reciclagem', icon: Trash2, secondary: true, secure: true },
  ];

  const mainLinks = allLinks.filter(l => !l.secondary);
  const secondaryLinks = allLinks.filter(l => l.secondary);

  const filterVisible = (links: typeof allLinks) => links.filter(link => {
    if (link.secure && !unlocked) return false;
    return true;
  });

  const visibleMain = filterVisible(mainLinks);
  const visibleSecondary = filterVisible(secondaryLinks);

  return (
    <>
      {/* Mobile Main Tab Bar (Fixed Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/40 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-around h-16 px-2">
          {visibleMain.map(link => {
            const isActive = location.pathname === link.id;
            const Icon = link.icon;
            return (
              <NavLink
                key={link.id}
                to={link.id}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 relative ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -top-px left-1/4 right-1/4 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  />
                )}
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  {link.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Desktop Secondary Scroller / Mobile Secondary Scroller (Above Tab Bar) */}
      <div className="shrink-0 border-t border-border/40 bg-card/40 backdrop-blur-md px-3 py-2 z-20 md:border-none md:bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-1 scrollbar-none justify-start md:justify-center">
          {/* On Mobile we only show secondary links here. On Desktop we show all. */}
          {[...(window.innerWidth < 768 ? visibleSecondary : [...visibleMain, ...visibleSecondary])].map(link => {
            const isActive = location.pathname === link.id;
            const Icon = link.icon;
            return (
              <NavLink
                key={link.id}
                to={link.id}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'text-muted-foreground hover:text-foreground bg-background/50 border-border/40 hover:border-border hover:bg-background'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
}
