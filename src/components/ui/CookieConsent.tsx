import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X } from 'lucide-react';
import { Button } from './button';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('finanas_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('finanas_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    // For a finance app, we might need essential cookies anyway, 
    // but we respect the "no" for tracking/marketing.
    localStorage.setItem('finanas_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-full hidden md:block">
              <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 md:hidden" />
                Privacidade e Cookies
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Utilizamos cookies para garantir que a sua experiência na aplicação seja segura e funcional. 
                Os seus dados financeiros são armazenados localmente e, caso opte, sincronizados de forma encriptada com o seu Google Drive. 
                Ao continuar, concorda com a nossa política de gestão de dados.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto min-w-[240px]">
              <Button 
                variant="outline" 
                onClick={handleDecline}
                className="flex-1 text-xs h-10 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Apenas Essenciais
              </Button>
              <Button 
                onClick={handleAccept}
                className="flex-1 text-xs h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
              >
                Aceitar Tudo
              </Button>
            </div>

            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
