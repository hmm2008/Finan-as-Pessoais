import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  User, Shield, KeyRound, Mail, Send, CheckCircle2, 
  Settings2, LayoutTemplate, Palette, Lock, AlertCircle
} from 'lucide-react';
import { useAuth, usePin } from '../contexts';
import { usePreferences } from '../contexts/PreferencesContext';
import { SidebarLabelsCustomizer } from '../components/configuracoes/SidebarLabelsCustomizer';
import { PageTitlesCustomizer } from '../components/configuracoes/PageTitlesCustomizer';
import { PageHeader } from '../components/layout';

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

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto px-4 md:px-0">
      <PageHeader 
        title="Configurações & Preferências" 
        subtitle="Gerencie a segurança por PIN, nomes dos menus e títulos das páginas."
      />

      {savedMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{savedMessage}</p>
        </div>
      )}

      <Tabs defaultValue="seguranca" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-secondary/50 rounded-xl mb-6">
          <TabsTrigger value="seguranca" className="py-2.5 flex items-center gap-2 text-xs md:text-sm">
            <Shield className="w-4 h-4" />
            <span>Segurança & PIN</span>
          </TabsTrigger>
          <TabsTrigger value="titulos" className="py-2.5 flex items-center gap-2 text-xs md:text-sm">
            <LayoutTemplate className="w-4 h-4" />
            <span>Títulos das Páginas</span>
          </TabsTrigger>
          <TabsTrigger value="menu" className="py-2.5 flex items-center gap-2 text-xs md:text-sm">
            <Settings2 className="w-4 h-4" />
            <span>Menu Lateral</span>
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="py-2.5 flex items-center gap-2 text-xs md:text-sm">
            <Palette className="w-4 h-4" />
            <span>Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="perfil" className="py-2.5 flex items-center gap-2 text-xs md:text-sm">
            <User className="w-4 h-4" />
            <span>Perfil</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SEGURANÇA & PIN */}
        <TabsContent value="seguranca" className="space-y-6">
          <Card className="border border-border bg-card shadow-xs rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" /> Alterar PIN de Acesso Direto
              </CardTitle>
              <CardDescription>
                {hasPin 
                  ? 'Defina um novo PIN numérico de 4 dígitos para o seu acesso rápido local'
                  : 'Crie um PIN numérico de 4 dígitos para proteger o acesso'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pinMessage && (
                <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  pinMessage.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}>
                  {pinMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{pinMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleDirectPinChange} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs">Novo PIN de 4 Dígitos</Label>
                  <Input 
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={newPinAttempt}
                    onChange={(e) => setNewPinAttempt(e.target.value)}
                    className="h-9 text-xs font-mono tracking-widest"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Confirmar Novo PIN</Label>
                  <Input 
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={confirmPinAttempt}
                    onChange={(e) => setConfirmPinAttempt(e.target.value)}
                    className="h-9 text-xs font-mono tracking-widest"
                    required
                  />
                </div>

                <Button type="submit" size="sm" className="h-9 text-xs">
                  {hasPin ? 'Atualizar PIN' : 'Guardar Novo PIN'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-xs rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" /> Gestão / Recuperação de PIN por E-mail
              </CardTitle>
              <CardDescription>
                Solicite um código de verificação de 6 dígitos enviado para o e-mail do proprietário (<strong>{ownerEmail}</strong>)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resetEmailMessage && (
                <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  resetEmailMessage.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}>
                  {resetEmailMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{resetEmailMessage.text}</span>
                </div>
              )}

              {verificationStep === 'email' ? (
                <form onSubmit={handleSendResetCode} className="space-y-3 max-w-md">
                  <div className="space-y-1.5">
                    <Label className="text-xs">E-mail Autorizado</Label>
                    <Input 
                      value={ownerEmail}
                      disabled
                      className="h-9 text-xs bg-muted text-muted-foreground font-mono"
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-9 text-xs" disabled={isSendingCode}>
                    {isSendingCode ? 'A enviar código...' : 'Solicitar Código de Verificação por E-mail'}
                    <Send className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyResetCode} className="space-y-3 max-w-md">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Código de Verificação (6 dígitos recebidos)</Label>
                    <Input 
                      placeholder="Ex: 123456" 
                      value={resetCodeInput}
                      onChange={(e) => setResetCodeInput(e.target.value)}
                      maxLength={6}
                      className="h-9 text-xs tracking-widest font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Novo PIN de Acesso (4 dígitos numéricos)</Label>
                    <Input 
                      type="password"
                      placeholder="••••" 
                      value={newPinViaEmail}
                      onChange={(e) => setNewPinViaEmail(e.target.value)}
                      maxLength={4}
                      className="h-9 text-xs tracking-widest font-mono"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-9 text-xs"
                      onClick={() => setVerificationStep('email')}
                    >
                      Voltar
                    </Button>
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="flex-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" 
                      disabled={isResettingPin}
                    >
                      {isResettingPin ? 'A redefinir...' : 'Confirmar Novo PIN'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: TÍTULOS DAS PÁGINAS */}
        <TabsContent value="titulos">
          <PageTitlesCustomizer />
        </TabsContent>

        {/* TAB 3: MENU LATERAL */}
        <TabsContent value="menu">
          <SidebarLabelsCustomizer />
        </TabsContent>

        {/* TAB 4: APARÊNCIA */}
        <TabsContent value="aparencia" className="space-y-6">
          <Card className="border border-border bg-card shadow-xs rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" /> Preferências Visuais & Tema
              </CardTitle>
              <CardDescription>Personalize o tema de cores, tipografia e densidade do ecrã</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tema */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Tema de Cores</Label>
                  <p className="text-xs text-muted-foreground">Escolha o modo de iluminação ideal</p>
                </div>
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <Button
                      key={t}
                      variant={prefs.theme === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updatePrefs({ theme: t })}
                      className="capitalize text-xs"
                    >
                      {t === 'system' ? 'Sistema' : t === 'light' ? 'Claro' : 'Escuro'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Cor de Destaque</Label>
                  <p className="text-xs text-muted-foreground">Personalize a cor principal dos botões e badges</p>
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
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 shrink-0"
                      style={{ 
                        backgroundColor: colorObj.color,
                        borderColor: prefs.accentColor === colorObj.color ? 'var(--foreground)' : 'transparent'
                      }}
                      title={colorObj.label}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: PERFIL E CONTA */}
        <TabsContent value="perfil" className="space-y-6">
          <Card className="border border-border bg-card shadow-xs rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Perfil do Utilizador
              </CardTitle>
              <CardDescription>
                Informações da conta de utilizador ligada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center border border-primary/20">
                  {(user?.displayName || userName || 'M').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-base">
                    {user?.displayName || userName}
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {user?.email || ownerEmail}
                  </p>
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Conta Ativa & Protegida
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome de Exibição</Label>
                  <Input 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)} 
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail do Proprietário</Label>
                  <Input 
                    value={user?.email || ownerEmail} 
                    disabled
                    className="h-9 text-xs bg-muted text-muted-foreground font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={handleSavePreferences}>
                  Atualizar Nome
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
