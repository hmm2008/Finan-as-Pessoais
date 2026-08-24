import React, { useState } from 'react';
import { useAuth, usePin } from '../contexts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, TrendingUp, Target, Car, Lock, Copy, Check, HardDrive, KeyRound, Delete, AlertCircle } from 'lucide-react';

export default function WelcomeView() {
  const { login, loginAsLocalUser, isLoadingAuth, authError } = useAuth();
  const { hasPin, verifyPin, unlock } = usePin();

  const [copied, setCopied] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePinKeyPress = async (val: string) => {
    setPinError(false);
    if (pinCode.length >= 4) return;

    const newPin = pinCode + val;
    setPinCode(newPin);

    if (newPin.length === 4) {
      const isValid = await verifyPin(newPin);
      if (isValid) {
        await unlock(newPin);
        loginAsLocalUser();
      } else {
        setTimeout(() => {
          setPinCode('');
          setPinError(true);
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPinError(false);
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
      description: 'Proteção por PIN local e modo rápido para ocultar valores sensíveis no ecrã.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Side - Hero / Informational */}
      <div className="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-primary/5 dark:bg-primary/10 border-b md:border-b-0 md:border-r border-border">
        <div className="max-w-xl mx-auto md:mx-0">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground text-3xl font-bold mb-8 shadow-sm">
            F
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            O seu centro de comando financeiro.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
            Tenha controlo absoluto sobre o seu dinheiro, património e objetivos familiares, num ambiente privado, seguro e premium.
          </p>

          <div className="grid sm:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-primary border border-border shadow-sm shrink-0">
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

      {/* Right Side - Login */}
      <div className="w-full md:w-[450px] lg:w-[500px] p-8 flex items-center justify-center relative bg-background">
        <Card className="w-full max-w-sm border-0 shadow-none bg-transparent">
          <CardHeader className="text-center px-0">
            <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
            <CardDescription>Inicie sessão para aceder aos seus dados</CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-4 mt-2">
            
            {/* PIN Unlock Card view if user toggled or has PIN */}
            {(showPinInput || hasPin) ? (
              <div className="p-5 bg-card border border-border rounded-2xl space-y-4 shadow-lg text-center animate-in fade-in duration-200">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Introduza o PIN de Segurança</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">PIN local de 4 dígitos (sem dependência do Firebase)</p>
                </div>

                <div className="flex justify-center items-center gap-3 py-1">
                  {[0, 1, 2, 3].map((idx) => (
                    <div 
                      key={idx}
                      className={`w-4 h-4 rounded-full border border-border transition-all duration-150 ${
                        pinCode.length > idx 
                          ? 'bg-primary scale-110 shadow-sm shadow-primary/30' 
                          : 'bg-secondary'
                      } ${pinError ? 'border-destructive bg-destructive/30 animate-shake' : ''}`}
                    />
                  ))}
                </div>

                {pinError && (
                  <p className="text-xs text-destructive font-semibold flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> PIN incorreto. Tente novamente.
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
                    onClick={() => { setPinCode(''); setPinError(false); }}
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

                {!hasPin && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-muted-foreground w-full mt-2" 
                    onClick={() => setShowPinInput(false)}
                  >
                    Voltar às opções
                  </Button>
                )}
              </div>
            ) : null}
            {authError === 'network_error' && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium text-center border border-destructive/20">
                Erro de rede. Verifique a sua ligação à internet.
              </div>
            )}
            
            {authError === 'unauthorized_domain' && (
              <div className="p-4 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm border border-amber-500/20 space-y-3">
                <p className="font-semibold text-center text-amber-800 dark:text-amber-300">
                  ⚠️ Domínio Vercel não autorizado no Firebase
                </p>
                <p className="text-xs leading-relaxed">
                  Para permitir o login com a Google via Firebase no seu domínio Vercel, adicione o endereço do seu site em <strong>Authorized Domains</strong> do seu projeto Firebase.
                </p>
                
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-amber-500/30 text-xs font-mono text-foreground">
                  <span className="truncate pr-2">{currentDomain}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0 text-amber-600 dark:text-amber-400" onClick={handleCopyDomain}>
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="ml-1 text-[11px]">{copied ? 'Copiado!' : 'Copiar'}</span>
                  </Button>
                </div>

                <div className="pt-2 border-t border-amber-500/20 flex flex-col gap-2">
                  <a 
                    href="https://console.firebase.google.com/project/gen-lang-client-0096022431/authentication/settings" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center h-9 px-3 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors"
                  >
                    1. Abrir Consola Firebase (Projeto gen-lang-client-0096022431) ↗
                  </a>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Cole o domínio em <strong>Authorized domains &gt; Add domain</strong>.
                  </p>
                </div>
              </div>
            )}

            {authError === 'operation_not_allowed' && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium text-center border border-destructive/20">
                A autenticação com a Google não está ativada na consola.
              </div>
            )}
            {authError === 'popup_blocked' && (
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium text-center border border-amber-500/20">
                A janela de autenticação foi bloqueada pelo navegador. Por favor permita pop-ups.
              </div>
            )}
            {authError === 'auth_required' && (
              <div className="p-3 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium text-center">
                Sessão expirada. Por favor inicie sessão novamente.
              </div>
            )}
            {authError && !['network_error', 'unauthorized_domain', 'operation_not_allowed', 'popup_blocked', 'auth_required'].includes(authError) && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium text-center border border-destructive/20">
                Erro de autenticação: {authError}
              </div>
            )}

            <Button 
              className="w-full h-12 text-base font-semibold transition-all" 
              onClick={login}
              disabled={isLoadingAuth}
            >
              {isLoadingAuth ? 'A autenticar...' : 'Entrar com Conta Google'}
            </Button>

            <div className="relative my-4 text-center text-xs text-muted-foreground">
              <span className="bg-background px-2 relative z-10">ou aceda sem Firebase</span>
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            </div>

            <div className="space-y-2">
              <Button 
                variant="outline"
                className="w-full h-11 text-sm font-medium border-border hover:bg-secondary/60" 
                onClick={loginAsLocalUser}
              >
                <HardDrive className="w-4 h-4 mr-2 text-primary" /> Entrar no Modo Local / Google Drive
              </Button>

              <Button 
                variant="ghost"
                className="w-full h-9 text-xs font-medium text-muted-foreground hover:text-foreground" 
                onClick={() => setShowPinInput(true)}
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5 text-primary" /> Introduzir / Usar PIN de Acesso Local
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-6">
              <Lock className="w-3 h-3" />
              <span>Armazenamento local seguro e sincronização via Google Drive</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
