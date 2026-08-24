import React, { useState } from 'react';
import { useAuth, usePin, usePreferences } from '../contexts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Shield, TrendingUp, Target, Car, Lock, KeyRound, Delete, AlertCircle, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function WelcomeView() {
  const { loginAsLocalUser } = useAuth();
  const { hasPin, verifyPin, unlock, setPin } = usePin();
  const { requestPinReset, resetPin } = usePreferences();

  // PIN keypad states
  const [pinCode, setPinCode] = useState('');
  const [firstPinAttempt, setFirstPinAttempt] = useState('');
  const [isCreatingPin, setIsCreatingPin] = useState(!hasPin);
  const [pinStep, setPinStep] = useState<'input' | 'confirm'>('input');
  const [pinError, setPinError] = useState<string | null>(null);

  // Email Verification States
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [verificationStep, setVerificationStep] = useState<'email' | 'code'>('email');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const features = [
    {
      icon: TrendingUp,
      title: 'Gestão Global',
      description: 'O seu património e contas bancárias unificadas num painel de controlo claro.'
    },
    {
      icon: Target,
      title: 'Orçamentos Familiares',
      description: 'Defina categorias de gastos, acompanhe limites e controle o destino do seu dinheiro.'
    },
    {
      icon: Car,
      title: 'Gestão de Viaturas',
      description: 'Acompanhe quilómetros, manutenções e o valor comercial dos seus veículos.'
    },
    {
      icon: Shield,
      title: 'Privacidade Reforçada',
      description: 'Proteção por PIN de acesso local e gestão/recuperação segura por e-mail autorizado.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Side - Hero / Informational */}
      <div className="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-primary/5 dark:bg-primary/10 border-b md:border-b-0 md:border-r border-border">
        <div className="max-w-xl mx-auto md:mx-0">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground text-3xl font-bold mb-8 shadow-xs">
            F
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            O seu centro de comando financeiro.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
            Tenha controlo absoluto sobre o seu dinheiro, património e objetivos familiares, num ambiente privado, seguro e encriptado.
          </p>

          <div className="grid sm:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-primary border border-border shadow-xs shrink-0">
                  <feature.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - PIN Login & Email Verification */}
      <div className="w-full md:w-[450px] lg:w-[500px] p-8 flex items-center justify-center relative bg-background">
        <Card className="w-full max-w-sm border-0 shadow-none bg-transparent">
          <CardHeader className="text-center px-0">
            <CardTitle className="text-2xl font-bold">Acesso à Aplicação</CardTitle>
            <CardDescription>Autenticação protegida por PIN de segurança</CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-4 mt-2">
            
            {/* Email Verification Form */}
            {showEmailVerification ? (
              <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-lg text-left animate-in fade-in duration-200">
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
                    <h4 className="font-bold text-foreground text-sm">Gerir PIN via E-mail</h4>
                    <p className="text-[11px] text-muted-foreground">E-mail do proprietário para definir ou alterar PIN</p>
                  </div>
                </div>

                {emailMessage && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                    emailMessage.type === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  }`}>
                    {emailMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{emailMessage.text}</span>
                  </div>
                )}

                {verificationStep === 'email' ? (
                  <form onSubmit={handleSendVerificationCode} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Introduza o E-mail Autorizado</Label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="ex: manuel.francisco3@gmail.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 h-9 text-xs"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" size="sm" className="w-full h-9 text-xs" disabled={isSendingCode}>
                      {isSendingCode ? 'A enviar código...' : 'Solicitar Código de Verificação'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyCodeAndSetPin} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Código enviado para {email}</Label>
                      <Input 
                        type="text" 
                        maxLength={6}
                        placeholder="Ex: 123456" 
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        className="h-9 text-xs font-mono tracking-widest text-center"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Defina o Novo PIN (4 dígitos)</Label>
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
                      {isResettingPin ? 'A validar...' : 'Confirmar e Entrar'}
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              /* Direct PIN Keypad Card */
              <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-lg text-center animate-in fade-in duration-200">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">
                    {!hasPin || isCreatingPin
                      ? (pinStep === 'input' ? 'Criar PIN de Acesso' : 'Confirme o Novo PIN')
                      : 'Introduza o PIN de Acesso'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {!hasPin || isCreatingPin
                      ? (pinStep === 'input' ? 'Escolha 4 dígitos para proteger o acesso à aplicação' : 'Repita os 4 dígitos para confirmar')
                      : 'Insira o seu código de 4 dígitos para desbloquear'}
                  </p>
                </div>

                <div className="flex justify-center items-center gap-3 py-1">
                  {[0, 1, 2, 3].map((idx) => (
                    <div 
                      key={idx}
                      className={`w-4 h-4 rounded-full border border-border transition-all duration-150 ${
                        pinCode.length > idx 
                          ? 'bg-primary scale-110 shadow-xs shadow-primary/30' 
                          : 'bg-secondary'
                      } ${pinError ? 'border-destructive bg-destructive/30 animate-shake' : ''}`}
                    />
                  ))}
                </div>

                {pinError && (
                  <p className="text-xs text-destructive font-semibold flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {pinError}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePinKeyPress(num)}
                      className="h-11 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-base font-bold transition-all active:scale-95 focus:outline-none flex items-center justify-center border border-border/40"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setPinCode(''); setPinError(null); }}
                    className="h-11 rounded-xl text-muted-foreground text-xs font-semibold hover:bg-secondary/60"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePinKeyPress('0')}
                    className="h-11 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-base font-bold transition-all active:scale-95 focus:outline-none flex items-center justify-center border border-border/40"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-11 rounded-xl text-muted-foreground hover:bg-secondary/60 flex items-center justify-center"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-3 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => { setShowEmailVerification(true); setEmailMessage(null); }}
                    className="text-xs text-primary hover:underline font-medium flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Mail className="w-3.5 h-3.5" /> Definir / Alterar PIN via E-mail
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-6">
              <Lock className="w-3.5 h-3.5" />
              <span>Acesso encriptado localmente por PIN de segurança</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

