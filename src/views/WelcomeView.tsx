import React from 'react';
import { useAuth } from '../contexts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, TrendingUp, Target, Car, Lock } from 'lucide-react';

export default function WelcomeView() {
  const { login, isLoadingAuth, authError } = useAuth();

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
          <CardContent className="px-0 space-y-6 mt-4">
            {authError === 'network_error' && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium text-center border border-destructive/20">
                Erro de rede. Verifique a sua ligação à internet.
              </div>
            )}
            {authError === 'unauthorized_domain' && (
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium text-center border border-amber-500/20 leading-relaxed">
                Domínio não autorizado. Adicione o seu domínio da Vercel (ex: <code className="bg-amber-500/20 px-1 rounded">seu-app.vercel.app</code>) em <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong>.
              </div>
            )}
            {authError === 'operation_not_allowed' && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium text-center border border-destructive/20">
                A autenticação com a Google não está ativada na sua consola do Firebase.
              </div>
            )}
            {authError === 'popup_blocked' && (
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium text-center border border-amber-500/20">
                O janela de autenticação foi bloqueada pelo navegador. Por favor permita pop-ups.
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
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-8">
              <Lock className="w-3 h-3" />
              <span>Autenticação segura via Firebase</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
