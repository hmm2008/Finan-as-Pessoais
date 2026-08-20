import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { usePin } from '../../contexts';
import { usePreferences } from '../../contexts/PreferencesContext';

export function BottomPageNav() {
  const { unlocked } = usePin();
  const { prefs } = usePreferences();
  const location = useLocation();
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
      </div>
    </div>
  );
}
