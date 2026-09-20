import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, X } from 'lucide-react';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'motion/react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Button
              onClick={install}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 rounded-xl bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar App
            </Button>
          </motion.div>
        )}

        {isIOS && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Button
              onClick={() => setShowIOSGuide(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 rounded-xl bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Share className="w-3.5 h-3.5" />
              Instalar iOS
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm rounded-[2rem] bg-card p-8 shadow-2xl border border-border/40"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black tracking-tight text-foreground">Instalar no iPhone</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowIOSGuide(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">1</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Toque no botão <span className="font-bold text-foreground inline-flex items-center gap-1">Partilhar <Share className="w-4 h-4 inline" /></span> na barra de ferramentas do Safari.
                </p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">2</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Role para baixo e selecione <span className="font-bold text-foreground">"Adicionar ao Ecrã Principal"</span>.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowIOSGuide(false)}
              className="mt-8 w-full rounded-2xl bg-primary text-white font-black uppercase tracking-widest py-6"
            >
              Entendido
            </Button>
          </motion.div>
        </div>
      )}
    </>
  );
};
