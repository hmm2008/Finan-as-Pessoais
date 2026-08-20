import React from 'react';
import { Menu, Sun, Moon, Eye, EyeOff, Lock } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth, usePrivacy, usePin, usePreferences } from '../../contexts';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const { privacyMode, togglePrivacy } = usePrivacy();
  const { hasPin, lock } = usePin();
  const { prefs: userPrefs, updatePrefs } = usePreferences();
  const navigate = useNavigate();
  
  const toggleTheme = () => {
    const currentTheme = userPrefs.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : userPrefs.theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update main preferences context
    updatePrefs({ theme: newTheme });
  };
  
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background px-4 sm:px-8 shrink-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationDropdown 
          onNavigateToNotifications={() => navigate('/notificacoes')} 
          onNavigateToLink={(link) => navigate('/' + link)} 
        />
        <Button variant="ghost" size="icon" onClick={togglePrivacy} title="Modo Privacidade">
          {privacyMode ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alternar Tema">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        {hasPin && (
          <Button variant="ghost" size="icon" onClick={lock} title="Bloquear Aplicação">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </Button>
        )}
        <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-border">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold overflow-hidden">
            {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" /> : user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium">{user?.displayName || 'Utilizador'}</p>
            <p className="text-[10px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
