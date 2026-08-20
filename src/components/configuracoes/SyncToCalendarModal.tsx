import React, { useState, useEffect } from 'react';
import { auth } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Clock, 
  Mail, 
  Trash2, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface SyncToCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SyncToCalendarModal({ isOpen, onClose }: SyncToCalendarModalProps) {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connector, setConnector] = useState<any>(null);

  // Form parameters
  const [email, setEmail] = useState('');
  const [calendarId, setCalendarId] = useState('primary');
  const [syncReminderMinutes, setSyncReminderMinutes] = useState('120');

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user?.email) {
        setEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch current connector info on open - Represents: get_connectors_info
  const fetchConnectorInfo = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/connectors/info?userId=${currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        setConnector(data);
        if (data.connected) {
          setEmail(data.email || currentUser.email || '');
          setCalendarId(data.calendarId || 'primary');
          setSyncReminderMinutes(String(data.syncReminderMinutes || 120));
        }
      }
    } catch (err) {
      console.error('Error fetching connector info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchConnectorInfo();
      setMessage(null);
    }
  }, [isOpen, currentUser]);

  // Connect flow: request_oauth_authorization -> register_workspace_connector
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    setMessage(null);

    try {
      // 1. Simulates request_oauth_authorization
      const oauthRes = await fetch('/api/connectors/request-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.uid, email })
      });
      const oauthData = await oauthRes.json();

      if (!oauthRes.ok) {
        throw new Error(oauthData.error || 'Falha na autorização OAuth');
      }

      // 2. Simulates register_workspace_connector
      const registerRes = await fetch('/api/connectors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          email,
          calendarId,
          syncReminderMinutes
        })
      });
      const registerData = await registerRes.json();

      if (registerRes.ok) {
        setMessage({ type: 'success', text: 'Conector Google Calendar ativado com sucesso!' });
        fetchConnectorInfo();
      } else {
        throw new Error(registerData.error || 'Falha ao registar conector');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro de ligação ao servidor.' });
    } finally {
      setLoading(false);
    }
  };

  // Sync fixed bills trigger
  const handleManualSync = async () => {
    if (!currentUser) return;
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/sync-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer SIMULATED_GOOGLE_OAUTH_TOKEN'
        },
        body: JSON.stringify({ userId: currentUser.uid })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Sincronização concluída com sucesso!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao sincronizar faturas.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro de comunicação de rede.' });
    } finally {
      setLoading(false);
    }
  };

  // Delete/Disconnect connector
  const handleDisconnect = async () => {
    if (!currentUser) return;
    const confirmed = window.confirm('Tem a certeza que deseja desligar e remover a sincronização com o Google Calendar?');
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);

    try {
      // We can update connector to connected: false or delete doc
      const response = await fetch('/api/connectors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          email,
          calendarId,
          syncReminderMinutes,
          connected: false // updates to offline
        })
      });

      // Simple mock removal
      setConnector(null);
      setMessage({ type: 'success', text: 'Conector desativado com sucesso.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao desligar o conector.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-card text-card-foreground border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold">Conector Google Calendar</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Status badge */}
          <div className="flex items-center justify-between p-3.5 bg-secondary/40 border border-border/50 rounded-xl">
            <span className="text-sm font-medium">Estado da Ligação:</span>
            {connector?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> LIGADO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> DESLIGADO
              </span>
            )}
          </div>

          {/* Feedback message banner */}
          {message && (
            <div className={`p-4 rounded-xl text-sm border flex gap-3 items-start ${
              message.type === 'success' 
                ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/5 border-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          {connector?.connected ? (
            /* CONNECTED VIEW */
            <div className="space-y-5">
              <div className="space-y-3.5 text-sm bg-muted/10 p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{connector.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Calendário Ativo: <strong>{connector.calendarId}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Avisos antes do vencimento: <strong>{connector.syncReminderMinutes} minutos</strong></span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleManualSync} 
                  disabled={loading} 
                  className="w-full bg-primary hover:opacity-90 font-semibold"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      A Sincronizar Faturas...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sincronizar Faturas Agora
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handleDisconnect} 
                  variant="outline" 
                  disabled={loading}
                  className="w-full border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/30 text-xs py-1 h-9 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Desligar Google Calendar
                </Button>
              </div>
            </div>
          ) : (
            /* DISCONNECTED VIEW: CONFIGURATION FORM */
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="connector-email">Conta Google (Email)</Label>
                <Input 
                  id="connector-email"
                  type="email" 
                  placeholder="nome@gmail.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="connector-cal-id">ID do Calendário Google</Label>
                <Input 
                  id="connector-cal-id"
                  type="text" 
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                  placeholder="primary"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  "primary" indica o seu calendário principal da conta Google.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="connector-reminder">Tempo de Notificação Predefinido</Label>
                <select
                  id="connector-reminder"
                  value={syncReminderMinutes}
                  onChange={(e) => setSyncReminderMinutes(e.target.value)}
                  className="w-full h-10 px-3 bg-secondary text-foreground text-sm rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="60">1 Hora antes (60m)</option>
                  <option value="120">2 Horas antes (120m)</option>
                  <option value="1440">1 Dia antes (1440m)</option>
                  <option value="2880">2 Dias antes (2880m)</option>
                </select>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold pt-2">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    A Ligar Google Calendar...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Ligar e Autorizar Google Calendar
                  </>
                )}
              </Button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 text-center text-[11px] text-muted-foreground flex gap-1.5 items-center justify-center">
          <HelpCircle className="w-3.5 h-3.5 text-primary" />
          <span>Utiliza a Google Calendar API em conformidade com as políticas OAuth.</span>
        </div>

      </div>
    </div>
  );
}
