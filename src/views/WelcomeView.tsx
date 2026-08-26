import React, { useState } from 'react';
import { useAuth, usePin, usePreferences } from '../contexts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Shield, TrendingUp, Target, Car, Lock, KeyRound, Delete, AlertCircle, Mail, 
  CheckCircle2, ArrowLeft, Copy, Check, Wallet, PiggyBank, PieChart, Activity, Globe, Home
} from 'lucide-react';

export default function WelcomeView() {
  const { login, loginAsLocalUser, isLoadingAuth, authError } = useAuth();
  const { hasPin, verifyPin, unlock, setPin } = usePin();
  const { prefs, requestPinReset, resetPin } = usePreferences();

  // PIN keypad states
  const [pinCode, setPinCode] = useState('');
  const [firstPinAttempt, setFirstPinAttempt] = useState('');
  const [isCreatingPin, setIsCreatingPin] = useState(!hasPin);
  const [pinStep, setPinStep] = useState<'input' | 'confirm'>('input');
  const [pinError, setPinError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  // Email Verification States
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [verificationStep, setVerificationStep] = useState<'email' | 'code'>('email');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Icon mapping for features
  const iconMap: Record<string, any> = {
    TrendingUp, Target, Car, Shield, Wallet, PiggyBank, PieChart, Activity, Lock, Globe, Home
  };

  const welcome = prefs.welcomeScreen || {
    title: 'O seu centro de comando financeiro.',
    subtitle: 'Tenha controlo absoluto sobre o seu dinheiro, património e objetivos familiares, num ambiente privado, seguro e encriptado.',
    features: [
      {
        icon: 'TrendingUp',
        title: 'Gestão Global',
        description: 'O seu património e contas bancárias unificadas num painel de controlo claro.'
      },
      {
        icon: 'Target',
        title: 'Orçamentos Familiares',
        description: 'Defina categorias de gastos, acompanhe limites e controle o destino do seu dinheiro.'
      },
      {
        icon: 'Car',
        title: 'Gestão de Viaturas',
        description: 'Acompanhe quilómetros, manutenções e o valor comercial dos seus veículos.'
      },
      {
        icon: 'Shield',
        title: 'Privacidade Reforçada',
        description: 'Proteção por PIN de acesso local e gestão/recuperação segura por e-mail autorizado.'
      }
    ]
  };

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setEmailMessage({ type: 'error', text: 'Por favor introduza um endereço de e-mail válido.' });
      return;
    }

    setIsSendingCode(true);
    setEmailMessage(null);

    const result = await requestPinReset(email);
    setIsSendingCode(false);

    if (result.success) {
      setEmailMessage({ type: 'success', text: result.message });
      setVerificationStep('code');
    } else {
      setEmailMessage({ type: 'error', text: result.message });
    }
  };

  const handleVerifyCodeAndSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode.length !== 6) {
      setEmailMessage({ type: 'error', text: 'O código de verificação deve ter 6 dígitos.' });
      return;
    }
    if (pinCode.length !== 4) {
      setEmailMessage({ type: 'error', text: 'O novo PIN deve ser composto por 4 dígitos.' });
      return;
    }

    setIsResettingPin(true);
    setEmailMessage(null);

    const result = await resetPin(email, resetCode, pinCode);
    setIsResettingPin(false);

    if (result.success) {
      await setPin(pinCode);
      await unlock(pinCode);
      loginAsLocalUser();
    } else {
      setEmailMessage({ type: 'error', text: result.message });
    }
  };

  const handlePinKeyPress = async (val: string) => {
    setPinError(null);
    if (pinCode.length >= 4) return;

    const newPin = pinCode + val;
    setPinCode(newPin);

    if (newPin.length === 4) {
      if (isCreatingPin || !hasPin) {
        if (pinStep === 'input') {
          // Move to confirm step
          setFirstPinAttempt(newPin);
          setPinStep('confirm');
          setPinCode('');
        } else {
          // Confirming second entry
          if (newPin === firstPinAttempt) {
            const success = await setPin(newPin);
            if (success) {
              await unlock(newPin);
              loginAsLocalUser();
            } else {
              setPinError('O PIN deve ter 4 dígitos numéricos.');
              setPinCode('');
              setPinStep('input');
            }
          } else {
            setPinError('Os PINs não coincidem. Tente novamente.');
            setPinCode('');
            setFirstPinAttempt('');
            setPinStep('input');
          }
        }
      } else {
        // Authenticating with existing PIN
        const isValid = await verifyPin(newPin);
        if (isValid) {
          await unlock(newPin);
          loginAsLocalUser();
        } else {
          setTimeout(() => {
            setPinCode('');
            setPinError('PIN incorreto. Tente novamente.');
          }, 150);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinError(null);
    setPinCode(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center py-12 px-6 overflow-x-hidden overflow-y-auto">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl w-full flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-2xl">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-105 duration-300">
            F
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {welcome.title}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {welcome.subtitle}
            </p>
          </div>
        </div>

        {/* Unified Content Container */}
        <div className="w-full grid md:grid-cols-5 gap-12 items-start">
          
          {/* Features - Left Side (3/5 on large screens, full on small) */}
          <div className="md:col-span-3 space-y-8 py-4">
            <div className="grid sm:grid-cols-2 gap-6">
              {welcome.features.map((feature, idx) => {
                const IconComp = iconMap[feature.icon] || Activity;
                return (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm transition-all hover:bg-card/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="hidden md:flex items-center gap-3 text-[10px] text-muted-foreground px-4 py-2 bg-secondary/30 rounded-full w-fit">
              <Lock className="w-3 h-3" />
              <span>Plataforma 100% privada com dados encriptados e sincronização segura.</span>
            </div>
          </div>

          {/* Login Card - Right Side (2/5 on large screens, full on small) */}
          <div className="md:col-span-2 w-full flex flex-col items-center">
            <Card className="w-full border border-border shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold">Acesso Seguro</CardTitle>
                <CardDescription className="text-xs">Identifique-se para entrar na sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Email Verification Form */}
                {showEmailVerification ? (
                  <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-4 text-left animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 rounded-full" 
                        onClick={() => { setShowEmailVerification(false); setEmailMessage(null); }}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div>
                        <h4 className="font-bold text-foreground text-xs">Gerir PIN via E-mail</h4>
                      </div>
                    </div>

                    {emailMessage && (
                      <div className={`p-2 rounded-lg text-[10px] font-medium border flex items-center gap-2 ${
                        emailMessage.type === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {emailMessage.type === 'success' ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
                        <span>{emailMessage.text}</span>
                      </div>
                    )}

                    {verificationStep === 'email' ? (
                      <form onSubmit={handleSendVerificationCode} className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">E-mail Autorizado</Label>
                          <div className="relative">
                            <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                            <Input 
                              type="email" 
                              placeholder="ex: manuel@exemplo.com" 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-9 h-9 text-xs"
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" size="sm" className="w-full h-9 text-xs" disabled={isSendingCode}>
                          {isSendingCode ? 'A enviar...' : 'Solicitar Código'}
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyCodeAndSetPin} className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Código de 6 dígitos</Label>
                          <Input 
                            type="text" 
                            maxLength={6}
                            placeholder="000000" 
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value)}
                            className="h-9 text-xs font-mono tracking-widest text-center"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Novo PIN</Label>
                          <Input 
                            type="password" 
                            maxLength={4}
                            placeholder="••••" 
                            value={pinCode}
                            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                            className="h-9 text-xs text-center font-mono tracking-widest"
                            required
                          />
                        </div>
                        <Button type="submit" size="sm" className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isResettingPin}>
                          {isResettingPin ? 'A validar...' : 'Confirmar'}
                        </Button>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Google Login Section */}
                    <Button 
                      className="w-full h-11 text-sm font-semibold transition-all shadow-md shadow-primary/10" 
                      onClick={login}
                      disabled={isLoadingAuth}
                    >
                      {isLoadingAuth ? 'A autenticar...' : 'Entrar com Conta Google'}
                    </Button>

                    {authError === 'network_error' && (
                      <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-[10px] font-medium text-center border border-destructive/20">
                        Erro de rede. Verifique a sua ligação.
                      </div>
                    )}
                    
                    {authError === 'unauthorized_domain' && (
                      <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] border border-amber-500/20 space-y-2">
                        <p className="font-semibold text-center">⚠️ Domínio não autorizado</p>
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-background/80 border border-amber-500/30 font-mono text-foreground">
                          <span className="truncate pr-2">{currentDomain}</span>
                          <Button size="sm" variant="ghost" className="h-6 px-1.5 shrink-0 text-amber-600" onClick={handleCopyDomain}>
                            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="relative flex items-center justify-center py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60"></div></div>
                      <span className="bg-card px-3 text-[10px] text-muted-foreground uppercase tracking-widest font-bold z-10">ou por PIN</span>
                    </div>

                    {/* Direct PIN Keypad Card */}
                    <div className="space-y-4 text-center">
                      <div className="space-y-1">
                        <h4 className="font-bold text-foreground text-sm">
                          {!hasPin || isCreatingPin
                            ? (pinStep === 'input' ? 'Criar PIN' : 'Confirmar PIN')
                            : 'Código de Acesso'}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {!hasPin || isCreatingPin
                            ? 'Proteja o acesso local'
                            : 'Introduza os 4 dígitos'}
                        </p>
                      </div>

                      <div className="flex justify-center items-center gap-3 py-1">
                        {[0, 1, 2, 3].map((idx) => (
                          <div 
                            key={idx}
                            className={`w-3.5 h-3.5 rounded-full border border-border/60 transition-all duration-150 ${
                              pinCode.length > idx 
                                ? 'bg-primary scale-110 shadow-sm shadow-primary/30' 
                                : 'bg-secondary/50'
                            } ${pinError ? 'border-destructive bg-destructive/30 animate-shake' : ''}`}
                          />
                        ))}
                      </div>

                      {pinError && (
                        <p className="text-[10px] text-destructive font-semibold flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {pinError}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto pt-1">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handlePinKeyPress(num)}
                            className="h-10 rounded-xl bg-secondary/40 hover:bg-secondary/70 text-foreground text-sm font-bold transition-all active:scale-95 focus:outline-none border border-border/20"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => { setPinCode(''); setPinError(null); }}
                          className="h-10 rounded-xl text-muted-foreground text-[10px] font-semibold hover:bg-secondary/30"
                        >
                          C
                        </button>
                        <button
                          key="0"
                          type="button"
                          onClick={() => handlePinKeyPress('0')}
                          className="h-10 rounded-xl bg-secondary/40 hover:bg-secondary/70 text-sm font-bold border border-border/20"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={handleBackspace}
                          className="h-10 rounded-xl text-muted-foreground hover:bg-secondary/30 flex items-center justify-center"
                        >
                          <Delete className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="pt-4 mt-2 border-t border-border/40">
                        <button
                          type="button"
                          onClick={() => { setShowEmailVerification(true); setEmailMessage(null); }}
                          className="text-[10px] text-primary hover:underline font-medium flex items-center justify-center gap-1.5 mx-auto"
                        >
                          <Mail className="w-3 h-3" /> Esqueci-me ou quero alterar o PIN
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="mt-8 flex items-center gap-2 text-[10px] text-muted-foreground/60">
              <Shield className="w-3 h-3" />
              <span>Encriptação de ponta-a-ponta na sua Google Drive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


