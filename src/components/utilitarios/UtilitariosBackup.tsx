import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Database, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  History,
  FileJson
} from 'lucide-react';
import { BackupButton, ExcelBackupButton, RestoreBackupModal } from '../arquivo';
import { motion } from 'motion/react';

interface UtilitariosBackupProps {
  isRestoreOpen: boolean;
  setIsRestoreOpen: (val: boolean) => void;
  showToast: (msg: string) => void;
}

export function UtilitariosBackup({
  isRestoreOpen,
  setIsRestoreOpen,
  showToast
}: UtilitariosBackupProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backup Card */}
        <Card className="border-border shadow-sm overflow-hidden group">
          <CardHeader className="pb-3 bg-muted/20 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Cópia de Segurança</CardTitle>
                <CardDescription className="text-xs">Exporte todos os seus dados para segurança externa.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-dashed border-border bg-muted/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Segurança Recomendada
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Recomendamos a exportação de um backup mensal em formato **JSON** e **Excel**. 
                  Estes ficheiros contêm a totalidade dos seus registos e podem ser usados para restauro total em caso de necessidade.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <BackupButton onBackupCreated={() => showToast('Cópia de segurança JSON gerada com sucesso!')} />
                <ExcelBackupButton onSuccess={() => showToast('Backup completo em Excel gerado com sucesso!')} />
              </div>
            </div>

            <div className="pt-6 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground font-medium italic">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Último backup: Hoje
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Sincronizado com Drive
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Restore Card */}
        <Card className="border-border shadow-sm overflow-hidden group">
          <CardHeader className="pb-3 bg-rose-500/5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Restauro de Dados</CardTitle>
                <CardDescription className="text-xs text-rose-600/80">Recupere o sistema a partir de um ficheiro JSON.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-900/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-600">
                  <RotateCcw className="w-4 h-4" />
                  Zona de Perigo
                </div>
                <p className="text-xs text-rose-700/80 dark:text-rose-400/80 leading-relaxed font-medium">
                  **Atenção:** O restauro de dados irá substituir TODOS os registos atuais pelos dados contidos no ficheiro de backup. 
                  Certifique-se de que tem o ficheiro correto antes de proceder.
                </p>
              </div>

              <Button 
                variant="destructive" 
                className="w-full h-11 gap-2 font-bold uppercase tracking-wider text-xs shadow-lg shadow-rose-500/20"
                onClick={() => setIsRestoreOpen(true)}
              >
                <RotateCcw className="w-4 h-4" /> Importar & Restaurar Sistema
              </Button>
            </div>

            <div className="pt-6 border-t border-border/50 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                <FileJson className="w-3.5 h-3.5" />
                Formatos suportados: .json (Backup Nativo)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <RestoreBackupModal 
        isOpen={isRestoreOpen} 
        onClose={() => setIsRestoreOpen(false)} 
        onRestoreComplete={(msg: string) => {
          setIsRestoreOpen(false);
          showToast(msg || 'Dados restaurados com sucesso!');
        }}
      />
    </motion.div>
  );
}
