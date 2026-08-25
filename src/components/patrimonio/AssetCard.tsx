import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Asset } from '../../types';
import { usePrivacy } from '../../contexts';
import { Building2, TrendingUp, Edit, Trash2, Archive } from 'lucide-react';

interface AssetCardProps {
  key?: any;
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onSelectProperty?: (asset: Asset) => void;
  isSelectedProperty?: boolean;
}

export function AssetCard({
  asset,
  onEdit,
  onDelete,
  onSelectProperty,
  isSelectedProperty
}: AssetCardProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const purchaseVal = asset.purchaseValue || 0;
  const currentVal = asset.currentValue || 0;
  const gainAbs = currentVal - purchaseVal;
  const gainPct = purchaseVal > 0 ? (gainAbs / purchaseVal) * 100 : 0;
  const isPositive = gainAbs >= 0;

  // Format acquisition date e.g. "Desde 04/01/2025"
  const formattedDate = asset.acquisitionDate || asset.startDate
    ? `Desde ${new Date(asset.acquisitionDate || asset.startDate || '').toLocaleDateString('pt-PT')}`
    : null;

  const fullAddress = [asset.street, asset.city].filter(Boolean).join(', ');

  return (
    <Card 
      className={`rounded-2xl border bg-card p-5 shadow-xs hover:shadow-md transition-all cursor-pointer ${
        isSelectedProperty 
          ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
          : 'border-border/80 hover:border-border'
      }`}
      onClick={() => {
        if (asset.category === 'imovel' && onSelectProperty) {
          onSelectProperty(asset);
        }
      }}
    >
      <CardContent className="p-0 space-y-4">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center shrink-0">
              {asset.category === 'imovel' ? (
                <Building2 className="w-5 h-5" />
              ) : asset.category === 'financeiro' ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <Archive className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-foreground truncate">
                {asset.name}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {asset.subType || (asset.category === 'imovel' ? 'Imóvel' : asset.category === 'financeiro' ? 'Ativo Financeiro' : 'Outro Ativo')}
              </p>
            </div>
          </div>

          {/* Action Buttons (Edit / Delete) */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
              onClick={() => onEdit(asset)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-500/80 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full"
              onClick={() => onDelete(asset)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Current Value & Gain Info */}
        <div className="space-y-1 pt-1">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground font-medium">Valor Atual</span>
            <span className="text-xl font-bold text-foreground">
              {maskValue(currentVal, formatter.format)}
            </span>
          </div>

          {purchaseVal > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Compra: {maskValue(purchaseVal, formatter.format)}
              </span>
              <span className={`font-semibold ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
              }`}>
                {isPositive ? '+' : ''}{gainPct.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Details & Tags */}
        <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs text-muted-foreground">
          <div className="text-muted-foreground font-medium">
            Capital próprio
          </div>

          {fullAddress && (
            <p className="truncate text-muted-foreground" title={fullAddress}>
              {fullAddress}
            </p>
          )}

          {formattedDate && (
            <p className="text-muted-foreground">
              {formattedDate}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
