import React from 'react';
import { Menu, Sun, Moon, Eye, EyeOff, Lock, Database, Loader2, Check, AlertCircle, AlertTriangle, UploadCloud } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth, usePrivacy, usePin, usePreferences } from '../../contexts';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useConnectDrive } from '../../hooks/useConnectDrive';
import { Modal } from '../ui/Modal';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const { privacyMode, togglePrivacy } = usePrivacy();
  const { hasPin, lock } = usePin();
  const { prefs: userPrefs, updatePrefs } = usePreferences();
  const navigate = useNavigate();
  const { 
    isConnecting, 
    isRefreshing,
    isConnected, 
    toastMsg, 
    toggleDriveConnection,
    handleSyncDriveData,
    showDisconnectModal,
    confirmDisconnect,
    cancelDisconnect
  } = useConnectDrive();
  
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
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleSyncDriveData}
          disabled={isRefreshing || isConnecting}
          title="Enviar dados para a Google Drive"
        >
          <UploadCloud className={`h-5 w-5 text-muted-foreground hover:text-foreground transition-transform ${isRefreshing ? 'animate-bounce text-primary' : ''}`} />
        </Button>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleDriveConnection}
          disabled={isConnecting || isRefreshing}
          title={isConnected ? 'Desconectar da Drive' : (userPrefs.navLabels?.['drive_connect'] || 'Conectar à Drive')}
        >
          {isConnecting ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Database className={`h-5 w-5 ${isConnected ? 'text-emerald-500' : 'text-red-500'}`} />
          )}
        </Button>

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

      {/* Floating Toast */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-[100] text-white shadow-2xl px-5 py-3.5 rounded-xl flex items-center gap-3 font-medium text-sm border animate-in fade-in slide-in-from-top-5 ${
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

      {/* Disconnect Drive Confirmation Modal */}
      <Modal open={showDisconnectModal} onClose={cancelDisconnect} title="Desconectar Google Drive">
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">A sincronização será interrompida</p>
              <p className="opacity-90">A sua base de dados deixará de atualizar para a Google Drive.</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Os dados locais no seu dispositivo não serão afetados, mas quaisquer alterações feitas a partir de agora deixarão de ser sincronizadas com outros dispositivos ou com a folha de cálculo.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={cancelDisconnect}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDisconnect}>
              Desconectar Drive
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
