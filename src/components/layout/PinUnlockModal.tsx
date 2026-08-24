import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, Delete, AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import { usePin, useAuth, usePreferences } from '../../contexts';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PinUnlockModalProps {
  open: boolean;
  onClose: () => void;
}

export function PinUnlockModal({ open, onClose }: PinUnlockModalProps) {
  const { unlock, setPin } = usePin();
  const { user } = useAuth();
  const { requestPinReset, resetPin } = usePreferences();

  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Email reset state
  const [showEmailReset, setShowEmailReset] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [resetCode, setResetCode] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleKeyPress = async (val: string) => {
    setError(null);
    if (pinCode.length >= 4) return;

    const newPin = pinCode + val;
    setPinCode(newPin);

    if (newPin.length === 4) {
      const isValid = await unlock(newPin);
      if (isValid) {
        setPinCode('');
        onClose();
      } else {
        setTimeout(() => {
          setPinCode('');
          setError('PIN incorreto. Tente novamente.');
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPinCode(prev => prev.slice(0, -1));
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setResetMessage({ type: 'error', text: 'E-mail inválido.' });
      return;
    }

    setIsSendingCode(true);
    setResetMessage(null);

    const res = await requestPinReset(email);
    setIsSendingCode(false);

    if (res.success) {
      setResetMessage({ type: 'success', text: res.message });
      setResetStep('code');
    } else {
      setResetMessage({ type: 'error', text: res.message });
    }
  };

  const handleVerifyCodeAndSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode.length !== 6) {
      setResetMessage({ type: 'error', text: 'O código deve ter 6 dígitos.' });
      return;
    }
    if (pinCode.length !== 4) {
      setResetMessage({ type: 'error', text: 'O novo PIN deve ter 4 dígitos.' });
      return;
    }

    setIsResettingPin(true);
    setResetMessage(null);

    const res = await resetPin(email, resetCode, pinCode);
    setIsResettingPin(false);

    if (res.success) {
      await setPin(pinCode);
      await unlock(pinCode);
      setPinCode('');
      setShowEmailReset(false);
      onClose();
    } else {
      setResetMessage({ type: 'error', text: res.message });
    }
  };

  const resetAll = () => {
    setPinCode('');
    setError(null);
    setShowEmailReset(false);
    setResetStep('email');
    setResetMessage(null);
  };

  const handleModalClose = () => {
    resetAll();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleModalClose} title={showEmailReset ? "Recuperar PIN por E-mail" : "Desbloquear Aplicação"}>
      <div className="space-y-4 py-1">
        {!showEmailReset ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-bold text-foreground text-base">Aplicação Bloqueada</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Introduza o PIN de 4 dígitos para desbloquear</p>
            </div>

            {/* Dots */}
            <div className="flex justify-center items-center gap-3 py-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border border-border transition-all duration-150 ${
                    pinCode.length > idx
                      ? 'bg-primary scale-110 shadow-sm shadow-primary/30'
                      : 'bg-secondary'
                  } ${error ? 'border-destructive bg-destructive/30 animate-shake' : ''}`}
                />
              ))}
            </div>

            {error && (
              <p className="text-xs text-destructive font-semibold flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="h-11 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-base font-bold transition-all active:scale-95 focus:outline-none flex items-center justify-center border border-border/40"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setPinCode(''); setError(null); }}
                className="h-11 rounded-xl text-muted-foreground text-xs font-semibold hover:bg-secondary/60"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
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

            <div className="pt-2 border-t border-border/60 flex justify-center">
              <button
                type="button"
                onClick={() => setShowEmailReset(true)}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" /> Esqueceu-se do PIN? Recuperar via E-mail
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {resetMessage && (
              <div className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                resetMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}>
                {resetMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{resetMessage.text}</span>
              </div>
            )}

            {resetStep === 'email' ? (
              <form onSubmit={handleSendResetCode} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail do Administrador</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="o.seu.email@exemplo.com"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowEmailReset(false)} className="flex-1 text-xs">
                    Voltar
                  </Button>
                  <Button type="submit" size="sm" className="flex-1 text-xs" disabled={isSendingCode}>
                    {isSendingCode ? 'A enviar...' : 'Enviar Código'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyCodeAndSetPin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Código (6 dígitos)</Label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    className="h-9 text-xs font-mono tracking-widest text-center"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Novo PIN (4 dígitos)</Label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="h-9 text-xs text-center font-mono tracking-widest"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowEmailReset(false)} className="flex-1 text-xs">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isResettingPin}>
                    {isResettingPin ? 'A redefinir...' : 'Redefinir e Desbloquear'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
