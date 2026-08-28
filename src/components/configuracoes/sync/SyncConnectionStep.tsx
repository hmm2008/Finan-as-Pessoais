import React from 'react';
import { Button } from '../../ui/button';
import { ShieldCheck, HardDrive, CheckCircle, RefreshCw, Loader2, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface SyncConnectionStepProps {
  accessToken: string | null;
  userEmail: string | null;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function SyncConnectionStep({
  accessToken,
  userEmail,
  isLoading,
  onConnect,
  onDisconnect
}: SyncConnectionStepProps) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card/40 space-y-4 relative overflow-hidden group">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            accessToken 
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm' 
              : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              1. Conta Google
            </h3>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
              Autorização e Segurança
            </p>
          </div>
        </div>

        {accessToken && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            AUTORIZADO
          </motion.div>
        )}
      </div>

      {!accessToken ? (
        <div className="space-y-4 pt-1 relative z-10">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Autorize a aplicação a aceder à sua Google Drive para sincronizar todos as suas transações e dados financeiros de forma segura e privada.
          </p>
          <Button 
            onClick={onConnect} 
            disabled={isLoading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs font-bold h-10 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
            Conectar Conta Google Drive
          </Button>
        </div>
      ) : (
          <div className="flex flex-col items-center gap-3 w-full">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest self-start">Conta Ativa</span>
            <span className="text-sm font-bold text-foreground font-mono bg-muted/50 px-4 py-2 rounded-lg border border-border/40 w-full text-center">
              {userEmail || 'Utilizador Google'}
            </span>
            <div className="flex gap-2 w-full justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onDisconnect}
                className="h-9 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200/50 rounded-xl gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair da Conta
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onConnect}
                disabled={isLoading}
                className="h-9 text-xs font-bold rounded-xl gap-1.5"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Renovar Token
              </Button>
            </div>
          </div>
      )}

      {/* Decorative Background */}
      <div className="absolute -bottom-12 -right-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity duration-700">
        <ShieldCheck className="w-48 h-48" />
      </div>
    </div>
  );
}
