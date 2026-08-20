import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { CreditCard, Plus, Trash2, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';

export function PaymentMethodsCustomizer() {
  const { 
    paymentMethods, 
    customMethods, 
    defaultMethods, 
    addPaymentMethod, 
    removePaymentMethod, 
    resetPaymentMethods 
  } = usePaymentMethods();

  const [newMethod, setNewMethod] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMethod.trim();
    if (!trimmed) return;

    addPaymentMethod(trimmed);
    setNewMethod('');
    setSuccessMsg(`Forma de pagamento "${trimmed}" guardada com sucesso!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRemove = (method: string) => {
    removePaymentMethod(method);
    setSuccessMsg(`Forma de pagamento "${method}" removida.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Tem a certeza que pretende repor as formas de pagamento predefinidas?')) {
      resetPaymentMethods();
      setSuccessMsg('Formas de pagamento repostas para os valores predefinidos.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Formas e Métodos de Pagamento</CardTitle>
              <CardDescription className="text-xs">
                Crie e personalize as opções de método de pagamento para as suas despesas, receitas e importações.
              </CardDescription>
            </div>
          </div>
          {customMethods.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repor Predefinições</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Add New Method Input */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="relative flex-1">
            <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nome da nova forma de pagamento (ex: PayPal, Cartão Refeição, Universo...)"
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              className="pl-9 text-xs h-9 bg-background"
            />
          </div>
          <Button type="submit" size="sm" disabled={!newMethod.trim()} className="gap-1.5 h-9 shrink-0">
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </Button>
        </form>

        {/* List of active methods */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Formas de Pagamento Disponíveis ({paymentMethods.length})</span>
            <span className="text-[11px] font-normal">{customMethods.length} personalizadas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {paymentMethods.map((method) => {
              const isCustom = customMethods.includes(method);
              return (
                <div
                  key={method}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                    isCustom 
                      ? 'bg-primary/5 border-primary/30 text-foreground' 
                      : 'bg-secondary/30 border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <CreditCard className={`w-3.5 h-3.5 shrink-0 ${isCustom ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium truncate">{method}</span>
                    {isCustom ? (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                        Personalizado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                        Padrão
                      </Badge>
                    )}
                  </div>

                  {isCustom && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(method)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 ml-2"
                      title={`Remover ${method}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-secondary/20 rounded-lg border border-border/60 flex items-start gap-2 text-[11px] text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <span>
            Todas as formas de pagamento criadas aqui ficam automaticamente sincronizadas e disponíveis nos formulários de Despesas, Receitas, Despesas Fixas, Receitas Fixas e Importador de ficheiros.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
