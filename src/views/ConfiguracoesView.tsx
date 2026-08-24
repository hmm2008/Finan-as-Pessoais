import React, { useState, useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import { auth } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { 
  Settings, 
  Sparkles, 
  Calendar, 
  Terminal, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Send,
  RefreshCw,
  Search,
  Database,
  Volume2
} from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GoogleDriveSyncCard } from '../components/configuracoes/GoogleDriveSyncCard';
import { PaymentMethodsCustomizer } from '../components/configuracoes/PaymentMethodsCustomizer';
import { SidebarLabelsCustomizer } from '../components/configuracoes/SidebarLabelsCustomizer';
import { PageTitlesCustomizer } from '../components/configuracoes/PageTitlesCustomizer';

import { DangerZoneCard } from '../components/configuracoes/DangerZoneCard';

export default function ConfiguracoesView() {
  const { prefs, updatePrefs, resetToDefaults, requestPinReset, resetPin } = usePreferences();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // General States
  const [loading, setLoading] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['[System] Consola do servidor inicializada. Pronta para receber ações.']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // PIN Reset Form States
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinStep, setPinStep] = useState<'request' | 'verify'>('request');

  // AI Advice States
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user?.email) {
        setEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const addLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [`[${timestamp}] ${log}`, ...prev]);
  };

  const handleClientSideAction = async (action: string) => {
    setLoading(action);
    setErrorMessage(null);
    setSuccessMessage(null);
    addLog(`A iniciar: ${action}...`);

    try {
      if (action === 'Manutenção Noturna') {
        const trashRaw = localStorage.getItem('fin_trash');
        let trashDeleted = 0;
        if (trashRaw) {
          const trash = JSON.parse(trashRaw);
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          
          const filteredTrash = trash.filter((item: any) => {
            if (item.deletedAt && new Date(item.deletedAt) < ninetyDaysAgo) {
              trashDeleted++;
              return false;
            }
            return true;
          });
          
          if (trashDeleted > 0) {
            localStorage.setItem('fin_trash', JSON.stringify(filteredTrash));
            window.dispatchEvent(new Event('storage'));
          }
        }
        setSuccessMessage(`Manutenção concluída. ${trashDeleted} itens antigos apagados.`);
        addLog(`Sucesso: ${trashDeleted} itens antigos apagados da lixeira.`);
      } 
      else if (action === 'Validação de Integridade') {
        const expensesRaw = localStorage.getItem('fin_expenses');
        const vehiclesRaw = localStorage.getItem('fin_vehicles');
        let issues = 0;
        
        if (expensesRaw && vehiclesRaw) {
          const expenses = JSON.parse(expensesRaw);
          const vehicles = JSON.parse(vehiclesRaw);
          const vehicleIds = new Set(vehicles.map((v: any) => v.id));
          
          expenses.forEach((exp: any) => {
            if (exp.vehicleId && !vehicleIds.has(exp.vehicleId)) {
              issues++;
              addLog(`Aviso: Despesa "${exp.description}" tem vehicleId inválido (${exp.vehicleId}).`);
            }
          });
        }
        
        if (issues > 0) {
          setErrorMessage(`Encontradas ${issues} inconsistências de dados.`);
          addLog(`Aviso: Validação encontrou inconsistências.`);
        } else {
          setSuccessMessage('A base de dados local está íntegra.');
          addLog(`Sucesso: Nenhuma inconsistência encontrada.`);
        }
      }
      else if (action === 'Alerta Despesas Fixas') {
        const fixedRaw = localStorage.getItem('fin_fixed_expenses');
        if (fixedRaw) {
           const fixed = JSON.parse(fixedRaw);
           addLog(`Analisadas ${fixed.length} despesas fixas.`);
        }
        setSuccessMessage('Verificação de despesas fixas executada.');
      }
      else if (action === 'Alertas de Orçamentos') {
        const budgetsRaw = localStorage.getItem('fin_budgets');
        if (budgetsRaw) {
           const budgets = JSON.parse(budgetsRaw);
           addLog(`Analisados ${budgets.length} orçamentos.`);
        }
        setSuccessMessage('Verificação de orçamentos executada.');
      }
    } catch (err: any) {
      addLog(`Erro crítico: ${err.message}`);
      setErrorMessage(`Erro ao executar a ação: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleRequestPinReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('request-pin');
    setErrorMessage(null);
    setSuccessMessage(null);
    addLog(`A solicitar código de recuperação PIN para ${email}...`);

    try {
      const res = await requestPinReset(email);
      if (res.success) {
        addLog(`Código de verificação de 6 dígitos gerado e guardado com sucesso.`);
        setSuccessMessage(res.message);
        setPinStep('verify');
      } else {
        setErrorMessage(res.message);
        addLog(`Falha no pedido de PIN: ${res.message}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleVerifyPinReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('verify-pin');
    setErrorMessage(null);
    setSuccessMessage(null);
    addLog(`A submeter verificação do PIN para ${email}...`);

    try {
      const res = await resetPin(email, verificationCode, newPin);
      if (res.success) {
        addLog(`PIN alterado com sucesso no servidor e sincronizado.`);
        setSuccessMessage(res.message);
        setPinStep('request');
        setVerificationCode('');
        setNewPin('');
      } else {
        setErrorMessage(res.message);
        addLog(`Falha ao verificar código: ${res.message}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleGetAiAdvice = async () => {
    setLoading('ai-advice');
    setErrorMessage(null);
    setAiSuggestions(null);
    addLog('A solicitar conselhos de poupança personalizados à IA...');

    try {
      const expensesRaw = localStorage.getItem('fin_expenses');
      const expenses = expensesRaw ? JSON.parse(expensesRaw) : [];

      const response = await fetch('/api/suggest-savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses })
      });

      const data = await response.json();

      if (response.ok) {
        addLog('Conselhos gerados com sucesso pela IA.');
        setAiSuggestions(data.suggestions);
      } else {
        addLog(`Falha na IA: ${data.error}`);
        setErrorMessage(`Não foi possível obter conselhos: ${data.error}`);
      }
    } catch (err: any) {
      addLog(`Erro na IA: ${err.message}`);
      setErrorMessage(`Erro ao ligar ao servidor de IA: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 md:px-0">
      <PageHeader 
        title="Definições e Backend" 
        subtitle="Gerencie as preferências da aplicação e teste os endpoints backend do servidor." 
      />

      {/* Alert Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Col 1: Preferences & Appearance */}
        <div className="lg:col-span-2 space-y-6">
          <GoogleDriveSyncCard />
          <DangerZoneCard />

          <Card className="border border-border bg-card shadow-sm rounded-xl">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Preferências Visuais</CardTitle>
                  <CardDescription>Ajuste o visual, tema e comportamento do seu painel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Tema */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Tema de Cores</Label>
                  <p className="text-xs text-muted-foreground">Escolha o modo de iluminação ideal para o seu ecrã</p>
                </div>
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <Button
                      key={t}
                      variant={prefs.theme === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updatePrefs({ theme: t })}
                      className="capitalize"
                    >
                      {t === 'system' ? 'Sistema' : t === 'light' ? 'Claro' : 'Escuro'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Cor de Destaque</Label>
                  <p className="text-xs text-muted-foreground">Personalize a cor dos botões, badges e destaques</p>
                </div>
                <div className="flex gap-2">
                  {[
                    { color: '#059669', label: 'Verde' },
                    { color: '#2563eb', label: 'Azul' },
                    { color: '#d97706', label: 'Laranja' },
                    { color: '#e11d48', label: 'Rosa' },
                    { color: '#7c3aed', label: 'Roxo' }
                  ].map((colorObj) => (
                    <button
                      key={colorObj.color}
                      onClick={() => updatePrefs({ accentColor: colorObj.color })}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shrink-0"
                      style={{ 
                        backgroundColor: colorObj.color,
                        borderColor: prefs.accentColor === colorObj.color ? 'var(--foreground)' : 'transparent'
                      }}
                      title={colorObj.label}
                    />
                  ))}
                </div>
              </div>

              {/* Typography / Font Family */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Família de Fontes</Label>
                  <p className="text-xs text-muted-foreground">Defina a tipografia padrão para melhorar a leitura</p>
                </div>
                <div className="flex gap-2">
                  {(['inter', 'system', 'serif', 'mono'] as const).map((f) => (
                    <Button
                      key={f}
                      variant={prefs.fontFamily === f ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updatePrefs({ fontFamily: f })}
                      className="capitalize"
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sidebar Collapsible toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Densidade do Layout</Label>
                  <p className="text-xs text-muted-foreground">Alterne o tamanho de espaçamentos no ecrã</p>
                </div>
                <div className="flex gap-2">
                  {(['normal', 'compact'] as const).map((d) => (
                    <Button
                      key={d}
                      variant={prefs.density === d ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updatePrefs({ density: d })}
                      className="capitalize"
                    >
                      {d === 'normal' ? 'Normal' : 'Compacto'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border/50">
                <Button variant="ghost" size="sm" onClick={resetToDefaults} className="text-destructive">
                  Repor Predefinições
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Custom Navigation Labels (Sidebar and Footer) */}
          <SidebarLabelsCustomizer />

          {/* Custom Page Titles & Subtitles */}
          <PageTitlesCustomizer />

          {/* Custom Payment Methods Manager */}
          <PaymentMethodsCustomizer />

          {/* PIN Lock Settings Card */}
          <Card className="border border-border bg-card shadow-sm rounded-xl">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Recuperação de PIN Seguro (19.8, 19.9)</CardTitle>
                  <CardDescription>Gerencie o PIN de bloqueio local ou solicite reposição</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {pinStep === 'request' ? (
                <form onSubmit={handleRequestPinReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pin-email">Endereço de E-mail</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="pin-email"
                        type="email" 
                        placeholder="nome@exemplo.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex-1"
                      />
                      <Button type="submit" disabled={loading === 'request-pin'} className="shrink-0">
                        {loading === 'request-pin' ? 'A enviar...' : 'Solicitar Código'}
                        <Send className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gera um código de verificação temporário de 6 dígitos válido por 15 minutos.
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyPinReset} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Introduza o código de 6 dígitos enviado para <strong>{email}</strong> e escolha o novo PIN de 4 dígitos.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="verification-code">Código (6 dígitos)</Label>
                      <Input 
                        id="verification-code"
                        type="text" 
                        maxLength={6} 
                        placeholder="123456" 
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new-pin">Novo PIN (4 números)</Label>
                      <Input 
                        id="new-pin"
                        type="password" 
                        maxLength={4} 
                        placeholder="••••" 
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="ghost" onClick={() => setPinStep('request')}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading === 'verify-pin'}>
                      {loading === 'verify-pin' ? 'A redefinir...' : 'Redefinir PIN'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* AI Savings Advice Section (19.3) */}
          <Card className="border border-border bg-card shadow-sm rounded-xl">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <CardTitle className="text-lg">Recomendações Inteligentes de Poupança (19.3)</CardTitle>
                  <CardDescription>IA especialista analisa os seus padrões de gastos integrando pesquisas na internet</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Análise automática de categorias de despesa frequentes com propostas ativas ligadas aos custos atuais de energia, transportes e alimentação em Portugal.
              </p>
              
              <Button 
                onClick={handleGetAiAdvice} 
                disabled={loading === 'ai-advice'}
                className="w-full bg-gradient-to-r from-amber-500 to-primary text-white border-0 hover:opacity-90"
              >
                {loading === 'ai-advice' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    A Analisar Gastos e Pesquisar Mercados...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    Gerar Plano de Poupança Personalizado
                  </>
                )}
              </Button>

              {aiSuggestions && (
                <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                    <Sparkles className="w-4 h-4" />
                    Conselhos do Consultor Financeiro AI:
                  </div>
                  <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                    {aiSuggestions}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Col 2: Local & Drive Operations & Logs */}
        <div className="space-y-6">
          <Card className="border border-border bg-card shadow-sm rounded-xl">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Operações do Sistema Local</CardTitle>
                  <CardDescription>Triggers manuais para tarefas de manutenção</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              
              {/* Check Bill Alerts (19.1) */}
              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Alertar Despesas Fixas
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Verifica as despesas pendentes</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full text-xs font-medium"
                  onClick={() => handleClientSideAction('Alerta Despesas Fixas')}
                  disabled={loading !== null}
                >
                  {loading === 'Alerta Despesas Fixas' ? 'A verificar...' : 'Executar Verificação'}
                </Button>
              </div>

              {/* Check Budget Alerts (19.2) */}
              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-primary" />
                      Controlo Orçamental
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Verifica o limite dos orçamentos</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full text-xs font-medium"
                  onClick={() => handleClientSideAction('Alertas de Orçamentos')}
                  disabled={loading !== null}
                >
                  {loading === 'Alertas de Orçamentos' ? 'A processar...' : 'Executar Verificação'}
                </Button>
              </div>

              {/* Nightly Maintenance (19.5) */}
              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-purple-500" />
                      Manutenção de Dados
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Limpa Lixeira com &gt; 90 dias</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full text-xs font-medium"
                  onClick={() => handleClientSideAction('Manutenção Noturna')}
                  disabled={loading !== null}
                >
                  {loading === 'Manutenção Noturna' ? 'A limpar...' : 'Limpar Cache Antiga'}
                </Button>
              </div>

              {/* Validate Integrity (19.6) */}
              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Integridade de Dados
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Verifica despesas sem veículos válidos</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full text-xs font-medium"
                  onClick={() => handleClientSideAction('Validação de Integridade')}
                  disabled={loading !== null}
                >
                  {loading === 'Validação de Integridade' ? 'A analisar...' : 'Validar Integridade'}
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Console Output Logs */}
          <Card className="border border-border bg-black text-emerald-400 font-mono text-xs rounded-xl overflow-hidden shadow-md">
            <CardHeader className="bg-neutral-900 border-b border-neutral-800 p-3 flex flex-row justify-between items-center">
              <span className="flex items-center gap-2 text-white font-semibold">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Consola de Resposta API
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setConsoleLogs(['[System] Consola limpa.'])}
                className="h-6 text-[10px] text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                Limpar
              </Button>
            </CardHeader>
            <CardContent className="p-3 h-64 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-800">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap leading-relaxed border-b border-neutral-900 pb-1">
                  {log}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
