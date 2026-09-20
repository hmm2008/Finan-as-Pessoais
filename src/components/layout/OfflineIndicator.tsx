import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowNotification(true);
    } else {
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] md:bottom-8"
        >
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border ${
            isOnline 
              ? 'bg-emerald-500/90 text-white border-emerald-400/20' 
              : 'bg-amber-500/90 text-white border-amber-400/20'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isOnline ? 'Ligação Restabelecida' : 'Modo Offline Ativado'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
