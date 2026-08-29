import React, { useState, useRef, useEffect } from 'react';
import { useNotifications, NotificationItem } from '../../contexts/NotificationContext';
import { Bell, Check, ArrowRight, ShieldAlert, AlertCircle, Sparkles, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';

interface NotificationDropdownProps {
  onNavigateToNotifications: () => void;
  onNavigateToLink: (link: string) => void;
}

const TYPE_CONFIG: Record<string, { icon: any; colorClass: string }> = {
  info: { icon: Info, colorClass: 'text-blue-500 bg-blue-500/10' },
  warning: { icon: AlertTriangle, colorClass: 'text-amber-500 bg-amber-500/10' },
  success: { icon: CheckCircle2, colorClass: 'text-emerald-500 bg-emerald-500/10' },
  error: { icon: AlertCircle, colorClass: 'text-destructive bg-destructive/10' }
};

export function NotificationDropdown({ onNavigateToNotifications, onNavigateToLink }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const latestNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.link) {
      onNavigateToLink(item.link);
    } else {
      onNavigateToNotifications();
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)} 
        title="Notificações"
        className="relative"
      >
        <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 animate-in zoom-in">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Popover Content */}
      {isOpen && (
        <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2.5 w-auto sm:w-96 rounded-xl border border-border bg-card shadow-lg ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in duration-100 slide-in-from-top-2">
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-secondary/20">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm text-foreground">Notificações</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {unreadCount} novas
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Marcar lidas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
            {latestNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
                <Bell className="w-8 h-8 mx-auto opacity-40 text-muted-foreground" />
                <p>Não tem notificações de momento</p>
              </div>
            ) : (
              latestNotifications.map(item => {
                const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
                const IconComponent = config.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 hover:bg-secondary/40 transition-colors ${
                      !item.read ? 'bg-primary/5 border-l-2 border-primary' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.colorClass}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold text-foreground truncate ${!item.read ? 'font-semibold' : ''}`}>
                          {item.title}
                        </span>
                        <span className="text-[9px] text-muted-foreground shrink-0">
                          {new Date(item.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer view-all Link */}
          <button 
            onClick={() => { setIsOpen(false); onNavigateToNotifications(); }}
            className="w-full p-2.5 bg-secondary/10 border-t border-border hover:bg-secondary/30 transition-colors text-center text-xs font-semibold text-primary flex items-center justify-center gap-1.5"
          >
            Ver todas as notificações <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
