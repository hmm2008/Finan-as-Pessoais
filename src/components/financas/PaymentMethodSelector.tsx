import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Plus, X, CreditCard, Check } from 'lucide-react';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PaymentMethodSelector({
  value,
  onChange,
  id = 'method',
  placeholder = 'Selecione a forma de pagamento...',
  disabled = false,
  className
}: PaymentMethodSelectorProps) {
  const { paymentMethods, addPaymentMethod, customMethods } = usePaymentMethods();
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');

  const handleSelectChange = (val: string) => {
    if (val === '__add_custom_payment_method__') {
      setIsAddingCustom(true);
      setNewMethodName('');
    } else {
      setIsAddingCustom(false);
      onChange(val);
    }
  };

  const handleSaveCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMethodName.trim();
    if (!trimmed) return;

    const saved = addPaymentMethod(trimmed);
    onChange(saved);
    setNewMethodName('');
    setIsAddingCustom(false);
  };

  if (isAddingCustom) {
    return (
      <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <CreditCard className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${id}-new-input`}
              placeholder="Ex: Cartão Universo, PayPal, Edenred..."
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveCustom();
                } else if (e.key === 'Escape') {
                  setIsAddingCustom(false);
                }
              }}
              autoFocus
              className="h-8 text-xs pl-8 pr-2 bg-background"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => handleSaveCustom()}
            disabled={!newMethodName.trim()}
            className="h-8 px-2.5 text-xs gap-1 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsAddingCustom(false)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground pl-0.5">
          A nova forma de pagamento será guardada e ficará disponível em toda a aplicação.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1">
        <Select value={value || ''} onValueChange={handleSelectChange} disabled={disabled}>
          <SelectTrigger id={id} className={`h-8 sm:h-9 text-xs bg-background ${className || ''}`}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {paymentMethods.map((m) => (
              <SelectItem key={m} value={m} className="text-xs">
                {m}
              </SelectItem>
            ))}
            <SelectItem 
              value="__add_custom_payment_method__" 
              className="text-xs text-primary font-semibold focus:text-primary focus:bg-primary/10 cursor-pointer"
            >
              + Criar Nova Forma de Pagamento...
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setIsAddingCustom(true)}
        className="h-8 sm:h-9 w-8 sm:w-9 shrink-0 text-muted-foreground hover:text-primary hover:border-primary/50"
        title="Criar Nova Forma de Pagamento"
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
