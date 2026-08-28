import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  User, Shield, KeyRound, Mail, Send, CheckCircle2, 
  Settings2, LayoutTemplate, Palette, Lock, AlertCircle, HardDrive, Monitor, RotateCcw, Sparkles,
  Loader2, Info, Euro
} from 'lucide-react';
import { useAuth, usePin } from '../contexts';
import { usePreferences, TextStyle, DEFAULT_PREFERENCES } from '../contexts/PreferencesContext';
import { scheduleSheetsBackgroundSync } from '../lib/googleSheetsDataService';
import { SidebarLabelsCustomizer } from '../components/configuracoes/SidebarLabelsCustomizer';
import { PageTitlesCustomizer } from '../components/configuracoes/PageTitlesCustomizer';
import { WelcomeScreenCustomizer } from '../components/configuracoes/WelcomeScreenCustomizer';
import { TextStyleEditor } from '../components/configuracoes/TextStyleEditor';
import { CategorizationRulesCustomizer } from '../components/configuracoes/CategorizationRulesCustomizer';
import { PageHeader } from '../components/layout';
import { GoogleDriveSyncCard } from '../components/configuracoes/GoogleDriveSyncCard';
import { motion, AnimatePresence } from 'motion/react';

export default function ConfiguracoesView() {
  const { user } = useAuth();
  const { hasPin, setPin } = usePin();
  const { prefs, updatePrefs, requestPinReset, resetPin } = usePreferences();

  // PIN Direct Change States
  const [currentPinAttempt, setCurrentPinAttempt] = useState('');
  const [newPinAttempt, setNewPinAttempt] = useState('');
  const [confirmPinAttempt, setConfirmPinAttempt] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email Pin Reset States
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPinViaEmail, setNewPinViaEmail] = useState('');
  const [verificationStep, setVerificationStep] = useState<'email' | 'code'>('email');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [resetEmailMessage, setResetEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Account profile local state
  const [userName, setUserName] = useState(user?.displayName || prefs.userName || 'Manuel Francisco');
  const ownerEmail = 'manuel.francisco3@gmail.com';

  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSavePreferences = () => {
    updatePrefs({
      userName,
    });
    setSavedMessage('Preferências guardadas com sucesso!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleDirectPinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);

    if (newPinAttempt.length !== 4 || !/^\d+$/.test(newPinAttempt)) {
      setPinMessage({ type: 'error', text: 'O novo PIN deve ter exatamente 4 dígitos numéricos.' });
      return;
    }

    if (newPinAttempt !== confirmPinAttempt) {
      setPinMessage({ type: 'error', text: 'A confirmação do novo PIN não coincide.' });
      return;
    }

    const success = await setPin(newPinAttempt);
    if (success) {
      setPinMessage({ type: 'success', text: 'PIN atualizado com sucesso!' });
      setCurrentPinAttempt('');
      setNewPinAttempt('');
      setConfirmPinAttempt('');
    } else {
      setPinMessage({ type: 'error', text: 'Não foi possível atualizar o PIN.' });
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingCode(true);
    setResetEmailMessage(null);
    try {
      const res = await requestPinReset(ownerEmail);
      if (res.success) {
        setResetEmailMessage({ type: 'success', text: res.message });
        setVerificationStep('code');
      } else {
        setResetEmailMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setResetEmailMessage({ type: 'error', text: err.message || 'Erro ao enviar código.' });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResettingPin(true);
    setResetEmailMessage(null);
    try {
      const res = await resetPin(ownerEmail, resetCodeInput, newPinViaEmail);
      if (res.success) {
        setResetEmailMessage({ type: 'success', text: res.message });
        setVerificationStep('email');
        setResetCodeInput('');
        setNewPinViaEmail('');
      } else {
        setResetEmailMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setResetEmailMessage({ type: 'error', text: err.message || 'Erro ao redefinir PIN.' });
    } finally {
      setIsResettingPin(false);
    }
  };

  const handleResetAppearance = async () => {
    await updatePrefs({
      theme: DEFAULT_PREFERENCES.theme,
      accentColor: DEFAULT_PREFERENCES.accentColor,
      density: DEFAULT_PREFERENCES.density,
      fontFamily: DEFAULT_PREFERENCES.fontFamily,
      baseFontSize: DEFAULT_PREFERENCES.baseFontSize,
      customStyles: {
        ...prefs.customStyles,
        global: {}
      }
    });
    setSavedMessage('Aparência reposta para os padrões!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto px-4 md:px-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <PageHeader 
          title="Configurações & Preferências" 
          subtitle="Gerencie a segurança, sincronização cloud e personalização visual da sua aplicação."
        />
      </motion.div>

      {savedMessage && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold tracking-tight">{savedMessage}</p>
        </motion.div>
      )}

      <Tabs defaultValue="drive" className="w-full space-y-8">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-max md:w-full md:grid md:grid-cols-8 h-auto p-1.5 bg-muted/40 backdrop-blur-sm rounded-2xl border border-border/40">
            {[
              { value: 'drive', label: 'Sync', icon: HardDrive },
              { value: 'seguranca', label: 'Segurança', icon: Shield },
              { value: 'titulos', label: 'Títulos', icon: LayoutTemplate },
              { value: 'welcome', label: 'Início', icon: Monitor },
              { value: 'regras', label: 'Regras', icon: Sparkles },
              { value: 'menu', label: 'Menu', icon: Settings2 },
              { value: 'aparencia', label: 'Visual', icon: Palette },
              { value: 'perfil', label: 'Perfil', icon: User },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="py-2.5 px-4 md:px-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-xl"
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* TAB 0: DRIVE & SYNC */}
          <TabsContent value="drive" className="space-y-6 focus-visible:outline-none">
            <GoogleDriveSyncCard />
          </TabsContent>

          {/* TAB 1: SEGURANÇA & PIN */}
          <TabsContent value="seguranca" className="space-y-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-card/50 rounded-3xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black uppercase tracking-tight">Alterar PIN Direto</CardTitle>
                      <CardDescription className="text-xs font-medium">Controlo de acesso local instantâneo</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {pinMessage && (
                    <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
                      pinMessage.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                    }`}>
                      {pinMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <span>{pinMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleDirectPinChange} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Novo PIN (4 dígitos)</Label>
                      <Input 
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        value={newPinAttempt}
                        onChange={(e) => setNewPinAttempt(e.target.value)}
                        className="h-11 text-base font-mono tracking-[1em] rounded-xl bg-muted/30 focus:bg-white dark:focus:bg-slate-900 border-border/60"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirmar Novo PIN</Label>
                      <Input 
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        value={confirmPinAttempt}
                        onChange={(e) => setConfirmPinAttempt(e.target.value)}
                        className="h-11 text-base font-mono tracking-[1em] rounded-xl bg-muted/30 focus:bg-white dark:focus:bg-slate-900 border-border/60"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/20">
                      {hasPin ? 'Atualizar PIN de Segurança' : 'Criar PIN de Acesso'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/50 rounded-3xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black uppercase tracking-tight">Recuperação por E-mail</CardTitle>
                      <CardDescription className="text-xs font-medium">Recupere o acesso caso esqueça o PIN</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {resetEmailMessage && (
                    <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
                      resetEmailMessage.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                    }`}>
                      {resetEmailMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <span>{resetEmailMessage.text}</span>
                    </div>
                  )}

                  {verificationStep === 'email' ? (
                    <form onSubmit={handleSendResetCode} className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail do Proprietário</Label>
                        <Input 
                          value={ownerEmail}
                          disabled
                          className="h-11 text-xs bg-muted/30 text-muted-foreground font-mono rounded-xl border-border/40"
                        />
                      </div>
                      <Button type="submit" disabled={isSendingCode} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 gap-2">
                        {isSendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Solicitar Código de Recuperação
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyResetCode} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Código de Verificação (6 dígitos)</Label>
                        <Input 
                          placeholder="Ex: 123456" 
                          value={resetCodeInput}
                          onChange={(e) => setResetCodeInput(e.target.value)}
                          maxLength={6}
                          className="h-11 text-base tracking-[0.5em] font-mono rounded-xl bg-muted/30 focus:bg-white dark:focus:bg-slate-900"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Novo PIN (4 dígitos)</Label>
                        <Input 
                          type="password"
                          placeholder="••••" 
                          value={newPinViaEmail}
                          onChange={(e) => setNewPinViaEmail(e.target.value)}
                          maxLength={4}
                          className="h-11 text-base tracking-[1em] font-mono rounded-xl bg-muted/30 focus:bg-white dark:focus:bg-slate-900"
                          required
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1 h-11 text-xs font-black uppercase tracking-widest rounded-xl"
                          onClick={() => setVerificationStep('email')}
                        >
                          Voltar
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20" 
                          disabled={isResettingPin}
                        >
                          {isResettingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Novo PIN'}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: TÍTULOS DAS PÁGINAS */}
          <TabsContent value="titulos" className="focus-visible:outline-none">
            <PageTitlesCustomizer />
          </TabsContent>

          {/* TAB WELCOME: BOAS VINDAS */}
          <TabsContent value="welcome" className="focus-visible:outline-none">
            <WelcomeScreenCustomizer />
          </TabsContent>

          {/* TAB REGRAS: AUTO-CATEGORIZAÇÃO */}
          <TabsContent value="regras" className="focus-visible:outline-none">
            <CategorizationRulesCustomizer />
          </TabsContent>

          {/* TAB 3: MENU LATERAL */}
          <TabsContent value="menu" className="focus-visible:outline-none">
            <SidebarLabelsCustomizer />
          </TabsContent>

          {/* TAB 4: APARÊNCIA */}
          <TabsContent value="aparencia" className="space-y-6 focus-visible:outline-none">
            <Card className="border-none shadow-sm bg-card/50 rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black uppercase tracking-tight">Preferências Visuais</CardTitle>
                      <CardDescription className="text-xs font-medium">Personalize a identidade da sua app</CardDescription>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetAppearance}
                    className="h-8 text-[10px] font-black uppercase tracking-widest rounded-lg gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Repor Padrões
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Global Typography */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tipografia Global do Sistema</h4>
                  </div>
                  <div className="bg-muted/20 rounded-2xl p-4 border border-border/40">
                    <TextStyleEditor 
                      label="Aspeto Visual Geral" 
                      style={prefs.customStyles?.global || {}} 
                      onChange={(newStyle) => updatePrefs({
                        customStyles: {
                          ...prefs.customStyles,
                          global: newStyle
                        }
                      })} 
                      onReset={() => updatePrefs({
                        customStyles: {
                          ...prefs.customStyles,
                          global: {}
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Tema */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Modo de Exibição</h4>
                    </div>
                    <div className="flex gap-2 p-1.5 bg-muted/40 rounded-xl border border-border/40">
                      {(['light', 'dark', 'system'] as const).map((t) => (
                        <Button
                          key={t}
                          variant={prefs.theme === t ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => updatePrefs({ theme: t })}
                          className={`flex-1 capitalize text-[10px] font-black tracking-widest rounded-lg h-9 ${
                            prefs.theme === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground'
                          }`}
                        >
                          {t === 'system' ? 'Sistema' : t === 'light' ? 'Claro' : 'Escuro'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Cor de Destaque Primária</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { color: '#059669', label: 'Verde' },
                        { color: '#2563eb', label: 'Azul' },
                        { color: '#d97706', label: 'Laranja' },
                        { color: '#e11d48', label: 'Rosa' },
                        { color: '#7c3aed', label: 'Roxo' }
                      ].map((colorObj) => (
                        <motion.button
                          key={colorObj.color}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updatePrefs({ accentColor: colorObj.color })}
                          className={`w-9 h-9 rounded-xl border-2 transition-all shrink-0 shadow-sm ${
                            prefs.accentColor === colorObj.color 
                              ? 'border-indigo-600 ring-4 ring-indigo-500/10' 
                              : 'border-white dark:border-slate-800'
                          }`}
                          style={{ backgroundColor: colorObj.color }}
                          title={colorObj.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Save Button for Appearance */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/40">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Info className="w-3.5 h-3.5" />
                    <p className="text-[10px] font-medium italic">
                      As alterações visuais são aplicadas instantaneamente e guardadas no perfil.
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      await updatePrefs({});
                      setSavedMessage('Definições de aparência guardadas com sucesso!');
                      setTimeout(() => setSavedMessage(null), 3000);
                    }}
                    className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl px-6 h-10 shadow-lg shadow-indigo-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Guardar Todas as Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: PERFIL E CONTA */}
          <TabsContent value="perfil" className="space-y-6 focus-visible:outline-none">
            <Card className="border-none shadow-sm bg-card/50 rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Gestão de Perfil</CardTitle>
                    <CardDescription className="text-xs font-medium">Informações da conta ativa no sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-border/40 shadow-sm relative overflow-hidden group">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-black text-3xl flex items-center justify-center border border-indigo-500/20 shadow-xl shadow-indigo-500/20 relative z-10">
                    {(user?.displayName || userName || 'M').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-center md:text-left relative z-10">
                    <h4 className="font-black text-xl text-foreground tracking-tight mb-1">
                      {user?.displayName || userName}
                    </h4>
                    <p className="text-sm text-muted-foreground font-mono opacity-60">
                      {user?.email || ownerEmail}
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-widest">
                        <Shield className="w-3 h-3" /> Conta Verificada
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 uppercase tracking-widest">
                        Nível Proprietário
                      </span>
                    </div>
                  </div>
                  
                  {/* Decoration */}
                  <User className="absolute -bottom-8 -right-8 w-40 h-40 text-muted-foreground opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome de Exibição na App</Label>
                    <Input 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)} 
                      className="h-11 text-sm font-bold rounded-xl bg-muted/30 focus:bg-white dark:focus:bg-slate-900 border-border/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail Registado (Não Editável)</Label>
                    <Input 
                      value={user?.email || ownerEmail} 
                      disabled
                      className="h-11 text-xs bg-muted/40 text-muted-foreground font-mono rounded-xl border-border/40"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border/40">
                  <Button size="sm" onClick={handleSavePreferences} className="w-full sm:w-auto h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl px-8 shadow-lg shadow-indigo-500/20">
                    Atualizar Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
}
