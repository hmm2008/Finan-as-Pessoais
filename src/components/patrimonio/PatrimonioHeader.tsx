import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Asset } from './types';
import { usePrivacy } from '../../contexts';
import { Wallet, ShoppingBag, ArrowUpRight, ArrowDownRight, Plus, Home, TrendingUp, Box } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface PatrimonioHeaderProps {
  assets: Asset[];
  onAddImovel: () => void;
  onAddFinanceiro: () => void;
  onAddOutros: () => void;
}

export function PatrimonioHeader({
  assets,
  onAddImovel,
  onAddFinanceiro,
  onAddOutros
}: PatrimonioHeaderProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const totalCurrent = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const totalPurchase = assets.reduce((sum, a) => sum + (a.purchaseValue || 0), 0);
  const totalGainAbs = totalCurrent - totalPurchase;
  const totalGainPct = totalPurchase > 0 ? (totalGainAbs / totalPurchase) * 100 : 0;
  const isPositive = totalGainAbs >= 0;

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Património</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhamento consolidado de imóveis, carteira financeira e outros ativos
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Ativo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onAddImovel} className="cursor-pointer">
              <Home className="w-4 h-4 mr-2 text-emerald-600" />
              Novo Imóvel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddFinanceiro} className="cursor-pointer">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
              Novo Ativo Financeiro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddOutros} className="cursor-pointer">
              <Box className="w-4 h-4 mr-2 text-amber-600" />
              Outro Ativo (Bens/Arte)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Património Total</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {maskValue(totalCurrent, formatter.format)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Custo Total de Aquisição</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {maskValue(totalPurchase, formatter.format)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Ganho / Perda Absoluta</p>
              <p className={`text-xl font-bold mt-1 ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              }`}>
                {isPositive ? '+' : ''}{maskValue(totalGainAbs, formatter.format)}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
            }`}>
              {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Rentabilidade Acumulada</p>
              <p className={`text-xl font-bold mt-1 ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              }`}>
                {isPositive ? '+' : ''}{totalGainPct.toFixed(2)}%
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
