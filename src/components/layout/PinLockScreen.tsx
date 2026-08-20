import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Key, Mail, RefreshCw, Delete, CornerDownLeft, ShieldAlert } from 'lucide-react';
import { usePin, useAuth } from '../../contexts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function PinLockScreen() {
  const { unlock, requestPinReset } = usePin();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState(false);

  // Email Reset flow states
  const [isResetFlow, setIsResetFlow] = useState(false);
  const [resetEmail, setResetEmail] = useState(user?.email || '');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyPress = async (val: string) => {
    setError(false);
    if (pinCode.length >= 4) return;

    const newPin = pinCode + val;
    setPinCode(newPin);

    if (newPin.length === 4) {
      const success = await unlock(newPin);
      if (!success) {
        setTimeout(() => {
          setPinCode('');
          setError(true);
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setError(false);
    setPinCode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(false);
    setPinCode('');
  };

  const handleEmailResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (!resetEmail.includes('@')) {
      setResetError('Por favor introduza um endereço de e-mail válido.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await requestPinReset(resetEmail);
      if (success) {
        setResetSuccess(`Instruções de reposição enviadas com sucesso para ${resetEmail}.`);
      } else {
        setResetError('Não foi possível processar o pedido. Tente novamente.');
      }
    } catch (err) {
      setResetError('Ocorreu um erro ao processar a reposição.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] p-4 max-w-sm mx-auto">
      {!isResetFlow ? (
        <div className="w-full bg-card border border-border p-6 rounded-2xl text-center space-y-6 shadow-xl animate-in fade-in duration-200">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <Lock className="w-7 h-7" />
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-foreground">Área Protegida</h3>
            <p className="text-xs text-muted-foreground mt-1">Por favor introduza o seu PIN de 4 dígitos para continuar.</p>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-4 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div 
                key={idx}
                className={`w-4.5 h-4.5 rounded-full border border-border transition-all duration-150 ${
                  pinCode.length > idx 
                    ? 'bg-primary scale-110 shadow-sm shadow-primary/30' 
                    : 'bg-secondary'
                } ${error ? 'border-destructive bg-destructive/30 animate-shake' : ''}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-destructive font-semibold flex items-center justify-center gap-1">
              <ShieldAlert className="w-4 h-4" /> PIN incorreto. Tente novamente.
            </p>
          )}

          {/* Virtual Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-14 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xl font-bold transition-all active:scale-95 focus:outline-none flex items-center justify-center border border-border/40"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-14 rounded-xl hover:bg-secondary/60 text-muted-foreground text-xs font-semibold transition-all active:scale-95 focus:outline-none flex items-center justify-center"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-14 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xl font-bold transition-all active:scale-95 focus:outline-none flex items-center justify-center border border-border/40"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 rounded-xl hover:bg-secondary/60 text-muted-foreground transition-all active:scale-95 focus:outline-none flex items-center justify-center"
              title="Apagar"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-2 border-t border-border">
            <button 
              onClick={() => setIsResetFlow(true)}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Esqueceu-se do PIN? Recuperar por Email
            </button>
            <Button onClick={() => navigate('/')} variant="ghost" className="w-full text-xs text-muted-foreground h-9">
              Voltar à Visão Geral
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full bg-card border border-border p-6 rounded-2xl space-y-5 shadow-xl animate-in fade-in duration-200">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-foreground">Recuperação de PIN</h3>
            <p className="text-xs text-muted-foreground">
              Enviaremos um código de reposição seguro para o endereço de e-mail registado.
            </p>
          </div>

          {resetSuccess ? (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold space-y-2 text-center">
              <p>{resetSuccess}</p>
              <Button size="sm" onClick={() => setIsResetFlow(false)} className="mx-auto block mt-1">
                Voltar ao Início
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailResetSubmit} className="space-y-4">
              <div className="space-y-1">
                <Input 
                  type="email" 
                  placeholder="Seu endereço de e-mail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="text-xs"
                  required
                />
                {resetError && <p className="text-[11px] text-destructive font-semibold">{resetError}</p>}
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsResetFlow(false)} 
                  className="flex-1 text-xs h-9"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 text-xs h-9"
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Pedir Instruções'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
