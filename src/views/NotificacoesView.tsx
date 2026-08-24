import React from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNotifications, NotificationItem } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, Trash2, Calendar, Info, 
  AlertTriangle, CheckCircle2, AlertCircle, ArrowRight, BellOff 
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: any; bgClass: string; textClass: string; label: string }> = {
  info: { icon: Info, bgClass: 'bg-blue-500/10 dark:bg-blue-500/20', textClass: 'text-blue-500 dark:text-blue-400', label: 'Informativo' },
  warning: { icon: AlertTriangle, bgClass: 'bg-amber-500/10 dark:bg-amber-500/20', textClass: 'text-amber-500 dark:text-amber-400', label: 'Aviso' },
  success: { icon: CheckCircle2, bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20', textClass: 'text-emerald-500 dark:text-emerald-400', label: 'Sucesso' },
  error: { icon: AlertCircle, bgClass: 'bg-destructive/10 dark:bg-destructive/20', textClass: 'text-destructive', label: 'Erro' }
};

export default function NotificacoesView() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  // Helper to categorize dates
  const groupNotificationsByDate = (items: NotificationItem[]) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    return items.reduce<Record<string, NotificationItem[]>>((groups, item) => {
      const itemDate = new Date(item.createdAt);
      
      let groupKey = 'Mais antigas';
      if (itemDate.toDateString() === today.toDateString()) {
        groupKey = 'Hoje';
      } else if (itemDate.toDateString() === yesterday.toDateString()) {
        groupKey = 'Ontem';
      } else {
        const diffTime = Math.abs(today.getTime() - itemDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          groupKey = 'Esta Semana';
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {});
  };

  const grouped = groupNotificationsByDate(notifications);

  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.link) {
      navigate('/' + item.link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Central de Notificações" 
          subtitle="Acompanhe alertas importantes, orçamentos, objetivos e ações de segurança em tempo real"
        />

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-1.5" /> Marcar todas como lidas
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4 mr-1.5" /> Limpar todas
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <BellOff className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg text-foreground">Sem novas notificações</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Está tudo em dia de momento! Quando surgirem novos alertas de segurança ou orçamentos excedidos, eles aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Order of sections explicitly: Hoje -> Ontem -> Esta Semana -> Mais antigas */}
          {['Hoje', 'Ontem', 'Esta Semana', 'Mais antigas'].map(group => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;

            return (
              <div key={group} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-border">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{group}</h3>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-foreground font-semibold">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {items.map(item => {
                    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
                    const IconComp = config.icon;
                    const timeStr = new Date(item.createdAt).toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <Card 
                        key={item.id} 
                        className={`border border-border hover:border-border/80 transition-all overflow-hidden ${
                          !item.read ? 'bg-primary/5 dark:bg-primary/5 border-l-2 border-l-primary' : 'bg-card'
                        }`}
                      >
                        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bgClass} ${config.textClass}`}>
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`text-sm font-bold text-foreground ${!item.read ? 'font-semibold' : 'font-normal'}`}>
                                  {item.title}
                                </h4>
                                <span className="text-[10px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                                  {timeStr}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {item.message}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons: Solid and completely visible on both mobile and desktop (16.1) */}
                          <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border">
                            {!item.read && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => { e.stopPropagation(); markAsRead(item.id); }}
                                className="text-xs h-8 px-2.5 flex items-center gap-1 border-primary/20 text-primary hover:bg-primary/5"
                              >
                                <Check className="w-3.5 h-3.5" /> Marcar lida
                              </Button>
                            )}

                            {item.link && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleItemClick(item)}
                                className="text-xs h-8 px-2.5 flex items-center gap-1 border-border text-foreground hover:bg-secondary"
                              >
                                Aceder <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
