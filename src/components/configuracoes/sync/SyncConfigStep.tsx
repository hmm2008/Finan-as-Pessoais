import React from 'react';
import { 
  Sliders, Zap, Database, CheckCircle2, 
  Radio, Info, SlidersHorizontal, ToggleRight, 
  ToggleLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { StorageMode } from '../../../lib/googleSheetsDataService';

interface SyncConfigStepProps {
  storageMode: StorageMode;
  autoSync: boolean;
  onStorageModeChange: (mode: StorageMode) => void;
  onAutoSyncToggle: () => void;
}

export function SyncConfigStep({
  storageMode,
  autoSync,
  onStorageModeChange,
  onAutoSyncToggle
}: SyncConfigStepProps) {
  return (
    <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] space-y-5 relative overflow-hidden group">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              3. Configuração de Resiliência
            </h3>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
              Modo de Operação e Auto-Sync
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Hybrid Mode Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onStorageModeChange('hybrid')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between group/card ${
            storageMode === 'hybrid'
              ? 'bg-white dark:bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10'
              : 'bg-muted/30 border-border/50 hover:border-indigo-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-1.5 rounded-lg ${storageMode === 'hybrid' ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
              <Zap className={`w-4 h-4 ${storageMode === 'hybrid' ? 'fill-amber-500' : ''}`} />
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${storageMode === 'hybrid' ? 'border-indigo-500 bg-indigo-500' : 'border-muted-foreground/30'}`}>
              {storageMode === 'hybrid' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground mb-1">Modo Híbrido Real-Time</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
              Sincronização imediata em segundo plano para cada transação registada. Segurança total na cloud.
            </p>
          </div>
        </motion.div>

        {/* Local Mode Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onStorageModeChange('local_only')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between group/card ${
            storageMode === 'local_only'
              ? 'bg-white dark:bg-slate-900/40 border-slate-500 shadow-lg shadow-slate-500/10'
              : 'bg-muted/30 border-border/50 hover:border-slate-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-1.5 rounded-lg ${storageMode === 'local_only' ? 'bg-slate-500/10 text-slate-500' : 'bg-muted text-muted-foreground'}`}>
              <Database className="w-4 h-4" />
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${storageMode === 'local_only' ? 'border-slate-500 bg-slate-500' : 'border-muted-foreground/30'}`}>
              {storageMode === 'local_only' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground mb-1">Apenas Local / Drive</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
              Privacidade máxima. O Google Sheets serve apenas para backups manuais ou pontuais.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Auto-Sync Switcher */}
      {storageMode === 'hybrid' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-indigo-500/10 rounded-2xl p-4 flex items-center justify-between gap-4 relative z-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Radio className={`w-5 h-5 ${autoSync ? 'animate-pulse' : 'opacity-40'}`} />
            </div>
            <div>
              <p className="text-xs font-black text-foreground uppercase tracking-tight">Sincronização Automática</p>
              <p className="text-[10px] text-muted-foreground font-medium">As alterações são enviadas enquanto usa a app</p>
            </div>
          </div>
          <button 
            onClick={onAutoSyncToggle}
            className={`transition-colors duration-300 ${autoSync ? 'text-indigo-600' : 'text-muted-foreground opacity-40'}`}
          >
            {autoSync ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
          </button>
        </motion.div>
      )}

      {/* Decorative Background */}
      <div className="absolute -bottom-12 -right-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity duration-700">
        <Sliders className="w-48 h-48" />
      </div>
    </div>
  );
}
