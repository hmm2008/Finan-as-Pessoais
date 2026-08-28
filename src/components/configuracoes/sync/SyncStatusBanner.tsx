import React from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { SyncStatusEvent } from '../../../lib/googleSheetsDataService';
import { motion } from 'motion/react';

interface SyncStatusBannerProps {
  isOnline: boolean;
  syncStatus: SyncStatusEvent;
  pendingCount: number;
}

export function SyncStatusBanner({ isOnline, syncStatus, pendingCount }: SyncStatusBannerProps) {
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        label: 'Modo Offline',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20'
      };
    }

    switch (syncStatus.state) {
      case 'syncing':
        return {
          icon: Loader2,
          label: 'Sincronizando...',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          isSpinning: true
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Erro de Sincronização',
          color: 'text-rose-600 dark:text-rose-400',
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/20'
        };
      case 'offline_queued':
        return {
          icon: Clock,
          label: `${pendingCount} pendentes na fila`,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20'
        };
      default:
        return {
          icon: CheckCircle2,
          label: 'Sincronizado',
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border ${config.bgColor} ${config.borderColor} transition-all duration-500`}
    >
      <div className={`${config.color} shrink-0`}>
        <Icon className={`w-4 h-4 ${config.isSpinning ? 'animate-spin' : ''}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${config.color}`}>
          {config.label}
        </p>
        <p className="text-[10px] text-muted-foreground truncate opacity-70">
          {isOnline ? 'Ligação estável ao Google Cloud' : 'As alterações serão guardadas localmente'}
        </p>
      </div>
      {pendingCount > 0 && isOnline && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] font-black">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          {pendingCount} PENDENTES
        </div>
      )}
    </motion.div>
  );
}
