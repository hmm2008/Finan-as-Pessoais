import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth, usePin, usePreferences, textStyleToCSS } from '../contexts';
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
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center py-12 px-6 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center"
      >
        {/* Header Section */}
        <div className="space-y-8">
          <div className="w-16 h-16 bg-foreground rounded-[1.5rem] flex items-center justify-center text-background text-3xl font-black shadow-2xl shadow-foreground/20">
            F
          </div>
          <div className="space-y-4">
            <h1 
              className="text-5xl md:text-6xl font-black tracking-tighter text-foreground"
              style={textStyleToCSS(prefs.customStyles?.welcomeScreen?.title)}
            >
              {welcome.title}
            </h1>
            <p 
              className="text-lg text-muted-foreground leading-relaxed max-w-lg"
              style={textStyleToCSS(prefs.customStyles?.welcomeScreen?.subtitle)}
            >
              {welcome.subtitle}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {welcome.features.map((feature, idx) => {
              const IconComp = iconMap[feature.icon] || Activity;
              return (
                <div key={idx} className="flex gap-4 p-5 rounded-[2rem] border border-border/40 bg-card/40 backdrop-blur-sm transition-all hover:bg-card/60">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-foreground/5 flex items-center justify-center text-foreground shrink-0">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 
                      className="font-black text-foreground text-sm uppercase tracking-widest mb-1"
                      style={textStyleToCSS(prefs.customStyles?.welcomeScreen?.features)}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full">
            <Card className="w-full border border-border/40 shadow-3xl shadow-black/5 bg-card/60 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden p-8">
              <CardHeader className="text-center pb-2 p-0 mb-6">
                <CardTitle className="text-2xl font-black tracking-tighter uppercase">Acesso Seguro</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Identifique-se para entrar</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-8">
                
                {/* Email Verification Form */}
                {showEmailVerification ? (
                  <div className="p-6 bg-muted/30 border border-border/40 rounded-[2rem] space-y-6 text-left animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full hover:bg-muted" 
                        onClick={() => { setShowEmailVerification(false); setEmailMessage(null); }}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <h4 className="font-black text-lg tracking-tight uppercase">Gerir PIN via E-mail</h4>
                    </div>

                    {emailMessage && (
                      <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-3 ${
                        emailMessage.type === 'success' 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>
                        {emailMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{emailMessage.text}</span>
                      </div>
                    )}

                    {verificationStep === 'email' ? (
                      <form onSubmit={handleSendVerificationCode} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">E-mail Autorizado</Label>
                          <div className="relative">
                            <Mail className="w-4 h-4 absolute left-4 top-4.5 text-muted-foreground" />
                            <Input 
                              type="email" 
                              placeholder="ex: manuel@exemplo.com" 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-12 h-14 rounded-2xl bg-background border-border/40"
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg" disabled={isSendingCode}>
                          {isSendingCode ? 'A enviar...' : 'Solicitar Código'}
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyCodeAndSetPin} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Código de 6 dígitos</Label>
                          <Input 
                            type="text" 
                            maxLength={6}
                            placeholder="000000" 
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value)}
                            className="h-14 rounded-2xl bg-background text-center font-mono text-lg tracking-[0.5em] border-border/40"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Novo PIN</Label>
                          <Input 
                            type="password" 
                            maxLength={4}
                            placeholder="••••" 
                            value={pinCode}
                            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                            className="h-14 rounded-2xl bg-background text-center font-mono text-lg tracking-[0.5em] border-border/40"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[10px] shadow-lg" disabled={isResettingPin}>
                          {isResettingPin ? 'A validar...' : 'Confirmar'}
                        </Button>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Google Login Section */}
                    <Button 
                      className="w-full h-14 text-sm font-black uppercase tracking-widest transition-all shadow-xl rounded-2xl" 
                      onClick={login}
                      disabled={isLoadingAuth}
                    >
                      {isLoadingAuth ? 'A autenticar...' : 'Entrar com Conta Google'}
                    </Button>

                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40"></div></div>
                      <span className="bg-card px-4 text-[10px] text-muted-foreground font-black uppercase tracking-widest z-10">ou via PIN</span>
                    </div>

                    {/* Direct PIN Keypad */}
                    <div className="space-y-6 text-center">
                      <div className="space-y-1">
                        <h4 className="font-black text-foreground text-sm uppercase tracking-widest">
                          {!hasPin || isCreatingPin
                            ? (pinStep === 'input' ? 'Criar PIN' : 'Confirmar PIN')
                            : 'Código de Acesso'}
                        </h4>
                      </div>

                      <div className="flex justify-center items-center gap-4 py-2">
                        {[0, 1, 2, 3].map((idx) => (
                          <div 
                            key={idx}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                              pinCode.length > idx 
                                ? 'bg-foreground border-foreground' 
                                : 'bg-muted border-border'
                            } ${pinError ? 'border-rose-500 bg-rose-500/20 animate-shake' : ''}`}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handlePinKeyPress(num)}
                            className="h-14 rounded-[1.25rem] bg-foreground/5 hover:bg-foreground/10 text-foreground text-lg font-black transition-all active:scale-95 border border-border/40"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => { setPinCode(''); setPinError(null); }}
                          className="h-14 rounded-[1.25rem] text-muted-foreground text-xs font-black uppercase tracking-widest hover:bg-foreground/5"
                        >
                          C
                        </button>
                        <button
                          key="0"
                          type="button"
                          onClick={() => handlePinKeyPress('0')}
                          className="h-14 rounded-[1.25rem] bg-foreground/5 hover:bg-foreground/10 text-lg font-black border border-border/40"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={handleBackspace}
                          className="h-14 rounded-[1.25rem] text-muted-foreground hover:bg-foreground/5 flex items-center justify-center"
                        >
                          <Delete className="w-5 h-5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setShowEmailVerification(true); setEmailMessage(null); }}
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center justify-center gap-2 mx-auto"
                      >
                        <Mail className="w-4 h-4" /> Esqueci-me do PIN
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="mt-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 justify-center">
              <Shield className="w-4 h-4" />
              <span>Dados Encriptados na sua Google Drive</span>
            </div>
          </div>
        
      </motion.div>
    </div>
  );
}


